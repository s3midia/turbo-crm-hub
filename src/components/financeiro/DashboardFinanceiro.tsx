import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

function formatBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

// ── KPIs ──────────────────────────────────────────────────────────────────────
const kpis = [
  { label: "Faturamento Total", value: "R$ 0,00", sub: "Últimos 12 meses", trend: "0%", up: true },
  { label: "Clientes Ativos", value: "0", sub: "Com contratos vigentes", trend: "0%", up: true },
  { label: "Taxa de Crescimento", value: "0%", sub: "Vs. mesmo período", trend: "0pp", up: true },
  { label: "Inadimplências", value: "0", sub: "Pagamentos vencidos", trend: "0%", up: false },
  { label: "Projetos em Andamento", value: "0", sub: "Em execução agora", trend: "0%", up: true },
  { label: "Projetos Concluídos", value: "0", sub: "No ano corrente", trend: "0%", up: true },
];

// ── Focus Areas ───────────────────────────────────────────────────────────────
const focusAreas = [
  { name: "Financeiro", status: "Pendente", trendUp: null, tab: "dashboard" },
  { name: "Stakeholders", status: "Pendente", trendUp: null, tab: "cobrancas" },
  { name: "Processos Internos", status: "Pendente", trendUp: null, tab: "lancamentos" },
  { name: "Capacidade Operacional", status: "Pendente", trendUp: null, tab: "equipe" },
];

const orgPerf = [
  { name: "CEO / Estratégia", status: "Pendente", trendUp: null },
  { name: "Vendas", status: "Pendente", trendUp: null },
  { name: "Operações", status: "Pendente", trendUp: null },
  { name: "Financeiro", status: "Pendente", trendUp: null },
];

// ── Cash Flow Data (quarterly) ────────────────────────────────────────────────
const cashFlowQ = [
  { label: "Q1", points: [0, 0, 0, 0, 0, 0] },
  { label: "Q2", points: [0, 0, 0, 0, 0, 0] },
  { label: "Q3", points: [0, 0, 0, 0, 0, 0] },
  { label: "Q4", points: [0, 0, 0, 0, 0, 0] },
];
const allPoints = cashFlowQ.flatMap(q => q.points);
const minPt = Math.min(...allPoints);
const maxPt = Math.max(...allPoints);
const chartW = 340;
const chartH = 100;
function toX(i: number, total: number) { return total > 1 ? (i / (total - 1)) * chartW : 0; }
function toY(v: number) { return chartH - ((v - minPt) / (maxPt - minPt + 0.5)) * chartH; }

