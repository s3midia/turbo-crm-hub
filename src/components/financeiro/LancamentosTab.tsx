import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus, Search, Filter, FileSpreadsheet, Trash2, Check, Users, Calendar,
  RefreshCw, Tag, ArrowUpCircle, ArrowDownCircle, Edit3 as Edit3Icon, X,
  Phone, Mail, Download, ChevronUp, ChevronDown, MoreHorizontal, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance, FinancialTransaction } from "@/hooks/useFinance";
import { useProjections, ProjectedTransaction } from "@/hooks/useProjections";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIAS_ENTRADA = ["Software", "Web Design", "Consultoria", "Manutenção", "Licença", "Outros"];
const CATEGORIAS_SAIDA = ["Infraestrutura", "Marketing", "Salários", "Impostos", "Escritório", "Ferramentas", "Outros"];

import { formatBRL, formatDisplayId, formatDate, parseBRL } from '@/lib/formatters';
import { CurrencyInput } from "@/components/ui/currency-input";

const recorrenciaLabel = { unica: "Única", mensal: "Mensal", trimestral: "Trimestral", anual: "Anual" };
const recorrenciaColor = { unica: "bg-muted text-muted-foreground", mensal: "bg-blue-500/10 text-blue-500", trimestral: "bg-violet-500/10 text-violet-500", anual: "bg-emerald-500/10 text-emerald-500" };

export interface TransacaoModalProps {
  transaction?: FinancialTransaction;
  onClose: () => void;
  onSave: (t: Partial<FinancialTransaction>) => void;
  preFilledLeadId?: string;
  preFilledLeadName?: string;
}

