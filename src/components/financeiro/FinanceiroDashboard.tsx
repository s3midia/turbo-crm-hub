import React, { useEffect, useRef, useState } from "react";
import {
  TrendingUp, TrendingDown, Scale, Clock, Percent, Building2,
  AlertTriangle, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight,
  Target, Flame, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const kpis = [
  { label: "Receita Realizada", value: 23476, icon: TrendingUp, color: "emerald", trend: "+18.2%", up: true },
  { label: "Despesas Totais", value: 4670, icon: TrendingDown, color: "rose", trend: "-2.3%", up: false },
  { label: "Saldo Líquido", value: 18806, icon: Scale, color: "blue", trend: "+22.1%", up: true },
  { label: "A Receber", value: 6097, icon: Clock, color: "amber", trend: "Pendente", up: null },
  { label: "Margem Líquida", value: null, display: "80.1%", icon: Percent, color: "violet", trend: "+5.4pp", up: true },
  { label: "Valuation Est.", value: null, display: "R$ 842k", icon: Building2, color: "cyan", trend: "Crescendo", up: true },
];

const colorMap: Record<string, string> = {
  emerald: "text-emerald-500 bg-emerald-500/8 border-emerald-500/15",
  rose: "text-rose-500 bg-rose-500/8 border-rose-500/15",
  blue: "text-blue-500 bg-blue-500/8 border-blue-500/15",
  amber: "text-amber-500 bg-amber-500/8 border-amber-500/15",
  violet: "text-violet-500 bg-violet-500/8 border-violet-500/15",
  cyan: "text-cyan-500 bg-cyan-500/8 border-cyan-500/15",
};

const urgentActions = [
  { type: "danger", icon: AlertTriangle, title: "3 pagamentos vencidos", desc: "Clínica Academias 6, Giovanna e ANDREA OLIVEIRA — R$ 13.476", action: "Ver cobranças", tab: "cobrancas" },
  { type: "warning", icon: AlertCircle, title: "Hospedagem AWS vence em 3 dias", desc: "R$ 1.450,00 — vencimento 18/05/2026", action: "Agendar", tab: "lancamentos" },
  { type: "warning", icon: AlertCircle, title: "Meta mensal: 83% atingida", desc: "Faltam R$ 4.024 · 4 dias restantes", action: "Ver metas", tab: "relatorios" },
  { type: "success", icon: CheckCircle2, title: "Impostos em dia", desc: "Próximo: DAS Simples — 20/05/2026", action: "Ver fiscal", tab: "cobrancas" },
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

// ── Animated bar component ─────────────────────────────────────────────────────
function AnimatedBar({ height, color, title }: { height: string; color: string; title: string }) {
  const [h, setH] = useState("0%");
  useEffect(() => {
    const t = setTimeout(() => setH(height), 80);
    return () => clearTimeout(t);
  }, [height]);
  return (
    <div
      className={cn("flex-1 rounded-t-md transition-all duration-700 ease-out cursor-pointer opacity-80 hover:opacity-100", color)}
      style={{ height: h }}
      title={title}
    />
  );
}

// ── Animated progress bar ──────────────────────────────────────────────────────
function AnimatedProgress({ pct, color }: { pct: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

interface Props {
  onTabChange?: (tab: string) => void;
}

export default function FinanceiroDashboard({ onTabChange }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">

      {/* ── KPI STRIP ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => {
          const cls = colorMap[kpi.color];
          return (
            <div
              key={i}
              className={cn(
                "group p-4 rounded-xl border bg-card/60 backdrop-blur-sm hover:bg-card transition-all duration-200 hover:shadow-sm cursor-default",
                cls
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-3 border", cls)}>
                <kpi.icon size={14} className={cls.split(" ")[0]} />
              </div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 leading-none">
                {kpi.label}
              </p>
              <p className="text-lg font-bold text-foreground tracking-tight leading-none">
                {kpi.display ?? (kpi.value !== null ? formatBRL(kpi.value!) : "—")}
              </p>
              <div className={cn(
                "mt-2 text-[10px] font-semibold flex items-center gap-0.5",
                kpi.up === true ? "text-emerald-500" : kpi.up === false ? "text-rose-500" : "text-amber-500"
              )}>
                {kpi.up === true && <ArrowUpRight size={10} />}
                {kpi.up === false && <ArrowDownRight size={10} />}
                {kpi.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MID ROW ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Bar Chart */}
        <div className="lg:col-span-3 p-5 rounded-xl bg-card border border-border/40">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Receitas vs Despesas</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />Receita
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-rose-400 inline-block" />Despesa
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2" style={{ height: "140px" }}>
            {barData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                <div className="w-full flex items-end gap-0.5 justify-center h-full">
                  <AnimatedBar
                    height={`${(d.receita / maxBar) * 100}%`}
                    color="bg-emerald-500"
                    title={formatBRL(d.receita)}
                  />
                  <AnimatedBar
                    height={`${(d.despesa / maxBar) * 100}%`}
                    color="bg-rose-400"
                    title={formatBRL(d.despesa)}
                  />
                </div>
                <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest mt-1">{d.month}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent Actions */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-card border border-border/40">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Flame size={14} className="text-orange-400" />
            Ações Urgentes
          </h3>
          <div className="space-y-2">
            {urgentActions.map((a, i) => (
              <div
                key={i}
                onClick={() => onTabChange?.(a.tab)}
                className={cn(
                  "p-3 rounded-lg border flex gap-2.5 cursor-pointer group hover:shadow-sm transition-all duration-200",
                  a.type === "danger" ? "bg-rose-500/5 border-rose-500/15 hover:border-rose-500/30" :
                    a.type === "warning" ? "bg-amber-500/5 border-amber-500/15 hover:border-amber-500/30" :
                      "bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/30"
                )}
              >
                <a.icon size={14} className={cn(
                  "mt-0.5 shrink-0",
                  a.type === "danger" ? "text-rose-500" : a.type === "warning" ? "text-amber-500" : "text-emerald-500"
                )} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-foreground leading-tight">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{a.desc}</p>
                </div>
                <ChevronRight size={13} className="mt-0.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Cashflow */}
        <div className="p-5 rounded-xl bg-card border border-border/40">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Target size={14} className="text-blue-500" />
            Fluxo de Caixa Projetado
          </h3>
          <div className="space-y-2">
            {cashflowDays.map((day, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/20">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{day.label}</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatBRL(day.value)}</p>
                  {day.delta !== 0 && (
                    <p className={cn("text-[10px] font-medium", day.delta > 0 ? "text-emerald-500" : "text-rose-500")}>
                      {day.delta > 0 ? "+" : ""}{formatBRL(day.delta)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="p-5 rounded-xl bg-card border border-border/40">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Scale size={14} className="text-violet-500" />
            Composição das Despesas
          </h3>
          <div className="space-y-5">
            {expenseCategories.map((cat, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground">{cat.label}</span>
                  <span className="font-bold text-muted-foreground">{formatBRL(cat.value)}</span>
                </div>
                <AnimatedProgress pct={cat.pct} color={cat.color} />
                <p className="text-[10px] text-muted-foreground">{cat.pct.toFixed(1)}% do total</p>
              </div>
            ))}
            <div className="pt-3 border-t border-border/30 flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Total</span>
              <span className="text-sm font-bold text-foreground">{formatBRL(totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Health Score */}
        <div className="p-5 rounded-xl bg-card border border-border/40 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Saúde Financeira</h3>
            <p className="text-[11px] text-muted-foreground">Score baseado em margem, liquidez e crescimento</p>
          </div>

          {/* Score Ring - simple CSS */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-border/30" />
                <AnimatedRing />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">92</span>
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Margem</span>
                <span className="font-semibold text-emerald-500">Excelente</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Liquidez</span>
                <span className="font-semibold text-emerald-500">Sólida</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Inadimplência</span>
                <span className="font-semibold text-amber-500">Atenção</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Crescimento</span>
                <span className="font-semibold text-emerald-500">Forte</span>
              </div>
            </div>
          </div>

          <div className="mt-auto p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium leading-relaxed">
              Margem líquida de <strong>80.1%</strong> está acima da média do setor tech (45–55%). Eficiência operacional excelente.
            </p>
          </div>

          <button
            onClick={() => {}}
            className="w-full py-2 rounded-lg border border-border/50 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-all flex items-center justify-center gap-1.5"
          >
            Ver relatório completo
            <ArrowUpRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AnimatedRing() {
  const [dash, setDash] = useState(0);
  const circumference = 2 * Math.PI * 26; // ~163.4
  useEffect(() => {
    const t = setTimeout(() => setDash((92 / 100) * circumference), 100);
    return () => clearTimeout(t);
  }, []);
  return (
    <circle
      cx="32" cy="32" r="26"
      fill="none"
      stroke="#10b981"
      strokeWidth="6"
      strokeLinecap="round"
      strokeDasharray={circumference}
      strokeDashoffset={circumference - dash}
      style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
    />
  );
}
