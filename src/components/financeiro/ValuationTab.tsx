import React, { useState } from "react";
import { Building2, TrendingUp, BarChart3, RefreshCw, ChevronDown, ArrowUpRight, Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";

function formatBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

type MetodoValuation = "multiplos" | "fcd" | "patrimonial";

interface ValuationInput {
  faturamento12m: number;
  lucroLiquido: number;
  ativos: number;
  passivos: number;
  taxaCrescimento: number;
  setor: string;
  wacc: number;
}

const SETORES = [
  { nome: "Tecnologia / SaaS", multiplo: 4.5 },
  { nome: "Agência Digital", multiplo: 3.0 },
  { nome: "Consultoria", multiplo: 2.5 },
  { nome: "Varejo / E-commerce", multiplo: 1.8 },
  { nome: "Indústria", multiplo: 2.0 },
];

const historico = [
  { mes: "Jan/25", multiplos: 320000, fcd: 295000, patrimonial: 262000 },
  { mes: "Fev/25", multiplos: 340000, fcd: 312000, patrimonial: 268000 },
  { mes: "Mar/25", multiplos: 380000, fcd: 355000, patrimonial: 273000 },
  { mes: "Abr/25", multiplos: 410000, fcd: 388000, patrimonial: 280000 },
  { mes: "Mai/25", multiplos: 450000, fcd: 420000, patrimonial: 290000 },
  { mes: "Jun/25", multiplos: 502920, fcd: 471300, patrimonial: 305000 },
];

function calcularValuation(inputs: ValuationInput, metodo: MetodoValuation): { valor: number; min: number; max: number } {
  const setor = SETORES.find(s => s.nome === inputs.setor) || SETORES[0];

  if (metodo === "multiplos") {
    const base = inputs.faturamento12m * setor.multiplo;
    return { valor: base, min: base * 0.85, max: base * 1.2 };
  }

  if (metodo === "fcd") {
    // Simplified DCF: sum of 5 years projected free cash flow, discounted
    const fcf = inputs.lucroLiquido;
    let total = 0;
    for (let i = 1; i <= 5; i++) {
      const projetado = fcf * Math.pow(1 + inputs.taxaCrescimento / 100, i);
      total += projetado / Math.pow(1 + inputs.wacc / 100, i);
    }
    // Terminal value (Gordon Growth Model, simplified)
    const valorTerminal = (fcf * Math.pow(1 + inputs.taxaCrescimento / 100, 5) * 1.02) / ((inputs.wacc / 100) - 0.02);
    const valorTerminalDescontado = valorTerminal / Math.pow(1 + inputs.wacc / 100, 5);
    const valor = total + valorTerminalDescontado;
    return { valor, min: valor * 0.8, max: valor * 1.25 };
  }

  // Patrimonial
  const pl = inputs.ativos - inputs.passivos;
  return { valor: pl, min: pl * 0.9, max: pl * 1.1 };
}

const METODO_INFO = {
  multiplos: { label: "Múltiplos de Mercado", desc: "Avalia baseado no faturamento multiplicado por um fator do setor.", icon: BarChart3 },
  fcd: { label: "Fluxo de Caixa Descontado", desc: "Projeta fluxos futuros e desconta pelo custo de capital (WACC).", icon: TrendingUp },
  patrimonial: { label: "Valor Patrimonial", desc: "Soma dos ativos líquidos da empresa (Ativos - Passivos).", icon: Building2 },
};

export default function ValuationTab() {
  const [metodo, setMetodo] = useState<MetodoValuation>("multiplos");
  const [inputs, setInputs] = useState<ValuationInput>({
    faturamento12m: 281712,
    lucroLiquido: 225690,
    ativos: 113143,
    passivos: 6079,
    taxaCrescimento: 25,
    setor: "Tecnologia / SaaS",
    wacc: 18,
  });

  const resultado = calcularValuation(inputs, metodo);
  const maxHistorico = Math.max(...historico.map(h => Math.max(h.multiplos, h.fcd, h.patrimonial)));

  function updateInput(key: keyof ValuationInput, val: string) {
    setInputs(prev => ({ ...prev, [key]: parseFloat(val) || prev[key] }));
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Method Selector */}
      <div className="grid grid-cols-3 gap-4">
        {(Object.entries(METODO_INFO) as [MetodoValuation, typeof METODO_INFO[MetodoValuation]][]).map(([id, info]) => (
          <button key={id} onClick={() => setMetodo(id)}
            className={cn("p-5 rounded-2xl border text-left transition-all hover:scale-[1.01]",
              metodo === id ? "bg-primary/5 border-primary shadow-md shadow-primary/10" : "bg-card border-border/50 hover:border-primary/30"
            )}>
            <info.icon size={20} className={metodo === id ? "text-primary mb-2" : "text-muted-foreground mb-2"} />
            <p className={cn("text-sm font-black", metodo === id ? "text-primary" : "text-foreground")}>{info.label}</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{info.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-border/50 bg-card shadow-sm space-y-4">
          <h3 className="text-sm font-black mb-4">Parâmetros de Avaliação</h3>

          {[
            { key: "faturamento12m", label: "Faturamento Últimos 12m (R$)", show: true },
            { key: "lucroLiquido", label: "Lucro Líquido Anual (R$)", show: metodo === "fcd" || metodo === "patrimonial" },
            { key: "ativos", label: "Total de Ativos (R$)", show: metodo === "patrimonial" },
            { key: "passivos", label: "Total de Passivos (R$)", show: metodo === "patrimonial" },
            { key: "taxaCrescimento", label: "Taxa de Crescimento Anual (%)", show: metodo === "fcd" },
            { key: "wacc", label: "WACC — Custo de Capital (%)", show: metodo === "fcd" },
          ].filter(f => f.show).map(field => (
            <div key={field.key} className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{field.label}</label>
              <input
                type="number"
                value={inputs[field.key as keyof ValuationInput]}
                onChange={e => updateInput(field.key as keyof ValuationInput, e.target.value)}
                className="w-full px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          ))}

          {metodo === "multiplos" && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Setor de Atuação</label>
              <select value={inputs.setor} onChange={e => setInputs(prev => ({ ...prev, setor: e.target.value }))}
                className="w-full px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                {SETORES.map(s => <option key={s.nome}>{s.nome} (×{s.multiplo})</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Result Card */}
        <div className="lg:col-span-3 space-y-5">
          {/* Main Valuation Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-12 -mt-12" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8" />
            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">
                Estimativa — {METODO_INFO[metodo].label}
              </p>
              <p className="text-5xl font-black tracking-tight mb-2">{formatBRL(resultado.valor)}</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="p-3 rounded-xl bg-white/10 text-center">
                  <p className="text-[10px] font-black opacity-70 uppercase">Mínimo</p>
                  <p className="text-sm font-black">{formatBRL(resultado.min)}</p>
                </div>
                <div className="flex-1 h-0.5 bg-white/20" />
                <div className="p-3 rounded-xl bg-white/20 text-center border border-white/20">
                  <p className="text-[10px] font-black opacity-70 uppercase">Estimado</p>
                  <p className="text-sm font-black">{formatBRL(resultado.valor)}</p>
                </div>
                <div className="flex-1 h-0.5 bg-white/20" />
                <div className="p-3 rounded-xl bg-white/10 text-center">
                  <p className="text-[10px] font-black opacity-70 uppercase">Máximo</p>
                  <p className="text-sm font-black">{formatBRL(resultado.max)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Evolution */}
          <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-sm">
            <h3 className="text-sm font-bold mb-5 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Evolução do Valuation (Histórico)
            </h3>
            <div className="flex items-end gap-2 h-28">
              {historico.map((h, i) => {
                const vals = { multiplos: h.multiplos, fcd: h.fcd, patrimonial: h.patrimonial };
                const current = vals[metodo];
                return (
                  <div key={i} className="flex-1 group flex flex-col items-center gap-1">
                    <div className="w-full relative">
                      <div className="w-full bg-primary/70 hover:bg-primary rounded-t-lg transition-all cursor-pointer relative group"
                        style={{ height: `${(current / maxHistorico) * 80}px` }}>
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-popover text-[9px] font-bold px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatBRL(current)}
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground">{h.mes}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
              <span className="text-xs text-muted-foreground">Variação 6 meses</span>
              <span className="font-black text-emerald-500 flex items-center gap-1">
                <ArrowUpRight size={14} />
                +{(((historico[5][metodo] - historico[0][metodo]) / historico[0][metodo]) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