// ── Risk Area Data ────────────────────────────────────────────────────────────
const riskMonths = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const high =   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const medium = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const low =    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function buildPath(data: number[], minV: number, maxV: number, w: number, h: number) {
  return data.map((v, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * w : 0;
    const y = h - ((v - minV) / (maxV - minV + 1)) * h;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}
function buildArea(data: number[], minV: number, maxV: number, w: number, h: number) {
  const line = buildPath(data, minV, maxV, w, h);
  return `${line} L ${w} ${h} L 0 ${h} Z`;
}
const rW = 400, rH = 110;
const rMin = 0, rMax = 28;

// ── Initiative Bar Data ───────────────────────────────────────────────────────
const initiativeMonths = ["Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const overdue = [0, 0, 0, 0, 0, 0, 0, 0];
const budget  = [0, 0, 0, 0, 0, 0, 0, 0];
const maxInitBar = Math.max(...overdue, 1);

// ── Animated SVG line ─────────────────────────────────────────────────────────
function AnimatedLine({ d, stroke, strokeWidth = 1.5 }: { d: string; stroke: string; strokeWidth?: number }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);
  useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, [d]);
  useEffect(() => {
    if (len > 0 && pathRef.current) {
      pathRef.current.style.strokeDasharray = `${len}`;
      pathRef.current.style.strokeDashoffset = `${len}`;
      const raf = requestAnimationFrame(() => {
        if (pathRef.current) {
          pathRef.current.style.transition = "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)";
          pathRef.current.style.strokeDashoffset = "0";
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [len]);
  return <path ref={pathRef} d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />;
}

// ── Animated bar for initiative chart ────────────────────────────────────────
function AnimatedInitBar({ height, budgetHeight }: { height: number; budgetHeight: number }) {
  const [h, setH] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setH(height), 100);
    return () => clearTimeout(t);
  }, [height]);
  return (
    <div className="w-full rounded-t bg-muted/40 overflow-hidden relative" style={{ height: `${h}px`, transition: "height 0.8s cubic-bezier(0.4,0,0.2,1)" }}>
      <div
        className="absolute bottom-0 w-full bg-primary/50 rounded-t transition-all duration-1000"
        style={{ height: `${budgetHeight}%` }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === "Sucesso";
  return (
    <span className={cn(
      "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
      ok
        ? "bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        : "bg-amber-500/8 text-amber-600 dark:text-amber-400 border-amber-500/20"
    )}>
      {status}
    </span>
  );
}

interface DashboardFinanceiroProps {
  onTabChange?: (tab: string) => void;
}

export default function DashboardFinanceiro({ onTabChange }: DashboardFinanceiroProps) {
  const flatPoints = cashFlowQ.flatMap(q => q.points);
  const linePath = flatPoints.map((v, i) => {
    const x = toX(i, flatPoints.length);
    const y = toY(v);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  const areaPath = linePath + ` L ${chartW} ${chartH + 4} L 0 ${chartH + 4} Z`;
  const peakIdx = flatPoints.indexOf(Math.max(...flatPoints));
  const peakX = toX(peakIdx, flatPoints.length);
  const peakY = toY(flatPoints[peakIdx]);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-400">

      {/* ── KPI STRIP ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <div
            key={i}
            className="bg-card border border-border/40 rounded-xl p-4 hover:shadow-sm hover:border-primary/20 transition-all duration-200"
          >
            <p className="text-[10px] font-medium text-muted-foreground mb-2 leading-tight uppercase tracking-wider">{k.label}</p>
            <p className="text-xl font-bold text-foreground tracking-tight">{k.value}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{k.sub}</p>
            <div className={cn("flex items-center gap-0.5 mt-2 text-[10px] font-semibold",
              k.up === true ? "text-emerald-500" : "text-rose-500"
            )}>
              {k.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {k.trend}
            </div>
          </div>
        ))}
      </div>

      {/* ── MIDDLE ROW ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Focus Areas */}
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Áreas de Foco</h3>
          </div>
          <div>
            <div className="grid grid-cols-3 pb-2 border-b border-border/30">
              {["Área", "Status", "Tendência"].map(h => (
                <span key={h} className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{h}</span>
              ))}
            </div>
            {focusAreas.map((a, i) => (
              <div key={i} className="grid grid-cols-3 items-center py-3 border-b border-border/15 last:border-0 group cursor-pointer hover:bg-muted/50 rounded-lg transition-all"
                onClick={() => a.tab && onTabChange?.(a.tab)}>
                <span className="text-[12px] font-medium text-foreground">{a.name}</span>
                <StatusBadge status={a.status} />
                <span className={cn("text-base font-bold",
                  a.trendUp === true ? "text-emerald-500" : "text-amber-500"
                )}>{a.trendUp === true ? "↗" : "→"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Org Performance */}
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Desempenho Organizacional</h3>
          </div>
          <div>
            <div className="grid grid-cols-3 pb-2 border-b border-border/30">
              {["Área", "Status", "Tendência"].map(h => (
                <span key={h} className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{h}</span>
              ))}
            </div>
            {orgPerf.map((o, i) => (
              <div key={i} className="grid grid-cols-3 items-center py-3 border-b border-border/15 last:border-0">
                <span className="text-[12px] font-medium text-foreground">{o.name}</span>
                <StatusBadge status={o.status} />
                <span className={cn("text-base font-bold",
                  o.trendUp === true ? "text-emerald-500" : "text-amber-500"
                )}>{o.trendUp === true ? "↗" : "→"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cash Flow Chart */}
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-0.5">Fluxo de Caixa</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Performance trimestral (R$ k)</p>
          <div className="relative">
            <svg viewBox={`0 0 ${chartW} ${chartH + 24}`} className="w-full h-28" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cfGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#cfGrad2)" />
              <AnimatedLine d={linePath} stroke="hsl(var(--primary))" strokeWidth={2} />
              <circle cx={peakX} cy={peakY} r="3.5" fill="hsl(var(--primary))" />
            </svg>
            <div className="flex justify-between mt-1">
              {cashFlowQ.map(q => (
                <span key={q.label} className="text-[10px] font-medium text-muted-foreground">{q.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Initiative Status Bar Chart */}
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">Status de Iniciativas</h3>
            <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted-foreground/30 inline-block" />Vencidas</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/50 inline-block" />Orçamento</span>
            </div>
          </div>
          <div className="flex items-end gap-2 mt-4" style={{ height: "100px" }}>
            {initiativeMonths.map((m, i) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <AnimatedInitBar
                  height={(overdue[i] / maxInitBar) * 80}
                  budgetHeight={(budget[i] / (overdue[i] || 1)) * 100}
                />
                <span className="text-[9px] font-medium text-muted-foreground mt-1">{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risks Area Chart */}
        <div className="bg-card border border-border/40 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">Riscos por Categoria</h3>
            <div className="flex items-center gap-3 text-[10px] font-medium">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />Alto</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Médio</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Baixo</span>
            </div>
          </div>
          <div className="mt-3">
            <svg viewBox={`0 0 ${rW} ${rH}`} className="w-full h-28" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lowG2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="midG2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="hiG2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f87171" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path d={buildArea(low, rMin, rMax, rW, rH)} fill="url(#lowG2)" />
              <AnimatedLine d={buildPath(low, rMin, rMax, rW, rH)} stroke="#34d399" />
              <path d={buildArea(medium, rMin, rMax, rW, rH)} fill="url(#midG2)" />
              <AnimatedLine d={buildPath(medium, rMin, rMax, rW, rH)} stroke="#fbbf24" />
              <path d={buildArea(high, rMin, rMax, rW, rH)} fill="url(#hiG2)" />
              <AnimatedLine d={buildPath(high, rMin, rMax, rW, rH)} stroke="#f87171" />
            </svg>
            <div className="flex justify-between mt-1">
              {riskMonths.map(m => (
                <span key={m} className="text-[9px] font-medium text-muted-foreground">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
