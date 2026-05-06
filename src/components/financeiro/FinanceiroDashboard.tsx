import React, { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, Scale, Clock, Percent, Building2,
  CheckCircle2, AlertCircle, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Target, Flame, ChevronRight, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance, FinancialTransaction } from "@/hooks/useFinance";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const colorMap: Record<string, string> = {
  emerald: "text-emerald-500 bg-emerald-500/8 border-emerald-500/15",
  rose: "text-rose-500 bg-rose-500/8 border-rose-500/15",
  blue: "text-blue-500 bg-blue-500/8 border-blue-500/15",
  amber: "text-amber-500 bg-amber-500/8 border-amber-500/15",
  violet: "text-violet-500 bg-violet-500/8 border-violet-500/15",
  cyan: "text-cyan-500 bg-cyan-500/8 border-cyan-500/15",
};

const EXPENSE_COLORS = [
  "bg-rose-500", "bg-violet-500", "bg-amber-500",
  "bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500",
];

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function getLast6Months(): { label: string; year: number; month: number }[] {
  const now = new Date();
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ label: MONTH_LABELS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() });
  }
  return result;
}

function computeMetrics(transactions: FinancialTransaction[]) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Receita paga e despesa paga
  const receitaPaga = transactions
    .filter(t => t.tipo === "entrada" && t.status === "pago")
    .reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);

  const despesaPaga = transactions
    .filter(t => t.tipo === "saida" && t.status === "pago")
    .reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);

  const saldoLiquido = receitaPaga - despesaPaga;

  // A receber = entradas pendentes/agendadas
  const aReceber = transactions
    .filter(t => t.tipo === "entrada" && t.status !== "pago")
    .reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);

  const margem = receitaPaga > 0 ? (saldoLiquido / receitaPaga) * 100 : 0;

  // Valuation estimado (Agência Digital = 3x receita anualizada)
  const receitaAnualizada = receitaPaga * (12 / Math.max(1, 6)); // estima com base nos dados disponíveis
  const valuation = receitaAnualizada * 3;

  // Últimos 6 meses
  const months6 = getLast6Months();
  const barData = months6.map(({ label, year, month }) => {
    const receita = transactions
      .filter(t => {
        const d = new Date(t.vencimento || t.data_lancamento);
        return t.tipo === "entrada" && t.status === "pago"
          && d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);

    const despesa = transactions
      .filter(t => {
        const d = new Date(t.vencimento || t.data_lancamento);
        return t.tipo === "saida" && t.status === "pago"
          && d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);

    return { month: label, receita, despesa };
  });

  const maxBar = Math.max(...barData.flatMap(d => [d.receita, d.despesa]), 1);

  // Cashflow projetado
  const addDays = (base: Date, n: number) => new Date(base.getTime() + n * 86400000);
  const inRange = (dateStr: string, from: Date, to: Date) => {
    const d = new Date(dateStr);
    return d >= from && d <= to;
  };

  const horizons = [0, 7, 15, 30];
  let accumulated = saldoLiquido;
  const cashflowDays = horizons.map((days, i) => {
    const from = i === 0 ? new Date(0) : addDays(now, horizons[i - 1] + 1);
    const to = addDays(now, days);

    const inflows = transactions
      .filter(t => t.tipo === "entrada" && t.status !== "pago" && t.vencimento && inRange(t.vencimento, from, to))
      .reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);

    const outflows = transactions
      .filter(t => t.tipo === "saida" && t.status !== "pago" && t.vencimento && inRange(t.vencimento, from, to))
      .reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);

    const delta = inflows - outflows;
    accumulated += delta;
    return {
      label: i === 0 ? "Hoje" : `+${days}d`,
      value: accumulated,
      delta: i === 0 ? 0 : delta,
    };
  });

  // Composição das despesas por categoria
  const expMap: Record<string, number> = {};
  transactions
    .filter(t => t.tipo === "saida" && t.status === "pago")
    .forEach(t => {
      const cat = t.categoria || "Outros";
      expMap[cat] = (expMap[cat] || 0) + (parseFloat(String(t.valor)) || 0);
    });

  const totalExp = Object.values(expMap).reduce((s, v) => s + v, 0);
  const expenseCategories = Object.entries(expMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], idx) => ({
      label,
      value,
      pct: totalExp > 0 ? (value / totalExp) * 100 : 0,
      color: EXPENSE_COLORS[idx % EXPENSE_COLORS.length],
    }));

  // Ações urgentes: vencimentos atrasados e pendentes próximos
  const urgentActions: { icon: any; type: string; title: string; desc: string; tab: string }[] = [];

  const vencidos = transactions.filter(t => t.status === "pendente" && t.vencimento && t.vencimento < today);
  if (vencidos.length > 0) {
    const total = vencidos.reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);
    urgentActions.push({
      icon: AlertCircle,
      type: "danger",
      title: `${vencidos.length} lançamento(s) vencido(s)`,
      desc: `Total em atraso: ${formatBRL(total)}`,
      tab: "lancamentos",
    });
  }

  const vence7d = transactions.filter(t => {
    if (t.status !== "pendente" || !t.vencimento) return false;
    return t.vencimento >= today && t.vencimento <= addDays(now, 7).toISOString().split("T")[0];
  });
  if (vence7d.length > 0) {
    urgentActions.push({
      icon: AlertTriangle,
      type: "warning",
      title: `${vence7d.length} vencimento(s) nos próximos 7 dias`,
      desc: `${formatBRL(vence7d.filter(t => t.tipo === "entrada").reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0))} a receber`,
      tab: "lancamentos",
    });
  }

  // Health score (0–100)
  const margemScore = Math.min(margem / 30 * 40, 40); // até 40 pts
  const inadimplenciaRatio = receitaPaga > 0 ? (vencidos.filter(t => t.tipo === "entrada").reduce((s, t) => s + parseFloat(String(t.valor)), 0) / receitaPaga) : 0;
  const inadimplenciaScore = Math.max(0, 30 - inadimplenciaRatio * 100); // até 30 pts
  const liquidezScore = saldoLiquido > 0 ? Math.min(30, 30) : Math.max(0, 30 + saldoLiquido / 1000); // até 30 pts
  const healthScore = Math.round(Math.min(100, margemScore + inadimplenciaScore + liquidezScore));

  const healthDesc =
    healthScore >= 75 ? "Finanças saudáveis. Continue assim!"
    : healthScore >= 50 ? "Situação estável, mas há pontos de atenção."
    : "Atenção: revise despesas e inadimplência.";

  return {
    receitaPaga, despesaPaga, saldoLiquido, aReceber,
    margem, valuation, barData, maxBar,
    cashflowDays, expenseCategories, totalExp,
    urgentActions, healthScore, healthDesc,
    inadimplenciaRatio,
  };
}

