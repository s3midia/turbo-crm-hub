import React, { useEffect, useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Scale, Clock, Percent, Building2,
  AlertTriangle, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight,
  Target, Flame, ChevronRight, PieChart as PieIcon, LineChart as LineIcon,
  Users, Wallet, Briefcase, Zap, Info, RefreshCw, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/formatters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

// --- Types ---
interface DashboardData {
  receita_realizada: number;
  despesas_totais: number;
  saldo_liquido: number;
  a_receber: number;
  margem_liquida: number;
  valuation_est: number;
  barData: any[];
  expenseCategories: any[];
  cashflow: any[];
  profitTrend: any[];
  urgentActions: any[];
  topClients: any[];
  ebitda: number;
  score: number;
}

const COLORS = ['#10b981', '#f87171', '#3b82f6', '#fbbf24', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function FinanceiroDashboard({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    receita_realizada: 0,
    despesas_totais: 0,
    saldo_liquido: 0,
    a_receber: 0,
    margem_liquida: 0,
    valuation_est: 0,
    barData: [],
    expenseCategories: [],
    cashflow: [],
    profitTrend: [],
    urgentActions: [],
    topClients: [],
    ebitda: 0,
    score: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Transactions
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', user.id);

      // 2. Fetch Valuation Config
      const { data: valConfig } = await supabase
        .from('company_valuation_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // 3. Fetch Employees (for payroll calc if not in transactions)
      const { data: employees } = await supabase
        .from('company_employees')
        .select('*')
        .eq('user_id', user.id);

      const txs = transactions || [];
      const emps = employees || [];

      // --- CALCULATIONS ---

      // KPIs
      const receita = txs.filter(t => t.tipo === 'entrada' && t.status === 'pago').reduce((acc, t) => acc + Number(t.valor), 0);
      const despesas = txs.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + Number(t.valor), 0);
      const saldo = receita - despesas;
      const aReceber = txs.filter(t => t.tipo === 'entrada' && t.status === 'pendente').reduce((acc, t) => acc + Number(t.valor), 0);
      const margem = receita > 0 ? Math.max(-999, Math.min(100, (saldo / receita) * 100)) : (saldo < 0 ? -100 : 0);
      
      // EBITDA Estimate (Simplified: Revenue - Op Expenses before Tax/Depreciation)
      // Here we just use Operating Profit as proxy
      const ebitda = saldo; 

      // Valuation
      let valuation = 0;
      if (valConfig) {
        if (valConfig.metodo === 'multiplos') {
          valuation = Number(valConfig.faturamento12m) * 4.5; // Default multiplier for Tech/SaaS
        } else if (valConfig.metodo === 'patrimonial') {
          valuation = Number(valConfig.ativos_circulantes) - Number(valConfig.passivos);
        } else {
          valuation = Number(valConfig.lucro_liquido) * 10; // Default FCD simplified
        }
      }

      // Group by Month (Last 6 Months)
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const currentMonth = new Date().getMonth();
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const m = (currentMonth - i + 12) % 12;
        last6Months.push({ month: months[m], monthIdx: m, receita: 0, despesa: 0, profit: 0 });
      }

      txs.forEach(t => {
        const date = new Date(t.vencimento);
        const mIdx = date.getMonth();
        const monthObj = last6Months.find(m => m.monthIdx === mIdx);
        if (monthObj) {
          if (t.tipo === 'entrada' && t.status === 'pago') monthObj.receita += Number(t.valor);
          if (t.tipo === 'saida') monthObj.despesa += Number(t.valor);
        }
      });
      last6Months.forEach(m => m.profit = m.receita - m.despesa);

      // Expense Categories
      const catMap: Record<string, number> = {};
      txs.filter(t => t.tipo === 'saida').forEach(t => {
        catMap[t.categoria] = (catMap[t.categoria] || 0) + Number(t.valor);
      });
      const expenseCats = Object.entries(catMap).map(([label, value]) => ({ label, value }));
      const totalExp = expenseCats.reduce((acc, c) => acc + c.value, 0);
      const expenseCategories = expenseCats.map(c => ({ ...c, pct: totalExp > 0 ? (c.value / totalExp) * 100 : 0 }))
        .sort((a, b) => b.value - a.value);

      // Cashflow (Today, +7, +15, +30)
      const now = new Date();
      const getDelta = (days: number) => {
        const target = new Date();
        target.setDate(now.getDate() + days);
        return txs.filter(t => {
          const v = new Date(t.vencimento);
          return t.status === 'pendente' && v <= target && v >= now;
        }).reduce((acc, t) => acc + (t.tipo === 'entrada' ? Number(t.valor) : -Number(t.valor)), 0);
      };

      const cashflow = [
        { label: "Hoje", value: saldo, delta: getDelta(0) },
        { label: "+7d", value: saldo + getDelta(7), delta: getDelta(7) },
        { label: "+15d", value: saldo + getDelta(15), delta: getDelta(15) },
        { label: "+30d", value: saldo + getDelta(30), delta: getDelta(30) },
      ];

      // Top Clients
      const clientMap: Record<string, number> = {};
      txs.filter(t => t.tipo === 'entrada' && t.status === 'pago').forEach(t => {
        if (t.lead_nome && t.lead_nome !== "N/A") {
          clientMap[t.lead_nome] = (clientMap[t.lead_nome] || 0) + Number(t.valor);
        }
      });
      const topClients = Object.entries(clientMap)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Urgent Actions
      const urgent: any[] = [];
      const overDue = txs.filter(t => t.status === 'pendente' && new Date(t.vencimento) < now);
      if (overDue.length > 0) {
        urgent.push({
          type: "danger",
          icon: AlertCircle,
          title: "Contas em Atraso",
          desc: `${overDue.length} transações vencidas totalizando ${formatBRL(overDue.reduce((acc, t) => acc + Number(t.valor), 0))}`,
          tab: "lancamentos"
        });
      }
      const pendingPayroll = emps.filter(e => e.status === 'pendente');
      if (pendingPayroll.length > 0) {
        urgent.push({
          type: "warning",
          icon: Users,
          title: "Folha de Pagamento",
          desc: `${pendingPayroll.length} colaboradores aguardando pagamento.`,
          tab: "equipe"
        });
      }

      // Score calc (Arbitrary formula)
      const score = Math.min(100, Math.max(0, 
        (margem > 30 ? 40 : margem * 1.3) + 
        (aReceber > despesas ? 30 : 15) + 
        (overDue.length === 0 ? 30 : 0)
      ));

      setData({
        receita_realizada: receita,
        despesas_totais: despesas,
        saldo_liquido: saldo,
        a_receber: aReceber,
        margem_liquida: margem,
        valuation_est: valuation,
        barData: last6Months,
        expenseCategories,
        cashflow,
        profitTrend: last6Months,
        urgentActions: urgent,
        topClients,
        ebitda,
        score: Math.round(score)
      });
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    { label: "Receita Realizada", value: data.receita_realizada, icon: TrendingUp, color: "emerald", trend: "+12%", up: true },
    { label: "Despesas Totais", value: data.despesas_totais, icon: TrendingDown, color: "rose", trend: "-5%", up: false },
    { label: "Saldo Líquido", value: data.saldo_liquido, icon: Scale, color: "blue", trend: "+8%", up: true },
    { label: "A Receber", value: data.a_receber, icon: Clock, color: "amber", trend: data.a_receber > 0 ? "Em aberto" : "Nenhum", up: null },
    { label: "Margem Líquida", display: `${data.margem_liquida.toFixed(1)}%`, icon: Percent, color: "violet", trend: "+2.4pp", up: true },
    { label: "Valuation Est.", display: formatBRL(data.valuation_est), icon: Building2, color: "cyan", trend: "Estável", up: true },
  ];

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 font-jakarta">

      {/* --- KPI GRID (Image Reference Style) --- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[24px] overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi, i) => {
            // Prepare sparkline data based on the metric
            const sparkData = data.barData.map(m => {
              if (kpi.label === "Receita Realizada") return { value: m.receita };
              if (kpi.label === "Despesas Totais") return { value: m.despesa };
              if (kpi.label === "Saldo Líquido") return { value: m.profit };
              if (kpi.label === "Margem Líquida") return { value: m.receita > 0 ? (m.receita - m.despesa) / m.receita * 100 : 0 };
              // Fallback for others
              return { value: Math.random() * 100 }; 
            });

            const colorHex = 
              kpi.color === "emerald" ? "#10b981" :
              kpi.color === "rose" ? "#f87171" :
              kpi.color === "blue" ? "#3b82f6" :
              kpi.color === "amber" ? "#fbbf24" :
              kpi.color === "violet" ? "#8b5cf6" :
              "#06b6d4";

            return (
              <div 
                key={i} 
                className={cn(
                  "p-10 flex items-center justify-between group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20",
                  i % 3 !== 2 && "lg:border-r border-zinc-100 dark:border-zinc-800",
                  i < 3 && "lg:border-b border-zinc-100 dark:border-zinc-800",
                  i % 2 !== 1 && "md:border-r lg:md:border-r-0 border-zinc-100 dark:border-zinc-800",
                  i < 4 && "md:border-b lg:md:border-b-0 border-zinc-100 dark:border-zinc-800",
                  "border-b md:border-b-0 last:border-b-0"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">
                      {kpi.display ?? (kpi.value! >= 1000 ? (kpi.value! / 1000).toFixed(1) + 'k' : kpi.value)}
                    </span>
                    {kpi.trend && (
                      <div className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                        kpi.up === true ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : 
                        kpi.up === false ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : 
                        "bg-zinc-50 text-zinc-500 dark:bg-zinc-500/10"
                      )}>
                        {kpi.up === true ? "+" : ""}{kpi.trend}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-extrabold text-zinc-400 dark:text-zinc-500 max-w-[140px] leading-tight uppercase tracking-[0.2em]">
                    {kpi.label}
                  </p>
                </div>

                <div className="h-16 w-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparkData}>
                      <defs>
                        <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={colorHex} stopOpacity={0.2}/>
                          <stop offset="100%" stopColor={colorHex} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={colorHex} 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill={`url(#grad-${i})`}
                        isAnimationActive={true}
                        animationDuration={2000}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MIDDLE ROW: MAIN CHARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Chart: Receitas vs Despesas (Animated Lines) */}
        <div className="lg:col-span-3 p-8 rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-tight">
                <BarChart3 size={18} className="text-zinc-900 dark:text-zinc-100" />
                Desempenho Financeiro
              </h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Análise Comparativa • 6 Meses</p>
            </div>
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />Receitas
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/20" />Despesas
              </span>
            </div>
          </div>
          
          <div className="h-[220px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#A1A1AA' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#A1A1AA' }}
                  tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`}
                />
                <Tooltip 
                  cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 1 }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid rgba(0,0,0,0.1)', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontSize: '10px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                  formatter={(value: any) => [formatBRL(value), '']}
                />
                <Line 
                  type="monotone" 
                  dataKey="receita" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }}
                  animationDuration={2000}
                />
                <Line 
                  type="monotone" 
                  dataKey="despesa" 
                  stroke="#f87171" 
                  strokeWidth={3} 
                  dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#f87171" }}
                  animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Clients & EBITDA */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-8 rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm h-full flex flex-col">
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-8 uppercase tracking-tight">
              <Users size={18} className="text-zinc-400" />
              Maiores Clientes
            </h3>
            <div className="space-y-4 flex-1">
              {data.topClients.map((client, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-zinc-900 transition-all">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-zinc-900 dark:text-zinc-100 leading-none">{client.name}</p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Sócio Parceiro</p>
                    </div>
                  </div>
                  <p className="text-[12px] font-black text-zinc-900 dark:text-zinc-100">{formatBRL(client.total)}</p>
                </div>
              ))}
              {data.topClients.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <Info size={32} className="mx-auto mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Sem dados de clientes</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">EBITDA Estimado</p>
                  <p className="text-[18px] font-black text-emerald-500 tracking-tighter">{formatBRL(data.ebitda)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp size={20} className="text-emerald-500" />
                </div>
              </div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase leading-relaxed tracking-tight">
                Resultado operacional antes de impostos, amortização e depreciação. Saúde operacional bruta.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- BOTTOM ROW: BREAKDOWNS & HEALTH --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Expense Breakdown (Donut Chart) */}
        <div className="p-8 rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col">
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-8 uppercase tracking-tight">
            <PieIcon size={18} className="text-zinc-400" />
            Composição das Despesas
          </h3>
          <div className="h-[180px] w-full flex items-center">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={data.expenseCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => formatBRL(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-[40%] space-y-2.5">
              {data.expenseCategories.slice(0, 4).map((cat, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[9px] font-black text-zinc-900 dark:text-zinc-100 truncate uppercase tracking-tighter">{cat.label}</span>
                  </div>
                  <span className="text-[9px] font-bold text-zinc-400 ml-3 uppercase tracking-widest">{cat.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Total Saídas</span>
            <span className="text-[14px] font-black text-rose-500">{formatBRL(data.despesas_totais)}</span>
          </div>
        </div>

        {/* Projected Cashflow & Line Chart */}
        <div className="p-8 rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-8 uppercase tracking-tight">
            <Target size={18} className="text-zinc-400" />
            Fluxo Projetado
          </h3>
          <div className="space-y-2 mb-6">
            {data.cashflow.map((day, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{day.label}</span>
                <div className="text-right">
                  <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{formatBRL(day.value)}</p>
                  {day.delta !== 0 && (
                    <p className={cn("text-[9px] font-black uppercase tracking-tighter", day.delta > 0 ? "text-emerald-500" : "text-rose-500")}>
                      {day.delta > 0 ? "+" : ""}{formatBRL(day.delta)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="h-[80px] w-full mt-auto opacity-50 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.profitTrend}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Score & Actions */}
        <div className="p-8 rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col">
          <div className="mb-8">
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight flex items-center gap-2">
               <Zap size={18} className="text-amber-500 fill-amber-500/20" />
               Saúde Financeira
            </h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Score Dinâmico de Performance</p>
          </div>

          <div className="flex items-center gap-6 mb-8">
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" strokeWidth="8" />
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke={data.score > 70 ? "#10b981" : data.score > 40 ? "#fbbf24" : "#f87171"} 
                  strokeWidth="8" 
                  strokeDasharray="282.7" 
                  strokeDashoffset={282.7 - (282.7 * data.score / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 leading-none tracking-tighter">{data.score}</span>
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mt-1">Pontos</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {[
                { label: "Liquidez", val: data.a_receber > data.despesas_totais ? "Alta" : "Média", color: "text-emerald-500" },
                { label: "Eficiência", val: data.margem_liquida > 20 ? "Ótima" : "Regular", color: "text-blue-500" },
                { label: "Risco", val: data.urgentActions.length === 0 ? "Baixo" : "Médio", color: "text-amber-500" }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px]">
                  <span className="text-zinc-400 font-bold uppercase tracking-widest text-[8px]">{item.label}</span>
                  <span className={cn("font-black uppercase tracking-tighter", item.color)}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 mt-auto">
            {data.urgentActions.map((action, i) => (
              <button 
                key={i}
                onClick={() => onTabChange?.(action.tab)}
                className={cn("w-full p-3 rounded-2xl border flex items-start gap-3 text-left transition-all hover:scale-[1.02]",
                  action.type === "danger" ? "bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30" : "bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30"
                )}
              >
                <div className={cn("p-1.5 rounded-lg", action.type === "danger" ? "bg-rose-500/20 text-rose-500" : "bg-amber-500/20 text-amber-500")}>
                  <action.icon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">{action.title}</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-tight mt-0.5">{action.desc}</p>
                </div>
              </button>
            ))}
            {data.urgentActions.length === 0 && (
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Obrigações em dia!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

