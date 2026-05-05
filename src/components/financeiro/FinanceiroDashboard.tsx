import React, { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight,
  Zap, Info, RefreshCw, MoreHorizontal, Send, Plus, CreditCard,
  LayoutDashboard, ShoppingBag, Utensils, Receipt, Home as HomeIcon,
  Gamepad2, Plane, Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/formatters";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

// --- Types ---
interface DashboardData {
  receita_realizada: number;
  despesas_totais: number;
  saldo_liquido: number;
  a_receber: number;
  recentTransactions: any[];
  expenseCategories: any[];
  budgetData: any[];
  cardInfo: {
    last4: string;
    expiry: string;
    balance: number;
    limit: number;
    used: number;
  };
}

const LIME_PRIMARY = "#d9f99d";
const LIME_DARK = "#bef264";

const CATEGORY_ICONS: Record<string, any> = {
  "Alimentação": Utensils,
  "Contas": Receipt,
  "Lazer": Gamepad2,
  "Transporte": Plane,
  "Moradia": HomeIcon,
  "Compras": ShoppingBag,
  "Outros": Info
};

const CATEGORY_COLORS: Record<string, string> = {
  "Alimentação": "#fbbf24",
  "Contas": "#3b82f6",
  "Lazer": "#8b5cf6",
  "Transporte": "#06b6d4",
  "Moradia": "#10b981",
  "Compras": "#f87171",
  "Outros": "#94a3b8"
};

export default function FinanceiroDashboard({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    receita_realizada: 0,
    despesas_totais: 0,
    saldo_liquido: 0,
    a_receber: 0,
    recentTransactions: [],
    expenseCategories: [],
    budgetData: [],
    cardInfo: {
      last4: "9423",
      expiry: "06/28",
      balance: 8523.20,
      limit: 22000.00,
      used: 0
    }
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
        .eq('user_id', user.id)
        .order('vencimento', { ascending: false });

      const txs = transactions || [];

      // KPIs
      const receita = txs.filter(t => t.tipo === 'entrada' && t.status === 'pago').reduce((acc, t) => acc + Number(t.valor), 0);
      const despesas = txs.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + Number(t.valor), 0);
      const saldo = receita - despesas;
      const aReceber = txs.filter(t => t.tipo === 'entrada' && t.status === 'pendente').reduce((acc, t) => acc + Number(t.valor), 0);
      
      // Recent Transactions (Top 5)
      const recent = txs.slice(0, 5).map(t => ({
        id: t.id,
        name: t.lead_nome || t.categoria || "Transação",
        date: new Date(t.vencimento).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
        time: "11:55 AM", 
        amount: (t.tipo === 'saida' ? -1 : 1) * Number(t.valor),
        icon: CATEGORY_ICONS[t.categoria] || Wallet,
        color: CATEGORY_COLORS[t.categoria] || "#94a3b8"
      }));

      // Expense Categories (for Radar Chart)
      const catMap: Record<string, number> = {};
      txs.filter(t => t.tipo === 'saida').forEach(t => {
        catMap[t.categoria] = (catMap[t.categoria] || 0) + Number(t.valor);
      });
      
      const defaultRadarData = [
        { subject: 'Alimentação', A: 120 },
        { subject: 'Contas', A: 98 },
        { subject: 'Lazer', A: 86 },
        { subject: 'Moradia', A: 99 },
        { subject: 'Compras', A: 85 },
        { subject: 'Outros', A: 65 },
      ];

      const realRadarData = Object.keys(catMap).length > 0 
        ? Object.entries(catMap).map(([cat, val]) => ({ subject: cat, A: val }))
        : defaultRadarData;

      // Budget Line Chart Data
      const budgetData = [
        { day: '18 dec', value: 3200 },
        { day: '25 dec', value: 4800 },
        { day: '1 jan', value: 2400 },
        { day: '8 jan', value: 3800 },
        { day: '15 jan', value: 6500 },
        { day: '22 jan', value: 5400 },
        { day: '29 jan', value: 6800 },
      ];

      setData({
        receita_realizada: receita,
        despesas_totais: despesas,
        saldo_liquido: saldo,
        a_receber: aReceber,
        recentTransactions: recent,
        expenseCategories: realRadarData.slice(0, 6),
        budgetData: budgetData,
        cardInfo: {
          last4: "9423",
          expiry: "06/28",
          balance: saldo,
          limit: 22000.00,
          used: despesas
        }
      });
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#f8faf7] min-h-screen rounded-[2.5rem] space-y-6">
      
      {/* --- GRID LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. Recent Transactions (Col: 4) */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-black/[0.03]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recent transactions</h3>
            <button 
              onClick={() => onTabChange?.("lancamentos")}
              className="px-4 py-2 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-slate-800 transition-all active:scale-95"
            >
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          
          <div className="space-y-6">
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                    style={{ backgroundColor: `${tx.color}15`, color: tx.color }}
                  >
                    <tx.icon size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none">{tx.name}</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1.5 uppercase tracking-wider">{tx.date} · {tx.time}</p>
                  </div>
                </div>
                <p className={cn("font-bold text-sm tracking-tight", tx.amount < 0 ? "text-slate-900" : "text-emerald-500")}>
                  {tx.amount < 0 ? "- " : "+ "}{formatBRL(Math.abs(tx.amount))}
                </p>
              </div>
            ))}
            {data.recentTransactions.length === 0 && (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Info size={20} className="text-slate-300" />
                </div>
                <p className="text-xs text-slate-400 font-medium italic">Nenhuma transação recente</p>
              </div>
            )}
          </div>
        </div>

        {/* 2. Spending Radar (Col: 5) */}
        <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-black/[0.03]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Spending</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#bef264]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">This month</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full border border-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average</span>
              </div>
            </div>
          </div>
          
          <div className="h-[320px] w-full mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.expenseCategories}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}
                />
                <Radar
                  name="Gastos"
                  dataKey="A"
                  stroke="#4d7c0f"
                  strokeWidth={2}
                  fill={LIME_DARK}
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Quick Transfer (Col: 3) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-black/[0.03] h-full flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-8">Quick transfer</h3>
            
            <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-4 scrollbar-none">
              {[1, 2, 3, 4, 5].map((i) => (
                <img 
                  key={i}
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}\u0026backgroundColor=f1f5f9`} 
                  alt="avatar" 
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm shrink-0 ring-1 ring-slate-100"
                />
              ))}
              <button className="w-10 h-10 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-slate-400 hover:text-slate-500 transition-all shrink-0 active:scale-90">
                <Plus size={18} />
              </button>
            </div>
            
            <div className="relative mb-4 group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
              <input 
                type="text" 
                placeholder="1000" 
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-10 pr-4 text-slate-900 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-lime-500/20 transition-all text-lg"
              />
            </div>
            
            <button className="w-full bg-black text-white rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] mt-auto">
              Send <Send size={14} className="opacity-60" />
            </button>
          </div>
        </div>

        {/* 4. Credit Card Widget (Col: 3) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-black/[0.03]">
            <div className="relative w-full aspect-[1.58/1] bg-gradient-to-br from-[#d9f99d] to-[#bef264] rounded-[1.75rem] p-6 overflow-hidden shadow-lg shadow-lime-500/20 mb-8 group cursor-pointer transition-all hover:shadow-xl hover:shadow-lime-500/30">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all" />
              <div className="flex justify-between items-start mb-10 relative z-10">
                <p className="text-[9px] font-black text-black/40 uppercase tracking-[0.2em]">Universal</p>
                <div className="relative w-10 h-6">
                    <div className="absolute left-0 w-6 h-6 rounded-full bg-black/10 backdrop-blur-sm" />
                    <div className="absolute right-0 w-6 h-6 rounded-full bg-black/10 backdrop-blur-sm" />
                </div>
              </div>
              <div className="mb-8 relative z-10">
                <p className="text-2xl font-black text-black tracking-tight">{formatBRL(data.cardInfo.balance)}</p>
              </div>
              <div className="flex justify-between items-end relative z-10">
                <p className="text-[10px] font-bold text-black/50 tracking-[0.2em]">*{data.cardInfo.last4}  {data.cardInfo.expiry}</p>
                <p className="text-xs font-black text-black tracking-tighter italic">VISA</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8 px-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credit limit</span>
                <span className="text-xs font-bold text-slate-900">{formatBRL(data.cardInfo.limit)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credit used</span>
                <span className="text-xs font-bold text-slate-900">{formatBRL(data.cardInfo.used)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currency</span>
                <span className="text-xs font-bold text-slate-900">BRL</span>
              </div>
            </div>
            
            <button className="w-full bg-black text-white rounded-2xl py-3.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98]">
              <Plus size={14} strokeWidth={3} /> Add new card
            </button>
          </div>
        </div>

        {/* 5. Budget Line Chart (Col: 6) */}
        <div className="lg:col-span-6 bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-black/[0.03]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Budget</h3>
            <select className="bg-slate-50 border-none rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-0 cursor-pointer hover:bg-slate-100 transition-colors">
              <option>Month</option>
              <option>Year</option>
            </select>
          </div>
          
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.budgetData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1', textAnchor: 'middle' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }}
                  tickFormatter={(val) => `${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: '800',
                    padding: '16px',
                    backgroundColor: '#000',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#bef264' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '10px' }}
                  formatter={(value: any) => [formatBRL(value), 'Value']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#1e293b" 
                  strokeWidth={4} 
                  dot={false}
                  activeDot={{ r: 6, fill: LIME_DARK, stroke: '#fff', strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Promo Card (Col: 3) - Tall */}
        <div className="lg:col-span-3">
          <div className="bg-[#bef264] rounded-[2.5rem] p-10 h-full relative overflow-hidden flex flex-col justify-between group shadow-lg shadow-lime-500/10 border border-black/[0.03]">
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-slate-950 leading-[1.1] tracking-tighter">
                How to reduce expenses by <span className="bg-slate-950 text-white px-3 py-1 rounded-full inline-flex items-center justify-center -rotate-2 ml-1 shadow-lg">25%?</span>
              </h2>
            </div>
            
            <div className="my-10 relative z-10 flex justify-center group-hover:scale-110 transition-all duration-700">
               <div className="relative">
                  <div className="w-24 h-24 bg-slate-950 rounded-[2rem] flex items-center justify-center relative overflow-hidden shadow-2xl rotate-3">
                    <TrendingDown size={48} className="text-[#bef264]" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-12 h-12 bg-white rounded-full border-4 border-[#bef264] flex items-center justify-center shadow-xl -rotate-12">
                    <Zap size={20} className="text-slate-950" />
                  </div>
               </div>
            </div>
            
            <button className="w-full bg-white text-slate-950 rounded-2xl py-4 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-black/5 hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 relative z-10">
              Learn more
            </button>
            
            {/* Background elements */}
            <div className="absolute top-1/2 -right-20 w-60 h-60 bg-black/[0.03] rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
          </div>
        </div>

      </div>

      {/* --- QUICK STATS / KPI SUMMARY --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[
            { label: "Income", val: data.receita_realizada, icon: TrendingUp, color: "emerald" },
            { label: "Expenses", val: data.despesas_totais, icon: TrendingDown, color: "rose" },
            { label: "Pending", val: data.a_receber, icon: Clock, color: "blue" },
            { label: "Balance", val: data.saldo_liquido, icon: LayoutDashboard, color: "slate" },
        ].map((kpi, i) => (
            <div key={i} className="bg-white/40 backdrop-blur-md rounded-[2rem] p-5 border border-white/60 flex items-center gap-4 shadow-sm hover:bg-white/60 transition-all">
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm", 
                    kpi.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                    kpi.color === "rose" ? "bg-rose-50 text-rose-600" :
                    kpi.color === "blue" ? "bg-blue-50 text-blue-600" :
                    "bg-slate-50 text-slate-600"
                )}>
                    <kpi.icon size={18} strokeWidth={2.5} />
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{kpi.label}</p>
                    <p className="text-sm font-black text-slate-900 tracking-tight leading-none">{formatBRL(kpi.val)}</p>
                </div>
            </div>
        ))}
      </div>

    </div>
  );
}
