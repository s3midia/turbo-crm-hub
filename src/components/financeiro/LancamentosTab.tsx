import React, { useState } from "react";
import {
  Plus, Search, Filter, FileSpreadsheet, Trash2, Check, Users, Calendar,
  ChevronDown, X, RefreshCw, Tag, ArrowUpCircle, ArrowDownCircle, Edit3 as Edit3Icon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: number;
  descricao: string;
  tipo: "entrada" | "saida";
  valor: number;
  dataLancamento: string;
  vencimento: string;
  recebimento?: string;
  lead: string;
  status: "pago" | "pendente" | "agendado";
  categoria: string;
  recorrencia: "unica" | "mensal" | "trimestral" | "anual";
  classificacao?: "recorrente" | "nao_recorrente";
}

const CATEGORIAS_ENTRADA = ["Software", "Web Design", "Consultoria", "Manutenção", "Licença", "Outros"];
const CATEGORIAS_SAIDA = ["Infraestrutura", "Marketing", "Salários", "Impostos", "Escritório", "Ferramentas", "Outros"];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, descricao: "Sistema personalizado para academia", tipo: "entrada", valor: 9979, dataLancamento: "20/12/2025", vencimento: "30/12/2025", recebimento: "30/12/2025", lead: "Clínica Academias 6", status: "pago", categoria: "Software", recorrencia: "unica", classificacao: "nao_recorrente" },
  { id: 2, descricao: "Criação de site", tipo: "entrada", valor: 3520, dataLancamento: "15/12/2025", vencimento: "24/12/2025", lead: "N/A", status: "pendente", categoria: "Web Design", recorrencia: "unica", classificacao: "nao_recorrente" },
  { id: 3, descricao: "Criação de sistema", tipo: "entrada", valor: 7400, dataLancamento: "10/12/2025", vencimento: "23/12/2025", recebimento: "23/12/2025", lead: "ANDREA OLIVEIRA LIMA", status: "pago", categoria: "Software", recorrencia: "unica", classificacao: "nao_recorrente" },
  { id: 4, descricao: "Criação de Site", tipo: "entrada", valor: 2577, dataLancamento: "12/12/2025", vencimento: "20/12/2025", recebimento: "20/12/2025", lead: "Giovanna", status: "pago", categoria: "Web Design", recorrencia: "unica", classificacao: "nao_recorrente" },
  { id: 5, descricao: "Plano Manutenção CRM", tipo: "entrada", valor: 1200, dataLancamento: "01/04/2026", vencimento: "05/04/2026", lead: "Clínica Academias 6", status: "pago", categoria: "Manutenção", recorrencia: "mensal", classificacao: "recorrente" },
  { id: 6, descricao: "API OpenAI - Usage", tipo: "saida", valor: 220, dataLancamento: "15/12/2025", vencimento: "19/12/2025", lead: "N/A", status: "pago", categoria: "Infraestrutura", recorrencia: "mensal" },
  { id: 7, descricao: "Hospedagem AWS", tipo: "saida", valor: 1450, dataLancamento: "10/12/2025", vencimento: "15/12/2025", lead: "N/A", status: "pago", categoria: "Infraestrutura", recorrencia: "mensal" },
  { id: 8, descricao: "Consultoria Marketing", tipo: "saida", valor: 3000, dataLancamento: "05/12/2025", vencimento: "10/12/2025", lead: "N/A", status: "pago", categoria: "Marketing", recorrencia: "mensal" },
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const recorrenciaLabel = { unica: "Única", mensal: "Mensal", trimestral: "Trimestral", anual: "Anual" };
const recorrenciaColor = { unica: "bg-muted text-muted-foreground", mensal: "bg-blue-500/10 text-blue-500", trimestral: "bg-violet-500/10 text-violet-500", anual: "bg-emerald-500/10 text-emerald-500" };

interface ModalProps {
  transaction?: Transaction;
  onClose: () => void;
  onSave: (t: Transaction) => void;
}

