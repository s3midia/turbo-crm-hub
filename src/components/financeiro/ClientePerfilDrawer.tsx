import React, { useState, useEffect } from "react";
import {
  X, User, Building2, Calendar, Phone, Mail, DollarSign,
  ArrowUpCircle, ArrowDownCircle, AlertTriangle, Check,
  Zap, ChevronRight, RefreshCw, Edit3, Receipt, History,
  Paperclip, MessageSquare, Send, Plus, Trash2, FileText,
  Edit2, FolderOpen, FileCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance, FinancialTransaction } from "@/hooks/useFinance";
import { useNavigate } from "react-router-dom";
import { formatBRL, formatDisplayId } from "@/lib/formatters";
import { TransacaoModal } from "./LancamentosTab";
import { LeadDocumentsTab } from "./LeadDocumentsTab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
const PIPELINE_STAGES = [
  { key: "novo", label: "Novo" },
  { key: "qualificacao", label: "Qualif." },
  { key: "atendimento", label: "Contato" },
  { key: "reuniao", label: "Reunião" },
  { key: "fechamento", label: "Fechamento" },
  { key: "ganhou", label: "Fechado" },
];

export interface ClientePerfilData {
  id?: string;
  lead_id?: string;
  cliente?: string;
  company_name?: string;
  email?: string;
  telefone?: string;
  phone?: string;
  empresa?: string;
  plano?: string;
  valor?: number;
  kanbanStage?: string;
  status?: string;
  dataInicio?: string;
  totalPago?: number;
  clientId?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  cliente: ClientePerfilData | null;
}

type ProfileTab = "lancamentos" | "pipeline" | "documentos";

