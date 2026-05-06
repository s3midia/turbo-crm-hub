import React, { useMemo, useState } from "react";
import { FileText, Download, TrendingUp, TrendingDown, BarChart3, PieChart, Edit2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatBRL } from "@/lib/formatters";
import { useFinance, FinancialTransaction } from "@/hooks/useFinance";

function pct(v: number, t: number) { return t === 0 ? "0%" : `${((v / t) * 100).toFixed(1)}%`; }

const MONTH_LABELS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function buildPeriodos() {
  const now = new Date();
  const opts: { label: string; type: "month" | "quarter" | "year"; year: number; month?: number; quarter?: number }[] = [];
  // últimos 6 meses
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({ label: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`, type: "month", year: d.getFullYear(), month: d.getMonth() });
  }
  // trimestres do ano atual
  for (let q = Math.floor(now.getMonth() / 3); q >= 0; q--) {
    opts.push({ label: `Q${q + 1} ${now.getFullYear()}`, type: "quarter", year: now.getFullYear(), quarter: q });
  }
  // ano completo
  opts.push({ label: `${now.getFullYear()} Completo`, type: "year", year: now.getFullYear() });
  return opts;
}

function filterByPeriodo(transactions: FinancialTransaction[], periodo: ReturnType<typeof buildPeriodos>[0]) {
  return transactions.filter(t => {
    const d = new Date(t.vencimento || t.data_lancamento);
    if (periodo.type === "month") return d.getFullYear() === periodo.year && d.getMonth() === periodo.month;
    if (periodo.type === "quarter") return d.getFullYear() === periodo.year && Math.floor(d.getMonth() / 3) === periodo.quarter;
    return d.getFullYear() === periodo.year;
  });
}

const CUSTOS_CATS = ["Infraestrutura", "Ferramentas", "Software", "Licença"];
const DEDUCOES_CATS = ["Impostos"];

function computeRelatorio(txs: FinancialTransaction[]) {
  const pagas = txs.filter(t => t.status === "pago");

  const receitaBruta = pagas.filter(t => t.tipo === "entrada")
    .reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);

  const deducoes = pagas.filter(t => t.tipo === "saida" && DEDUCOES_CATS.includes(t.categoria))
    .reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);

  const receitaLiquida = receitaBruta - deducoes;

  const custosServicos = pagas.filter(t => t.tipo === "saida" && CUSTOS_CATS.includes(t.categoria))
    .reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);

  const lucroBruto = receitaLiquida - custosServicos;

  const despesasOp = pagas.filter(t => t.tipo === "saida" && !DEDUCOES_CATS.includes(t.categoria) && !CUSTOS_CATS.includes(t.categoria))
    .reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);

  const lucroOperacional = lucroBruto - despesasOp;
  const lucroLiquido = lucroOperacional; // impostos sobre lucro não modelados

  const margemBruta = receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0;
  const margemLiquida = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;
  const totalDespesas = custosServicos + despesasOp + deducoes;
  const roi = totalDespesas > 0 ? ((receitaBruta - totalDespesas) / totalDespesas) * 100 : 0;

  // Fluxo de Caixa agrupado
  const recebimentos = pagas.filter(t => t.tipo === "entrada").reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);
  const pagamentos = pagas.filter(t => t.tipo === "saida" && !DEDUCOES_CATS.includes(t.categoria)).reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);
  const impostosOp = pagas.filter(t => t.tipo === "saida" && DEDUCOES_CATS.includes(t.categoria)).reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);
  const totalOperacional = recebimentos - pagamentos - impostosOp;

  // Balancete: usa transações a receber e a pagar como ativos/passivos simples
  const aReceber = txs.filter(t => t.tipo === "entrada" && t.status !== "pago").reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);
  const aPagar = txs.filter(t => t.tipo === "saida" && t.status !== "pago").reduce((s, t) => s + (parseFloat(String(t.valor)) || 0), 0);
  const caixaAtual = recebimentos - pagamentos - impostosOp;

  return {
    receitaBruta, deducoes, receitaLiquida,
    custosServicos, lucroBruto,
    despesasOp, lucroOperacional, lucroLiquido,
    margemBruta, margemLiquida, roi,
    recebimentos, pagamentos, impostosOp, totalOperacional,
    aReceber, aPagar, caixaAtual,
  };
}

type ReportType = "dre" | "balancete" | "fluxo";

interface RelatoriosTabProps {
  onTabChange?: (tab: string) => void;
}

export default function RelatoriosTab({ onTabChange }: RelatoriosTabProps) {
  const { transactions, loading, fetchTransactions } = useFinance();
  const periodos = useMemo(() => buildPeriodos(), []);
  const [periodoIdx, setPeriodoIdx] = useState(0);
  const [activeReport, setActiveReport] = useState<ReportType>("dre");

  const txsFiltradas = useMemo(() => filterByPeriodo(transactions, periodos[periodoIdx]), [transactions, periodoIdx, periodos]);
  const r = useMemo(() => computeRelatorio(txsFiltradas), [txsFiltradas]);

  const kpis = [
    { label: "Margem Bruta", value: `${r.margemBruta.toFixed(1)}%`, sub: "Eficiência de produção", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Margem Líquida", value: `${r.margemLiquida.toFixed(1)}%`, sub: "Lucro real / Receita", icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "EBITDA Est.", value: formatBRL(r.lucroOperacional), sub: "Lucro operacional", icon: TrendingDown, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "ROI Médio", value: `${r.roi.toFixed(1)}%`, sub: "Retorno sobre investimento", icon: PieChart, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  const dreRows = [
    { label: "Receita Bruta", value: r.receitaBruta, level: 0, type: "normal", tab: "lancamentos" },
    { label: "(-) Deduções e Impostos sobre Receita", value: -r.deducoes, level: 1, type: "deduction", tab: "lancamentos" },
    { label: "= Receita Líquida", value: r.receitaLiquida, level: 0, type: "subtotal", tab: null },
    { label: "(-) Custos dos Serviços Prestados", value: -r.custosServicos, level: 1, type: "deduction", tab: "lancamentos" },
    { label: "= Lucro Bruto", value: r.lucroBruto, level: 0, type: "subtotal", tab: null },
    { label: "(-) Despesas Operacionais", value: -r.despesasOp, level: 1, type: "deduction", tab: "lancamentos" },
    { label: "= Lucro Operacional (EBIT)", value: r.lucroOperacional, level: 0, type: "subtotal", tab: null },
    { label: "(-) Impostos sobre o Lucro", value: 0, level: 1, type: "deduction", tab: null },
    { label: "= LUCRO LÍQUIDO DO PERÍODO", value: r.lucroLiquido, level: 0, type: "total", tab: "relatorios" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className={cn("p-4 rounded-2xl border border-border/30 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]", k.bg)}
            onClick={() => onTabChange?.("lancamentos")}
          >
            <div className="flex items-center gap-2 mb-2">
              <k.icon size={16} className={k.color} />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{k.label}</span>
            </div>
            <p className="text-2xl font-black text-foreground">{k.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Report Selector & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl border border-border/30">
          {([["dre", "DRE"], ["balancete", "Balancete"], ["fluxo", "Fluxo de Caixa"]] as [ReportType, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setActiveReport(id)}
              className={cn("px-5 py-2 rounded-xl text-xs font-bold transition-all",
                activeReport === id ? "bg-background text-foreground shadow-sm ring-1 ring-border/20" : "text-muted-foreground hover:text-foreground"
              )}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={periodoIdx}
            onChange={e => setPeriodoIdx(Number(e.target.value))}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-border/50 bg-card text-muted-foreground focus:ring-2 focus:ring-primary/20"
          >
            {periodos.map((p, i) => (
              <option key={i} value={i}>{p.label}</option>
            ))}
          </select>
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/50 bg-card hover:bg-muted text-xs font-bold transition-all"
          >
            <RefreshCw size={12} /> Atualizar
          </button>
          <button
            onClick={() => toast.info("Exportação PDF em desenvolvimento")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 bg-card hover:bg-muted text-xs font-bold transition-all"
          >
            <Download size={13} /> PDF
          </button>
          <button
            onClick={() => toast.info("Exportação Excel em desenvolvimento")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 bg-card hover:bg-muted text-xs font-bold transition-all"
          >
            <Download size={13} /> Excel
          </button>
        </div>
      </div>

      {/* ── DRE ──────────────────────────────────────────────────────────────── */}
      {activeReport === "dre" && (
        <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              <h3 className="text-base font-black">DRE — {periodos[periodoIdx].label}</h3>
            </div>
            <span className="text-[10px] text-muted-foreground">{txsFiltradas.length} lançamento(s) no período</span>
          </div>

          {dreRows.map((row, i) => (
            <div
              key={i}
              onClick={() => row.tab && onTabChange?.(row.tab)}
              className={cn(
                "flex items-center justify-between py-3 border-b border-border/20 last:border-0 group px-4",
                row.type === "subtotal" ? "bg-muted/20 rounded-xl" : "",
                row.type === "total" ? "bg-emerald-500/10 rounded-xl border-0 mt-2" : "",
                row.tab ? "cursor-pointer hover:bg-muted/30 transition-colors" : "cursor-default",
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("text-sm",
                  row.level === 1 ? "ml-4 text-muted-foreground" : "font-bold text-foreground",
                  row.type === "total" && "font-black text-emerald-600"
                )}>{row.label}</span>
                {row.tab && (
                  <Edit2 size={10} className="opacity-0 group-hover:opacity-60 text-primary transition-opacity" />
                )}
              </div>
              <span className={cn("font-black",
                row.value > 0 ? (row.type === "total" ? "text-emerald-600 text-lg" : "text-foreground")
                  : row.value < 0 ? "text-rose-500"
                  : "text-muted-foreground",
                row.type === "total" && "text-xl"
              )}>
                {row.value < 0 ? `(${formatBRL(Math.abs(row.value))})` : formatBRL(row.value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── BALANCETE ────────────────────────────────────────────────────────── */}
      {activeReport === "balancete" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm">
            <h3 className="text-sm font-black text-emerald-600 mb-4 flex items-center gap-2">
              <TrendingUp size={16} /> ATIVO
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Caixa / Banco</span>
                <span className="text-sm font-bold text-foreground">{formatBRL(r.caixaAtual)}</span>
              </div>
              <div
                className="flex items-center justify-between cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => onTabChange?.("lancamentos")}
              >
                <span className="text-xs text-muted-foreground">Contas a Receber ↗</span>
                <span className="text-sm font-bold text-emerald-600">{formatBRL(r.aReceber)}</span>
              </div>
              <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between">
                <span className="text-xs font-black text-emerald-600 uppercase">Total Ativo</span>
                <span className="text-lg font-black text-emerald-600">{formatBRL(r.caixaAtual + r.aReceber)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-rose-500/20 bg-rose-500/5 shadow-sm">
            <h3 className="text-sm font-black text-rose-500 mb-4 flex items-center gap-2">
              <TrendingDown size={16} /> PASSIVO
            </h3>
            <div className="space-y-3">
              <div
                className="flex items-center justify-between cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => onTabChange?.("lancamentos")}
              >
                <span className="text-xs text-muted-foreground">Contas a Pagar ↗</span>
                <span className="text-sm font-bold text-rose-500">{formatBRL(r.aPagar)}</span>
              </div>
              <div className="pt-3 border-t border-rose-500/20 flex items-center justify-between">
                <span className="text-xs font-black text-rose-500 uppercase">Total Passivo</span>
                <span className="text-lg font-black text-rose-500">{formatBRL(r.aPagar)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5 shadow-sm">
            <h3 className="text-sm font-black text-blue-500 mb-4 flex items-center gap-2">
              <BarChart3 size={16} /> PATRIMÔNIO LÍQUIDO
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Resultado do Período</span>
                <span className="text-sm font-bold text-foreground">{formatBRL(r.lucroLiquido)}</span>
              </div>
              <div className="pt-3 border-t border-blue-500/20 flex items-center justify-between">
                <span className="text-xs font-black text-blue-500 uppercase">Total PL</span>
                <span className="text-lg font-black text-blue-500">{formatBRL(r.caixaAtual + r.aReceber - r.aPagar)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FLUXO DE CAIXA ───────────────────────────────────────────────────── */}
      {activeReport === "fluxo" && (
        <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-sm">
          <h3 className="text-base font-black mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            Fluxo de Caixa — {periodos[periodoIdx].label}
          </h3>

          {[
            {
              section: "Atividades Operacionais", color: "emerald",
              items: [
                { label: "Recebimentos de clientes", value: r.recebimentos, tab: "lancamentos" },
                { label: "Pagamentos a fornecedores/despesas", value: -r.pagamentos, tab: "lancamentos" },
                { label: "Impostos pagos", value: -r.impostosOp, tab: "lancamentos" },
              ],
              total: r.totalOperacional,
            },
            {
              section: "Atividades de Investimento", color: "amber",
              items: [
                { label: "Aquisição de equipamentos", value: 0, tab: null },
                { label: "Softwares e licenças", value: 0, tab: null },
              ],
              total: 0,
            },
            {
              section: "Atividades de Financiamento", color: "blue",
              items: [
                { label: "Aporte de capital sócio", value: 0, tab: null },
                { label: "Distribuição de lucros", value: 0, tab: null },
              ],
              total: 0,
            },
          ].map((s, si) => (
            <div key={si} className="mb-6">
              <h4 className={cn("text-xs font-black uppercase tracking-wider mb-3",
                s.color === "emerald" ? "text-emerald-500" : s.color === "amber" ? "text-amber-500" : "text-blue-500"
              )}>{s.section}</h4>
              {s.items.map((item, ii) => (
                <div
                  key={ii}
                  onClick={() => item.tab && onTabChange?.(item.tab)}
                  className={cn(
                    "flex items-center justify-between py-2 border-b border-border/20 px-4 group",
                    item.tab ? "cursor-pointer hover:bg-muted/20 transition-colors rounded-lg" : ""
                  )}
                >
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    {item.label}
                    {item.tab && <Edit2 size={9} className="opacity-0 group-hover:opacity-50 text-primary transition-opacity" />}
                  </span>
                  <span className={cn("font-bold", item.value >= 0 ? "text-foreground" : "text-rose-500")}>
                    {item.value < 0 ? `(${formatBRL(Math.abs(item.value))})` : formatBRL(item.value)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3 px-4 mt-1 rounded-xl bg-muted/20">
                <span className="text-xs font-black text-muted-foreground uppercase">Subtotal</span>
                <span className={cn("font-black", s.total >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {s.total < 0 ? `(${formatBRL(Math.abs(s.total))})` : formatBRL(s.total)}
                </span>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between py-4 px-6 rounded-2xl bg-primary/10 border border-primary/20 mt-4">
            <span className="font-black text-foreground">Variação Líquida do Caixa</span>
            <span className={cn("text-2xl font-black", r.totalOperacional >= 0 ? "text-primary" : "text-rose-500")}>
              {formatBRL(r.totalOperacional)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
