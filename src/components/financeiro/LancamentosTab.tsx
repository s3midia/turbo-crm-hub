import React, { useState, useEffect } from "react";
import {
  Plus, Search, Filter, FileSpreadsheet, Trash2, Check, Users, Calendar,
  RefreshCw, Tag, ArrowUpCircle, ArrowDownCircle, Edit3 as Edit3Icon, X,
  Phone, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance, FinancialTransaction } from "@/hooks/useFinance";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIAS_ENTRADA = ["Software", "Web Design", "Consultoria", "Manutenção", "Licença", "Outros"];
const CATEGORIAS_SAIDA = ["Infraestrutura", "Marketing", "Salários", "Impostos", "Escritório", "Ferramentas", "Outros"];

import { formatBRL } from '@/lib/formatters';

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
    valor: transaction?.valor?.toString() ?? "",
    data_lancamento: transaction?.data_lancamento ?? "",
    vencimento: transaction?.vencimento ?? "",
    recebimento: transaction?.recebimento ?? "",
    lead_nome: transaction?.lead_nome ?? preFilledLeadName ?? "",
    lead_id: transaction?.lead_id ?? preFilledLeadId ?? "",
    categoria: transaction?.categoria ?? "",
    recorrencia: (transaction?.recorrencia ?? "unica") as FinancialTransaction["recorrencia"],
    status: (transaction?.status ?? "pendente") as FinancialTransaction["status"],
    classificacao: (transaction?.classificacao ?? "nao_recorrente") as "recorrente" | "nao_recorrente",
  });

  const [searchLead, setSearchLead] = useState("");
  const [leadsResults, setLeadsResults] = useState<any[]>([]);
  const [isSearchingLeads, setIsSearchingLeads] = useState(false);
  const [showLeadResults, setShowLeadResults] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchLead.length >= 2) {
        searchLeads(searchLead);
      } else {
        setLeadsResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchLead]);

  async function searchLeads(term: string) {
    setIsSearchingLeads(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, company_name, phone, email, niche')
        .or(`company_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(10);

      if (!error && data) {
        setLeadsResults(data);
        setShowLeadResults(true);
      }
    } catch (e) {
      console.error("Search error", e);
    } finally {
      setIsSearchingLeads(false);
    }
  }

  const categorias = form.tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  async function handleSave() {
    if (!form.descricao || !form.valor || !form.vencimento) return;
    
    const payload: any = {
      descricao: form.descricao,
      tipo: form.tipo,
      valor: parseFloat(String(form.valor).replace(",", ".")),
      data_lancamento: form.data_lancamento || new Date().toISOString().split('T')[0],
      vencimento: form.vencimento,
      recebimento: form.recebimento || undefined,
      lead_nome: form.lead_nome || "N/A",
      lead_id: form.lead_id || undefined,
      status: form.status,
      categoria: form.categoria || categorias[0],
      recorrencia: form.recorrencia,
      classificacao: form.tipo === "entrada" ? form.classificacao : undefined,
    };

    if (transaction?.id) {
      payload.id = transaction.id;
    }

    await onSave(payload);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-8 mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">{transaction ? "Editar Transação" : "Nova Transação"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-all"><X size={18} /></button>
        </div>

        {/* Tipo Toggle */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl mb-6">
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
            <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Ex: Criação de site" />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Valor (R$) *</label>
            <input value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
              type="number" className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="0,00" />
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
            <input value={form.vencimento} onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))}
              type="date" className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
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
              {form.lead_id && <span className="text-[9px] font-mono text-primary/60">ID: {form.lead_id}</span>}
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

              {showLeadResults && leadsResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  {leadsResults.map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => {
                        setForm(f => ({ ...f, lead_nome: lead.company_name, lead_id: lead.id }));
                        setSearchLead("");
                        setShowLeadResults(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0 flex items-center justify-between group"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{lead.company_name}</span>
                        <div className="flex items-center gap-3 mt-1">
                          {lead.phone && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Phone size={10} className="text-primary/60" /> {lead.phone}
                            </span>
                          )}
                          {lead.email && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Mail size={10} className="text-primary/60" /> {lead.email}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {lead.niche && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary tracking-widest">
                              {lead.niche}
                            </span>
                          )}
                          <span className="text-[9px] text-muted-foreground/60 font-mono">ID: {lead.id}</span>
                        </div>
                      </div>
                      <Plus size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-border bg-background hover:bg-muted text-sm font-bold transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
            {transaction ? "Salvar Alterações" : "Salvar Transação"}
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
  const { transactions, loading, saveTransaction, deleteTransaction } = useFinance();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<"todos" | "entrada" | "saida">("todos");
  const [filterStatus, setFilterStatus] = useState<"todos" | "pago" | "pendente" | "agendado">("todos");
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | undefined>();

  const filtered = transactions.filter(t => {
    const matchSearch = t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || (t.lead_nome || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === "todos" || t.tipo === filterTipo;
    const matchStatus = filterStatus === "todos" || t.status === filterStatus;
    return matchSearch && matchTipo && matchStatus;
  });

  const totals = {
    entradas: transactions.filter(t => t.tipo === "entrada" && t.status === "pago").reduce((s, t) => s + t.valor, 0),
    saidas: transactions.filter(t => t.tipo === "saida").reduce((s, t) => s + t.valor, 0),
    pendentes: transactions.filter(t => t.tipo === "entrada" && t.status === "pendente").reduce((s, t) => s + t.valor, 0),
  };

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

  function openEdit(t: FinancialTransaction) {
    setEditingTransaction(t);
    setShowModal(true);
  }

  function openNew() {
    setEditingTransaction(undefined);
    setShowModal(true);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      {showModal && (
        <TransacaoModal
          transaction={editingTransaction}
          onClose={() => { setShowModal(false); setEditingTransaction(undefined); }}
          onSave={handleUpsertTransaction}
        />
      )}

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Entradas Pagas", value: totals.entradas, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Saídas Totais", value: totals.saidas, color: "text-rose-500", bg: "bg-rose-500/10" },
          { label: "Pendente a Receber", value: totals.pendentes, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((s, i) => (
          <div key={i} className={cn("p-4 rounded-2xl border border-border/40", s.bg)}>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className={cn("text-xl font-black mt-1", s.color)}>{formatBRL(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar por descrição ou cliente..."
            className="w-full pl-10 pr-4 py-3 bg-card border border-border/50 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(["todos", "entrada", "saida"] as const).map(t => (
            <button key={t} onClick={() => setFilterTipo(t)} className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
              filterTipo === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
            )}>
              {t === "todos" ? "Todos" : t === "entrada" ? "Entradas" : "Saídas"}
            </button>
          ))}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-border/50 bg-card text-muted-foreground focus:ring-2 focus:ring-primary/20">
            <option value="todos">Todos Status</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
            <option value="agendado">Agendado</option>
          </select>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            <Plus size={14} />
            Nova
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border/40">
              {["Transação", "Categoria", "Recorrência", "Valor", "Vencimento", "Status", "Ações"].map(h => (
                <th key={h} className="px-5 py-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-black">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, idx) => (
              <tr 
                key={t.id} 
                className={cn(
                  "border-b border-border/30 hover:bg-muted/20 transition-all group cursor-pointer", 
                  idx === filtered.length - 1 && "border-0"
                )}
                onClick={() => openEdit(t)}
              >
                <td className="px-5 py-4">
                  <div className="flex items-start gap-2">
                    <div className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", t.tipo === "entrada" ? "bg-emerald-500" : "bg-rose-500")} />
                    <div>
                      <p className="text-[13px] font-bold text-foreground">{t.descricao}</p>
                      {t.lead_nome && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenProfile) onOpenProfile({ id: t.lead_id, cliente: t.lead_nome });
                          }}
                          className="text-[10px] text-primary hover:underline font-medium mt-0.5 flex items-center gap-1"
                        >
                          <Users size={10} />
                          {t.lead_nome} {t.lead_id && <span className="opacity-50 text-[8px] font-mono">({t.lead_id})</span>}
                        </button>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-secondary/50 border border-border/40 text-muted-foreground flex items-center gap-1 w-fit">
                    <Tag size={10} /> {t.categoria}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit", recorrenciaColor[t.recorrencia])}>
                    <RefreshCw size={9} /> {recorrenciaLabel[t.recorrencia]}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={cn("text-[14px] font-black", t.tipo === "entrada" ? "text-emerald-500" : "text-rose-500")}>
                    {t.tipo === "entrada" ? "+" : "-"} {formatBRL(t.valor)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <Calendar size={12} /> {t.vencimento}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={cn("text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit border",
                    t.status === "pago" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      t.status === "pendente" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                        "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", t.status === "pago" ? "bg-emerald-500" : t.status === "pendente" ? "bg-amber-500 animate-pulse" : "bg-blue-500")} />
                    {t.status === "pago" ? "Liquidado" : t.status === "pendente" ? "Pendente" : "Agendado"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); t.id && handleDelete(t.id); }}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-all text-muted-foreground"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                    {t.status !== "pago" && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); t.id && handleMarkPaid(t.id); }}
                        className="p-1.5 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 transition-all text-muted-foreground"
                        title="Marcar como Pago"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                      className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                      title="Editar"
                    >
                      <Edit3Icon size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <Search size={40} className="text-muted-foreground/30" />
            <p className="font-bold text-foreground">Nenhuma transação encontrada</p>
            <p className="text-sm text-muted-foreground">Ajuste os filtros ou adicione uma nova transação.</p>
          </div>
        )}
      </div>
    </div>
  );
}
