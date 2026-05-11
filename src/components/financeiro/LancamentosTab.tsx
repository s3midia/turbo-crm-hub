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
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [periodPreset, setPeriodPreset] = useState<"todos" | "mes" | "30d">("todos");
  const [sortKey, setSortKey] = useState<"vencimento" | "valor" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSort = (k: "vencimento" | "valor") => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };
  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const clearSelection = () => setSelectedIds(new Set());

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

  function openEdit(t: ProjectedTransaction) {
    if (t.isProjection) {
      handleConfirmProjection(t);
      return;
    }
    setEditingTransaction(t as FinancialTransaction);
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

  async function bulkMarkPaid() {
    const ids = Array.from(selectedIds);
    let ok = 0;
    for (const id of ids) {
      const t = transactions.find(x => x.id === id);
      if (t && t.status !== "pago" && !(t as ProjectedTransaction).isProjection) {
        try { await saveTransaction({ ...t, status: "pago" }); ok++; } catch {}
      }
    }
    toast.success(`${ok} lançamento(s) marcados como pagos`);
    clearSelection();
  }
  async function bulkDelete() {
    if (!confirm(`Excluir ${selectedIds.size} lançamento(s)?`)) return;
    const ids = Array.from(selectedIds);
    let ok = 0;
    for (const id of ids) {
      try { await deleteTransaction(id); ok++; } catch {}
    }
    toast.success(`${ok} lançamento(s) excluídos`);
    clearSelection();
  }

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
      <div className="rounded-2xl border border-border/40 bg-muted/60 p-4 flex flex-wrap items-center gap-6 shadow-sm">
        <div>
          <p className="text-lg font-black text-emerald-600">+ {formatBRL(totals.entradas)}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Entradas</p>
        </div>
        <div>
          <p className="text-lg font-black text-rose-600">- {formatBRL(totals.saidas)}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Saídas</p>
        </div>
        <div>
          <p className={cn("text-lg font-black", saldoPrevisto >= 0 ? "text-primary" : "text-rose-600")}>
            {formatBRL(saldoPrevisto)}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Saldo previsto</p>
        </div>
        {totals.atrasados > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <AlertTriangle size={16} className="text-rose-600" />
            <div>
              <p className="text-sm font-black text-rose-600 leading-none">{totals.atrasados} atrasado{totals.atrasados > 1 ? "s" : ""}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600/70">Atenção</p>
            </div>
          </div>
        )}
        <div className="ml-auto">
          <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            <Plus size={14} /> Novo lançamento
          </button>
        </div>
      </div>
      </div>

      {/* Barra de seleção em lote */}
      {selectedIds.size > 0 && (
        <div className="rounded-2xl border border-primary/40 bg-primary/5 px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
          <span className="text-sm font-black text-primary">{selectedIds.size} selecionado{selectedIds.size > 1 ? "s" : ""}</span>
          <div className="h-4 w-px bg-border" />
          <button onClick={bulkMarkPaid} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all">
            <Check size={12} /> Marcar como pagos
          </button>
          <button onClick={bulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-all">
            <Trash2 size={12} /> Excluir
          </button>
          <button onClick={clearSelection} className="ml-auto text-xs font-bold text-muted-foreground hover:text-foreground">
            Limpar seleção
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar por descrição ou cliente..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border/50 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center rounded-xl border border-border/50 bg-card p-0.5">
            {([
              { v: "todos", l: "Tudo" },
              { v: "mes", l: "Este mês" },
              { v: "30d", l: "30 dias" },
            ] as const).map(p => (
              <button key={p.v} onClick={() => setPeriodPreset(p.v as any)} className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                periodPreset === p.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
                {p.l}
              </button>
            ))}
          </div>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-border/50 bg-card text-muted-foreground focus:ring-2 focus:ring-primary/20 capitalize">
            <option value="todos">Todos os Meses</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {(["todos", "entrada", "saida"] as const).map(t => (
            <button key={t} onClick={() => setFilterTipo(t)} className={cn(
              "px-3 py-2 rounded-xl text-xs font-bold border transition-all",
              filterTipo === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
            )}>
              {t === "todos" ? "Todos" : t === "entrada" ? "Entradas" : "Saídas"}
            </button>
          ))}
          {([
            { v: "todos", l: "Todos" },
            { v: "pendente", l: "Pendente" },
            { v: "atrasado", l: "Atrasado" },
            { v: "pago", l: "Pago" },
            { v: "projecao", l: "Projeção" },
          ] as const).map(s => (
            <button key={s.v} onClick={() => setFilterStatus(s.v as any)} className={cn(
              "px-3 py-2 rounded-xl text-xs font-bold border transition-all",
              filterStatus === s.v
                ? s.v === "atrasado" ? "bg-rose-500 text-white border-rose-500"
                  : s.v === "projecao" ? "bg-blue-500 text-white border-blue-500"
                  : "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
            )}>
              {s.l}
            </button>
          ))}
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition-all">
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

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
                <Calendar size={14} className="text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground capitalize">{month}</h3>
                <div className="h-px flex-1 bg-border/40" />
                {monthOut > 0 && <span className="text-xs font-black text-rose-600">- {formatBRL(monthOut)}</span>}
                {monthIn > 0 && <span className="text-xs font-black text-emerald-600">+ {formatBRL(monthIn)}</span>}
                <button
                  onClick={() => setCollapsedMonths(p => ({ ...p, [month]: !p[month] }))}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  {collapsed ? "expandir" : "recolher"}
                </button>
              </div>

              {!collapsed && (
              <div className="rounded-3xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/40">
                      <th className="px-3 py-3 w-8">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                          checked={visible.length > 0 && visible.every(t => t.id && selectedIds.has(t.id))}
                          onChange={(e) => {
                            setSelectedIds(prev => {
                              const next = new Set(prev);
                              if (e.target.checked) visible.forEach(t => t.id && !(t as ProjectedTransaction).isProjection && next.add(t.id));
                              else visible.forEach(t => t.id && next.delete(t.id));
                              return next;
                            });
                          }}
                        />
                      </th>
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
                            isCritical && "bg-rose-500/[0.04] border-l-4 border-l-rose-500",
                            isWarning && "bg-amber-500/[0.04] border-l-4 border-l-amber-500",
                            t.id && selectedIds.has(t.id) && "bg-primary/5"
                          )}
                          onClick={() => openEdit(t)}
                        >
                          <td className="px-3 py-2.5 w-8" onClick={(e) => e.stopPropagation()}>
                            {!t.isProjection && t.id && (
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                                checked={selectedIds.has(t.id)}
                                onChange={() => toggleSelect(t.id!)}
                              />
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-start gap-2">
                              <div className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", t.tipo === "entrada" ? "bg-emerald-500" : "bg-rose-500")} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-[13px] font-bold text-foreground">{t.descricao}</p>
                                  {t.isProjection && <span className="text-[8px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.5 rounded uppercase tracking-widest">Projeção</span>}
                                  {isCritical && <span className="text-[8px] font-black bg-rose-500 text-white px-1 rounded animate-pulse uppercase">Atrasado</span>}
                                  {isWarning && <span className="text-[8px] font-black bg-amber-500 text-white px-1 rounded uppercase">Vence em breve</span>}
                                </div>
                                {t.lead_nome && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onOpenProfile) onOpenProfile({ id: t.lead_id, cliente: t.lead_nome });
                                    }}
                                    className="text-[10px] text-primary hover:underline font-medium mt-0.5 flex items-center gap-1"
                                  >
                                    <Users size={10} />
                                    {t.lead_nome} {t.lead_id && <span className="opacity-50 text-[8px] font-mono">({formatDisplayId(t.lead_id)})</span>}
                                  </button>
                                )}
                                {t.document_url && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(t.document_url, "_blank");
                                    }}
                                    className="text-[10px] text-emerald-600 hover:underline font-bold mt-1 flex items-center gap-1"
                                  >
                                    <FileSpreadsheet size={10} />
                                    Comprovante anexado
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-secondary/50 border border-border/40 text-muted-foreground flex items-center gap-1 w-fit">
                              <Tag size={10} /> {t.categoria}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit", recorrenciaColor[t.recorrencia])}>
                              <RefreshCw size={9} /> {recorrenciaLabel[t.recorrencia]}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={cn("text-[14px] font-black", t.tipo === "entrada" ? "text-emerald-500" : "text-rose-500")}>
                              {t.tipo === "entrada" ? "+" : "-"} {formatBRL(t.valor)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className={cn(
                              "flex items-center gap-1.5 text-[11px] font-semibold",
                              isCritical ? "text-rose-500" : isWarning ? "text-amber-500" : "text-muted-foreground"
                            )}>
                              <Calendar size={12} /> {t.vencimento}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={cn("text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit border",
                              t.status === "pago" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                t.status === "pendente" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                  "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            )}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", t.status === "pago" ? "bg-emerald-500" : t.status === "pendente" ? "bg-amber-500 animate-pulse" : "bg-blue-500")} />
                              {t.status === "pago" ? "Liquidado" : t.status === "pendente" ? "Pendente" : "Agendado"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              {t.isProjection ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleConfirmProjection(t); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all text-[11px] font-bold"
                                  title="Confirmar Lançamento"
                                >
                                  <Check size={12} /> Confirmar
                                </button>
                              ) : t.status !== "pago" ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); t.id && handleMarkPaid(t.id); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/40 transition-all text-[11px] font-bold"
                                  title="Marcar como Pago"
                                >
                                  <Check size={12} /> Pagar
                                </button>
                              ) : null}
                              {!t.isProjection && (
                                <div className="relative group/menu">
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-all text-muted-foreground"
                                    title="Mais ações"
                                  >
                                    <MoreHorizontal size={14} />
                                  </button>
                                  <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-20 hidden group-hover/menu:block min-w-[140px] overflow-hidden">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-muted text-left"
                                    >
                                      <Edit3Icon size={12} /> Editar
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); t.id && handleDelete(t.id); }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-rose-500/10 text-rose-600 text-left"
                                    >
                                      <Trash2 size={12} /> Excluir
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 border-t-2 border-border/60">
                      <td className="px-3 py-3"></td>
                      <td className="px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-black" colSpan={3}>
                        Subtotal do mês
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-black text-emerald-600">+ {formatBRL(monthIn)}</span>
                          <span className="text-[12px] font-black text-rose-600">- {formatBRL(monthOut)}</span>
                          <span className={cn("text-[13px] font-black mt-0.5", (monthIn - monthOut) >= 0 ? "text-primary" : "text-rose-600")}>
                            = {formatBRL(monthIn - monthOut)}
                          </span>
                        </div>
                      </td>
                      <td colSpan={3}></td>
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
    </div>
  );
}
