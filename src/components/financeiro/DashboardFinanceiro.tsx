import React from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

function formatBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

// ── KPIs ──────────────────────────────────────────────────────────────────────
const kpis = [
  { label: "Faturamento Total", value: "R$ 281,7k", sub: "Últimos 12 meses", trend: "+18.2%", up: true },
  { label: "Clientes Ativos", value: "14", sub: "Com contratos vigentes", trend: "+23.9%", up: true },
  { label: "Taxa de Crescimento", value: "18.2%", sub: "Vs. mesmo período", trend: "+5.4pp", up: true },
  { label: "Inadimplências", value: "3", sub: "Pagamentos vencidos", trend: "-11.9%", up: false },
  { label: "Projetos em Andamento", value: "7", sub: "Em execução agora", trend: "+19.3%", up: true },
  { label: "Projetos Concluídos", value: "28", sub: "No ano corrente", trend: "+12.7%", up: true },
];

// ── Focus Areas ───────────────────────────────────────────────────────────────
const focusAreas = [
  { name: "Financeiro", status: "Pendente", trend: "→", trendUp: null },
  { name: "Stakeholders", status: "Sucesso", trend: "↗", trendUp: true },
  { name: "Processos Internos", status: "Pendente", trend: "→", trendUp: null },
  { name: "Capacidade Operacional", status: "Sucesso", trend: "↗", trendUp: true },
];

// ── Org Performance ───────────────────────────────────────────────────────────
const orgPerf = [
  { name: "CEO / Estratégia", status: "Sucesso", trend: "↗", trendUp: true },
  { name: "Vendas", status: "Pendente", trend: "→", trendUp: null },
  { name: "Operações", status: "Sucesso", trend: "↗", trendUp: true },
  { name: "Financeiro", status: "Pendente", trend: "→", trendUp: null },
];

// ── Cash Flow Data (quarterly) ────────────────────────────────────────────────
const cashFlowQ = [
  { label: "Q1", points: [16.2, 16.8, 16.5, 17.1, 16.9, 17.4] },
  { label: "Q2", points: [17.4, 16.6, 16.8, 17.2, 16.5, 16.8] },
  { label: "Q3", points: [16.8, 17.0, 17.5, 17.8, 17.2, 17.6] },
  { label: "Q4", points: [17.6, 17.9, 17.4, 17.8, 18.0, 18.2] },
];
const allPoints = cashFlowQ.flatMap(q => q.points);
const minPt = Math.min(...allPoints);
const maxPt = Math.max(...allPoints);
const chartW = 340;
const chartH = 100;
function toX(i: number, total: number) { return (i / (total - 1)) * chartW; }
function toY(v: number) { return chartH - ((v - minPt) / (maxPt - minPt)) * chartH; }

// ── Initiative Bar Data ───────────────────────────────────────────────────────
const initiativeMonths = ["Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const overdue =   [18, 15, 19, 20, 14, 13, 15, 17];
const budget =    [5,  4,  5,  8,  3,  2,  4,  5];
const maxBar = Math.max(...overdue);

// ── Risk Area Data ────────────────────────────────────────────────────────────
const riskMonths = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const high =   [5,  5,  6,  5,  5,  6,  5,  6,  7,  8,  8,  9];
const medium = [10, 11, 12, 11, 12, 13, 13, 14, 15, 16, 17, 18];
const low =    [15, 16, 18, 17, 18, 19, 19, 20, 21, 22, 23, 24];

function buildPath(data: number[], minV: number, maxV: number, w: number, h: number) {
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - minV) / (maxV - minV + 1)) * h;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}
function buildArea(data: number[], minV: number, maxV: number, w: number, h: number) {
  const line = buildPath(data, minV, maxV, w, h);
  const lastX = w;
  const lastY = h - ((data[data.length-1] - minV) / (maxV - minV + 1)) * h;
  return `${line} L ${lastX} ${h} L 0 ${h} Z`;
}
const rW = 400, rH = 120;
const rMin = 0, rMax = 28;

function StatusBadge({ status }: { status: string }) {
  const ok = status === "Sucesso";
  return (
    <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border",
      ok ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
         : "bg-amber-500/10 text-amber-600 border-amber-500/30"
    )}>
      {status}
    </span>
  );
}