function TransacaoModal({ transaction, onClose, onSave }: ModalProps) {
  const [form, setForm] = useState({
    tipo: (transaction?.tipo ?? "entrada") as "entrada" | "saida",
    descricao: transaction?.descricao ?? "",
    valor: transaction?.valor?.toString() ?? "",
    dataLancamento: transaction?.dataLancamento ?? "",
    vencimento: transaction?.vencimento ?? "",
    recebimento: transaction?.recebimento ?? "",
    lead: transaction?.lead ?? "",
    categoria: transaction?.categoria ?? "",
    recorrencia: (transaction?.recorrencia ?? "unica") as Transaction["recorrencia"],
    status: (transaction?.status ?? "pendente") as Transaction["status"],
    classificacao: (transaction?.classificacao ?? "nao_recorrente") as "recorrente" | "nao_recorrente",
  });

  const categorias = form.tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  function handleSave() {
    if (!form.descricao || !form.valor || !form.vencimento) return;
    onSave({
      id: transaction?.id ?? Date.now(),
      descricao: form.descricao,
      tipo: form.tipo,
      valor: parseFloat(form.valor.replace(",", ".")),
      dataLancamento: form.dataLancamento || new Date().toLocaleDateString("pt-BR"),
      vencimento: form.vencimento,
      recebimento: form.recebimento || undefined,
      lead: form.lead || "N/A",
      status: form.status,
      categoria: form.categoria || categorias[0],
      recorrencia: form.recorrencia,
      classificacao: form.tipo === "entrada" ? form.classificacao : undefined,
    });
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

          <div className="col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Cliente / Lead</label>
            <input value={form.lead} onChange={e => setForm(f => ({ ...f, lead: e.target.value }))}
              className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Nome do cliente" />
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
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<"todos" | "entrada" | "saida">("todos");
  const [filterStatus, setFilterStatus] = useState<"todos" | "pago" | "pendente" | "agendado">("todos");
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();

  const filtered = transactions.filter(t => {
    const matchSearch = t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || t.lead.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === "todos" || t.tipo === filterTipo;
    const matchStatus = filterStatus === "todos" || t.status === filterStatus;
    return matchSearch && matchTipo && matchStatus;
  });

  const totals = {
    entradas: transactions.filter(t => t.tipo === "entrada" && t.status === "pago").reduce((s, t) => s + t.valor, 0),
    saidas: transactions.filter(t => t.tipo === "saida").reduce((s, t) => s + t.valor, 0),
    pendentes: transactions.filter(t => t.tipo === "entrada" && t.status === "pendente").reduce((s, t) => s + t.valor, 0),
  };

  function handleUpsertTransaction(t: Transaction) {
    setTransactions(prev => {
      const exists = prev.find(x => x.id === t.id);
      return exists ? prev.map(x => x.id === t.id ? t : x) : [t, ...prev];
    });
  }

  function handleMarkPaid(id: number) {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: "pago" } : t));
  }

  function handleDelete(id: number) {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  function openEdit(t: Transaction) {
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
                    <div className={cn("mt-0.5 w-2 h-2 rounded-full shrink-0", t.tipo === "entrada" ? "bg-emerald-500" : "bg-rose-500")} />
                    <div>
                      <p className="text-[13px] font-bold text-foreground">{t.descricao}</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenProfile) {
                            // Find the lead or create a mock lead from the name
                            onOpenProfile({ 
                              cliente: t.lead, 
                              clientId: `CL-${t.id + 100}`,
                              empresa: t.lead,
                              email: "contato@empresa.com",
                              status: "pago",
                              plano: "Plano Standard",
                              valor: t.valor
                            });
                          }
                        }}
                        className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-0.5 font-bold"
                      >
                        <Users size={10} /> {t.lead}
                        {t.classificacao && (
                          <span className={cn("ml-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase", t.classificacao === "recorrente" ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground")}>
                            {t.classificacao === "recorrente" ? "Recorrente" : "Não Recorrente"}
                          </span>
                        )}
                      </button>
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
                    {t.status === "pendente" && (
                      <button onClick={(e) => { e.stopPropagation(); handleMarkPaid(t.id); }} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-600 transition-all" title="Marcar como Pago">
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); openEdit(t); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Editar transação">
                      <Edit3Icon size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-all" title="Excluir">
                      <Trash2 size={14} />
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