export function ClientePerfilDrawer({ open, onClose, cliente }: Props) {
  const leadId = cliente?.id || cliente?.lead_id || "";
  const leadName = cliente?.cliente || cliente?.company_name || "";

  const { transactions, loading, saveTransaction, deleteTransaction } = useFinance(leadId || undefined);
  const [activeTab, setActiveTab] = useState<ProfileTab>("lancamentos");
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ email: "", telefone: "", empresa: "" });
  const navigate = useNavigate();

  const [localDocs, setLocalDocs] = useState<any[]>([]);

  useEffect(() => {
    // Simulate fetching docs for this client
    if (cliente) {
      setLocalDocs([
        { id: 1, titulo: "Proposta de Marketing Digital", subtipo: "Proposta Premium", data: "10/04/2026", status: "aprovado", valor: 5000, conteudo: "{}" },
        { id: 2, titulo: "Contrato de Prestação de Serviços", subtipo: "Contrato", data: "12/04/2026", status: "pendente", valor: 0, arquivo: "contrato.pdf" },
      ]);
    }
  }, [cliente?.id, cliente?.lead_id]);

  useEffect(() => {
    if (cliente) {
      setEditForm({
        email: cliente.email || "",
        telefone: cliente.telefone || cliente.phone || "",
        empresa: cliente.empresa || cliente.company_name || "",
      });
      setActiveTab("lancamentos");
    }
  }, [cliente?.id, cliente?.lead_id]);

  const toNumber = (v: any) => {
    if (v === null || v === undefined) return 0;
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    return isNaN(n) ? 0 : n;
  };

  const totals = {
    paid: transactions.filter(t => t.tipo === "entrada" && t.status === "pago").reduce((a, t) => a + toNumber(t.valor), 0),
    pending: transactions.filter(t => t.tipo === "entrada" && t.status === "pendente").reduce((a, t) => a + toNumber(t.valor), 0),
    saidas: transactions.filter(t => t.tipo === "saida").reduce((a, t) => a + toNumber(t.valor), 0),
    overdue: transactions.filter(t => t.status === "pendente" && new Date(t.vencimento) < new Date()).reduce((a, t) => a + toNumber(t.valor), 0),
  };

  const net = totals.paid - totals.saidas;

  function openNew() {
    setEditingTransaction({
      descricao: `Cobrança — ${leadName}`,
      tipo: "entrada",
      status: "pendente",
      categoria: "Software",
      recorrencia: "unica",
      data_lancamento: new Date().toISOString().split("T")[0],
      vencimento: new Date().toISOString().split("T")[0],
      lead_nome: leadName,
      lead_id: leadId,
    } as any);
    setShowModal(true);
  }

  function openEdit(t: FinancialTransaction) {
    setEditingTransaction(t);
    setShowModal(true);
  }

  async function handleSave(t: Partial<FinancialTransaction>) {
    try {
      await saveTransaction(t);
      toast.success("Transação salva!");
    } catch { toast.error("Erro ao salvar"); }
    setShowModal(false);
  }

  async function handleMarkPaid(t: FinancialTransaction) {
    try {
      await saveTransaction({ ...t, status: "pago" });
      toast.success("Marcada como paga!");
    } catch { toast.error("Erro"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta transação?")) return;
    try {
      await deleteTransaction(id);
      toast.success("Excluída!");
    } catch { toast.error("Erro ao excluir"); }
  }

  const currentStageIdx = PIPELINE_STAGES.findIndex(s => s.key === (cliente?.kanbanStage || cliente?.status));

  if (!open || !cliente) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-background border-l border-border/40 shadow-2xl flex flex-col animate-in slide-in-from-right-4 duration-300">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">{leadName || "Cliente"}</h2>
              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={editForm.empresa}
                    onChange={e => setEditForm(f => ({ ...f, empresa: e.target.value }))}
                    className="h-6 text-xs w-40 bg-muted/30"
                    placeholder="Empresa"
                  />
                  <button onClick={() => { setIsEditing(false); toast.success("Perfil atualizado!"); }} className="text-[10px] text-primary font-bold hover:underline">Salvar</button>
                  <button onClick={() => setIsEditing(false)} className="text-[10px] text-muted-foreground hover:underline">Cancelar</button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  {(cliente.empresa || cliente.company_name) && (
                    <span className="flex items-center gap-1"><Building2 size={11} />{cliente.empresa || cliente.company_name}</span>
                  )}
                  {cliente.clientId && (
                    <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">{formatDisplayId(cliente.clientId || cliente.id)}</span>
                  )}
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-0.5 text-primary hover:underline">
                    <Edit2 size={10} /> editar
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contact bar */}
        <div className="flex items-center gap-4 px-6 py-3 bg-muted/20 border-b border-border/20 shrink-0">
          {(cliente.email) && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail size={12} className="text-primary/60" />{cliente.email}
            </span>
          )}
          {(cliente.telefone || cliente.phone) && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone size={12} className="text-primary/60" />{cliente.telefone || cliente.phone}
            </span>
          )}
          {cliente.dataInicio && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar size={12} className="text-primary/60" />Desde {cliente.dataInicio}
            </span>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-border/20 shrink-0">
          {[
            { label: "Recebido", value: totals.paid, color: "text-emerald-500", bg: "bg-emerald-500/8" },
            { label: "Pendente", value: totals.pending, color: "text-amber-500", bg: "bg-amber-500/8" },
            { label: "Saldo Líq.", value: net, color: net >= 0 ? "text-emerald-500" : "text-rose-500", bg: net >= 0 ? "bg-emerald-500/8" : "bg-rose-500/8" },
          ].map((k, i) => (
            <div key={i} className={cn("rounded-xl p-3 border border-border/20", k.bg)}>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">{k.label}</p>
              <p className={cn("text-sm font-bold", k.color)}>{formatBRL(k.value)}</p>
            </div>
          ))}
        </div>

        {/* Overdue alert */}
        {totals.overdue > 0 && (
          <div className="mx-6 mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/8 border border-rose-500/20 text-rose-600 text-xs font-bold shrink-0">
            <AlertTriangle size={13} />
            {formatBRL(totals.overdue)} em atraso
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border/30 px-6 shrink-0">
          {([
            { id: "lancamentos", label: "Lançamentos", icon: Receipt },
            { id: "pipeline", label: "Pipeline", icon: Zap },
            { id: "documentos", label: "Documentos", icon: Paperclip },
          ] as { id: ProfileTab; label: string; icon: any }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-all",
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon size={13} />{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* ── Lançamentos ── */}
          {activeTab === "lancamentos" && (
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Histórico de transações</p>
                <button
                  onClick={openNew}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold shadow-sm hover:bg-primary/90 transition-all"
                >
                  <Plus size={12} /> Novo Lançamento
                </button>
              </div>

              {loading && transactions.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <RefreshCw size={20} className="animate-spin opacity-40" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-40">
                  <Receipt size={32} className="mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">Nenhum lançamento</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {transactions.map(t => {
                    const isOverdue = t.status === "pendente" && new Date(t.vencimento) < new Date();
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card hover:border-border/60 transition-all group"
                      >
                        {/* tipo dot */}
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          t.tipo === "entrada" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                        )}>
                          {t.tipo === "entrada" ? <ArrowUpCircle size={15} /> : <ArrowDownCircle size={15} />}
                        </div>

                        {/* info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{t.descricao}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{new Date(t.vencimento).toLocaleDateString("pt-BR")}</span>
                            <span className="text-[10px] text-muted-foreground/50">·</span>
                            <span className="text-[10px] text-muted-foreground">{t.categoria}</span>
                            {isOverdue && (
                              <span className="text-[9px] font-bold text-rose-600 flex items-center gap-0.5 uppercase">
                                <AlertTriangle size={9} />Atrasado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* valor */}
                        <p className={cn("text-sm font-bold shrink-0", t.tipo === "entrada" ? "text-emerald-600" : "text-rose-600")}>
                          {t.tipo === "entrada" ? "+" : "-"}{formatBRL(toNumber(t.valor))}
                        </p>

                        {/* status */}
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                          t.status === "pago" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                            isOverdue ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                              "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}>
                          {t.status === "pago" ? "Pago" : isOverdue ? "Atrasado" : "Pendente"}
                        </span>

                        {/* ações */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {t.status !== "pago" && (
                            <button onClick={() => handleMarkPaid(t)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground transition-all" title="Marcar como pago">
                              <Check size={13} />
                            </button>
                          )}
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all" title="Editar">
                            <Edit3 size={13} />
                          </button>
                          <button onClick={() => t.id && handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 text-muted-foreground transition-all" title="Excluir">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Pipeline ── */}
          {activeTab === "pipeline" && (
            <div className="p-6 space-y-5">
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={13} className="text-primary" />Posição no Funil
                  </p>
                  <button
                    onClick={() => navigate("/pipeline")}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
                  >
                    Abrir Kanban <ChevronRight size={12} />
                  </button>
                </div>

                {/* Stepper */}
                <div className="relative pt-1 pb-5">
                  <div className="absolute top-[1.05rem] left-0 right-0 h-0.5 bg-border/40 rounded-full" />
                  <div className="relative flex justify-between">
                    {PIPELINE_STAGES.map((stage, idx) => {
                      const isActive = idx <= currentStageIdx;
                      const isCurrent = idx === currentStageIdx;
                      return (
                        <div key={stage.key} className="flex flex-col items-center gap-2 z-10">
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 border-background transition-all",
                            isCurrent ? "bg-primary ring-2 ring-primary/30 scale-125" :
                              isActive ? "bg-primary/60" : "bg-border"
                          )} />
                          <span className={cn(
                            "text-[9px] font-semibold uppercase tracking-tight",
                            isCurrent ? "text-primary" : isActive ? "text-muted-foreground" : "text-muted-foreground/40"
                          )}>
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="text-center text-sm font-semibold text-foreground capitalize mt-1">
                  {PIPELINE_STAGES[currentStageIdx]?.label || "Novo lead"}
                </p>
              </div>

              {/* Fluxo de pagamentos */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fluxo de mensalidades — {new Date().getFullYear()}</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"].map((mes, idx) => {
                    const year = new Date().getFullYear();
                    const monthTransactions = transactions.filter(t => {
                      const d = new Date(t.vencimento);
                      return d.getMonth() === idx && d.getFullYear() === year && t.tipo === 'entrada';
                    });

                    const status = monthTransactions.length === 0 ? 'vazio' :
                                  monthTransactions.some(t => t.status === 'pago') ? 'pago' :
                                  monthTransactions.some(t => t.status === 'pendente' && new Date(t.vencimento) < new Date()) ? 'atrasado' : 'pendente';

                    return (
                      <div key={mes} className={cn(
                        "flex flex-col items-center p-2 rounded-xl border text-center transition-all",
                        status === 'pago' ? "bg-emerald-500/8 border-emerald-500/20" : 
                        status === 'atrasado' ? "bg-rose-500/8 border-rose-500/20" :
                        status === 'pendente' ? "bg-amber-500/8 border-amber-500/20" :
                        "bg-muted/20 border-border/30 opacity-40"
                      )}>
                        <span className="text-[9px] font-bold uppercase">{mes}</span>
                        <div className={cn(
                          "w-2 h-2 rounded-full my-1", 
                          status === 'pago' ? "bg-emerald-500" : 
                          status === 'atrasado' ? "bg-rose-500 animate-pulse" :
                          status === 'pendente' ? "bg-amber-500" :
                          "bg-muted-foreground/20"
                        )} />
                        <span className={cn(
                          "text-[8px] font-semibold uppercase", 
                          status === 'pago' ? "text-emerald-600" : 
                          status === 'atrasado' ? "text-rose-600" :
                          status === 'pendente' ? "text-amber-600" :
                          "text-muted-foreground/50"
                        )}>
                          {status === 'pago' ? "PAGO" : 
                           status === 'atrasado' ? "ATR." :
                           status === 'pendente' ? "PEND." : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "documentos" && (
            <div className="p-6">
              <LeadDocumentsTab leadId={leadId} leadName={leadName} />
            </div>
          )}
        </div>
      </div>

      {/* Modal de transação */}
      {showModal && (
        <TransacaoModal
          transaction={editingTransaction}
          onClose={() => { setShowModal(false); setEditingTransaction(undefined); }}
          onSave={handleSave}
          preFilledLeadId={leadId}
          preFilledLeadName={leadName}
        />
      )}
    </>
  );
}
