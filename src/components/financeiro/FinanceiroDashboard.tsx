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
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
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
  recentTransactions: any[];
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
    recentTransactions: [],
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
      const margem = receita > 0 ? (saldo / receita) * 100 : 0;
      
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

      // Recent Transactions (Last 5)
      const recentTransactions = txs
        .sort((a, b) => new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime())
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          name: t.lead_nome || t.descricao || "Transação",
          date: new Date(t.vencimento).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
          time: new Date(t.vencimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          amount: Number(t.valor),
          type: t.tipo, // 'entrada' or 'saida'
          category: t.categoria
        }));

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
        recentTransactions,
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 bg-[#f4f7f4] -m-6 p-6 min-h-screen">
      
      {/* Layout Grid based on Reference Image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TOP LEFT: Recent Transactions */}
        <div className="lg:col-span-4 p-8 rounded-[2.5rem] bg-white shadow-sm border border-black/5 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900">Recent transactions</h3>
            <button 
              onClick={() => onTabChange?.("lancamentos")}
              className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold flex items-center gap-2 hover:bg-black/80 transition-all"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="space-y-6 flex-1">
            {data.recentTransactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    tx.type === 'entrada' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                  )}>
                    {tx.type === 'entrada' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{tx.name}</p>
                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">{tx.date} • {tx.time}</p>
                  </div>
                </div>
                <p className={cn("text-sm font-bold", tx.type === 'entrada' ? "text-emerald-600" : "text-gray-900")}>
                  {tx.type === 'entrada' ? '+' : '-'} {formatBRL(tx.amount)}
                </p>
              </div>
            ))}
            {data.recentTransactions.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-30 italic text-sm">
                Nenhuma transação recente
              </div>
            )}
          </div>
        </div>

        {/* TOP MIDDLE: Spending Radar Chart */}
        <div className="lg:col-span-5 p-8 rounded-[2.5rem] bg-white shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900">Spending</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d4ff3f]" /> This month
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border border-gray-400 rounded-full" /> Average
              </span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.expenseCategories.slice(0, 6)}>
                <PolarGrid stroke="#f0f0f0" />
                <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                <Radar
                  name="Gastos"
                  dataKey="value"
                  stroke="#000"
                  fill="#d4ff3f"
                  fillOpacity={0.8}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => formatBRL(value)}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP RIGHT: Quick Transfer / Avatars */}
        <div className="lg:col-span-3 p-8 rounded-[2.5rem] bg-white shadow-sm border border-black/5 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Quick transfer</h3>
            <div className="flex -space-x-3 mb-8">
              {data.topClients.slice(0, 5).map((client, i) => (
                <div 
                  key={i} 
                  className="w-12 h-12 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm"
                  title={client.name}
                >
                  {client.name?.substring(0, 1) || "?"}
                </div>
              ))}
              <button className="w-12 h-12 rounded-full border-4 border-white bg-gray-50 border-dashed flex items-center justify-center text-gray-400 hover:text-black transition-colors">
                <Plus size={20} />
              </button>
            </div>

            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
              <input 
                type="text" 
                placeholder="1000" 
                className="w-full pl-8 pr-4 py-4 rounded-2xl bg-gray-50 border-none text-sm font-bold focus:ring-2 focus:ring-[#d4ff3f]"
              />
            </div>
          </div>

          <button className="w-full py-4 rounded-2xl bg-black text-white font-bold text-sm hover:bg-black/90 transition-all shadow-lg shadow-black/10">
            Send
          </button>
        </div>

        {/* BOTTOM LEFT: Card Mockup */}
        <div className="lg:col-span-3 p-8 rounded-[2.5rem] bg-white shadow-sm border border-black/5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="bg-[#d4ff3f] rounded-3xl p-6 relative overflow-hidden h-44 flex flex-col justify-between shadow-lg shadow-[#d4ff3f]/20">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Universal</p>
                  <p className="text-2xl font-black text-black mt-1">{formatBRL(data.saldo_liquido)}</p>
                </div>
                <div className="w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="w-6 h-4 border-2 border-black/20 rounded-sm" />
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <p className="text-sm font-bold text-black/60 tracking-[0.2em]">**** 9423</p>
                <div className="flex items-center gap-1 opacity-40">
                  <div className="w-8 h-8 rounded-full bg-red-500" />
                  <div className="w-8 h-8 rounded-full bg-amber-500 -ml-4" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Receita</p>
                <p className="text-sm font-black text-gray-900">{formatBRL(data.receita_realizada)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">A Receber</p>
                <p className="text-sm font-black text-gray-900">{formatBRL(data.a_receber)}</p>
              </div>
            </div>
          </div>

          <button className="w-full py-4 mt-8 rounded-2xl border-2 border-black bg-transparent text-black font-bold text-sm hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2">
            <Plus size={16} /> Add new card
          </button>
        </div>

        {/* BOTTOM MIDDLE: Budget Line Chart */}
        <div className="lg:col-span-6 p-8 rounded-[2.5rem] bg-white shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900">Budget</h3>
            <select className="bg-gray-50 border-none rounded-xl text-[10px] font-bold px-3 py-1.5 focus:ring-1 focus:ring-[#d4ff3f]">
              <option>Month</option>
              <option>Year</option>
            </select>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.profitTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.05}/>
                    <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                  tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`}
                />
                <Tooltip 
                  cursor={{ stroke: '#000', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [formatBRL(value), 'Lucro']}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#000" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTTOM RIGHT: Promo / Health Card */}
        <div className="lg:col-span-3 p-8 rounded-[2.5rem] bg-[#d4ff3f] shadow-lg shadow-[#d4ff3f]/20 border border-black/5 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-4xl font-black text-black leading-tight">
              Aumente sua <br />
              <span className="inline-block px-3 py-1 rounded-full border-2 border-black mt-2">
                Margem {data.margem_liquida.toFixed(0)}%
              </span> ?
            </h3>
          </div>

          <div className="absolute right-0 bottom-12 w-48 h-48 opacity-20 pointer-events-none">
            <Briefcase size={200} className="text-black" />
          </div>

          <div className="relative z-10 mt-12">
            <div className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Valuation Est.</p>
                <p className="text-lg font-black text-black">{formatBRL(data.valuation_est)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#d4ff3f] flex items-center justify-center">
                <Target size={20} className="text-black" />
              </div>
            </div>
            
            <button className="w-full py-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-gray-50 transition-all shadow-sm">
              Learn more
            </button>
          </div>
        </div>

      </div>

      {/* Actionable Alerts (Keeping existing functionality) */}
      {data.urgentActions.length > 0 && (
        <div className="mt-8 flex gap-4 overflow-x-auto pb-4 scrollbar-none">
          {data.urgentActions.map((action, i) => (
            <button 
              key={i}
              onClick={() => onTabChange?.(action.tab)}
              className={cn("flex-shrink-0 min-w-[300px] p-6 rounded-3xl border-2 flex items-start gap-4 text-left transition-all hover:scale-[1.02] bg-white shadow-sm",
                action.type === "danger" ? "border-rose-100" : "border-amber-100"
              )}
            >
              <div className={cn("p-3 rounded-2xl", action.type === "danger" ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500")}>
                <action.icon size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">{action.title}</p>
                <p className="text-[11px] font-medium text-gray-500 leading-tight mt-1">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

