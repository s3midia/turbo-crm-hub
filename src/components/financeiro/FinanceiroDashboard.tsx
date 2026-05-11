import React, { useEffect, useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Scale, Clock, Percent, Building2,
  AlertTriangle, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight,
  Target, Flame, ChevronRight, PieChart as PieIcon, LineChart as LineIcon,
  Users, Wallet, Briefcase, Zap, Info, RefreshCw, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useFinance, FinancialTransaction } from "@/hooks/useFinance";
import { useProjections } from "@/hooks/useProjections";
import { formatBRL } from "@/lib/formatters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

import { calculateDashboardData, DashboardKPIs } from "./dashboard-utils";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function FinanceiroDashboard({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { transactions: txs, loading: transactionsLoading } = useProjections();
  const [extraLoading, setExtraLoading] = useState(true);
  const [extraData, setExtraData] = useState<{ employees: any[], valConfig: any }>({ employees: [], valConfig: null });

  useEffect(() => {
    async function fetchExtra() {
      try {
        setExtraLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [empRes, valRes] = await Promise.all([
          supabase.from('company_employees').select('*').eq('user_id', user.id),
          supabase.from('company_valuation_config').select('*').eq('user_id', user.id).single()
        ]);

        setExtraData({
          employees: empRes.data || [],
          valConfig: valRes.data
        });
      } catch (error) {
        console.error("Error fetching extra dashboard data:", error);
      } finally {
        setExtraLoading(false);
      }
    }
    fetchExtra();
  }, []);

  const data = useMemo(() => {
    return calculateDashboardData(txs, extraData);
  }, [txs, extraData]);

  const kpis = [
    { label: "Receita Realizada", value: data.receita_realizada, icon: TrendingUp, color: "emerald", trend: "+12%", up: true },
    { label: "Despesas Pagas", value: data.despesa_realizada, icon: TrendingDown, color: "rose", trend: "-5%", up: false },
    { label: "Saldo em Caixa", value: data.saldo_atual, icon: Scale, color: "blue", trend: "+8%", up: true },
    { label: "Pendente a Receber", value: data.a_receber, icon: Clock, color: "amber", trend: data.a_receber > 0 ? "Em aberto" : "Nenhum", up: null },
    { label: "Pendente a Pagar", value: data.a_pagar, icon: AlertCircle, color: "rose", trend: data.a_pagar > 0 ? "Compromissos" : "Nenhum", up: false },
    { label: "Valuation Est.", display: formatBRL(data.valuation_est), icon: Building2, color: "cyan", trend: "Estável", up: true },
  ];

  if (transactionsLoading && extraLoading) {
    return (
      <div className="h-96 flex items-center justify-center flex-col gap-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sincronizando Hub Financeiro...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700 font-jakarta">

      {/* --- KPI GRID (Minimalist Slim Design) --- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi, i) => {
            const sparkData = data.barData.map(m => {
              if (kpi.label === "Receita Realizada") return { value: m.receita };
              if (kpi.label === "Despesas Totais") return { value: m.despesa };
              if (kpi.label === "Saldo Líquido") return { value: m.profit };
              if (kpi.label === "Margem Líquida") return { value: m.receita > 0 ? (m.receita - m.despesa) / m.receita * 100 : 0 };
              return { value: Math.random() * 100 }; 
            });

            const isPositive = kpi.up !== false;
            const accentColor = isPositive ? (kpi.color === "rose" ? "#f87171" : "#10b981") : "#f87171";

            return (
              <div 
                key={i} 
                onClick={() => {
                  if (kpi.label === "Valuation Est.") onTabChange?.("valuation");
                  else if (kpi.label === "Margem Líquida") onTabChange?.("relatorios");
                  else onTabChange?.("lancamentos");
                }}
                className={cn(
                  "p-4 flex flex-col justify-center group transition-all duration-500 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 cursor-pointer select-none",
                  i % 3 !== 2 && "lg:border-r border-zinc-100 dark:border-zinc-800",
                  i < 3 && "lg:border-b border-zinc-100 dark:border-zinc-800",
                  "border-b lg:border-b-0 last:border-b-0"
                )}
              >
                {/* Header Row: Label + Stretched Sparkline + Icon */}
                <div className="flex items-center gap-4 mb-2">
                  <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap shrink-0">
                    {kpi.label}
                  </p>
                  
                  <div className="flex-1 h-10 opacity-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparkData}>
                        <defs>
                          <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={accentColor} stopOpacity={0.2}/>
                            <stop offset="100%" stopColor={accentColor} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={accentColor} 
                          strokeWidth={2.5} 
                          fillOpacity={1} 
                          fill={`url(#grad-${i})`}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={cn("p-1.5 rounded-lg shrink-0", kpi.color === "emerald" ? "bg-emerald-500/10 text-emerald-500" : kpi.color === "rose" ? "bg-rose-500/10 text-rose-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400")}>
                    <kpi.icon size={14} />
                  </div>
                </div>

                {/* Value Row */}
                <div className="flex items-baseline gap-2">
                  <h4 className="text-[22px] font-black text-zinc-900 dark:text-zinc-100 tracking-tighter leading-none">
                    {kpi.display || formatBRL(kpi.value || 0)}
                  </h4>
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", isPositive ? "text-emerald-500" : "text-rose-500")}>
                    {kpi.trend}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- SECOND ROW: MAIN CHART & TOP CLIENTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        
        {/* Main Chart: Profit Trend (The Big One) */}
        <div 
          onClick={() => onTabChange?.("lancamentos")}
          className="lg:col-span-3 p-5 lg:p-6 rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group cursor-pointer select-none"
        >
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-tight">
                <LineIcon size={18} className="text-zinc-400" />
                Desempenho Financeiro
              </h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Evolução de Fluxo (Receita vs Despesa)</p>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.15em]">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Receita</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /> Despesa</div>
            </div>
          </div>

          <div className="h-[220px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.barData}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888810" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#888' }} 
                  dy={10}
                />
                <YAxis 
                  hide 
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#ffffff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '900' }}
                  formatter={(value: any) => formatBRL(value)}
                />
                <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRec)" />
                <Area type="monotone" dataKey="despesa" stroke="#f87171" strokeWidth={4} fillOpacity={1} fill="url(#colorDesp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Background Decorative Grid */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
            <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          </div>
        </div>

        {/* Top Clients & EBITDA */}
        <div className="lg:col-span-2 space-y-4">
          <div 
            onClick={() => onTabChange?.("relatorios")}
            className="p-4 rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm h-full flex flex-col cursor-pointer select-none"
          >
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4 uppercase tracking-tight">
              <Users size={18} className="text-zinc-400" />
              Maiores Clientes
            </h3>
            <div className="space-y-3 flex-1">
              {data.topClients.map((client, i) => (
                <div key={i} className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black">
                      {client.name.substring(0, 1)}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">{client.name}</p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Participação: {((client.total / data.receita_realizada) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100">{formatBRL(client.total)}</span>
                </div>
              ))}
              {data.topClients.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-6 text-zinc-300">
                  <Info size={24} className="mb-2 opacity-20" />
                  <p className="text-[8px] font-black uppercase tracking-widest">Sem dados de clientes</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Lucro Operacional</span>
                <span className="text-[18px] font-black text-emerald-500">{formatBRL(data.ebitda)}</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <TrendingUp size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- THIRD ROW: EXPENSES, CASHFLOW & HEALTH --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Expense Breakdown (Donut Chart) */}
        <div 
          onClick={() => onTabChange?.("lancamentos")}
          className="p-4 rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col cursor-pointer select-none"
        >
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-3 uppercase tracking-tight">
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
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Total Saídas (Pagas)</span>
            <span className="text-[14px] font-black text-rose-500">{formatBRL(data.despesa_realizada)}</span>
          </div>
        </div>

        {/* Projected Cashflow & Line Chart */}
        <div 
          onClick={() => onTabChange?.("lancamentos")}
          className="p-4 rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col cursor-pointer select-none"
        >
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-3 uppercase tracking-tight">
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
        </div>

        {/* Health Score & Actions */}
        <div 
          onClick={() => onTabChange?.("relatorios")}
          className="p-4 rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col cursor-pointer hover:bg-zinc-50/50 transition-all group select-none"
        >
          <div className="mb-3">
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight flex items-center gap-2 mb-4">
              <Zap size={18} className="text-amber-500 fill-amber-500/20" />
              Saúde Financeira
            </h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Score Dinâmico de Performance</p>
          </div>

          <div className="flex items-center gap-6 mb-4">
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
                { label: "Liquidez", val: data.a_receber > data.a_pagar ? "Alta" : "Média", color: "text-emerald-500" },
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
              <div className="flex flex-col items-center justify-center py-4 opacity-30">
                <CheckCircle2 size={24} className="text-emerald-500 mb-1" />
                <p className="text-[8px] font-black uppercase tracking-widest">Tudo sob controle</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
