import React, { useState, useEffect, useCallback } from "react";
import { Building2, TrendingUp, BarChart3, RefreshCw, ChevronDown, ArrowUpRight, Sparkles, Info, Trash2, Plus, Package, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

import { formatBRL } from "@/lib/formatters";
import { CurrencyInput } from "@/components/ui/currency-input";

type MetodoValuation = "multiplos" | "fcd" | "patrimonial";

interface Bem {
  id: string;
  nome: string;
  valor: number;
}

interface ValuationInput {
  faturamento12m: number;
  lucroLiquido: number;
  ativosCirculantes: number;
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

const historico: any[] = [];

function calcularValuation(inputs: ValuationInput, bens: Bem[], metodo: MetodoValuation): { valor: number; min: number; max: number } {
  const setor = SETORES.find(s => s.nome === inputs.setor) || SETORES[0];
  const totalBens = bens.reduce((acc, b) => acc + b.valor, 0);
  const totalAtivos = inputs.ativosCirculantes + totalBens;

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
  const pl = totalAtivos - inputs.passivos;
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
    faturamento12m: 0,
    lucroLiquido: 0,
    ativosCirculantes: 0,
    passivos: 0,
    taxaCrescimento: 0,
    setor: "Agência Digital",
    wacc: 0,
  });

  const [bens, setBens] = useState<Bem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Valuation Config
      const { data: configData } = await supabase
        .from('company_valuation_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (configData) {
        setMetodo(configData.metodo as MetodoValuation);
        setInputs({
          faturamento12m: Number(configData.faturamento12m),
          lucroLiquido: Number(configData.lucro_liquido),
          ativosCirculantes: Number(configData.ativos_circulantes),
          passivos: Number(configData.passivos),
          taxaCrescimento: Number(configData.taxa_crescimento),
          setor: configData.setor,
          wacc: Number(configData.wacc),
        });
      }

      // Se faturamento12m ainda está zerado (config inexistente),
      // pré-popular a partir dos dados reais das transações para coincidir com o dashboard
      if (!configData) {
        const { data: txData } = await supabase
          .from('financial_transactions')
          .select('tipo, valor, status')
          .eq('user_id', user.id);

        if (txData && txData.length > 0) {
          const parseVal = (v: any) => {
            if (typeof v === 'number') return v;
            return parseFloat(String(v).replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.')) || 0;
          };
          const receitaPaga = txData
            .filter(t => t.tipo === 'entrada' && t.status === 'pago')
            .reduce((s, t) => s + parseVal(t.valor), 0);
          const despesaPaga = txData
            .filter(t => t.tipo === 'saida' && t.status === 'pago')
            .reduce((s, t) => s + parseVal(t.valor), 0);
          // Anualiza com base nos últimos 6 meses de dados (mesmo critério do dashboard)
          const faturamento12m = receitaPaga * 2;
          const lucroLiquido = (receitaPaga - despesaPaga) * 2;
          // Usa "Múltiplos de Mercado" + "Agência Digital (×3)" para coincidir com o dashboard
          setMetodo("multiplos");
          setInputs(prev => ({ ...prev, faturamento12m, lucroLiquido, setor: "Agência Digital" }));
        }
      }

      // Fetch Assets
      const { data: assetsData } = await supabase
        .from('company_assets')
        .select('*')
        .eq('user_id', user.id);

      if (assetsData) {
        setBens(assetsData.map(a => ({
          id: a.id,
          nome: a.nome,
          valor: Number(a.valor)
        })));
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Auto-save logic with debounce
  useEffect(() => {
    if (loading) return;
    
    const timer = setTimeout(() => {
      saveConfig();
    }, 1500); // Save 1.5s after last input change

    return () => clearTimeout(timer);
  }, [inputs, loading, saveConfig]);

  const saveConfig = useCallback(async (newMetodo?: MetodoValuation, newInputs?: ValuationInput) => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const m = newMetodo || metodo;
      const i = newInputs || inputs;

      const { error } = await supabase.from('company_valuation_config').upsert({
        user_id: user.id,
        metodo: m,
        faturamento12m: i.faturamento12m,
        lucro_liquido: i.lucroLiquido,
        ativos_circulantes: i.ativosCirculantes,
        passivos: i.passivos,
        taxa_crescimento: i.taxaCrescimento,
        setor: i.setor,
        wacc: i.wacc,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      if (error) throw error;
      setLastSaved(new Date());
    } catch (err: any) {
      console.error('Erro ao salvar configuração de valuation:', err);
      toast.error('Erro ao salvar configuração.');
    } finally {
      setIsSaving(false);
    }
  }, [metodo, inputs]);

  const handleMetodoChange = (m: MetodoValuation) => {
    setMetodo(m);
    saveConfig(m);
  };

  const updateInput = (key: keyof ValuationInput, val: number) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  };

  const updateSetor = (setor: string) => {
    setInputs(prev => ({ ...prev, setor }));
  };

  const [novoBem, setNovoBem] = useState({ nome: "", valor: 0 });

  const totalBens = bens.reduce((acc, b) => acc + b.valor, 0);
  const resultado = calcularValuation(inputs, bens, metodo);

  const addBem = async () => {
    if (!novoBem.nome || !novoBem.valor) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from('company_assets').insert([{
      user_id: user.id,
      nome: novoBem.nome,
      valor: novoBem.valor
    }]).select();

    if (data) {
      setBens([...bens, { id: data[0].id, nome: data[0].nome, valor: Number(data[0].valor) }]);
      setNovoBem({ nome: "", valor: 0 });
      toast.success("Bem adicionado com sucesso!");
    }
  };

  const removeBem = async (id: string) => {
    const { error } = await supabase.from('company_assets').delete().eq('id', id);
    if (!error) {
      setBens(bens.filter(b => b.id !== id));
      toast.success("Bem removido!");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Method Selector */}
      <div className="grid grid-cols-3 gap-4">
        {(Object.entries(METODO_INFO) as [MetodoValuation, typeof METODO_INFO[MetodoValuation]][]).map(([id, info]) => (
          <button key={id} onClick={() => handleMetodoChange(id)}
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
        <div className="lg:col-span-2 p-6 rounded-3xl border border-border/50 bg-card shadow-sm space-y-4 relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black">Parâmetros de Avaliação</h3>
            <div className="flex flex-col items-end gap-1">
              <button 
                onClick={() => saveConfig()}
                disabled={isSaving}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  isSaving ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </button>
              {lastSaved && !isSaving && (
                <span className="text-[9px] text-muted-foreground font-medium italic">
                  Salvo às {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          {[
            { key: "faturamento12m", label: "Faturamento Últimos 12m (R$)", show: true },
            { key: "lucroLiquido", label: "Lucro Líquido Anual (R$)", show: metodo === "fcd" || metodo === "patrimonial" },
            { key: "ativosCirculantes", label: "Ativos Circulantes (Dinheiro/Estoque) (R$)", show: metodo === "patrimonial" },
            { key: "passivos", label: "Total de Passivos (R$)", show: metodo === "patrimonial" },
            { key: "taxaCrescimento", label: "Taxa de Crescimento Anual (%)", show: metodo === "fcd" },
            { key: "wacc", label: "WACC — Custo de Capital (%)", show: metodo === "fcd" },
          ].filter(f => f.show).map(field => (
            <div key={field.key} className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{field.label}</label>
              <CurrencyInput
                value={inputs[field.key as keyof ValuationInput] as number}
                onChange={val => updateInput(field.key as keyof ValuationInput, val)}
                className="w-full px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-[42px]"
              />
            </div>
          ))}

          {metodo === "multiplos" && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Setor de Atuação</label>
              <select value={inputs.setor} onChange={e => updateSetor(e.target.value)}
                className="w-full px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                {SETORES.map(s => <option key={s.nome} value={s.nome}>{s.nome} (×{s.multiplo})</option>)}
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
                const current = vals[metodo as keyof typeof vals];
                return (
                  <div key={i} className="flex-1 group flex flex-col items-center gap-1">
                    <div className="w-full relative">
                      <div className="w-full bg-primary/70 hover:bg-primary rounded-t-lg transition-all cursor-pointer relative group"
                        onClick={() => toast.info(`Relatório de ${h.mes} em desenvolvimento`)}
                        style={{ height: `${maxHistorico > 0 ? (current / maxHistorico) * 80 : 0}px` }}>
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-popover text-[9px] font-bold px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatBRL(current)}
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground">{h.mes}</p>
                  </div>
                );
              })}
              {historico.length === 0 && (
                <div className="w-full flex items-center justify-center h-full text-muted-foreground text-[10px] uppercase font-black tracking-widest opacity-40">
                  Nenhum histórico disponível
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
              <span className="text-xs text-muted-foreground">Variação 6 meses</span>
              <span className={cn("font-black flex items-center gap-1", historico.length > 0 ? "text-emerald-500" : "text-muted-foreground")}>
                <ArrowUpRight size={14} />
                {historico.length > 0 ? `+${(((historico[historico.length-1][metodo] - historico[0][metodo]) / historico[0][metodo]) * 100).toFixed(1)}%` : "0%"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bens da Empresa Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl border border-border/50 bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black flex items-center gap-2">
              <Package size={16} className="text-primary" />
              Bens da Empresa (Ativos Imobilizados)
            </h3>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {formatBRL(totalBens)}
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-3 space-y-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase">Descrição do Bem</label>
                <input
                  type="text"
                  placeholder="Ex: Veículo..."
                  value={novoBem.nome}
                  onChange={e => setNovoBem({ ...novoBem, nome: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/30 border border-border/50 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase">Valor (R$)</label>
                <div className="flex gap-2">
                  <CurrencyInput
                    placeholder="0,00"
                    value={novoBem.valor}
                    onChange={val => setNovoBem({ ...novoBem, valor: val })}
                    className="w-full px-3 py-2 bg-muted/30 border border-border/50 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none h-[34px]"
                  />
                  <button
                    onClick={addBem}
                    className="p-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar text-left">
              {bens.map(bem => (
                <div key={bem.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/30 group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-card border border-border/50">
                      <HardDrive size={14} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{bem.nome}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Ativo Fixo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black">{formatBRL(bem.valor)}</span>
                    <button
                      onClick={() => removeBem(bem.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {bens.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum bem cadastrado</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 p-6 rounded-3xl border border-border/50 bg-card shadow-sm flex flex-col justify-center">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="p-3 rounded-full bg-primary/10">
              <Sparkles size={24} className="text-primary" />
            </div>
            <div className="space-y-1 text-left">
              <h4 className="text-sm font-black text-primary">Impacto no Patrimônio</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Os bens da empresa (imobilizado) são fundamentais para o cálculo do <strong>Valor Patrimonial</strong>. 
                Atualmente, seus bens somam <span className="font-black text-foreground">{formatBRL(totalBens)}</span>, 
                o que representa <span className="font-black text-foreground">
                  {inputs.ativosCirculantes + totalBens > 0 
                    ? ((totalBens / (inputs.ativosCirculantes + totalBens)) * 100).toFixed(1) 
                    : 0}%
                </span> do seu ativo total estimado.
              </p>
              <div className="pt-2 flex gap-4">
                <div className="text-center">
                  <p className="text-[9px] font-black text-muted-foreground uppercase">Total Ativos</p>
                  <p className="text-sm font-black">{formatBRL(inputs.ativosCirculantes + totalBens)}</p>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-center">
                  <p className="text-[9px] font-black text-muted-foreground uppercase">Capital Próprio</p>
                  <p className="text-sm font-black text-emerald-500">{formatBRL(inputs.ativosCirculantes + totalBens - inputs.passivos)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
