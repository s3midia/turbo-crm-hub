import React, { useState } from "react";
import { FileText, Download, TrendingUp, TrendingDown, BarChart3, PieChart, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function formatBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function pct(v: number, t: number) { return t === 0 ? "0%" : `${((v / t) * 100).toFixed(1)}%`; }

const dreData = {
  receitaBruta: 23476,
  deducoes: 1174,
  get receitaLiquida() { return this.receitaBruta - this.deducoes; },
  custosServicos: 1670,
  get lucroBruto() { return this.receitaLiquida - this.custosServicos; },
  despesasOperacionais: 3000,
  get lucroOperacional() { return this.lucroBruto - this.despesasOperacionais; },
  impostos: 1409,
  get lucroLiquido() { return this.lucroOperacional - this.impostos; },
};

const balanceData = {
  ativos: [
    { descricao: "Caixa e Equivalentes", valor: 18806 },
    { descricao: "Contas a Receber", valor: 6097 },
    { descricao: "Equipamentos (líquido)", valor: 12400 },
    { descricao: "Software e Licenças", valor: 3200 },
  ],
  passivos: [
    { descricao: "Contas a Pagar", valor: 4670 },
    { descricao: "Impostos a Recolher", valor: 1409 },
  ],
};

const totalAtivos = balanceData.ativos.reduce((s, a) => s + a.valor, 0);
const totalPassivos = balanceData.passivos.reduce((s, p) => s + p.valor, 0);
const patrimonioLiquido = totalAtivos - totalPassivos;

const kpis = [
  { label: "Margem Bruta", value: `${pct(dreData.lucroBruto, dreData.receitaBruta)}`, sub: "Eficiência de produção", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Margem Líquida", value: `${pct(dreData.lucroLiquido, dreData.receitaBruta)}`, sub: "Lucro real / Receita", icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "EBITDA Est.", value: formatBRL(dreData.lucroOperacional + 800), sub: "Lucro op. + depreciação", icon: TrendingDown, color: "text-violet-500", bg: "bg-violet-500/10" },
  { label: "ROI Médio", value: "84.2%", sub: "Retorno sobre investimento", icon: PieChart, color: "text-amber-500", bg: "bg-amber-500/10" },
];

type ReportType = "dre" | "balancete" | "fluxo";

export default function RelatoriosTab() {
  const [activeReport, setActiveReport] = useState<ReportType>("dre");
  const [periodo, setPeriodo] = useState("Dezembro 2025");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className={cn("p-4 rounded-2xl border border-border/30", k.bg)}>
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
          <select value={periodo} onChange={e => setPeriodo(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-border/50 bg-card text-muted-foreground focus:ring-2 focus:ring-primary/20">
            <option>Dezembro 2025</option>
            <option>Novembro 2025</option>
            <option>Q4 2025</option>
            <option>2025 Completo</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 bg-card hover:bg-muted text-xs font-bold transition-all">
            <Download size={13} /> PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 bg-card hover:bg-muted text-xs font-bold transition-all">
            <Download size={13} /> Excel
          </button>
        </div>
      </div>

      {/* DRE */}
      {activeReport === "dre" && (
        <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-sm space-y-1">
          <div className="flex items-center gap-2 mb-6">
            <FileText size={18} className="text-primary" />
            <h3 className="text-base font-black">Demonstração do Resultado do Exercício — {periodo}</h3>
          </div>
          {[
            { label: "Receita Bruta", value: dreData.receitaBruta, level: 0, type: "normal" },
            { label: "(-) Deduções e Impostos sobre Receita", value: -dreData.deducoes, level: 1, type: "deduction" },
            { label: "= Receita Líquida", value: dreData.receitaLiquida, level: 0, type: "subtotal" },
            { label: "(-) Custos dos Serviços Prestados", value: -dreData.custosServicos, level: 1, type: "deduction" },
            { label: "= Lucro Bruto", value: dreData.lucroBruto, level: 0, type: "subtotal" },
            { label: "(-) Despesas Operacionais", value: -dreData.despesasOperacionais, level: 1, type: "deduction" },
            { label: "= Lucro Operacional (EBIT)", value: dreData.lucroOperacional, level: 0, type: "subtotal" },
            { label: "(-) Impostos sobre o Lucro", value: -dreData.impostos, level: 1, type: "deduction" },
            { label: "= LUCRO LÍQUIDO DO PERÍODO", value: dreData.lucroLiquido, level: 0, type: "total" },
          ].map((row, i) => (
            <div key={i} className={cn(
              "flex items-center justify-between py-3 border-b border-border/20 last:border-0",
              row.type === "subtotal" ? "bg-muted/20 px-4 rounded-xl" : "px-4",
              row.type === "total" ? "bg-emerald-500/10 px-4 rounded-xl border-0 mt-2" : "",
            )}>
              <span className={cn("text-sm",
                row.level === 1 ? "ml-4 text-muted-foreground" : "font-bold text-foreground",
                row.type === "total" && "font-black text-emerald-600"
              )}>{row.label}</span>
              <span className={cn("font-black",
                row.value >= 0 ? (row.type === "total" ? "text-emerald-600 text-lg" : "text-foreground") : "text-rose-500",
                row.type === "total" && "text-xl"
              )}>
                {row.value < 0 ? `(${formatBRL(Math.abs(row.value))})` : formatBRL(row.value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Balancete */}
      {activeReport === "balancete" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ativos */}
          <div className="p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm">
            <h3 className="text-sm font-black text-emerald-600 mb-4 flex items-center gap-2">
              <TrendingUp size={16} /> ATIVO
            </h3>
            <div className="space-y-3">
              {balanceData.ativos.map((a, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{a.descricao}</span>
                  <span className="text-sm font-bold text-foreground">{formatBRL(a.valor)}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between">
                <span className="text-xs font-black text-emerald-600 uppercase">Total Ativo</span>
                <span className="text-lg font-black text-emerald-600">{formatBRL(totalAtivos)}</span>
              </div>
            </div>
          </div>

          {/* Passivos */}
          <div className="p-6 rounded-3xl border border-rose-500/20 bg-rose-500/5 shadow-sm">
            <h3 className="text-sm font-black text-rose-500 mb-4 flex items-center gap-2">
              <TrendingDown size={16} /> PASSIVO
            </h3>
            <div className="space-y-3">
              {balanceData.passivos.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{p.descricao}</span>
                  <span className="text-sm font-bold text-foreground">{formatBRL(p.valor)}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-rose-500/20 flex items-center justify-between">
                <span className="text-xs font-black text-rose-500 uppercase">Total Passivo</span>
                <span className="text-lg font-black text-rose-500">{formatBRL(totalPassivos)}</span>
              </div>
            </div>
          </div>

          {/* PL */}
          <div className="p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5 shadow-sm">
            <h3 className="text-sm font-black text-blue-500 mb-4 flex items-center gap-2">
              <BarChart3 size={16} /> PATRIMÔNIO LÍQUIDO
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Capital Social</span>
                <span className="text-sm font-bold text-foreground">{formatBRL(20000)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Lucros Acumulados</span>
                <span className="text-sm font-bold text-foreground">{formatBRL(patrimonioLiquido - 20000)}</span>
              </div>
              <div className="pt-3 border-t border-blue-500/20 flex items-center justify-between">
                <span className="text-xs font-black text-blue-500 uppercase">Total PL</span>
                <span className="text-lg font-black text-blue-500">{formatBRL(patrimonioLiquido)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fluxo de Caixa */}
      {activeReport === "fluxo" && (
        <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-sm">
          <h3 className="text-base font-black mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            Fluxo de Caixa — {periodo}
          </h3>
          {[
            { section: "Atividades Operacionais", items: [
              { label: "Recebimentos de clientes", value: 23476 },
              { label: "Pagamentos a fornecedores", value: -4670 },
              { label: "Impostos pagos", value: -1409 },
            ], total: 17397, color: "emerald" },
            { section: "Atividades de Investimento", items: [
              { label: "Aquisição de equipamentos", value: -2400 },
              { label: "Softwares e licenças", value: -800 },
            ], total: -3200, color: "amber" },
            { section: "Atividades de Financiamento", items: [
              { label: "Aporte de capital sócio", value: 5000 },
              { label: "Distribuição de lucros", value: -3000 },
            ], total: 2000, color: "blue" },
          ].map((s, si) => (
            <div key={si} className="mb-6">
              <h4 className={cn("text-xs font-black uppercase tracking-wider mb-3",
                s.color === "emerald" ? "text-emerald-500" : s.color === "amber" ? "text-amber-500" : "text-blue-500"
              )}>{s.section}</h4>
              {s.items.map((item, ii) => (
                <div key={ii} className="flex items-center justify-between py-2 border-b border-border/20 px-4">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
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
            <span className="text-2xl font-black text-primary">{formatBRL(17397 - 3200 + 2000)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