// ── Animated bar ───────────────────────────────────────────────────────────────
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

function AnimatedRing({ score }: { score: number }) {
  const [dash, setDash] = useState(0);
  const circumference = 2 * Math.PI * 26;
  useEffect(() => {
    const t = setTimeout(() => setDash((score / 100) * circumference), 100);
    return () => clearTimeout(t);
  }, [score, circumference]);
  return (
    <circle
      cx="32" cy="32" r="26"
      fill="none"
      stroke={score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#f43f5e"}
      strokeWidth="6"
      strokeLinecap="round"
      strokeDasharray={circumference}
      strokeDashoffset={circumference - dash}
      style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
    />
  );
}

interface Props {
  onTabChange?: (tab: string) => void;
}

export default function FinanceiroDashboard({ onTabChange }: Props) {
  const { transactions, loading, fetchTransactions } = useFinance();

  const m = computeMetrics(transactions);

  const kpis = [
    { label: "Receita Realizada", value: m.receitaPaga, icon: TrendingUp, color: "emerald", trend: formatBRL(m.receitaPaga), up: true, tab: "lancamentos" },
    { label: "Despesas Totais", value: m.despesaPaga, icon: TrendingDown, color: "rose", trend: formatBRL(m.despesaPaga), up: false, tab: "lancamentos" },
    { label: "Saldo Líquido", value: m.saldoLiquido, icon: Scale, color: "blue", trend: m.saldoLiquido >= 0 ? "Positivo" : "Negativo", up: m.saldoLiquido >= 0, tab: "relatorios" },
    { label: "A Receber", value: m.aReceber, icon: Clock, color: "amber", trend: m.aReceber > 0 ? formatBRL(m.aReceber) : "Nenhum", up: null, tab: "lancamentos" },
    { label: "Margem Líquida", value: null, display: `${m.margem.toFixed(1)}%`, icon: Percent, color: "violet", trend: m.margem >= 0 ? "Saudável" : "Negativa", up: m.margem >= 0, tab: "relatorios" },
    { label: "Valuation Est.", value: null, display: formatBRL(m.valuation), icon: Building2, color: "cyan", trend: "Múltiplo 3x", up: true, tab: "valuation" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">

      {/* Header com refresh */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            {transactions.length} lançamento(s) carregado(s) do Supabase
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all"
        >
          <RefreshCw size={11} />
          Atualizar
        </button>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => {
          const cls = colorMap[kpi.color];
          return (
            <div
              key={i}
              onClick={() => onTabChange?.(kpi.tab)}
              className={cn(
                "group p-4 rounded-xl border bg-card/60 backdrop-blur-sm hover:bg-card transition-all duration-200 hover:shadow-md cursor-pointer active:scale-[0.98]",
                cls
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border", cls)}>
                  <kpi.icon size={14} className={cls.split(" ")[0]} />
                </div>
                <ArrowUpRight size={11} className="text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors" />
              </div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 leading-none">
                {kpi.label}
              </p>
              <p className="text-lg font-bold text-foreground tracking-tight leading-none">
                {kpi.display ?? formatBRL(kpi.value ?? 0)}
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
              <p className="text-[11px] text-muted-foreground mt-0.5">Últimos 6 meses (lançamentos pagos)</p>
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
            {m.barData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                <div className="w-full flex items-end gap-0.5 justify-center h-full">
                  <AnimatedBar
                    height={`${(d.receita / m.maxBar) * 100}%`}
                    color="bg-emerald-500"
                    title={formatBRL(d.receita)}
                  />
                  <AnimatedBar
                    height={`${(d.despesa / m.maxBar) * 100}%`}
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
            {m.urgentActions.map((a, i) => (
              <div
                key={i}
                onClick={() => onTabChange?.(a.tab)}
                className={cn(
                  "p-3 rounded-lg border flex gap-2.5 cursor-pointer group hover:shadow-sm transition-all duration-200",
                  a.type === "danger" ? "bg-rose-500/5 border-rose-500/15 hover:border-rose-500/30"
                    : a.type === "warning" ? "bg-amber-500/5 border-amber-500/15 hover:border-amber-500/30"
                    : "bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/30"
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
            {m.urgentActions.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-10 opacity-40">
                <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">Tudo em dia</p>
              </div>
            )}
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
            {m.cashflowDays.map((day, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/20">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{day.label}</span>
                <div className="text-right">
                  <p className={cn("text-sm font-bold", day.value >= 0 ? "text-foreground" : "text-rose-500")}>
                    {formatBRL(day.value)}
                  </p>
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
          <div className="space-y-4">
            {m.expenseCategories.map((cat, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground">{cat.label}</span>
                  <span className="font-bold text-muted-foreground">{formatBRL(cat.value)}</span>
                </div>
                <AnimatedProgress pct={cat.pct} color={cat.color} />
                <p className="text-[10px] text-muted-foreground">{cat.pct.toFixed(1)}% do total</p>
              </div>
            ))}
            {m.expenseCategories.length === 0 && (
              <p className="text-center py-10 text-[10px] font-black uppercase tracking-widest opacity-30">
                Nenhuma despesa registrada
              </p>
            )}
            {m.totalExp > 0 && (
              <div className="pt-3 border-t border-border/30 flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">Total</span>
                <span className="text-sm font-bold text-foreground">{formatBRL(m.totalExp)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Health Score */}
        <div className="p-5 rounded-xl bg-card border border-border/40 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Saúde Financeira</h3>
            <p className="text-[11px] text-muted-foreground">Score baseado em margem, liquidez e inadimplência</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-border/30" />
                <AnimatedRing score={m.healthScore} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                {m.healthScore}
              </span>
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Margem</span>
                <span className={cn("font-semibold", m.margem >= 20 ? "text-emerald-500" : m.margem >= 0 ? "text-amber-500" : "text-rose-500")}>
                  {m.margem.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Saldo</span>
                <span className={cn("font-semibold", m.saldoLiquido >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {m.saldoLiquido >= 0 ? "Positivo" : "Negativo"}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Inadimplência</span>
                <span className={cn("font-semibold", m.inadimplenciaRatio < 0.1 ? "text-emerald-500" : "text-rose-500")}>
                  {(m.inadimplenciaRatio * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">A Receber</span>
                <span className="font-semibold text-amber-500">{formatBRL(m.aReceber)}</span>
              </div>
            </div>
          </div>

          <div className={cn(
            "mt-auto p-3 rounded-lg border text-[11px] font-medium leading-relaxed",
            m.healthScore >= 75 ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : m.healthScore >= 50 ? "bg-amber-500/5 border-amber-500/15 text-amber-600 dark:text-amber-400"
              : "bg-rose-500/5 border-rose-500/15 text-rose-600 dark:text-rose-400"
          )}>
            {m.healthDesc}
          </div>

          <button
            onClick={() => onTabChange?.("relatorios")}
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