export function TransacaoModal({ transaction, onClose, onSave, preFilledLeadId, preFilledLeadName }: TransacaoModalProps) {
  const [form, setForm] = useState({
    tipo: (transaction?.tipo ?? "entrada") as "entrada" | "saida",
    descricao: transaction?.descricao ?? "",
    valor: transaction?.valor ?? 0,
    data_lancamento: transaction?.data_lancamento ?? "",
    vencimento: transaction?.vencimento ?? "",
    recebimento: transaction?.recebimento ?? "",
    lead_nome: transaction?.lead_nome ?? preFilledLeadName ?? "",
    lead_id: transaction?.lead_id ?? preFilledLeadId ?? "",
    categoria: transaction?.categoria ?? "",
    recorrencia: (transaction?.recorrencia ?? "unica") as FinancialTransaction["recorrencia"],
    status: (transaction?.status ?? "pendente") as FinancialTransaction["status"],
    classificacao: (transaction?.classificacao ?? "nao_recorrente") as "recorrente" | "nao_recorrente",
    document_url: transaction?.document_url ?? "",
  });

  const [searchLead, setSearchLead] = useState("");
  const [leadsResults, setLeadsResults] = useState<any[]>([]);
  const [isSearchingLeads, setIsSearchingLeads] = useState(false);
  const [showLeadResults, setShowLeadResults] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchLeads(searchLead);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchLead]);

  async function searchLeads(term: string) {
    setIsSearchingLeads(true);
    try {
      // Busca idêntica à da página de Clientes para garantir consistência
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('company_name', { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        return;
      }

      if (data) {
        // Aplica exatamente o mesmo filtro da página de clientes
        let filtered = data.filter(lead => 
          lead.status === 'ganhou' || 
          lead.status === 'inativo' || 
          lead.is_client === true
        );

        // Se houver um termo de busca, filtra localmente
        if (term.trim().length >= 1) {
          const t = term.toLowerCase();
          filtered = filtered.filter(l => 
            (l.company_name || "").toLowerCase().includes(t) ||
            (l.phone || "").toLowerCase().includes(t) ||
            (l.email || "").toLowerCase().includes(t)
          );
        }
        
        setLeadsResults(filtered.slice(0, 20));
        setShowLeadResults(true);
      }
    } catch (e) {
      console.error("Search error", e);
    } finally {
      setIsSearchingLeads(false);
    }
  }

  const categorias = form.tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  async function handleFileUpload(file: File) {
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

      setForm(f => ({ ...f, document_url: publicUrl }));
      toast.dismiss(loadingToast);
      toast.success("Comprovante anexado!");
    } catch (error: any) {
      toast.error("Erro inesperado: " + error.message);
    }
  }

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSave() {
    const newErrors: Record<string, string> = {};
    if (!form.descricao.trim()) newErrors.descricao = "Descrição obrigatória";
    if (!form.valor || Number(form.valor) <= 0) newErrors.valor = "Informe um valor maior que zero";
    if (!form.vencimento) newErrors.vencimento = "Data de vencimento obrigatória";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      const payload: any = {
        descricao: form.descricao,
        tipo: form.tipo,
        valor: form.valor,
        data_lancamento: form.data_lancamento || new Date().toISOString().split('T')[0],
        vencimento: form.vencimento,
        recebimento: form.recebimento || undefined,
        lead_nome: form.lead_nome || "N/A",
        lead_id: form.lead_id || undefined,
        status: form.status,
        categoria: form.categoria || categorias[0],
        recorrencia: form.recorrencia,
        classificacao: form.tipo === "entrada" ? form.classificacao : undefined,
        document_url: form.document_url || undefined,
      };

      if (transaction?.id) {
        payload.id = transaction.id;
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar transação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black">{transaction ? "Editar Transação" : "Nova Transação"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-all"><X size={18} /></button>
        </div>

        {/* Tipo Toggle */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl mb-4">
          {(["entrada", "saida"] as const).map(tipo => (
            <button
              key={tipo}
              onClick={() => setForm(f => ({ ...f, tipo, categoria: "" }))}
              className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                form.tipo === tipo ? (tipo === "entrada" ? "bg-emerald-500 text-white shadow" : "bg-rose-500 text-white shadow") : "text-muted-foreground hover:text-foreground"
              )}>
              {tipo === "entrada" ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
              {tipo === "entrada" ? "Entrada" : "Saída"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Descrição *</label>
            <input value={form.descricao} onChange={e => { setForm(f => ({ ...f, descricao: e.target.value })); setErrors(p => ({ ...p, descricao: "" })); }}
              className={cn("w-full px-4 py-3 bg-muted/30 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                errors.descricao ? "border-rose-500" : "border-border/50")}
              placeholder="Ex: Criação de site" />
            {errors.descricao && <p className="text-[10px] text-rose-500 font-medium">{errors.descricao}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Valor (R$) *</label>
            <CurrencyInput
              value={Number(form.valor)}
              onChange={val => { setForm(f => ({ ...f, valor: val })); setErrors(p => ({ ...p, valor: "" })); }}
              className={cn("w-full px-4 py-3 bg-muted/30 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                errors.valor ? "border-rose-500" : "border-border/50")}
              placeholder="0,00"
            />
            {errors.valor && <p className="text-[10px] text-rose-500 font-medium">{errors.valor}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Categoria</label>
            <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
              className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              <option value="">Selecione...</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Vencimento *</label>
            <input value={form.vencimento} onChange={e => { setForm(f => ({ ...f, vencimento: e.target.value })); setErrors(p => ({ ...p, vencimento: "" })); }}
              type="date" className={cn("w-full px-4 py-3 bg-muted/30 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                errors.vencimento ? "border-rose-500" : "border-border/50")} />
            {errors.vencimento && <p className="text-[10px] text-rose-500 font-medium">{errors.vencimento}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Recorrência</label>
            <select value={form.recorrencia} onChange={e => setForm(f => ({ ...f, recorrencia: e.target.value as any }))}
              className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              {Object.entries(recorrenciaLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {form.tipo === "entrada" && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Classificação</label>
              <select value={form.classificacao} onChange={e => setForm(f => ({ ...f, classificacao: e.target.value as any }))}
                className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <option value="recorrente">Recorrente</option>
                <option value="nao_recorrente">Não Recorrente</option>
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
              className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="agendado">Agendado</option>
            </select>
          </div>

          <div className="col-span-2 space-y-1 relative">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Cliente / Lead</span>
              {form.lead_id && <span className="text-[9px] font-mono text-primary/60">ID: {formatDisplayId(form.lead_id)}</span>}
            </label>
            <div className="relative">
              <input 
                value={form.lead_nome || searchLead} 
                onChange={e => {
                  const val = e.target.value;
                  if (form.lead_nome) {
                    setForm(f => ({ ...f, lead_nome: "", lead_id: "" }));
                  }
                  setSearchLead(val);
                }}
                onFocus={() => setShowLeadResults(true)}
                className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
                placeholder="Pesquisar lead existente..." />
              
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isSearchingLeads ? (
                  <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                ) : form.lead_id ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Check size={12} className="text-emerald-500" />
                  </div>
                ) : (
                  <Search size={16} className="text-muted-foreground" />
                )}
              </div>

              {showLeadResults && (
                <>
                  <div className="fixed inset-0 z-[45]" onClick={() => setShowLeadResults(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {leadsResults.length > 0 ? (
                      leadsResults.map(lead => (
                        <button
                          key={lead.id}
                          onClick={() => {
                            setForm(f => ({ ...f, lead_nome: lead.company_name, lead_id: lead.id }));
                            setSearchLead("");
                            setShowLeadResults(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0 flex items-center justify-between group"
                        >
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground group-hover:text-primary transition-colors">{lead.company_name}</span>
                                <span className={cn(
                                  "text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest border",
                                  lead.status === 'ganhou' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                )}>
                                  {lead.status === 'ganhou' ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                              <span className="text-[9px] font-black text-muted-foreground/60 flex items-center gap-1 shrink-0">
                                <Calendar size={10} /> {formatDate(lead.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              {lead.phone && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Phone size={10} className="text-primary/40" /> {lead.phone}
                                </span>
                              )}
                              {lead.email && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Mail size={10} className="text-primary/40" /> {lead.email}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {lead.niche && (
                                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-primary/5 text-primary/70 tracking-widest border border-primary/10">
                                  {lead.niche}
                                </span>
                              )}
                              <span className="text-[8px] text-muted-foreground/40 font-mono">#{lead.id.substring(0, 8)}</span>
                            </div>
                          </div>
                          <Plus size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center gap-2">
                        <Users size={24} className="text-muted-foreground/30" />
                        <p className="text-xs font-bold text-muted-foreground">Nenhum cliente encontrado</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Comprovante / Anexo</label>
            <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border/50 rounded-xl">
              {form.document_url ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <FileSpreadsheet size={16} />
                  </div>
                  <span className="text-xs font-bold truncate flex-1">{form.document_url.split('/').pop()}</span>
                  <button 
                    onClick={() => setForm(f => ({ ...f, document_url: "" }))}
                    className="text-[10px] font-bold text-rose-500 hover:underline px-2"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 transition-all text-primary">
                  <Plus size={14} />
                  <span className="text-[11px] font-bold uppercase">Anexar Documento</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
              )}
              {form.document_url && (
                <button 
                  onClick={() => window.open(form.document_url, "_blank")}
                  className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                  title="Visualizar"
                >
                  <Search size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={saving} className="flex-1 py-3 rounded-2xl border border-border bg-background hover:bg-muted text-sm font-bold transition-all disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {saving ? "Salvando..." : transaction ? "Salvar Alterações" : "Salvar Transação"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface LancamentosTabProps {
  onOpenProfile?: (client: any) => void;
}

export default function LancamentosTab({ onOpenProfile }: LancamentosTabProps) {
  const { transactions, loading, saveTransaction, deleteTransaction } = useProjections();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState("");
  
  const initialTipo = searchParams.get("tipo") as "todos" | "entrada" | "saida" || "todos";
  const initialStatus = (searchParams.get("status") as "todos" | "pago" | "pendente" | "agendado" | "atrasado" | "projecao") || "todos";

  const [filterTipo, setFilterTipo] = useState<"todos" | "entrada" | "saida">(
    ["todos", "entrada", "saida"].includes(initialTipo) ? initialTipo : "todos"
  );
  const [filterStatus, setFilterStatus] = useState<"todos" | "pago" | "pendente" | "agendado" | "atrasado" | "projecao">(
    ["todos", "pago", "pendente", "agendado", "atrasado", "projecao"].includes(initialStatus) ? initialStatus : "todos"
  );
  const currentMonthKey = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});
  const [collapseInitialized, setCollapseInitialized] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [periodPreset, setPeriodPreset] = useState<"todos" | "mes" | "30d">("todos");
  const [sortKey, setSortKey] = useState<"vencimento" | "valor" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const toggleSort = (k: "vencimento" | "valor") => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };
  const [openMenu, setOpenMenu] = useState<"periodo" | "status" | null>(null);
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);

  const isOverdue = (t: ProjectedTransaction) => {
    if (t.status === "pago") return false;
    const today = new Date(); today.setHours(0,0,0,0);
    return new Date(t.vencimento) < today;
  };
  
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | undefined>();

  const [filterMonth, setFilterMonth] = useState<string>("todos");

  // Get unique months for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      const date = new Date(t.vencimento);
      const monthStr = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      months.add(monthStr);
    });
    return Array.from(months).sort((a, b) => {
      // Sort by date (reverse)
      const parse = (s: string) => {
        const parts = s.split(/[\s,de]+/);
        const m = parts[0];
        const y = parts[parts.length - 1];
        const monthIdx = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'].indexOf(m.toLowerCase());
        const year = parseInt(y);
        return new Date(isNaN(year) ? new Date().getFullYear() : year, monthIdx === -1 ? 0 : monthIdx);
      };
      return parse(b).getTime() - parse(a).getTime();
    });
  }, [transactions]);

  // Inicializa colapso: só o mês atual aberto
  useEffect(() => {
    if (collapseInitialized || transactions.length === 0) return;
    const initial: Record<string, boolean> = {};
    transactions.forEach(t => {
      const m = new Date(t.vencimento).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      if (m !== currentMonthKey) initial[m] = true;
    });
    setCollapsedMonths(initial);
    setCollapseInitialized(true);
  }, [transactions, collapseInitialized, currentMonthKey]);

  // Sync filters with URL
  useEffect(() => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (filterTipo !== "todos") newParams.set("tipo", filterTipo);
      else newParams.delete("tipo");
      
      if (filterStatus !== "todos") newParams.set("status", filterStatus);
      else newParams.delete("status");

      if (filterMonth !== "todos") newParams.set("mes", filterMonth);
      else newParams.delete("mes");
      
      return newParams;
    }, { replace: true });
  }, [filterTipo, filterStatus, filterMonth, setSearchParams]);

  const filtered = transactions.filter(t => {
    const matchSearch = t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || (t.lead_nome || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === "todos" || t.tipo === filterTipo;
    const matchStatus =
      filterStatus === "todos" ? true :
      filterStatus === "atrasado" ? isOverdue(t) :
      filterStatus === "projecao" ? !!(t as ProjectedTransaction).isProjection :
      t.status === filterStatus;

    const date = new Date(t.vencimento);
    const monthStr = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const matchMonth = filterMonth === "todos" || monthStr === filterMonth;

    let matchPeriod = true;
    if (periodPreset !== "todos") {
      const today = new Date(); today.setHours(0,0,0,0);
      if (periodPreset === "mes") {
        const now = new Date();
        matchPeriod = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      } else if (periodPreset === "30d") {
        const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
        matchPeriod = date >= today && date <= in30;
      }
    }

    return matchSearch && matchTipo && matchStatus && matchMonth && matchPeriod;
  });

  const totals = {
    entradas: filtered.filter(t => t.tipo === "entrada").reduce((s, t) => s + parseBRL(t.valor), 0),
    saidas: filtered.filter(t => t.tipo === "saida").reduce((s, t) => s + parseBRL(t.valor), 0),
    atrasados: filtered.filter(t => isOverdue(t)).length,
  };
  const saldoPrevisto = totals.entradas - totals.saidas;

  function exportCSV() {
    const headers = ["Descrição","Categoria","Tipo","Valor","Vencimento","Status","Cliente","Recorrência"];
    const rows = filtered.map(t => [
      t.descricao, t.categoria, t.tipo, parseBRL(t.valor).toFixed(2),
      t.vencimento, t.status, t.lead_nome || "", t.recorrencia
    ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["﻿"+csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lancamentos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  async function handleUpsertTransaction(t: Partial<FinancialTransaction>) {
    try {
      await saveTransaction(t);
      toast.success("Transação salva com sucesso!");
    } catch (err: any) {
      console.error("Error saving transaction:", err);
      toast.error(err.message || "Erro ao salvar transação.");
    }
  }

  async function handleMarkPaid(id: string) {
    const t = transactions.find(x => x.id === id);
    if (t) {
      try {
        await saveTransaction({ ...t, status: "pago" });
        toast.success("Transação marcada como paga!");
      } catch (err: any) {
        console.error("Error marking paid:", err);
        toast.error(err.message || "Erro ao atualizar status.");
      }
    }
  }

  async function handleConfirmProjection(t: ProjectedTransaction) {
    try {
      const { isProjection, ...cleanTransaction } = t;
      await saveTransaction({ ...cleanTransaction, status: "pendente" });
      toast.success("Projeção confirmada e salva!");
    } catch (err: any) {
      toast.error("Erro ao confirmar projeção.");
    }
  }

  // Dialog de exclusão recorrente
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    transaction: ProjectedTransaction | null;
  }>({ open: false, transaction: null });

  function openDeleteDialog(t: ProjectedTransaction) {
    const isRecurring = t.recorrencia && t.recorrencia !== "unica";
    if (isRecurring) {
      setDeleteDialog({ open: true, transaction: t });
    } else {
      handleDeleteSingle(t.id!);
    }
  }

  async function handleDeleteSingle(id: string) {
    if (!confirm("Deseja realmente excluir esta transação?")) return;
    try {
      await deleteTransaction(id);
      toast.success("Transação excluída!");
    } catch { toast.error("Erro ao excluir transação."); }
  }

  async function handleDeleteThisAndFuture(t: ProjectedTransaction) {
    setDeleteDialog({ open: false, transaction: null });
    if (!t.vencimento) return;
    const cutoffDate = t.vencimento;

    // Delete real transactions from cutoffDate onwards that match this recurrence group
    const toDelete = transactions.filter(tx =>
      !tx.isProjection &&
      tx.descricao === t.descricao &&
      tx.categoria === t.categoria &&
      tx.vencimento >= cutoffDate
    );
    let ok = 0;
    for (const tx of toDelete) {
      try { await deleteTransaction(tx.id!); ok++; } catch {}
    }
    if (ok > 0) {
      toast.success(`${ok} lançamento(s) excluído(s) (atual e futuros)`);
    } else {
      toast.info('Nenhum lançamento real encontrado para excluir. Projeções futuras não serão mais geradas.');
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Deseja realmente excluir esta transação?")) {
      try {
        await deleteTransaction(id);
        toast.success("Transação excluída com sucesso!");
      } catch (err) {
        toast.error("Erro ao excluir transação.");
      }
    }
  }

  async function handleMarkPaidOrConfirm(t: ProjectedTransaction) {
    if (t.isProjection) {
      // Projeção: confirma como transação real e já marca como paga
      try {
        const { isProjection, ...clean } = t;
        await saveTransaction({ ...clean, status: "pago" });
        toast.success("Lançamento confirmado e marcado como pago!");
      } catch { toast.error("Erro ao confirmar lançamento."); }
    } else {
      const found = transactions.find(x => x.id === t.id);
      if (found) {
        try {
          await saveTransaction({ ...found, status: "pago" });
          toast.success("Transação marcada como paga!");
        } catch (err: any) { toast.error(err.message || "Erro ao atualizar status."); }
      }
    }
  }

  function openEditOrConfirm(t: ProjectedTransaction) {
    if (t.isProjection) {
      // Confirma a projeção e abre o modal para edição
      const { isProjection, ...clean } = t;
      setEditingTransaction({ ...clean, status: "pendente" } as FinancialTransaction);
    } else {
      setEditingTransaction(t as FinancialTransaction);
    }
    setShowModal(true);
  }

  function openNew() {
    setEditingTransaction(undefined);
    setShowModal(true);
  }

  const getPriority = (t: FinancialTransaction) => {
    if (t.status === "pago") return 100;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const vDate = new Date(t.vencimento);
    if (vDate < today) return 0; // Vencida
    const diff = Math.ceil((vDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 5) return 1; // Próximo
    return 10; // Normal
  };

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "valor") {
      const d = parseBRL(a.valor) - parseBRL(b.valor);
      return sortDir === "asc" ? d : -d;
    }
    if (sortKey === "vencimento") {
      const d = new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime();
      return sortDir === "asc" ? d : -d;
    }
    const pA = getPriority(a);
    const pB = getPriority(b);
    if (pA !== pB) return pA - pB;
    return new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime();
  });


  const groupedByMonth = sorted.reduce((acc, t) => {
    const date = new Date(t.vencimento);
    const month = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(t);
    return acc;
  }, {} as Record<string, FinancialTransaction[]>);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      {showModal && (
        <TransacaoModal
          transaction={editingTransaction}
          onClose={() => { setShowModal(false); setEditingTransaction(undefined); }}
          onSave={handleUpsertTransaction}
        />
      )}

      {/* Resumo consolidado (sticky) */}
      <div className="sticky top-0 z-30 -mx-1 px-1 py-1 backdrop-blur-md">
        <div className="rounded-2xl border border-border/40 bg-card/80 px-4 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Entradas</span>
            <span className="text-sm font-black text-emerald-600 tabular-nums">{formatBRL(totals.entradas)}</span>
          </div>
          <div className="h-4 w-px bg-border/60" />
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Saídas</span>
            <span className="text-sm font-black text-rose-600 tabular-nums">{formatBRL(totals.saidas)}</span>
          </div>
          <div className="h-4 w-px bg-border/60" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Saldo</span>
            <span className={cn(
              "text-sm font-black tabular-nums px-2 py-0.5 rounded-md",
              saldoPrevisto >= 0 ? "text-emerald-700 bg-emerald-500/10" : "text-rose-700 bg-rose-500/10"
            )}>
              {saldoPrevisto >= 0 ? "+" : ""}{formatBRL(saldoPrevisto)}
            </span>
          </div>
          {totals.atrasados > 0 && (
            <button
              onClick={() => setFilterStatus("atrasado")}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
              title="Filtrar atrasados"
            >
              <AlertTriangle size={12} className="text-rose-600" />
              <span className="text-[11px] font-black text-rose-600 tabular-nums">
                {totals.atrasados} atrasado{totals.atrasados > 1 ? "s" : ""}
              </span>
            </button>
          )}
          <button onClick={openNew} className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all">
            <Plus size={14} /> Novo lançamento
          </button>
        </div>
      </div>

      {/* Filtros inteligentes */}
      {(() => {
        const statusCounts = {
          todos: transactions.length,
          pendente: transactions.filter(t => t.status === "pendente" && !isOverdue(t)).length,
          atrasado: transactions.filter(t => isOverdue(t)).length,
          pago: transactions.filter(t => t.status === "pago").length,
          projecao: transactions.filter(t => (t as ProjectedTransaction).isProjection).length,
        };
        const periodoLabel =
          periodPreset === "mes" ? "Este mês" :
          periodPreset === "30d" ? "Próximos 30 dias" :
          filterMonth !== "todos" ? filterMonth : "Todo período";
        const statusLabel =
          filterStatus === "todos" ? "Todos status" :
          filterStatus === "atrasado" ? "Atrasados" :
          filterStatus === "projecao" ? "Projeções" :
          filterStatus === "pago" ? "Pagos" :
          filterStatus === "pendente" ? "Pendentes" : "Agendados";
        const hasActiveFilters = searchTerm || filterTipo !== "todos" || filterStatus !== "todos" || filterMonth !== "todos" || periodPreset !== "todos";
        const clearAll = () => {
          setSearchTerm(""); setFilterTipo("todos"); setFilterStatus("todos");
          setFilterMonth("todos"); setPeriodPreset("todos");
        };
        const statusOpts = [
          { v: "todos", l: "Todos", dot: "bg-muted-foreground" },
          { v: "pendente", l: "Pendente", dot: "bg-amber-500" },
          { v: "atrasado", l: "Atrasado", dot: "bg-rose-500" },
          { v: "pago", l: "Pago", dot: "bg-emerald-500" },
          { v: "projecao", l: "Projeção", dot: "bg-blue-500" },
        ] as const;
        return (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Busca */}
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Buscar por descrição ou cliente..."
                className="w-full pl-10 pr-9 py-2.5 bg-card border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted">
                  <X size={14} className="text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Tipo segmented */}
            <div className="flex items-center rounded-xl border border-border/50 bg-card p-0.5">
              {([
                { v: "todos", l: "Todos" },
                { v: "entrada", l: "Entradas" },
                { v: "saida", l: "Saídas" },
              ] as const).map(t => (
                <button key={t.v} onClick={() => setFilterTipo(t.v as any)} className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filterTipo === t.v
                    ? t.v === "entrada" ? "bg-emerald-500 text-white"
                      : t.v === "saida" ? "bg-rose-500 text-white"
                      : "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* Dropdown Período */}
            <div className="relative">
              <button onClick={() => setOpenMenu(openMenu === "periodo" ? null : "periodo")} className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all",
                periodPreset !== "todos" || filterMonth !== "todos"
                  ? "bg-primary/10 text-primary border-primary/40"
                  : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
              )}>
                <Calendar size={14} />
                <span className="capitalize">{periodoLabel}</span>
                <ChevronDown size={12} className={cn("transition-transform", openMenu === "periodo" && "rotate-180")} />
              </button>
              {openMenu === "periodo" && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl min-w-[220px] py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Atalhos</p>
                    {([
                      { v: "todos", l: "Todo período" },
                      { v: "mes", l: "Este mês" },
                      { v: "30d", l: "Próximos 30 dias" },
                    ] as const).map(p => (
                      <button key={p.v} onClick={() => { setPeriodPreset(p.v as any); setFilterMonth("todos"); setOpenMenu(null); }}
                        className={cn("w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-muted transition-colors",
                          periodPreset === p.v && filterMonth === "todos" && "bg-primary/10 text-primary"
                        )}>
                        {p.l}
                        {periodPreset === p.v && filterMonth === "todos" && <Check size={12} />}
                      </button>
                    ))}
                    {availableMonths.length > 0 && (
                      <>
                        <div className="my-1 border-t border-border/40" />
                        <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Mês específico</p>
                        <div className="max-h-48 overflow-y-auto">
                          {availableMonths.map(m => (
                            <button key={m} onClick={() => { setFilterMonth(m); setPeriodPreset("todos"); setOpenMenu(null); }}
                              className={cn("w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-muted transition-colors capitalize",
                                filterMonth === m && "bg-primary/10 text-primary"
                              )}>
                              {m}
                              {filterMonth === m && <Check size={12} />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Dropdown Status */}
            <div className="relative">
              <button onClick={() => setOpenMenu(openMenu === "status" ? null : "status")} className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all",
                filterStatus !== "todos"
                  ? filterStatus === "atrasado" ? "bg-rose-500/10 text-rose-600 border-rose-500/40"
                    : filterStatus === "projecao" ? "bg-blue-500/10 text-blue-600 border-blue-500/40"
                    : "bg-primary/10 text-primary border-primary/40"
                  : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
              )}>
                <Filter size={14} />
                <span>{statusLabel}</span>
                <ChevronDown size={12} className={cn("transition-transform", openMenu === "status" && "rotate-180")} />
              </button>
              {openMenu === "status" && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl min-w-[200px] py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    {statusOpts.map(s => (
                      <button key={s.v} onClick={() => { setFilterStatus(s.v as any); setOpenMenu(null); }}
                        className={cn("w-full px-3 py-2 text-left text-xs font-bold flex items-center gap-2 hover:bg-muted transition-colors",
                          filterStatus === s.v && "bg-primary/10 text-primary"
                        )}>
                        <span className={cn("w-2 h-2 rounded-full", s.dot)} />
                        <span className="flex-1">{s.l}</span>
                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{statusCounts[s.v]}</span>
                        {filterStatus === s.v && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Exportar (ícone) */}
            <button onClick={exportCSV} title="Exportar CSV"
              className="p-2.5 rounded-xl border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <Download size={14} />
            </button>
          </div>

          {/* Chips de filtros ativos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-1">Filtros:</span>
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-[11px] font-bold hover:bg-muted/70">
                  "{searchTerm}" <X size={10} />
                </button>
              )}
              {filterTipo !== "todos" && (
                <button onClick={() => setFilterTipo("todos")} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-[11px] font-bold hover:bg-muted/70">
                  {filterTipo === "entrada" ? "Entradas" : "Saídas"} <X size={10} />
                </button>
              )}
              {(periodPreset !== "todos" || filterMonth !== "todos") && (
                <button onClick={() => { setPeriodPreset("todos"); setFilterMonth("todos"); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-[11px] font-bold hover:bg-muted/70 capitalize">
                  {periodoLabel} <X size={10} />
                </button>
              )}
              {filterStatus !== "todos" && (
                <button onClick={() => setFilterStatus("todos")} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-[11px] font-bold hover:bg-muted/70">
                  {statusLabel} <X size={10} />
                </button>
              )}
              <button onClick={clearAll} className="ml-1 text-[11px] font-bold text-primary hover:underline">
                Limpar tudo
              </button>
            </div>
          )}
        </div>
        );
      })()}

      {/* Grouped Table */}
      <div className="space-y-8">
        {Object.entries(groupedByMonth).length === 0 ? (
          <div className="rounded-3xl border border-border/40 bg-card/50 backdrop-blur-sm p-12 text-center flex flex-col items-center gap-3">
            <Search size={40} className="text-muted-foreground/30" />
            <p className="font-bold text-foreground">Nenhuma transação encontrada</p>
            <p className="text-sm text-muted-foreground">Ajuste os filtros ou adicione uma nova transação.</p>
          </div>
        ) : (
          Object.entries(groupedByMonth).map(([month, monthTransactions]) => {
            const monthIn = monthTransactions.filter(t => t.tipo === "entrada").reduce((s, t) => s + parseBRL(t.valor), 0);
            const monthOut = monthTransactions.filter(t => t.tipo === "saida").reduce((s, t) => s + parseBRL(t.valor), 0);
            const collapsed = collapsedMonths[month];
            const expanded = expandedMonths[month];
            const PAGE = 5;
            const visible = collapsed ? [] : (expanded ? monthTransactions : monthTransactions.slice(0, PAGE));
            const hidden = monthTransactions.length - visible.length;
            return (
            <div key={month} className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <Calendar size={14} className="text-muted-foreground" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground capitalize">{month}</h3>
                <div className="h-px flex-1 bg-border/40" />
                <span className={cn(
                  "text-xs font-bold tabular-nums px-2 py-0.5 rounded-md",
                  (monthIn - monthOut) >= 0 ? "text-emerald-700 bg-emerald-500/10" : "text-rose-700 bg-rose-500/10"
                )}>
                  {(monthIn - monthOut) >= 0 ? "+" : "−"}{formatBRL(Math.abs(monthIn - monthOut))}
                </span>
                <button
                  onClick={() => setCollapsedMonths(p => ({ ...p, [month]: !p[month] }))}
                  className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  {collapsed ? "expandir" : "recolher"}
                </button>
              </div>

              {!collapsed && (
              <div className="rounded-3xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-visible shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/40">
                      <th className="px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-black">Transação</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-black">Categoria</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-black">Recorrência</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-black">
                        <button onClick={() => toggleSort("valor")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          Valor {sortKey === "valor" && (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-black">
                        <button onClick={() => toggleSort("vencimento")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          Vencimento {sortKey === "vencimento" && (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-black">Status</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-black text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((t, idx) => {
                      const priority = getPriority(t);
                      const isCritical = priority === 0;
                      const isWarning = priority === 1;

                      return (
                        <tr
                          key={t.id}
                          className={cn(
                            "border-b border-border/30 hover:bg-muted/20 transition-all group cursor-pointer relative",
                            idx === visible.length - 1 && "border-0",
                            isCritical && "border-l-2 border-l-rose-400",
                            isWarning && "border-l-2 border-l-amber-400",
                          )}
                          onClick={() => openEditOrConfirm(t)}
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-start gap-2.5">
                              <div className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", t.tipo === "entrada" ? "bg-emerald-500/70" : "bg-muted-foreground/40")} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-[13px] font-bold text-foreground">{t.descricao}</p>
                                  {t.isProjection && <span className="text-[9px] font-bold text-muted-foreground border border-border/60 px-1.5 py-0.5 rounded uppercase tracking-wider">Projeção</span>}
                                  {isCritical && <span className="text-[9px] font-bold text-rose-700 bg-rose-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Atrasado</span>}
                                  {isWarning && <span className="text-[9px] font-bold text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Vence em breve</span>}
                                </div>
                                {t.lead_nome && t.lead_nome !== "N/A" ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); if (onOpenProfile) onOpenProfile({ id: t.lead_id, cliente: t.lead_nome }); }}
                                    className="text-[11px] text-muted-foreground hover:text-primary font-medium mt-0.5 flex items-center gap-1 transition-colors"
                                  >
                                    <Users size={10} className="opacity-60" />
                                    {t.lead_nome}
                                  </button>
                                ) : t.lead_nome === "N/A" ? (
                                  <span className="text-[11px] text-muted-foreground/50 font-medium mt-0.5 flex items-center gap-1">
                                    <Users size={10} className="opacity-50" /> N/A
                                  </span>
                                ) : null}
                                {t.document_url && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); window.open(t.document_url, "_blank"); }}
                                    className="text-[10px] text-muted-foreground hover:text-foreground font-medium mt-1 flex items-center gap-1 transition-colors"
                                  >
                                    <FileSpreadsheet size={10} /> Comprovante
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {t.categoria}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {recorrenciaLabel[t.recorrencia]}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[13px] font-bold text-foreground tabular-nums">
                              {t.tipo === "entrada" ? "+" : "−"}{formatBRL(t.valor)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                              {t.vencimento}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md w-fit inline-block",
                              t.status === "pago" ? "text-emerald-700 bg-emerald-500/10" :
                                t.status === "pendente" ? "text-amber-700 bg-amber-500/10" :
                                  "text-muted-foreground bg-muted"
                            )}>
                              {t.status === "pago" ? "Pago" : t.status === "pendente" ? "Pendente" : "Agendado"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              {t.status !== "pago" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleMarkPaidOrConfirm(t); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/40 transition-all text-[11px] font-bold"
                                  title={t.isProjection ? "Confirmar e Pagar" : "Marcar como Pago"}
                                >
                                  <Check size={12} /> {t.isProjection ? "Pagar" : "Pagar"}
                                </button>
                              )}
                              <div className="relative">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setOpenRowMenu(openRowMenu === (t.id ?? t.vencimento + t.descricao) ? null : (t.id ?? t.vencimento + t.descricao)); }}
                                  className={cn(
                                    "p-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-all text-muted-foreground",
                                    openRowMenu === (t.id ?? t.vencimento + t.descricao) && "bg-muted"
                                  )}
                                  title="Mais ações"
                                >
                                  <MoreHorizontal size={14} />
                                </button>
                                {openRowMenu === (t.id ?? t.vencimento + t.descricao) && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenRowMenu(null); }} />
                                    <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-[9999] min-w-[170px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setOpenRowMenu(null); openEditOrConfirm(t); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-muted text-left"
                                      >
                                        <Edit3Icon size={12} /> {t.isProjection ? "Editar / Confirmar" : "Editar"}
                                      </button>
                                      {!t.isProjection && t.id && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setOpenRowMenu(null); openDeleteDialog(t); }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-rose-500/10 text-rose-600 text-left"
                                        >
                                          <Trash2 size={12} /> Excluir
                                        </button>
                                      )}
                                      {t.isProjection && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setOpenRowMenu(null); openDeleteDialog(t); }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-rose-500/10 text-rose-600 text-left"
                                        >
                                          <Trash2 size={12} /> Cancelar recorrência
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/20 border-t border-border/50">
                      <td colSpan={8} className="px-4 py-2">
                        <div className="flex items-center justify-end gap-4 text-[11px]">
                          <span className="font-black uppercase tracking-widest text-muted-foreground/70">Subtotal</span>
                          <span className="font-black text-emerald-600 tabular-nums">+{formatBRL(monthIn)}</span>
                          <span className="text-border">·</span>
                          <span className="font-black text-rose-600 tabular-nums">−{formatBRL(monthOut)}</span>
                          <span className="text-border">·</span>
                          <span className={cn(
                            "font-black tabular-nums px-2 py-0.5 rounded-md",
                            (monthIn - monthOut) >= 0 ? "text-emerald-700 bg-emerald-500/10" : "text-rose-700 bg-rose-500/10"
                          )}>
                            {(monthIn - monthOut) >= 0 ? "+" : ""}{formatBRL(monthIn - monthOut)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
                {hidden > 0 && (
                  <div className="px-4 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span>Mostrando {visible.length} de {monthTransactions.length} lançamentos em {month.split(' ')[0]}</span>
                    <button onClick={() => setExpandedMonths(p => ({ ...p, [month]: true }))} className="font-bold text-primary hover:underline">
                      Ver todos
                    </button>
                  </div>
                )}
                {expanded && monthTransactions.length > PAGE && (
                  <div className="px-4 py-2 border-t border-border/40 bg-muted/20 flex items-center justify-center text-xs">
                    <button onClick={() => setExpandedMonths(p => ({ ...p, [month]: false }))} className="font-bold text-primary hover:underline">
                      Recolher
                    </button>
                  </div>
                )}
              </div>
              )}
            </div>
            );
          })
        )}
      </div>

      {/* Dialog de exclusão de recorrência */}
      {deleteDialog.open && deleteDialog.transaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-6 mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600">
                <Trash2 size={18} />
              </div>
              <div>
                <h2 className="text-base font-black">Excluir Lançamento Recorrente</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Como deseja excluir?</p>
              </div>
            </div>
            <div className="bg-muted/40 rounded-2xl p-3 mb-5">
              <p className="text-[12px] font-bold text-foreground">{deleteDialog.transaction.descricao}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Recorrência: {recorrenciaLabel[deleteDialog.transaction.recorrencia ?? "unica"]} · Venc: {deleteDialog.transaction.vencimento}</p>
            </div>
            <div className="space-y-2">
              {/* Only show "Excluir apenas esta" for real transactions with an id */}
              {!deleteDialog.transaction.isProjection && deleteDialog.transaction.id && (
                <button
                  onClick={() => {
                    const t = deleteDialog.transaction!;
                    setDeleteDialog({ open: false, transaction: null });
                    handleDeleteSingle(t.id!);
                  }}
                  className="w-full flex items-start gap-3 p-3 rounded-2xl border border-border hover:bg-muted transition-all text-left"
                >
                  <div className="mt-0.5 p-1 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                    <Trash2 size={12} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold">Excluir apenas esta</p>
                    <p className="text-[10px] text-muted-foreground">Somente o lançamento de {deleteDialog.transaction.vencimento} será removido</p>
                  </div>
                </button>
              )}
              <button
                onClick={() => handleDeleteThisAndFuture(deleteDialog.transaction!)}
                className="w-full flex items-start gap-3 p-3 rounded-2xl border border-rose-500/30 hover:bg-rose-500/5 transition-all text-left"
              >
                <div className="mt-0.5 p-1 rounded-lg bg-rose-500/10 text-rose-600 shrink-0">
                  <Trash2 size={12} />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-rose-600">Excluir esta e as posteriores</p>
                  <p className="text-[10px] text-muted-foreground">Todos os lançamentos a partir de {deleteDialog.transaction.vencimento} serão removidos</p>
                </div>
              </button>
            </div>
            <button
              onClick={() => setDeleteDialog({ open: false, transaction: null })}
              className="w-full mt-4 py-2.5 rounded-2xl border border-border text-sm font-bold hover:bg-muted transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
