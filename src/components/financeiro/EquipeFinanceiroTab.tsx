import React, { useState, useEffect } from "react";
import { Users, Check, AlertCircle, Plus, Trash2, Calendar, FileText, Upload, MoreVertical, ExternalLink, Percent, Target, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { formatBRL } from "@/lib/formatters";
import { CurrencyInput } from "@/components/ui/currency-input";

interface Funcionario {
  id: string | number;
  nome: string;
  cargo: string;
  salario: number;
  inss: number;
  fgts: number;
  prolabore: number;
  status: "pago" | "pendente";
  vencimento: string;
  email?: string;
  telefone?: string;
  dataAdmissao?: string;
  cpf?: string;
}

interface Despesa {
  id: string;
  descricao: string;
  tipo: "fixa" | "variavel";
  valor: number;
  vencimento: string;
  status: "pago" | "pendente";
  categoria: string;
  document_url?: string;
}

const FUNCIONARIOS: Funcionario[] = [];

const DESPESAS: Despesa[] = [];

const totalFolha = FUNCIONARIOS.reduce((s, f) => s + f.salario + f.inss + f.fgts + f.prolabore, 0);
const despesasFixas = DESPESAS.filter(d => d.tipo === "fixa").reduce((s, d) => s + d.valor, 0);
const despesasVariaveis = DESPESAS.filter(d => d.tipo === "variavel").reduce((s, d) => s + d.valor, 0);
const receitaRef = 0;
const comprometimento = ((totalFolha + despesasFixas) / receitaRef) * 100;

export default function EquipeFinanceiroTab() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [receitaMensal, setReceitaMensal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchEquipeData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Employees
    const { data: empData } = await supabase
      .from('company_employees')
      .select('*')
      .eq('user_id', user.id);

    if (empData) {
      setFuncionarios(empData.map(f => ({
        id: f.id,
        nome: f.nome,
        cargo: f.cargo,
        salario: Number(f.salario || 0),
        inss: Number(f.inss || 0),
        fgts: Number(f.fgts || 0),
        prolabore: Number(f.prolabore || 0),
        status: f.status as "pago" | "pendente",
        vencimento: f.vencimento,
        email: f.email,
        telefone: f.telefone,
        dataAdmissao: f.data_admissao,
        cpf: f.cpf
      })));
    }

    // Fetch Expenses (from financial_transactions)
    const { data: despData } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('tipo', 'saida');

    if (despData) {
      setDespesas(despData.map(d => ({
        id: d.id,
        descricao: d.descricao,
        tipo: d.classificacao === 'recorrente' ? 'fixa' : 'variavel',
        valor: Number(d.valor),
        vencimento: d.vencimento,
        status: d.status === 'pago' ? 'pago' : 'pendente',
        categoria: d.categoria,
        document_url: d.document_url
      })));
    }

    // Fetch Revenue for commitment calculation
    const { data: revData } = await supabase
      .from('financial_transactions')
      .select('valor')
      .eq('user_id', user.id)
      .eq('tipo', 'entrada');
    
    if (revData) {
      const totalRev = revData.reduce((sum, r) => sum + Number(r.valor), 0);
      setReceitaMensal(totalRev);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchEquipeData();
  }, []);

  const [editingFuncId, setEditingFuncId] = useState<string | null>(null);
  const [editingDespId, setEditingDespId] = useState<string | null>(null);
  const [showFolhaModal, setShowFolhaModal] = useState(false);
  const [showDespesasModal, setShowDespesasModal] = useState(false);

  async function markFuncPaid(id: string) {
    const { error } = await supabase
      .from('company_employees')
      .update({ status: 'pago' })
      .eq('id', id);

    if (!error) {
      setFuncionarios(prev => prev.map(f => String(f.id) === String(id) ? { ...f, status: "pago" } : f));
      toast.success("Pagamento registrado!");
    }
  }

  async function markDespPaid(id: string) {
    const { error } = await supabase
      .from('financial_transactions')
      .update({ status: 'pago', recebimento: new Date().toISOString().split('T')[0] })
      .eq('id', id);

    if (!error) {
      setDespesas(prev => prev.map(d => String(d.id) === String(id) ? { ...d, status: "pago" } : d));
      toast.success("Despesa marcada como paga!");
    }
  }

  async function handleSaveFunc(id: string, data: Partial<Funcionario>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      nome: data.nome,
      cargo: data.cargo,
      salario: data.salario || 0,
      inss: data.inss || 0,
      fgts: data.fgts || 0,
      prolabore: data.prolabore || 0,
      vencimento: data.vencimento,
      user_id: user.id
    };

    if (String(id).length > 15) { // UUID
      const { error } = await supabase.from('company_employees').update(payload).eq('id', id);
      if (error) {
        toast.error("Erro ao atualizar colaborador");
        return;
      }
    } else {
      const { data: newData, error } = await supabase.from('company_employees').insert([payload]).select();
      if (error) {
        toast.error("Erro ao salvar novo colaborador");
        return;
      }
      if (newData) {
        setFuncionarios(prev => prev.map(f => String(f.id) === String(id) ? { ...f, id: newData[0].id } : f));
      }
    }
    setEditingFuncId(null);
    toast.success("Dados salvos!");
    fetchEquipeData();
  }

  async function handleSaveDesp(id: string, data: Partial<Despesa>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      descricao: data.descricao,
      valor: data.valor,
      categoria: data.categoria,
      vencimento: data.vencimento,
      tipo: 'saida',
      classificacao: data.tipo === 'fixa' ? 'recorrente' : 'nao_recorrente',
      document_url: data.document_url,
      user_id: user.id
    };

    if (String(id).length > 15) { // UUID
      const { error } = await supabase.from('financial_transactions').update(payload).eq('id', id);
      if (error) {
        toast.error("Erro ao atualizar despesa: " + error.message);
        return;
      }
    } else {
      const { data: newData, error } = await supabase.from('financial_transactions').insert([payload]).select();
      if (error) {
        toast.error("Erro ao salvar despesa: " + error.message);
        return;
      }
      if (newData) {
        setDespesas(prev => prev.map(d => String(d.id) === String(id) ? { ...d, id: newData[0].id } : d));
      }
    }
    setEditingDespId(null);
    toast.success("Despesa salva!");
    fetchEquipeData();
  }

  function handleAddFunc() {
    const tempId = Date.now().toString();
    const newFunc: Funcionario = {
      id: tempId as any,
      nome: "Novo Colaborador",
      cargo: "Cargo",
      salario: 0,
      inss: 0,
      fgts: 0,
      prolabore: 0,
      status: "pendente",
      vencimento: new Date().toISOString().split('T')[0],
    };
    setFuncionarios(prev => [...prev, newFunc]);
    setEditingFuncId(tempId);
  }

  function handleAddDesp(preset?: Partial<Despesa>) {
    const tempId = Date.now().toString();
    const newDesp: Despesa = {
      id: tempId,
      descricao: preset?.descricao || "Nova Despesa",
      tipo: preset?.tipo || "variavel",
      valor: preset?.valor || 0,
      vencimento: new Date().toISOString().split('T')[0],
      status: "pendente",
      categoria: preset?.categoria || "Geral",
    };
    setDespesas(prev => [...prev, newDesp]);
    setEditingDespId(tempId);
  }

  async function handleFileUpload(file: File, despId: string) {
    try {
      const loadingToast = toast.loading("Enviando comprovante...");
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        toast.dismiss(loadingToast);
        toast.error("Erro ao subir arquivo: " + uploadError.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Update local state
      setDespesas(prev => prev.map(d => String(d.id) === String(despId) ? { ...d, document_url: publicUrl } : d));
      
      toast.dismiss(loadingToast);
      toast.success("Comprovante anexado!");
    } catch (error: any) {
      toast.error("Erro inesperado: " + error.message);
    }
  }

  async function handleDeleteFunc(id: string) {
    if (String(id).length > 15) {
      const { error } = await supabase.from('company_employees').delete().eq('id', id);
      if (error) return;
    }
    setFuncionarios(prev => prev.filter(f => String(f.id) !== String(id)));
    toast.success("Colaborador removido");
  }

  async function handleDeleteDesp(id: string) {
    if (String(id).length > 15) {
      const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
      if (error) return;
    }
    setDespesas(prev => prev.filter(d => String(d.id) !== String(id)));
    toast.success("Despesa removida");
  }

  const totalFolhaState = funcionarios.reduce((s, f) => s + f.salario + f.inss + f.fgts + f.prolabore, 0);
  const despesasFixasState = despesas.filter(d => d.tipo === "fixa").reduce((s, d) => s + d.valor, 0);
  const despesasVariaveisState = despesas.filter(d => d.tipo === "variavel").reduce((s, d) => s + d.valor, 0);
  const comprometimentoState = receitaMensal > 0 ? ((totalFolhaState + despesasFixasState) / receitaMensal) * 100 : 0;

  // Gauge SVG helpers
  const gaugePercent = Math.min(comprometimentoState, 100);
  const gaugeRadius = 70;
  const gaugeCircumference = Math.PI * gaugeRadius; // half circle arc
  const gaugeDashOffset = gaugeCircumference * (1 - gaugePercent / 100);
  const gaugeColor = comprometimentoState > 60 ? "#f43f5e" : comprometimentoState > 40 ? "#f59e0b" : "#10b981";
  const gaugeLabel = comprometimentoState > 60 ? "Crítico" : comprometimentoState > 40 ? "Atenção" : "Saudável";

  // KPI tiles data
  const totalCustosFixos = totalFolhaState + despesasFixasState;
  const margemLucro = receitaMensal > 0 ? Math.max(0, receitaMensal - totalCustosFixos - despesasVariaveisState) : 0;
  const margemPct = receitaMensal > 0 ? (margemLucro / receitaMensal) * 100 : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-10">

      {/* ── HERO: Saúde Financeira ── */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border/40 bg-gradient-to-br from-card via-card/95 to-background shadow-xl">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: gaugeColor }} />
        <div className="pointer-events-none absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
          {/* Left: title + KPI strip */}
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: gaugeColor }} />
                <span className="relative inline-flex rounded-full h-3 w-3"
                  style={{ backgroundColor: gaugeColor }} />
              </div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">
                Saúde Financeira da Operação
              </span>
              <span className="ml-auto text-[10px] font-black px-3 py-1 rounded-full border"
                style={{
                  color: gaugeColor,
                  borderColor: `${gaugeColor}40`,
                  backgroundColor: `${gaugeColor}12`
                }}>
                {gaugeLabel}
              </span>
            </div>

            {/* KPI 4-strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Total da Folha",
                  value: formatBRL(totalFolhaState),
                  sub: `${funcionarios.length} colaboradores`,
                  accent: "#6366f1",
                  icon: Users,
                },
                {
                  label: "Despesas Fixas",
                  value: formatBRL(despesasFixasState),
                  sub: "recorrentes",
                  accent: "#f43f5e",
                  icon: AlertCircle,
                },
                {
                  label: "Desp. Variáveis",
                  value: formatBRL(despesasVariaveisState),
                  sub: "não recorrentes",
                  accent: "#f59e0b",
                  icon: TrendingUp,
                },
                {
                  label: "Margem de Lucro",
                  value: `${margemPct.toFixed(1)}%`,
                  sub: formatBRL(margemLucro),
                  accent: margemPct < 10 ? "#f43f5e" : "#10b981",
                  icon: Target,
                },
              ].map((k, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl p-4 border border-border/30 bg-background/50 hover:bg-background/80 hover:shadow-lg transition-all duration-300 cursor-default overflow-hidden"
                >
                  {/* subtle left accent bar */}
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-300"
                    style={{ backgroundColor: `${k.accent}60` }} />
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${k.accent}18` }}>
                      <k.icon size={13} style={{ color: k.accent }} />
                    </div>
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{k.label}</p>
                  <p className="text-[15px] font-black tracking-tight text-foreground leading-none">{k.value}</p>
                  <p className="text-[9px] text-muted-foreground/70 mt-1">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Segmented progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Comprometimento da Receita</span>
                <span>Receita: <span className="text-foreground font-black">{formatBRL(receitaMensal)}</span></span>
              </div>
              <div className="relative h-3 w-full rounded-full bg-muted/30 overflow-hidden border border-border/20">
                {/* zone markers */}
                <div className="absolute left-[40%] top-0 bottom-0 w-px bg-amber-500/40 z-10" />
                <div className="absolute left-[60%] top-0 bottom-0 w-px bg-rose-500/40 z-10" />
                {/* fill */}
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{
                    width: `${Math.min(gaugePercent, 100)}%`,
                    background: comprometimentoState > 60
                      ? "linear-gradient(90deg, #10b981 40%, #f59e0b 60%, #f43f5e)"
                      : comprometimentoState > 40
                        ? "linear-gradient(90deg, #10b981 40%, #f59e0b)"
                        : "linear-gradient(90deg, #10b981)",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white/50 blur-sm rounded-full" />
                </div>
              </div>
              <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                <span className="text-emerald-500">✓ Ideal &lt;40%</span>
                <span className="text-amber-500">⚠ Atenção 40–60%</span>
                <span className="text-rose-500">✕ Crítico &gt;60%</span>
              </div>
            </div>
          </div>

          {/* Right: Gauge SVG */}
          <div className="flex flex-col items-center justify-center shrink-0 select-none">
            <svg width="170" height="105" viewBox="0 0 170 105" className="overflow-visible">
              {/* background track */}
              <path
                d="M 15 95 A 70 70 0 0 1 155 95"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                className="text-muted/20"
              />
              {/* colored fill arc */}
              <path
                d="M 15 95 A 70 70 0 0 1 155 95"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={gaugeCircumference}
                strokeDashoffset={gaugeDashOffset}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)", filter: `drop-shadow(0 0 6px ${gaugeColor}80)` }}
              />
              {/* tick marks */}
              {[0, 20, 40, 60, 80, 100].map((tick) => {
                const angle = (tick / 100) * 180 - 180;
                const rad = (angle * Math.PI) / 180;
                const cx = 85 + 70 * Math.cos(rad);
                const cy = 95 + 70 * Math.sin(rad);
                const cx2 = 85 + 58 * Math.cos(rad);
                const cy2 = 95 + 58 * Math.sin(rad);
                return (
                  <line key={tick} x1={cx} y1={cy} x2={cx2} y2={cy2}
                    stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/30" strokeLinecap="round" />
                );
              })}
              {/* center value */}
              <text x="85" y="82" textAnchor="middle" className="fill-foreground"
                style={{ fontSize: "22px", fontWeight: 900, fontFamily: "inherit", letterSpacing: "-1px" }}>
                {comprometimentoState.toFixed(1)}%
              </text>
              <text x="85" y="100" textAnchor="middle"
                style={{ fontSize: "9px", fontWeight: 700, fontFamily: "inherit", fill: gaugeColor, textTransform: "uppercase", letterSpacing: "2px" }}>
                {gaugeLabel}
              </text>
            </svg>
            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">Comprometimento</p>
          </div>
        </div>

        {/* Bottom breakdown strip */}
        <div className="relative z-10 border-t border-border/20 grid grid-cols-3 divide-x divide-border/20">
          {[
            { label: "Folha de Pagamento", value: totalFolhaState, total: receitaMensal, color: "#6366f1", icon: Users },
            { label: "Despesas Fixas", value: despesasFixasState, total: receitaMensal, color: "#f43f5e", icon: AlertCircle },
            { label: "Capacidade de Lucro", value: Math.max(0, receitaMensal - totalCustosFixos), total: receitaMensal, color: "#10b981", icon: TrendingUp },
          ].map((item, i) => {
            const pct = receitaMensal > 0 ? Math.min((item.value / receitaMensal) * 100, 100) : 0;
            return (
              <div key={i} className="px-5 py-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${item.color}18` }}>
                    <item.icon size={10} style={{ color: item.color }} />
                  </div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider truncate">{item.label}</p>
                </div>
                <p className="text-[13px] font-black text-foreground">{formatBRL(item.value)}</p>
                <div className="h-1 w-full rounded-full bg-muted/20 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: item.color }} />
                </div>
                <p className="text-[9px] text-muted-foreground/60">{pct.toFixed(1)}% da receita</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Folha de Pagamento */}
        <div className="p-5 rounded-3xl border border-border/50 bg-card shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black flex items-center gap-2">
              <Users size={16} className="text-primary" />
              Folha de Pagamento — Maio 2026
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleAddFunc}
                className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 flex items-center gap-1.5"
              >
                <Plus size={12} /> Novo
              </button>
              <button 
                onClick={() => setShowFolhaModal(true)}
                className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20"
              >
                Ver mais
              </button>
            </div>
          </div>
          <div className="space-y-3 flex-1">
            {funcionarios.map(f => (
              <div key={f.id} className="p-4 rounded-2xl border border-border/30 bg-muted/10 hover:bg-muted/20 transition-all group relative">
                {editingFuncId === String(f.id) ? (
                                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase px-1">Nome do Colaborador</label>
                        <input 
                          className="w-full px-3 py-2 text-[12px] font-bold bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                          defaultValue={f.nome}
                          onChange={e => f.nome = e.target.value}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase px-1">Cargo</label>
                        <input 
                          className="w-full px-3 py-2 text-[12px] bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                          defaultValue={f.cargo}
                          onChange={e => f.cargo = e.target.value}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase px-1">Vencimento</label>
                        <input 
                          type="date"
                          className="w-full px-3 py-2 text-[12px] bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                          defaultValue={f.vencimento}
                          onChange={e => f.vencimento = e.target.value}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase px-1">Salário (R$)</label>
                        <CurrencyInput 
                          className="w-full px-3 py-2 text-[12px] font-bold bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                          value={f.salario}
                          onChange={val => f.salario = val}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase px-1">Pró-labore (R$)</label>
                        <CurrencyInput 
                          className="w-full px-3 py-2 text-[12px] font-bold bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                          value={f.prolabore}
                          onChange={val => f.prolabore = val}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase px-1">INSS (R$)</label>
                        <CurrencyInput 
                          className="w-full px-3 py-2 text-[12px] bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                          value={f.inss}
                          onChange={val => f.inss = val}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase px-1">FGTS (R$)</label>
                        <CurrencyInput 
                          className="w-full px-3 py-2 text-[12px] bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                          value={f.fgts}
                          onChange={val => f.fgts = val}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2 border-t border-border/30">
                      <button 
                        onClick={() => handleDeleteFunc(String(f.id))}
                        className="mr-auto px-3 py-1.5 text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        Excluir
                      </button>
                      <button 
                        onClick={() => setEditingFuncId(null)}
                        className="px-4 py-2 text-[11px] font-bold text-muted-foreground hover:bg-muted rounded-lg transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => handleSaveFunc(String(f.id), f)}
                        className="px-6 py-2 text-[11px] font-bold bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-[13px] font-bold text-foreground">{f.nome}</p>
                        <p className="text-[10px] text-muted-foreground">{f.cargo}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border",
                          f.status === "pago" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}>
                          {f.status === "pago" ? "✓ Pago" : "Pendente"}
                        </span>
                        <button 
                          onClick={() => setEditingFuncId(String(f.id))}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black hover:bg-primary/20 transition-all border border-primary/20"
                        >
                          Editar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                      {[
                        { label: "Salário", value: f.salario },
                        { label: "Pró-labore", value: f.prolabore },
                        { label: "INSS", value: f.inss },
                        { label: "FGTS", value: f.fgts },
                      ].map((item, ii) => (
                        <div key={ii} className="text-center p-2 rounded-xl bg-background/60 border border-border/10">
                          <p className="text-[9px] font-black text-muted-foreground uppercase">{item.label}</p>
                          <p className="text-[11px] font-black text-foreground mt-0.5">{formatBRL(item.value)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar size={10} /> Vence: {f.vencimento}
                      </p>
                      {f.status === "pendente" && (
                        <button onClick={() => markFuncPaid(String(f.id))} className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                          <Check size={12} /> Marcar pago
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between shadow-inner">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Líquido da Folha</span>
            <span className="text-lg font-black text-primary">{formatBRL(totalFolhaState)}</span>
          </div>
        </div>

        {/* Despesas Operacionais */}
        <div className="p-5 rounded-3xl border border-border/50 bg-card shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" />
              Despesas Operacionais
            </h3>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-all border border-rose-500/20 flex items-center gap-1.5"
                  >
                    <Plus size={12} /> Nova
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                  <p className="text-[9px] font-black text-muted-foreground uppercase px-2 py-1.5 mb-1 border-b border-border/50">Sugestões de Despesas</p>
                  <DropdownMenuItem onClick={() => handleAddDesp({ tipo: "fixa", categoria: "Aluguel", descricao: "Aluguel / Condomínio" })} className="gap-2 text-[11px] font-medium cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-blue-500" /> Aluguel / Condomínio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddDesp({ tipo: "fixa", categoria: "Software", descricao: "Software / SaaS (CRM, Adobe, etc)" })} className="gap-2 text-[11px] font-medium cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" /> Software / SaaS
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddDesp({ tipo: "variavel", categoria: "Marketing", descricao: "Tráfego Pago (Ads)" })} className="gap-2 text-[11px] font-medium cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-rose-500" /> Tráfego Pago / Ads
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddDesp({ tipo: "variavel", categoria: "Impostos", descricao: "Impostos / DAS / Guias" })} className="gap-2 text-[11px] font-medium cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-amber-500" /> Impostos / Taxas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddDesp({ tipo: "fixa", categoria: "Infraestrutura", descricao: "Energia / Internet / Água" })} className="gap-2 text-[11px] font-medium cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Utilidades (Luz/Internet)
                  </DropdownMenuItem>
                  <div className="h-px bg-border/50 my-1" />
                  <DropdownMenuItem onClick={() => handleAddDesp({ tipo: "variavel", categoria: "Geral", descricao: "Nova Despesa" })} className="gap-2 text-[11px] font-bold cursor-pointer text-primary">
                    <Plus size={12} /> Outra Despesa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button 
                onClick={() => setShowDespesasModal(true)}
                className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-all border border-amber-500/20"
              >
                Ver mais
              </button>
            </div>
          </div>
          <div className="space-y-3 flex-1">
            {despesas.map(d => (
              <div key={d.id} className="p-4 rounded-2xl border border-border/30 bg-muted/10 hover:bg-muted/20 transition-all group relative">
                {editingDespId === String(d.id) ? (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <input 
                      className="w-full px-3 py-2 text-[12px] font-bold bg-background border border-border rounded-lg"
                      defaultValue={d.descricao}
                      onChange={e => d.descricao = e.target.value}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <CurrencyInput 
                        className="px-3 py-2 text-[12px] bg-background border border-border rounded-lg"
                        value={d.valor}
                        onChange={val => d.valor = val}
                        placeholder="Valor (R$)"
                      />
                      <input 
                        className="px-3 py-2 text-[12px] bg-background border border-border rounded-lg"
                        defaultValue={d.categoria}
                        onChange={e => d.categoria = e.target.value}
                      />
                    </div>
                    <div className="flex flex-col gap-2 p-2 rounded-lg bg-muted/20 border border-dashed border-border/50">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Comprovante / Anexo</p>
                      <div className="flex items-center gap-2">
                        {d.document_url ? (
                          <div className="flex items-center gap-2 flex-1">
                            <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-600">
                              <FileText size={12} />
                            </div>
                            <span className="text-[10px] font-bold truncate flex-1">Arquivo anexado</span>
                            <button 
                              onClick={() => d.document_url = undefined}
                              className="text-[10px] text-rose-500 hover:underline"
                            >
                              Remover
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 transition-all text-primary">
                            <Upload size={12} />
                            <span className="text-[10px] font-bold uppercase">Anexar Documento</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, String(d.id));
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => handleDeleteDesp(String(d.id))}
                        className="mr-auto px-3 py-1.5 text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        Excluir
                      </button>
                      <button 
                        onClick={() => setEditingDespId(null)}
                        className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => handleSaveDesp(String(d.id), d)}
                        className="px-3 py-1.5 text-[10px] font-bold bg-amber-500 text-white rounded-lg"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[13px] font-bold text-foreground">{d.descricao}</p>
                        <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full",
                          d.tipo === "fixa" ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500"
                        )}>
                          {d.tipo === "fixa" ? "FIXA" : "VARIÁVEL"}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar size={10} /> {d.vencimento} · {d.categoria}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button 
                          onClick={() => setEditingDespId(String(d.id))}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-primary hover:underline"
                        >
                          Editar despesa
                        </button>
                        {d.document_url && (
                          <button 
                            onClick={() => window.open(d.document_url, "_blank")}
                            className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 hover:underline"
                          >
                            <FileText size={10} /> Ver Comprovante
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <span className="font-black text-rose-500 text-sm">{formatBRL(d.valor)}</span>
                      {d.status === "pendente" ? (
                        <button onClick={() => markDespPaid(String(d.id))} className="text-[10px] font-bold text-amber-600 border border-amber-500/30 bg-amber-500/10 px-2 py-1 rounded-lg hover:bg-amber-500/20 transition-all group-hover:opacity-100">
                          Pagar
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-emerald-600">✓ Pago</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between shadow-inner">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total de Despesas</span>
            <span className="text-lg font-black text-rose-500">{formatBRL(despesasFixasState + despesasVariaveisState)}</span>
          </div>
        </div>
      </div>

      {/* Folha Detailed Modal */}
      {showFolhaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border border-border/50 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-border/30 flex items-center justify-between bg-primary/5">
              <div>
                <h2 className="text-2xl font-black text-foreground">Gestão de Folha de Pagamento</h2>
                <p className="text-sm text-muted-foreground">Ciclo: Maio 2026 · 3 Colaboradores Ativos</p>
              </div>
              <button onClick={() => setShowFolhaModal(false)} className="w-10 h-10 rounded-full bg-background border border-border/50 flex items-center justify-center hover:bg-muted transition-all">
                <Trash2 size={18} className="text-muted-foreground rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left border-b border-border/50">
                      <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Colaborador</th>
                      <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Salário Base</th>
                      <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Pró-labore</th>
                      <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">INSS</th>
                      <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">FGTS</th>
                      <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Total Custo</th>
                      <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funcionarios.map(f => (
                      <tr key={f.id} className="border-b border-border/20 group hover:bg-muted/30 transition-colors">
                        <td className="py-5">
                          <p className="text-sm font-bold">{f.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{f.cargo} · {f.email}</p>
                        </td>
                        <td className="py-5 text-right font-bold text-sm">{formatBRL(f.salario)}</td>
                        <td className="py-5 text-right text-sm text-primary">{formatBRL(f.prolabore)}</td>
                        <td className="py-5 text-right text-sm text-rose-500">-{formatBRL(f.inss)}</td>
                        <td className="py-5 text-right text-sm text-blue-500">+{formatBRL(f.fgts)}</td>
                        <td className="py-5 text-right font-black text-sm">{formatBRL(f.salario + f.prolabore + f.inss + f.fgts)}</td>
                        <td className="py-5 text-center">
                          <span className={cn("text-[9px] font-black px-2 py-1 rounded-full border",
                            f.status === "pago" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          )}>
                            {f.status === "pago" ? "LIQUIDADO" : "PENDENTE"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="grid grid-cols-3 gap-6 pt-6">
                  <div className="p-6 rounded-3xl bg-muted/20 border border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Total Remunerações</p>
                    <p className="text-2xl font-black">{formatBRL(funcionarios.reduce((s,f) => s + f.salario + f.prolabore, 0))}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-muted/20 border border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Total Encargos (INSS+FGTS)</p>
                    <p className="text-2xl font-black text-rose-500">{formatBRL(funcionarios.reduce((s,f) => s + f.inss + f.fgts, 0))}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20">
                    <p className="text-[10px] font-black text-primary uppercase mb-2">Custo Total Folha</p>
                    <p className="text-2xl font-black text-primary">{formatBRL(totalFolhaState)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 border-t border-border/30 flex justify-end gap-4 bg-muted/20">
              <button className="px-6 py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-background transition-all">Exportar PDF</button>
              <button onClick={() => setShowFolhaModal(false)} className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 transition-all">Fechar Detalhes</button>
            </div>
          </div>
        </div>
      )}

      {/* Despesas Detailed Modal */}
      {showDespesasModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border border-border/50 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-border/30 flex items-center justify-between bg-amber-500/5">
              <div>
                <h2 className="text-2xl font-black text-foreground">Relatório de Despesas Operacionais</h2>
                <p className="text-sm text-muted-foreground">Competência: Maio 2026 · Gestão de Custos</p>
              </div>
              <button onClick={() => setShowDespesasModal(false)} className="w-10 h-10 rounded-full bg-background border border-border/50 flex items-center justify-center hover:bg-muted transition-all">
                <Trash2 size={18} className="text-muted-foreground rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5">
                    <h4 className="text-xs font-black text-blue-600 uppercase mb-4">Custos Fixos</h4>
                    <div className="space-y-3">
                      {despesas.filter(d => d.tipo === "fixa").map(d => (
                        <div key={d.id} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-muted-foreground">{d.descricao}</span>
                          <span className="font-bold">{formatBRL(d.valor)}</span>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-blue-500/20 flex justify-between font-black text-blue-600">
                        <span>Subtotal Fixo</span>
                        <span>{formatBRL(despesasFixasState)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl border border-orange-500/20 bg-orange-500/5">
                    <h4 className="text-xs font-black text-orange-600 uppercase mb-4">Custos Variáveis</h4>
                    <div className="space-y-3">
                      {despesas.filter(d => d.tipo === "variavel").map(d => (
                        <div key={d.id} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-muted-foreground">{d.descricao}</span>
                          <span className="font-bold">{formatBRL(d.valor)}</span>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-orange-500/20 flex justify-between font-black text-orange-600">
                        <span>Subtotal Variável</span>
                        <span>{formatBRL(despesasVariaveisState)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Histórico Completo</h4>
                <div className="rounded-2xl border border-border/50 overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-muted/50">
                      <tr className="text-left">
                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase">Data</th>
                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase">Descrição</th>
                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase">Categoria</th>
                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase">Tipo</th>
                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {despesas.map(d => (
                        <tr key={d.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                          <td className="p-4 text-xs font-medium">{d.vencimento}</td>
                          <td className="p-4 text-xs font-bold">{d.descricao}</td>
                          <td className="p-4 text-xs">{d.categoria}</td>
                          <td className="p-4">
                            <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full",
                              d.tipo === "fixa" ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500"
                            )}>{d.tipo.toUpperCase()}</span>
                          </td>
                          <td className="p-4 text-xs font-black text-right text-rose-500">{formatBRL(d.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 border-t border-border/30 flex justify-end gap-4 bg-muted/20">
              <button className="px-6 py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-background transition-all">Gerar DRE</button>
              <button onClick={() => setShowDespesasModal(false)} className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all">Fechar Detalhes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
