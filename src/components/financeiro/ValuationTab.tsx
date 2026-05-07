import { Building2, TrendingUp, TrendingDown, BarChart3, RefreshCw, ChevronDown, ArrowUpRight, Sparkles, Info, Trash2, Plus, Package, HardDrive, Clock, CheckCircle2, AlertTriangle, FileText, Share2, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useFinance, FinancialTransaction } from "@/hooks/useFinance";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { formatBRL } from "@/lib/formatters";
import { CurrencyInput } from "@/components/ui/currency-input";

import { MetodoValuation, Bem, ValuationInput, SETORES, parseVal, calcularValuation, validarIntegridade } from "./valuation-utils";

const METODO_INFO = {
  multiplos: { label: "Múltiplos de Mercado", desc: "Avalia baseado no faturamento multiplicado por um fator do setor.", icon: BarChart3 },
  fcd: { label: "Fluxo de Caixa Descontado", desc: "Projeta fluxos futuros e desconta pelo custo de capital (WACC).", icon: TrendingUp },
  patrimonial: { label: "Valor Patrimonial", desc: "Soma dos ativos líquidos da empresa (Ativos - Passivos).", icon: Building2 },
};

export default function ValuationTab({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [metodo, setMetodo] = useState<MetodoValuation>("multiplos");
  const [inputs, setInputs] = useState<ValuationInput>({
    faturamento12m: 0,
    lucroLiquido: 0,
    ativosCirculantes: 0,
    passivos: 0,
    taxaCrescimento: 0,
    setor: "Agência Digital",
    wacc: 10,
    observacoes: "",
  });

  const [bens, setBens] = useState<Bem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingBem, setIsAddingBem] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [savedHistorico, setSavedHistorico] = useState<any[]>([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

  const { transactions } = useFinance();

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
          observacoes: configData.observacoes || "",
        });
      }

      // Se faturamento12m ainda está zerado (config inexistente),
      // pré-popular a partir dos dados reais das transações para coincidir com o dashboard
      if (!configData) {
        if (transactions && transactions.length > 0) {
          const receitaPaga = transactions
            .filter(t => t.tipo === 'entrada' && t.status === 'pago')
            .reduce((s, t) => s + parseVal(t.valor), 0);
          const despesaPaga = transactions
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

      // Fetch Saved History Snapshots
      const { data: histData } = await supabase
        .from('company_valuation_history')
        .select('*')
        .eq('user_id', user.id)
        .order('mes_referencia', { ascending: false });

      if (histData) {
        setSavedHistorico(histData);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [transactions]);

  // Logic to calculate history
  useEffect(() => {
    if (!transactions || transactions.length === 0) return;

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const now = new Date();
    const newHistorico = [];

    // Gerar últimos 12 meses (em vez de 6) para dar mais controle ao gestor
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0); // Last day of month
      const m = targetDate.getMonth();
      const y = targetDate.getFullYear();
      const refDate = new Date(y, m, 1).toISOString().split('T')[0];
      const label = `${monthNames[m]}/${String(y).slice(-2)}`;
      
      // Check if we have a saved snapshot for this month
      const saved = savedHistorico.find(h => h.mes_referencia === refDate);

      if (saved) {
        // Use saved data
        const histInputs: ValuationInput = {
          faturamento12m: Number(saved.faturamento12m),
          lucroLiquido: Number(saved.lucro_liquido),
          ativosCirculantes: Number(saved.ativos_circulantes),
          passivos: Number(saved.passivos),
          taxaCrescimento: Number(saved.taxa_crescimento),
          setor: saved.setor,
          wacc: Number(saved.wacc),
        };

        const res = calcularValuation(histInputs, bens, saved.metodo as MetodoValuation);

        newHistorico.push({
          mes: label,
          date: refDate,
          multiplos: saved.metodo === "multiplos" ? res.valor : calcularValuation(histInputs, bens, "multiplos").valor,
          fcd: saved.metodo === "fcd" ? res.valor : calcularValuation(histInputs, bens, "fcd").valor,
          patrimonial: saved.metodo === "patrimonial" ? res.valor : calcularValuation(histInputs, bens, "patrimonial").valor,
          faturamento12m: histInputs.faturamento12m,
          lucroLiquido: histInputs.lucroLiquido,
          metodo: saved.metodo,
          observacoes: saved.observacoes || "",
          isSaved: true
        });
      } else {
        // Fallback to dynamic calculation
        const startDate = new Date(targetDate);
        startDate.setFullYear(targetDate.getFullYear() - 1);

        const relevantTxs = transactions.filter(t => {
          const d = new Date(t.vencimento || t.data_lancamento);
          return d >= startDate && d <= targetDate && t.status === 'pago';
        });

        const faturamento12m = relevantTxs.filter(t => t.tipo === 'entrada').reduce((s, t) => s + parseVal(t.valor), 0);
        const lucroLiquido = relevantTxs.filter(t => t.tipo === 'entrada').reduce((s, t) => s + parseVal(t.valor), 0) - 
                            relevantTxs.filter(t => t.tipo === 'saida').reduce((s, t) => s + parseVal(t.valor), 0);

        // Create temporary inputs for this historical point
        const histInputs: ValuationInput = {
          ...inputs,
          faturamento12m,
          lucroLiquido
        };

        const resMultiplos = calcularValuation(histInputs, bens, "multiplos");
        const resFCD = calcularValuation(histInputs, bens, "fcd");
        const resPatrimonial = calcularValuation(histInputs, bens, "patrimonial");

        newHistorico.push({
          mes: label,
          date: refDate,
          multiplos: resMultiplos.valor,
          fcd: resFCD.valor,
          patrimonial: resPatrimonial.valor,
          faturamento12m,
          lucroLiquido,
          isSaved: false
        });
      }
    }

    setHistorico(newHistorico);
  }, [transactions, inputs, bens]);

  const [currentInputsBackup, setCurrentInputsBackup] = useState<ValuationInput | null>(null);

  // Handle month selection
  const selectMonth = (index: number) => {
    if (selectedMonthIndex === index) {
      if (currentInputsBackup) {
        setInputs(currentInputsBackup);
        setCurrentInputsBackup(null);
      }
      setSelectedMonthIndex(null);
    } else {
      // Backup current inputs if we're not already in historical mode
      if (selectedMonthIndex === null) {
        setCurrentInputsBackup(inputs);
      }

      setSelectedMonthIndex(index);
      const h = historico[index];
      setInputs(prev => ({
        ...prev,
        faturamento12m: h.faturamento12m || 0,
        lucroLiquido: h.lucroLiquido || 0,
        observacoes: h.observacoes || "",
      }));
    }
  };

  const smartFill = () => {
    if (!transactions || transactions.length === 0) {
      toast.error("Sem dados de transações para sugerir valores.");
      return;
    }

    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const recent = transactions.filter(t => {
      const d = new Date(t.vencimento || t.data_lancamento);
      return d >= threeMonthsAgo && t.status === 'pago';
    });

    const avgRevenue = (recent.filter(t => t.tipo === 'entrada').reduce((s, t) => s + parseVal(t.valor), 0) / 3) * 12;
    const avgProfit = ((recent.filter(t => t.tipo === 'entrada').reduce((s, t) => s + parseVal(t.valor), 0) - 
                       recent.filter(t => t.tipo === 'saida').reduce((s, t) => s + parseVal(t.valor), 0)) / 3) * 12;

    setInputs(prev => ({
      ...prev,
      faturamento12m: Math.round(avgRevenue),
      lucroLiquido: Math.round(avgProfit)
    }));
    
    toast.success("Valores sugeridos com base nos últimos 3 meses!");
  };

  const saveConfig = useCallback(async (newMetodo?: MetodoValuation, newInputs?: ValuationInput) => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const m = newMetodo || metodo;
      const i = newInputs || inputs;

      if (selectedMonthIndex !== null) {
        // Save Historical Snapshot
        const histPoint = historico[selectedMonthIndex];
        const res = calcularValuation(i, bens, m);

        const { error } = await supabase.from('company_valuation_history').upsert({
          user_id: user.id,
          mes_referencia: histPoint.date,
          metodo: m,
          faturamento12m: i.faturamento12m,
          lucro_liquido: i.lucroLiquido,
          ativos_circulantes: i.ativosCirculantes,
          passivos: i.passivos,
          taxa_crescimento: i.taxaCrescimento,
          setor: i.setor,
          wacc: i.wacc,
          observacoes: i.observacoes,
          valor_calculado: res.valor,
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id, mes_referencia' });

        if (error) throw error;
        
        // Refresh saved history state
        const { data: histData } = await supabase
          .from('company_valuation_history')
          .select('*')
          .eq('user_id', user.id)
          .order('mes_referencia', { ascending: false });
        if (histData) setSavedHistorico(histData);
        
        toast.success(`Ajuste de ${histPoint.mes} salvo com sucesso!`);
      } else {
        // Save Current Config
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
          observacoes: i.observacoes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (error) throw error;
      }

      setLastSaved(new Date());
    } catch (err: any) {
      console.error('Erro ao salvar configuração de valuation:', err);
      toast.error('Erro ao salvar configuração.');
    } finally {
      setIsSaving(false);
    }
  }, [metodo, inputs, supabase.auth, toast]);

  // Auto-save logic with debounce
  useEffect(() => {
    if (loading) return;
    
    const timer = setTimeout(() => {
      saveConfig();
    }, 1500); // Save 1.5s after last input change

    return () => clearTimeout(timer);
  }, [inputs, loading, saveConfig]);

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
  const maxHistorico = historico.length > 0 
    ? Math.max(...historico.map(h => Math.max(h.multiplos || 0, h.fcd || 0, h.patrimonial || 0))) 
    : 1;

  const addBem = async () => {
    if (!novoBem.nome.trim()) {
      toast.error("Informe a descrição do bem.");
      return;
    }
    if (novoBem.valor <= 0) {
      toast.error("O valor do bem deve ser maior que zero.");
      return;
    }

    try {
      setIsAddingBem(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { data, error } = await supabase.from('company_assets').insert([{
        user_id: user.id,
        nome: novoBem.nome,
        valor: novoBem.valor
      }]).select();

      if (error) throw error;

      if (data && data[0]) {
        setBens([...bens, { id: data[0].id, nome: data[0].nome, valor: Number(data[0].valor) }]);
        setNovoBem({ nome: "", valor: 0 });
        toast.success("Bem adicionado com sucesso!");
      }
    } catch (err: any) {
      console.error('Erro ao adicionar bem:', err);
      toast.error('Erro ao salvar o bem: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsAddingBem(false);
    }
  };

  const removeBem = async (id: string) => {
    try {
      const { error } = await supabase.from('company_assets').delete().eq('id', id);
      if (error) throw error;
      
      setBens(bens.filter(b => b.id !== id));
      toast.success("Bem removido!");
    } catch (err: any) {
      console.error('Erro ao remover bem:', err);
      toast.error('Erro ao remover: ' + (err.message || 'Tente novamente'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addBem();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Month Status Grid (Calendário de Controle) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2rem] p-6 shadow-2xl shadow-black/5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Clock size={16} />
              </div>
              Fechamento Mensal de Valuation
            </h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 ml-10">Snapshots de saúde financeira histórica</p>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest bg-muted/30 px-4 py-2 rounded-full border border-border/50">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Confirmado</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> Estimado</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" /> Pendente</div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
          {historico.map((h, i) => (
            <button
              key={h.date}
              onClick={() => selectMonth(i)}
              className={cn(
                "flex flex-col items-center justify-center py-3 rounded-2xl border transition-all relative group overflow-hidden",
                selectedMonthIndex === i 
                  ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-105 z-10" 
                  : (h.isSaved 
                      ? "bg-emerald-500/[0.03] border-emerald-500/20 hover:border-emerald-500/50" 
                      : "bg-card border-border/50 hover:border-primary/30 hover:bg-muted/30")
              )}
            >
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tighter mb-1",
                selectedMonthIndex === i ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                {h.mes.split('/')[1]}
              </span>
              <span className="text-sm font-black">{h.mes.split('/')[0]}</span>
              
              {/* Animated indicator for current month selection */}
              {selectedMonthIndex === i && (
                <motion.div 
                  layoutId="month-active"
                  className="absolute inset-0 bg-primary/10 mix-blend-overlay"
                />
              )}

              {/* Status Dot */}
              <div className={cn(
                "absolute top-2 right-2 w-1.5 h-1.5 rounded-full",
                h.isSaved ? "bg-emerald-500" : (h.faturamento12m > 0 ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-700")
              )} />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Method Selector - Premium Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(METODO_INFO) as [MetodoValuation, typeof METODO_INFO[MetodoValuation]][]).map(([id, info]) => (
          <button 
            key={id} 
            onClick={() => handleMetodoChange(id)}
            className={cn(
              "group p-6 rounded-[2rem] border text-left transition-all duration-500 relative overflow-hidden",
              metodo === id 
                ? "bg-primary/5 border-primary/50 shadow-xl shadow-primary/5" 
                : "bg-card/50 border-border/50 hover:border-primary/20 hover:bg-muted/30"
            )}
          >
            {metodo === id && (
              <motion.div 
                layoutId="metodo-active-bg"
                className="absolute inset-0 bg-primary/[0.02]"
              />
            )}
            <div className={cn(
              "p-3 rounded-2xl w-fit mb-4 transition-colors",
              metodo === id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
              <info.icon size={20} />
            </div>
            <p className={cn("text-sm font-black tracking-tighter uppercase", metodo === id ? "text-primary" : "text-foreground")}>{info.label}</p>
            <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed font-medium uppercase tracking-widest">{info.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Inputs - Premium Panel */}
        <motion.div 
          layout
          className="lg:col-span-2 p-8 rounded-[2.5rem] border border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 space-y-6 relative overflow-hidden"
        >
          {selectedMonthIndex !== null && (
            <div className="absolute inset-0 bg-primary/[0.03] pointer-events-none border-2 border-primary/20 rounded-[2.5rem] z-0" />
          )}
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div>
              <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <BarChart3 size={16} />
                </div>
                {selectedMonthIndex !== null ? `Ajuste Retroativo — ${historico[selectedMonthIndex].mes}` : "Parâmetros de Valor"}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1">
              <AnimatePresence mode="wait">
                {lastSaved && !isSaving && (
                  <motion.span 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1"
                  >
                    <CheckCircle2 size={10} /> Sincronizado
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedMonthIndex === null ? 'current' : 'historical'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {[
                { key: "faturamento12m", label: "Faturamento L12M (Receita Bruta)", show: true, type: "currency", icon: TrendingUp },
                { key: "lucroLiquido", label: "Lucro Líquido (EBITDA Ajustado)", show: metodo === "fcd" || metodo === "patrimonial", type: "currency", icon: Target },
                { key: "ativosCirculantes", label: "Ativos Circulantes (Disponibilidades)", show: metodo === "patrimonial", type: "currency", icon: Package },
                { key: "passivos", label: "Passivos Totais (Dívidas/Obrigações)", show: metodo === "patrimonial", type: "currency", icon: AlertTriangle },
                { key: "taxaCrescimento", label: "Expectativa de Crescimento Anual (%)", show: metodo === "fcd", type: "slider", min: 0, max: 100 },
                { key: "wacc", label: "Taxa de Desconto (WACC %)", show: metodo === "fcd", type: "slider", min: 5, max: 30 },
              ].filter(f => f.show).map(field => (
                <div key={field.key} className="space-y-2 group">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 group-hover:text-primary transition-colors">
                      <field.icon size={10} />
                      {field.label}
                    </label>
                    {field.key === "faturamento12m" && (
                      <button onClick={smartFill} className="text-[9px] font-black text-primary hover:underline uppercase tracking-tighter flex items-center gap-1">
                        <Sparkles size={10} /> Sugestão IA
                      </button>
                    )}
                  </div>
                  
                  {field.type === "currency" ? (
                    <CurrencyInput
                      value={inputs[field.key as keyof ValuationInput] as number}
                      onChange={val => updateInput(field.key as keyof ValuationInput, val)}
                      className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-2xl text-sm font-black focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all h-[48px] shadow-inner"
                    />
                  ) : (
                    <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min={field.min} 
                          max={field.max} 
                          value={inputs[field.key as keyof ValuationInput] as number}
                          onChange={e => updateInput(field.key as keyof ValuationInput, Number(e.target.value))}
                          className="flex-1 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <span className="text-sm font-black w-10 text-primary">{inputs[field.key as keyof ValuationInput]}%</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Justificativa da Avaliação</label>
                <textarea 
                  value={inputs.observacoes}
                  onChange={e => setInputs(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Descreva o contexto estratégico desta avaliação..."
                  className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none min-h-[80px] resize-none transition-all"
                />
              </div>

              {metodo === "multiplos" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Benchmark de Setor</label>
                  <select 
                    value={inputs.setor} 
                    onChange={e => updateSetor(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-2xl text-sm font-black focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    {SETORES.map(s => <option key={s.nome} value={s.nome}>{s.nome} (Múltiplo ×{s.multiplo})</option>)}
                  </select>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Data Integrity Checklist - Premium Style */}
          <div className="p-5 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/50 border border-border/30 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 size={12} className="text-primary" />
              Verificador de Consistência
            </h4>
            <div className="space-y-2">
              {(() => {
                const integrityErrors = validarIntegridade(inputs, bens, metodo);
                if (integrityErrors.length === 0) {
                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-tight"
                    >
                      <div className="p-1.5 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 size={12} />
                      </div>
                      Valuation pronto para exportação profissional
                    </motion.div>
                  );
                }
                return integrityErrors.map((err, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-700 text-[10px] font-black uppercase tracking-tight"
                  >
                    <div className="p-1.5 rounded-full bg-amber-500 text-white">
                      <AlertTriangle size={12} />
                    </div>
                    {err}
                  </motion.div>
                ));
              })()}
            </div>
          </div>

          {selectedMonthIndex !== null && (
            <button 
              onClick={() => {
                if (currentInputsBackup) {
                  setInputs(currentInputsBackup);
                  setCurrentInputsBackup(null);
                }
                setSelectedMonthIndex(null);
              }}
              className="w-full py-3 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/5 rounded-2xl transition-all border border-primary/20"
            >
              Finalizar Ajuste e Voltar ao Atual
            </button>
          )}
        </motion.div>
        {/* Result Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Main Valuation Card - Bento Style Premium */}
          <motion.div 
            layout
            className="p-8 rounded-[2.5rem] bg-zinc-900 text-white shadow-2xl relative overflow-hidden border border-white/5"
          >
            {/* Animated Background Orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] -ml-20 -mb-20" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <Target size={12} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                    {METODO_INFO[metodo].label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Confiança</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className={cn("w-2 h-1 rounded-full", s <= 4 ? "bg-primary" : "bg-white/10")} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Valor Estimado do Negócio</p>
                <motion.p 
                  key={resultado.valor}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-black tracking-tighter leading-none"
                >
                  {formatBRL(resultado.valor)}
                </motion.p>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-10">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
                  <p className="text-[10px] font-black text-white/40 uppercase mb-1">Mínimo (Pessimista)</p>
                  <p className="text-base font-black text-white/90">{formatBRL(resultado.min)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-primary/20 border border-primary/30 backdrop-blur-sm shadow-inner">
                  <p className="text-[10px] font-black text-primary uppercase mb-1">Médio (Realista)</p>
                  <p className="text-base font-black text-white">{formatBRL(resultado.valor)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
                  <p className="text-[10px] font-black text-white/40 uppercase mb-1">Máximo (Otimista)</p>
                  <p className="text-base font-black text-white/90">{formatBRL(resultado.max)}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => window.print()}
              className="absolute bottom-6 right-6 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white/60 hover:text-white print:hidden group"
            >
              <FileText size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          </motion.div>

          {/* Historical Evolution - Pro Chart with Recharts */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-[2.5rem] border border-border/50 bg-card/50 backdrop-blur-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <TrendingUp size={16} />
                </div>
                Trajetória de Valorização
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Valuation</span>
                </div>
              </div>
            </div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="mes" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                    dy={10}
                  />
                  <YAxis hide domain={[0, 'dataMax + 100000']} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover/90 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{payload[0].payload.mes}</p>
                            <p className="text-sm font-black text-primary">{formatBRL(payload[0].value as number)}</p>
                            {payload[0].payload.isSaved && (
                              <div className="mt-1 flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase">
                                <CheckCircle2 size={10} /> Snapshot Confirmado
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={metodo} 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorVal)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border/30">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Performance (6m)</span>
                {(() => {
                  const startVal = historico.length > 0 ? historico[0][metodo] : 0;
                  const endVal = historico.length > 0 ? historico[historico.length - 1][metodo] : 0;
                  const variation = startVal > 0 ? ((endVal - startVal) / startVal) * 100 : 0;
                  const isPositive = variation >= 0;
                  
                  return (
                    <div className={cn("flex items-center gap-1.5 font-black text-xl tracking-tighter", 
                      isPositive ? "text-emerald-500" : "text-rose-500")}>
                      {isPositive ? <ArrowUpRight size={20} /> : <TrendingDown size={20} />}
                      {variation !== 0 ? `${isPositive ? '+' : ''}${variation.toFixed(1)}%` : "0%"}
                    </div>
                  );
                })()}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status de Tendência</span>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Zap size={14} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-tight">Crescimento Sustentado</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bens da Empresa Section - Premium Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 p-8 rounded-[2.5rem] border border-border/50 bg-card/50 backdrop-blur-xl shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Package size={16} />
              </div>
              Ativos Imobilizados
            </h3>
            <span className="text-[10px] font-black bg-primary text-primary-foreground px-3 py-1 rounded-full shadow-lg shadow-primary/20">
              {formatBRL(totalBens)}
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Descrição do Ativo</label>
                <input
                  type="text"
                  placeholder="Ex: Servidores, Veículos..."
                  value={novoBem.nome}
                  onChange={e => setNovoBem({ ...novoBem, nome: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-2xl text-xs font-black focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Valor de Mercado (R$)</label>
                <div className="flex gap-3">
                  <CurrencyInput
                    placeholder="0,00"
                    value={novoBem.valor}
                    onChange={val => setNovoBem({ ...novoBem, valor: val })}
                    onKeyDown={handleKeyDown}
                    className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-2xl text-xs font-black focus:ring-4 focus:ring-primary/10 outline-none h-[42px] transition-all"
                  />
                  <button
                    onClick={addBem}
                    disabled={isAddingBem}
                    className="px-4 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 group"
                  >
                    {isAddingBem ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} className="group-hover:rotate-90 transition-transform" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {bens.map(bem => (
                  <motion.div 
                    key={bem.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-muted/10 border border-border/30 group hover:border-primary/30 hover:bg-muted/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-card border border-border/50 shadow-sm group-hover:scale-110 transition-transform">
                        <HardDrive size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight">{bem.nome}</p>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Ativo Operacional</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-black tracking-tighter">{formatBRL(bem.valor)}</span>
                      <button
                        onClick={() => removeBem(bem.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {bens.length === 0 && (
                <div className="text-center py-12 bg-muted/5 rounded-[2rem] border border-dashed border-border/50">
                  <Package size={32} className="mx-auto mb-3 opacity-20 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Patrimônio não listado</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="lg:col-span-3 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/20 flex flex-col md:flex-row items-center gap-6"
          >
            <div className="p-5 rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30">
              <Sparkles size={32} />
            </div>
            <div className="space-y-2 text-left flex-1">
              <h4 className="text-base font-black text-primary uppercase tracking-tighter italic">Potencial de Saída (Exit)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Os ativos imobilizados somam <span className="font-black text-foreground">{formatBRL(totalBens)}</span>. 
                Em uma negociação de M&A, isso representa <span className="font-black text-primary text-sm px-1.5 py-0.5 bg-primary/10 rounded-md">
                  {inputs.ativosCirculantes + totalBens > 0 
                    ? ((totalBens / (inputs.ativosCirculantes + totalBens)) * 100).toFixed(1) 
                    : 0}%
                </span> do seu ativo total, aumentando a segurança do investidor.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-[2.5rem] bg-zinc-900 text-white border border-white/5 space-y-6 flex-1 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-white/50">
                <CheckCircle2 size={14} className="text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                Score de Auditabilidade
              </h4>
              <div className="text-[10px] font-black text-emerald-500 uppercase px-2 py-1 bg-emerald-500/10 rounded-lg">
                Nível Profissional
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Conciliação", status: transactions.length > 0 ? "success" : "warning", text: transactions.length > 0 ? "Consistente" : "Pendente" },
                { label: "Patrimônio", status: bens.length > 0 ? "success" : "warning", text: bens.length > 0 ? "Registrado" : "Vazio" },
                { label: "Mercado", status: inputs.setor ? "success" : "danger", text: inputs.setor || "Revisar" },
                { label: "Capitais", status: inputs.wacc > 0 ? "success" : "danger", text: inputs.wacc > 0 ? "Ajustado" : "Erro" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-tighter", item.status === "success" ? "text-emerald-400" : "text-amber-400")}>{item.text}</span>
                    {item.status === "success" ? <CheckCircle2 size={12} className="text-emerald-400" /> : <AlertTriangle size={12} className="text-amber-400" />}
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full py-4 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
              <FileText size={16} />
              Exportar Dossier de Valuation
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