export default function DashboardFinanceiro() {
  const flatPoints = cashFlowQ.flatMap(q => q.points);
  const linePath = flatPoints.map((v, i) => {
    const x = toX(i, flatPoints.length);
    const y = toY(v);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  const areaPath = linePath + ` L ${chartW} ${chartH} L 0 ${chartH} Z`;

  const peakIdx = flatPoints.indexOf(Math.max(...flatPoints));
  const peakX = toX(peakIdx, flatPoints.length);
  const peakY = toY(flatPoints[peakIdx]);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── KPI STRIP ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-card border border-border/50 rounded-2xl p-4 hover:shadow-md hover:border-primary/20 transition-all">
            <p className="text-[10px] font-semibold text-muted-foreground mb-2 leading-tight">{k.label}</p>
            <p className="text-2xl font-black text-foreground tracking-tight">{k.value}</p>
            <div className={cn("flex items-center gap-1 mt-2 text-[10px] font-bold",
              k.up === true ? "text-emerald-500" : "text-rose-500"
            )}>
              {k.up ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
              {k.trend} vs mês anterior
            </div>
          </div>
        ))}
      </div>

      {/* ── MIDDLE ROW ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Focus Areas */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-foreground">Áreas de Foco</h3>
            <button className="text-[10px] font-bold text-primary hover:underline">Ver todas &rsaquo;</button>
          </div>
          <div className="space-y-0">
            <div className="grid grid-cols-3 pb-2 border-b border-border/30">
              {["Nome","Status","Tendência"].map(h => (
                <span key={h} className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{h}</span>
              ))}
            </div>
            {focusAreas.map((a, i) => (
              <div key={i} className="grid grid-cols-3 items-center py-3 border-b border-border/20 last:border-0">
                <span className="text-[12px] font-semibold text-foreground">{a.name}</span>
                <StatusBadge status={a.status} />
                <span className={cn("text-base font-black",
                  a.trendUp === true ? "text-emerald-500" : "text-amber-500"
                )}>{a.trend}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Org Performance */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-foreground">Desempenho Organizacional</h3>
            <button className="text-[10px] font-bold text-primary hover:underline">Ver todos &rsaquo;</button>
          </div>
          <div className="space-y-0">
            <div className="grid grid-cols-3 pb-2 border-b border-border/30">
              {["Nome","Status","Tendência"].map(h => (
                <span key={h} className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{h}</span>
              ))}
            </div>
            {orgPerf.map((o, i) => (
              <div key={i} className="grid grid-cols-3 items-center py-3 border-b border-border/20 last:border-0">
                <span className="text-[12px] font-semibold text-foreground">{o.name}</span>
                <StatusBadge status={o.status} />
                <span className={cn("text-base font-black",
                  o.trendUp === true ? "text-emerald-500" : "text-amber-500"
                )}>{o.trend}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cash Flow Chart */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h3 className="text-sm font-black text-foreground mb-1">Fluxo de Caixa (R$ k)</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Performance trimestral</p>
          <div className="relative">
            <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} className="w-full h-28" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02"/>
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#cfGrad)" />
              <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Peak dot */}
              <circle cx={peakX} cy={peakY} r="4" fill="hsl(var(--primary))" />
              <rect x={peakX - 28} y={peakY - 22} width="56" height="18" rx="4" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1"/>
              <text x={peakX} y={peakY - 9} textAnchor="middle" fontSize="9" fill="hsl(var(--foreground))" fontWeight="700">
                R$ {flatPoints[peakIdx].toFixed(1)}k
              </text>
            </svg>
            {/* X labels */}
            <div className="flex justify-between mt-1">
              {cashFlowQ.map(q => (
                <span key={q.label} className="text-[10px] font-bold text-muted-foreground">{q.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Initiative Status Bar Chart */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-black text-foreground">Status de Iniciativas (#)</h3>
            <div className="flex items-center gap-3 text-[10px] font-semibold text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted-foreground/40 inline-block"/>Vencidas</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/60 inline-block"/>Orçamento</span>
            </div>
          </div>
          <div className="flex items-end gap-2 h-32 mt-4">
            {initiativeMonths.map((m, i) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                  <div className="relative w-full">
                    {/* Overdue bg bar */}
                    <div className="w-full rounded-t bg-muted/50 relative overflow-hidden"
                      style={{ height: `${(overdue[i] / maxBar) * 80}px` }}>
                      {/* Budget overlay */}
                      <div className="absolute bottom-0 w-full bg-primary/50 rounded-t"
                        style={{ height: `${(budget[i] / overdue[i]) * 100}%` }}/>
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-muted-foreground">{m}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-[10px] text-muted-foreground">Pico: Ago — Vencidas R$543 · Orçamento R$423</span>
          </div>
        </div>

        {/* Risks By Property Area Chart */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-black text-foreground">Riscos por Categoria</h3>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block"/>Alto</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>Médio</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>Baixo</span>
            </div>
          </div>
          <div className="mt-3">
            <svg viewBox={`0 0 ${rW} ${rH}`} className="w-full h-32" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lowG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.05"/>
                </linearGradient>
                <linearGradient id="midG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.1"/>
                </linearGradient>
                <linearGradient id="hiG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="#f87171" stopOpacity="0.1"/>
                </linearGradient>
              </defs>
              <path d={buildArea(low, rMin, rMax, rW, rH)} fill="url(#lowG)"/>
              <path d={buildPath(low, rMin, rMax, rW, rH)} fill="none" stroke="#34d399" strokeWidth="1.5"/>
              <path d={buildArea(medium, rMin, rMax, rW, rH)} fill="url(#midG)"/>
              <path d={buildPath(medium, rMin, rMax, rW, rH)} fill="none" stroke="#fbbf24" strokeWidth="1.5"/>
              <path d={buildArea(high, rMin, rMax, rW, rH)} fill="url(#hiG)"/>
              <path d={buildPath(high, rMin, rMax, rW, rH)} fill="none" stroke="#f87171" strokeWidth="1.5"/>
            </svg>
            <div className="flex justify-between mt-1">
              {riskMonths.map(m => (
                <span key={m} className="text-[9px] font-bold text-muted-foreground">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
