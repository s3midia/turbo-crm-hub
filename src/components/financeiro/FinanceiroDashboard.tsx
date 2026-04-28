import React from "react";
import {
  TrendingUp, TrendingDown, Scale, Clock, Percent, Building2,
  AlertTriangle, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight,
  Sparkles, Target, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const kpis = [
  { label: "Receita Realizada", value: 23476, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", trend: "+18.2%", up: true },
  { label: "Despesas Totais", value: 4670, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", trend: "-2.3%", up: false },
  { label: "Saldo Líquido", value: 18806, icon: Scale, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", trend: "+22.1%", up: true },
  { label: "A Receber", value: 6097, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", trend: "Pendente", up: null },
  { label: "Margem Líquida", value: null, display: "80.1%", icon: Percent, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20", trend: "+5.4pp", up: true },
  { label: "Valuation Est.", value: null, display: "R$ 842k", icon: Building2, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20", trend: "↗ Crescendo", up: true },
];

const urgentActions = [
  { type: "danger", icon: AlertTriangle, title: "3 pagamentos vencidos", desc: "Clínica Academias 6, Giovanna, e ANDREA OLIVEIRA — total R$ 13.476", action: "Ver cobranças" },
  { type: "warning", icon: AlertCircle, title: "Hospedagem AWS vence em 3 dias", desc: "R$ 1.450,00 — vencimento em 18/05/2026", action: "Agendar pagamento" },
  { type: "warning", icon: AlertCircle, title: "Meta mensal: 83% atingida", desc: "Faltam R$ 4.024 para bater R$ 27.500 — 4 dias restantes", action: "Ver metas" },
  { type: "success", icon: CheckCircle2, title: "Nenhum imposto vencido", desc: "Próximo vencimento: DAS Simples — 20/05/2026", action: "Ver fiscal" },
];

const barData = [
  { month: "Nov", receita: 18400, despesa: 3200 },
  { month: "Dez", receita: 23476, despesa: 4670 },
  { month: "Jan", receita: 14200, despesa: 5100 },
  { month: "Fev", receita: 19800, despesa: 4300 },
  { month: "Mar", receita: 21300, despesa: 3900 },
  { month: "Abr", receita: 16500, despesa: 4100 },
];

const maxBar = Math.max(...barData.flatMap(d => [d.receita, d.despesa]));

const cashflowDays = [
  { label: "Hoje", value: 18806, delta: 0 },
  { label: "+7d", value: 16356, delta: -2450 },
  { label: "+15d", value: 22353, delta: 5997 },
  { label: "+30d", value: 19853, delta: -2500 },
];

const expenseCategories = [
  { label: "Infraestrutura", value: 1670, pct: 35.8, color: "bg-blue-500" },
  { label: "Marketing", value: 3000, pct: 64.2, color: "bg-violet-500" },
];
const totalExpenses = expenseCategories.reduce((s, c) => s + c.value, 0);

export default function FinanceiroDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className={cn("group p-5 rounded-2xl bg-card border hover:scale-[1.02] transition-all duration-300 hover:shadow-xl relative overflow-hidden", kpi.border)}>
            <div className={cn("absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity", kpi.bg)} />
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", kpi.bg)}>
              <kpi.icon className={cn("w-4.5 h-4.5", kpi.color)} size={18} />
            </div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{kpi.label}</p>
            <p className="text-xl font-black text-foreground tracking-tight">
              {kpi.display ?? (kpi.value !== null ? formatBRL(kpi.value!) : "—")}
            </p>
            <div className={cn(
              "mt-2 text-[10px] font-bold flex items-center gap-1",
              kpi.up === true ? "text-emerald-500" : kpi.up === false ? "text-rose-500" : "text-amber-500"
            )}>
              {kpi.up === true && <ArrowUpRight size={11} />}
              {kpi.up === false && <ArrowDownRight size={11} />}
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Mid Row: Chart + Urgent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              Receitas vs Despesas
            </h3>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />Receita</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />Despesa</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-44">
            {barData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-1 justify-center" style={{ height: "160px" }}>
                  <div
                    className="flex-1 rounded-t-lg bg-emerald-500/80 hover:bg-emerald-500 transition-all cursor-pointer"
                    style={{ height: `${(d.receita / maxBar) * 100}%` }}
                    title={formatBRL(d.receita)}
                  />
                  <div
                    className="flex-1 rounded-t-lg bg-rose-400/80 hover:bg-rose-400 transition-all cursor-pointer"
                    style={{ height: `${(d.despesa / maxBar) * 100}%` }}
                    title={formatBRL(d.despesa)}
                  />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{d.month}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent Actions */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5">
            <Flame size={16} className="text-orange-500" />
            Ações Urgentes
          </h3>
          <div className="space-y-3">
            {urgentActions.map((a, i) => (
              <div key={i} className={cn(
                "p-3 rounded-xl border flex gap-3 group cursor-pointer hover:scale-[1.01] transition-all",
                a.type === "danger" ? "bg-rose-500/5 border-rose-500/20" :
                  a.type === "warning" ? "bg-amber-500/5 border-amber-500/20" :
                    "bg-emerald-500/5 border-emerald-500/20"
              )}>
                <a.icon size={16} className={cn(
                  "mt-0.5 shrink-0",
                  a.type === "danger" ? "text-rose-500" : a.type === "warning" ? "text-amber-500" : "text-emerald-500"
                )} />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-foreground truncate">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{a.desc}</p>
                  <button className={cn(
                    "text-[10px] font-black uppercase tracking-wider mt-1.5 hover:underline",
                    a.type === "danger" ? "text-rose-500" : a.type === "warning" ? "text-amber-500" : "text-emerald-500"
                  )}>{a.action} →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Cashflow + Expenses Breakdown + AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow */}
        <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5">
            <Target size={16} className="text-blue-500" />
            Fluxo de Caixa Projetado
          </h3>
          <div className="space-y-3">
            {cashflowDays.map((day, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/20">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{day.label}</span>
                <div className="text-right">
                  <p className="text-sm font-black text-foreground">{formatBRL(day.value)}</p>
                  {day.delta !== 0 && (
                    <p className={cn("text-[10px] font-bold", day.delta > 0 ? "text-emerald-500" : "text-rose-500")}>
                      {day.delta > 0 ? "+" : ""}{formatBRL(day.delta)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5">
            <Scale size={16} className="text-violet-500" />
            Composição das Despesas
          </h3>
          <div className="space-y-4">
            {expenseCategories.map((cat, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground">{cat.label}</span>
                  <span className="font-black text-muted-foreground">{formatBRL(cat.value)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", cat.color)}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold">{cat.pct.toFixed(1)}% do total</p>
              </div>
            ))}
            <div className="pt-2 border-t border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground">Total Despesas</span>
                <span className="text-sm font-black text-foreground">{formatBRL(totalExpenses)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-6 -mb-6" />
          <div className="relative z-10 space-y-4 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black italic flex items-center gap-2 mb-3">
                AI INSIGHT
                <Sparkles size={16} className="fill-current animate-pulse" />
              </h3>
              <p className="text-sm opacity-90 leading-relaxed font-medium">
                Sua margem líquida de <strong>80.1%</strong> está acima da média do setor de tech (45–55%). Excelente eficiência operacional.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Recomendação</p>
              <p className="text-xs font-semibold leading-relaxed">
                Com essa margem, você pode aumentar investimentos em marketing em até{" "}
                <span className="text-lg font-black block mt-1">R$ 5.200/mês</span>
                mantendo saldo positivo.
              </p>
            </div>
            <button className="w-full py-2.5 rounded-xl bg-white text-primary text-xs font-black hover:bg-white/90 transition-all flex items-center justify-center gap-2">
              Ver Relatório Completo
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
