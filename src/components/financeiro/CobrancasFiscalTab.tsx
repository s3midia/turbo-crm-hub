import React, { useState, useEffect, useRef, useMemo } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { 
  FileText, Receipt, RefreshCw, CheckCircle2, AlertCircle, 
  Zap, Loader2, Mail, Download, Paperclip, 
  History, Send, Check, Building2, Calendar, DollarSign,
  FilePlus, ChevronRight, Search, Filter, AlertTriangle,
  TrendingUp, Users, Clock, CheckSquare, Square, Minus
} from "lucide-react";
import { AsaasService } from "@/services/asaasService";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";

import { formatBRL, formatDateTime, formatDisplayId } from "@/lib/formatters";
import { CurrencyInput } from "@/components/ui/currency-input";

interface TimelineEvent {
  id: string;
  type: "payment" | "email" | "contract" | "system";
  title: string;
  description: string;
  date: string;
  status?: "success" | "pending" | "error";
}

interface Contrato {
  id: string;
  clientId: string;
  cliente: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  cpfCnpj?: string;
  plano: string;
  valor: number;
  diaVencimento: number;
  recorrencia: "mensal" | "trimestral" | "anual";
  ativo: boolean;
  proximoVencimento: string;
  ultimoEnvio: string;
  status: "pago" | "pendente" | "atrasado";
  kanbanStage?: string;
  totalPago?: number;
  dataInicio?: string;
  id_seq?: number;
  localizacao: string;
}

const CONTRATOS: Contrato[] = [];

const PIPELINE_STAGES = [
  { key: "vendas_b2b", label: "Vendas B2B" },
  { key: "novo", label: "Novo" },
  { key: "kanban_ready", label: "Qualificados" },
  { key: "gerando_site", label: "Gerando Site" },
  { key: "site_pronto", label: "Site Pronto" },
  { key: "atendimento", label: "Em Atendimento" },
  { key: "qualificacao", label: "Qualificação" },
  { key: "agendado", label: "Agendado" },
  { key: "reuniao", label: "Reunião" },
  { key: "apresentacao", label: "Apresentação" },
  { key: "fechamento", label: "Fechamento" },
  { key: "ganhou", label: "Contratado" },
  { key: "perdeu", label: "Perdeu" },
];

const integracoes = [
  {
    nome: "Boleto Bancário",
    desc: "Emissão de boletos via Asaas ou Gerencianet",
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    providers: ["Asaas", "Gerencianet", "PJBank", "Inter Empresas"],
  },
  {
    nome: "Nota Fiscal Eletrônica (NF-e)",
    desc: "Emissão de NF-e via Focus NFe ou Plug Notas",
    icon: Receipt,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    providers: ["Focus NFe", "Plug Notas", "eNotas", "Nuvem Fiscal"],
  },
  {
    nome: "NFC-e (Cupom Fiscal)",
    desc: "Emissão de nota fiscal de consumidor eletrônica",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    providers: ["Focus NFe", "Nuvem Fiscal"],
  },
];

interface IntState {
  open: boolean;
  provider: string;
  apiKey: string;
  connected: boolean;
  connectedProvider: string;
  error: string;
  saving: boolean;
}

const defaultIntState = (): IntState => ({
  open: false,
  provider: "",
  apiKey: "",
  connected: false,
  connectedProvider: "",
  error: "",
  saving: false,
});

interface CobrancasFiscalTabProps {
  externalSelectedClient?: any | null;
  externalShowProfile?: boolean;
  onProfileChange?: (show: boolean, client?: any) => void;
}

export default function CobrancasFiscalTab({ 
  externalSelectedClient, 
  externalShowProfile, 
  onProfileChange 
}: CobrancasFiscalTabProps) {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [selectedClient, setSelectedClientLocal] = useState<any>(externalSelectedClient);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"todos" | "pago" | "pendente" | "atrasado">("todos");

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleOpenProfile = (client: any) => {
    onProfileChange?.(true, client);
  };

  const handleCloseProfile = () => {
    onProfileChange?.(false, selectedClient);
  };

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const navigate = useNavigate();

  // Email and Boleto States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showBoletoModal, setShowBoletoModal] = useState(false);
  const [isReviewingBoleto, setIsReviewingBoleto] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    subject: "",
    content: "",
    attachBoleto: true,
  });
  const [generatedBoleto, setGeneratedBoleto] = useState<{ url: string, barcode: string, date: string, value: number, client: string, cpfCnpj?: string } | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [timelineEvents, setTimelineEvents] = useState<Record<string, TimelineEvent[]>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Filtered & searched contratos
  const filteredContratos = useMemo(() => {
    return contratos.filter(c => {
      const matchesSearch = !searchQuery ||
        c.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.empresa || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.clientId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === "todos" || c.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [contratos, searchQuery, filterStatus]);

  // KPI metrics
  const kpis = useMemo(() => {
    const totalPendente = contratos.filter(c => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
    const totalAtrasado = contratos.filter(c => c.status === "atrasado").reduce((s, c) => s + c.valor, 0);
    const totalPago = contratos.filter(c => c.status === "pago").reduce((s, c) => s + c.valor, 0);
    const inadimplencia = contratos.length > 0
      ? Math.round((contratos.filter(c => c.status === "atrasado").length / contratos.length) * 100)
      : 0;
    return { totalPendente, totalAtrasado, totalPago, inadimplencia, total: contratos.length };
  }, [contratos]);

  // Batch helpers
  const allSelected = filteredContratos.length > 0 && filteredContratos.every(c => selectedIds.has(c.id));
  const someSelected = filteredContratos.some(c => selectedIds.has(c.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredContratos.map(c => c.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const fetchRealData = async () => {
    setIsSyncing(true);
    try {
      // Fetch leads from Supabase to act as our contracts
      const { data: leadsData, error: leadsError } = await (supabase as any)
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;

      if (leadsData && leadsData.length > 0) {
        const mappedContratos: Contrato[] = leadsData.map((lead: any) => ({
          id: lead.id,
          id_seq: lead.id_seq,
          clientId: `CL-${lead.id.substring(0, 4).toUpperCase()}`,
          cliente: lead.company_name || "Cliente Sem Nome",
          email: lead.email || "contato@empresa.com",
          telefone: lead.phone || "(11) 99999-9999",
          empresa: lead.company_name || "N/A",
          cpfCnpj: lead.documento || lead.cpf_cnpj || "",
          plano: lead.plano || "N/A",
          valor: lead.value || lead.total_value || 0,
          diaVencimento: 10,
          recorrencia: "mensal",
          ativo: lead.status !== "perdeu",
          proximoVencimento: lead.status === "ganhou" ? "10/05/2026" : "Pendente",
          ultimoEnvio: "N/A",
          status: lead.status === "ganhou" ? "pago" : "pendente",
          kanbanStage: lead.status || "novo",
          localizacao: lead.status === "ganhou" ? "Cliente > Ativo" : 
                       lead.status === "inativo" ? "Cliente > Inativo" :
                       `Kanban > ${PIPELINE_STAGES.find(s => s.key === lead.status)?.label || "Novo"}`,
          totalPago: lead.status === "ganhou" ? (lead.value || lead.total_value || 0) : 0,
          dataInicio: new Date(lead.created_at).toLocaleDateString("pt-BR")
        }));

        setContratos(prev => {
          // Merge with existing static data for demo purposes, or replace
          const existingIds = new Set(CONTRATOS.map(c => c.clientId));
          const newOnes = mappedContratos.filter(c => !existingIds.has(c.clientId));
          return [...CONTRATOS, ...newOnes];
        });
      }

      setLastSync(new Date().toLocaleTimeString("pt-BR"));
      toast.success("Dados sincronizados com o Portal de Integração (API)!");
    } catch (err) {
      console.error("Erro na sincronização:", err);
      toast.error("Falha ao sincronizar dados da API.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Integramos diretamente com a API do Asaas via Vercel Proxy
    // Não é mais necessário buscar da tabela api_manager pois as chaves estão no .env / Vercel
    fetchRealData(); // Initial sync
  }, []);

  function updateInt(i: number, patch: Partial<IntState>) {
    setIntStates(prev => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  const handleAction = async (contrato: Contrato, action: "boleto" | "email" | "contract") => {
    handleOpenProfile(contrato);
    
    if (action === "email") {
      setEmailConfig({
        subject: `Cobrança - ${contrato.plano} - ${contrato.cliente}`,
        content: `Olá ${contrato.cliente},\n\nSegue em anexo a cobrança referente ao seu plano ${contrato.plano} no valor de ${formatBRL(contrato.valor)}.\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\nEquipe Financeira`,
        attachBoleto: true,
      });
      setShowEmailModal(true);
      return;
    }

    if (action === "boleto") {
      // Garante que a data seja um formato válido DD/MM/YYYY
      let defaultDate = new Date().toLocaleDateString("pt-BR");
      if (contrato.proximoVencimento && contrato.proximoVencimento.includes("/")) {
        defaultDate = contrato.proximoVencimento;
      }
      
      setGeneratedBoleto({
        url: "#",
        barcode: "", 
        date: defaultDate,
        value: contrato.valor,
        client: contrato.cliente,
        cpfCnpj: contrato.cpfCnpj || "" 
      });
      setIsReviewingBoleto(true);
      setShowBoletoModal(true);
      return;
    }

    if (action === "contract") {
      toast.info("Funcionalidade de anexo de contrato em desenvolvimento.");
    }
  };

  const confirmSendEmail = async () => {
    if (!selectedClient) return;
    setLoadingAction(`${selectedClient.id}-email`);
    
    // Simulate SMTP Delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newEvent: TimelineEvent = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString("pt-BR"),
      status: "success",
      type: "email",
      title: "Email Enviado",
      description: `Cobrança enviada para o cliente ${selectedClient.cliente} com ${emailConfig.attachBoleto ? 'boleto anexo' : 'sem anexo'}.`
    };

    setTimelineEvents(prev => ({
      ...prev,
      [selectedClient.clientId]: [newEvent, ...(prev[selectedClient.clientId] || [])]
    }));

    toast.success("E-mail enviado com sucesso!");
    setShowEmailModal(false);
    setLoadingAction(null);
  };

  // Status badge config
  const statusConfig = {
    pago: { label: "Pago", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    pendente: { label: "Pendente", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    atrasado: { label: "Atrasado", icon: AlertTriangle, className: "bg-red-500/10 text-red-600 border-red-500/20 animate-pulse" },
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total de Clientes", value: String(kpis.total), sub: "contratos ativos", icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/8 border-indigo-500/15" },
          { label: "A Receber (Mês)", value: formatBRL(kpis.totalPendente), sub: "pendente de pagamento", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/8 border-amber-500/15" },
          { label: "Inadimplência", value: `${kpis.inadimplencia}%`, sub: `${contratos.filter(c => c.status === "atrasado").length} em atraso`, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/8 border-red-500/15" },
          { label: "Receita Recebida", value: formatBRL(kpis.totalPago), sub: "pagamentos confirmados", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/8 border-emerald-500/15" },
        ].map((k, i) => (
          <div key={i} className={cn("rounded-2xl p-4 border", k.bg)}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{k.label}</p>
              <k.icon size={14} className={k.color} />
            </div>
            <p className={cn("text-xl font-black", k.color)}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Search + Filter + Actions Bar ──────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, empresa ou ID..."
            className="w-full pl-9 pr-4 h-9 rounded-xl border border-border/40 bg-card text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(["todos", "pago", "pendente", "atrasado"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "h-9 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all",
                filterStatus === s
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              )}
            >{s}</button>
          ))}
        </div>

        {/* Sync + New */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="rounded-xl text-[11px] font-bold h-9 border-primary/20 hover:bg-primary/5 text-primary" onClick={fetchRealData} disabled={isSyncing}>
            {isSyncing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Sincronizar
          </Button>
          <Button size="sm" className="rounded-xl text-[11px] font-bold h-9">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Novo
          </Button>
        </div>
      </div>

      {/* ── Batch Action Bar (floats when items selected) ──────── */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-foreground text-background border border-foreground animate-in slide-in-from-top-2 duration-200">
          <span className="text-[12px] font-black">{selectedIds.size} selecionado{selectedIds.size > 1 ? "s" : ""}</span>
          <div className="flex-1" />
          <button onClick={() => { toast.info("Geração em lote em desenvolvimento"); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/10 hover:bg-background/20 text-[11px] font-bold transition-all">
            <Download size={12} /> Gerar Boletos
          </button>
          <button onClick={() => { toast.info("Envio em lote em desenvolvimento"); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/10 hover:bg-background/20 text-[11px] font-bold transition-all">
            <Mail size={12} /> Enviar E-mails
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="p-1.5 rounded-lg hover:bg-background/20 transition-all">
            <Minus size={14} />
          </button>
        </div>
      )}

      {/* ── Contracts Table ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-sm">
        {/* Skeleton loading */}
        {isSyncing && contratos.length === 0 ? (
          <div className="divide-y divide-border/20">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-4 h-4 rounded bg-muted" />
                <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-40" />
                  <div className="h-2 bg-muted rounded w-24" />
                </div>
                <div className="h-6 w-16 bg-muted rounded-lg" />
                <div className="h-8 w-28 bg-muted rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredContratos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
              <FileText size={24} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm font-bold text-foreground mb-1">
              {searchQuery || filterStatus !== "todos" ? "Nenhum resultado encontrado" : "Nenhum contrato ainda"}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {searchQuery ? `Tente buscar por outro termo.` : filterStatus !== "todos" ? `Não há clientes com status "${filterStatus}".` : "Clique em Sincronizar para importar dados ou adicione um novo contrato."}
            </p>
            {!searchQuery && filterStatus === "todos" && (
              <Button size="sm" className="mt-4 rounded-xl text-[11px] font-bold h-9" onClick={fetchRealData}>
                <RefreshCw size={13} className="mr-1.5" /> Sincronizar Agora
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground transition-colors">
                    {allSelected ? <CheckSquare size={15} className="text-primary" /> : someSelected ? <Minus size={15} /> : <Square size={15} />}
                  </button>
                </th>
                <th className="px-3 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-black">Cliente</th>
                <th className="px-3 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-black hidden md:table-cell">Onde está o lead</th>
                <th className="px-3 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-black">Plano / MRR</th>
                <th className="px-3 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-black">Status</th>
                <th className="px-3 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-black hidden lg:table-cell">Vencimento</th>
                <th className="px-3 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-black text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredContratos.map((c) => {
                const cfg = statusConfig[c.status] || statusConfig.pendente;
                const isSelected = selectedIds.has(c.id);
                return (
                  <tr key={c.id} className={cn("hover:bg-muted/10 transition-all group", isSelected && "bg-primary/3 hover:bg-primary/5")}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleOne(c.id)} className="text-muted-foreground hover:text-primary transition-colors">
                        {isSelected ? <CheckSquare size={15} className="text-primary" /> : <Square size={15} />}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => handleOpenProfile(c)} className="flex flex-col items-start text-left group/name">
                        <span className="text-[13px] font-semibold text-foreground group-hover/name:text-primary transition-colors leading-tight">{c.cliente}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{c.clientId}</span>
                      </button>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          c.localizacao.includes("Cliente") ? "bg-emerald-500" : "bg-amber-500"
                        )} />
                        <span className="text-[11px] text-muted-foreground font-bold">{c.localizacao}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted-foreground">{c.plano || "—"}</span>
                        <span className="text-[13px] font-bold text-foreground tabular-nums">{formatBRL(c.valor)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border", cfg.className)}>
                        <cfg.icon size={10} />
                        {cfg.label}
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <span className="text-[11px] text-muted-foreground font-medium">{c.proximoVencimento}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleAction(c, "boleto")} className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all opacity-60 group-hover:opacity-100" title="Gerar Boleto" disabled={loadingAction === `${c.id}-boleto`}>
                          {loadingAction === `${c.id}-boleto` ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        </button>
                        <button onClick={() => handleAction(c, "email")} className="p-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 text-muted-foreground transition-all opacity-60 group-hover:opacity-100" title="Enviar por E-mail" disabled={loadingAction === `${c.id}-email`}>
                          {loadingAction === `${c.id}-email` ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                        </button>
                        <button onClick={() => handleOpenProfile(c)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all opacity-60 group-hover:opacity-100" title="Ver Perfil Completo">
                          <History size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Table footer with count */}
        {filteredContratos.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/20 bg-muted/10">
            <span className="text-[10px] text-muted-foreground font-medium">
              {filteredContratos.length} de {contratos.length} contrato{contratos.length !== 1 ? "s" : ""}
              {lastSync && <span className="ml-2 opacity-60">· sync {lastSync}</span>}
            </span>
            {isSyncing && <Loader2 size={12} className="animate-spin text-primary" />}
          </div>
        )}
      </div>

      {/* ── Automation Notice ──────────────────────────────────── */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
        <AlertCircle size={16} className="text-primary shrink-0" />
        <div className="space-y-0.5">
          <p className="text-[12px] font-bold text-foreground">Automação Inteligente</p>
          <p className="text-[11px] text-muted-foreground">
            O sistema monitora vencimentos e envia lembretes automáticos 3 dias antes do vencimento via Email e WhatsApp.
          </p>
        </div>
      </div>
      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Enviar Cobrança por E-mail</DialogTitle>
            <DialogDescription className="text-xs">
              Personalize a mensagem que será enviada para <strong>{selectedClient?.cliente}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assunto</Label>
              <Input 
                id="subject" 
                value={emailConfig.subject} 
                onChange={(e) => setEmailConfig(prev => ({ ...prev, subject: e.target.value }))}
                className="rounded-xl border-border/40 text-sm font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Corpo do E-mail</Label>
              <Textarea 
                id="content" 
                rows={6}
                value={emailConfig.content} 
                onChange={(e) => setEmailConfig(prev => ({ ...prev, content: e.target.value }))}
                className="rounded-xl border-border/40 text-sm font-medium resize-none"
              />
            </div>
            <div className="flex items-center space-x-2 bg-primary/5 p-3 rounded-2xl border border-primary/10">
              <Checkbox 
                id="attach" 
                checked={emailConfig.attachBoleto} 
                onCheckedChange={(checked) => setEmailConfig(prev => ({ ...prev, attachBoleto: !!checked }))}
              />
              <Label htmlFor="attach" className="text-[11px] font-bold text-primary flex items-center gap-2 cursor-pointer">
                <Paperclip size={12} /> Anexar Boleto Gerado Automaticamente
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-2xl font-bold" onClick={() => setShowEmailModal(false)}>Cancelar</Button>
            <Button 
              className="rounded-2xl font-black px-8 shadow-lg shadow-primary/20" 
              onClick={confirmSendEmail}
              disabled={loadingAction?.includes("email")}
            >
              {loadingAction?.includes("email") ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
              ENVIAR AGORA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boleto Modal with Review Step */}
      <Dialog open={showBoletoModal} onOpenChange={setShowBoletoModal}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-card">
          {isReviewingBoleto ? (
            <div className="flex flex-col h-full">
              <div className="bg-primary/10 p-8 border-b border-primary/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Conferir Dados</h2>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Passo 1 de 2: Revisão</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor da Cobrança</Label>
                      <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <CurrencyInput 
                          value={generatedBoleto?.value || 0}
                          onChange={(val) => setGeneratedBoleto(prev => prev ? { ...prev, value: val } : null)}
                          className="pl-2 rounded-xl border-border/40 font-bold h-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data de Vencimento</Label>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          value={generatedBoleto?.date}
                          onChange={(e) => setGeneratedBoleto(prev => prev ? { ...prev, date: e.target.value } : null)}
                          className="pl-9 rounded-xl border-border/40 font-bold"
                          placeholder="DD/MM/AAAA"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cliente / Sacado</Label>
                      <Input 
                        value={generatedBoleto?.client}
                        onChange={(e) => setGeneratedBoleto(prev => prev ? { ...prev, client: e.target.value } : null)}
                        className="rounded-xl border-border/40 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">CPF / CNPJ</Label>
                      <Input 
                        value={generatedBoleto?.cpfCnpj || ""}
                        onChange={(e) => setGeneratedBoleto(prev => prev ? { ...prev, cpfCnpj: e.target.value } : null)}
                        placeholder="Somente números"
                        className="rounded-xl border-border/40 font-bold"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 items-start">
                    <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                      Ao clicar em gerar, o sistema irá processar o boleto no gateway configurado (Asaas) e criar a linha digitável para pagamento. É obrigatório informar CPF/CNPJ válido.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" className="flex-1 rounded-2xl font-bold h-12" onClick={() => setShowBoletoModal(false)}>
                    CANCELAR
                  </Button>
                  <Button 
                    className="flex-1 rounded-2xl font-black h-12 shadow-lg shadow-primary/30" 
                    onClick={async () => {
                      try {
                        setLoadingAction("generating-final");
                        
                        toast.loading("Comunicando com Asaas via Proxy...");
                        
                        // 2. Initialize Service (A chave está protegida no servidor Vercel)
                        const asaas = new AsaasService();

                        if (!generatedBoleto?.cpfCnpj) {
                          toast.error("Obrigatório: Preencha o CPF ou CNPJ do cliente para emitir o boleto.");
                          setLoadingAction(null);
                          return;
                        }

                        // 3. Find or Create Customer
                        const customerId = await asaas.findOrCreateCustomer(
                          generatedBoleto?.client || selectedClient?.cliente,
                          selectedClient?.email || "contato@cliente.com",
                          selectedClient?.telefone,
                          generatedBoleto?.cpfCnpj
                        );

                        // 4. Create Payment
                        const payment = await asaas.createBoleto(
                          customerId,
                          generatedBoleto?.value || 0,
                          generatedBoleto?.date || "",
                          `Fatura Turbo CRM - ${selectedClient?.plano}`
                        );

                        setGeneratedBoleto(prev => prev ? {
                          ...prev,
                          url: payment.bankSlipUrl,
                          barcode: payment.identificationField || "Aguardando registro bancário (CIP)... Acesse o Boleto Oficial abaixo para copiar."
                        } : null);
                        
                        const newEvent: TimelineEvent = {
                          id: payment.id,
                          date: new Date().toLocaleDateString("pt-BR"),
                          status: "success",
                          type: "payment",
                          title: "Boleto Real Gerado (Asaas)",
                          description: `Boleto ID ${payment.id} no valor de ${formatBRL(generatedBoleto?.value || 0)} gerado via API.`
                        };

                        if (selectedClient) {
                          setTimelineEvents(prev => ({
                            ...prev,
                            [selectedClient.clientId]: [newEvent, ...(prev[selectedClient.clientId] || [])]
                          }));
                        }

                        setIsReviewingBoleto(false);
                        toast.dismiss();
                        toast.success("Boleto gerado com sucesso via Asaas!");
                      } catch (error: any) {
                        console.error("Erro Asaas:", error);
                        toast.dismiss();
                        toast.error(`Falha na API Asaas: ${error.message}`);
                      } finally {
                        setLoadingAction(null);
                      }
                    }}
                    disabled={loadingAction === "generating-final"}
                  >
                    {loadingAction === "generating-final" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
                    GERAR BOLETO REAL
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-primary p-8 text-white">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <Badge className="bg-white/20 text-white border-none text-[10px] uppercase font-black tracking-widest">BOLETO PRONTO</Badge>
                </div>
                <h2 className="text-2xl font-black mb-1">{generatedBoleto?.client}</h2>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{selectedClient?.plano}</p>
              </div>
              <div className="p-8 bg-card space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Valor</p>
                    <p className="text-xl font-black text-foreground">{generatedBoleto && formatBRL(generatedBoleto.value)}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vencimento</p>
                    <p className="text-xl font-black text-primary">{generatedBoleto?.date}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Linha Digitável / PIX</p>
                  <div className="bg-muted/50 p-3 rounded-xl border border-border/40 font-mono text-[11px] break-all leading-relaxed">
                    {generatedBoleto?.barcode}
                  </div>
                  {generatedBoleto?.barcode && !generatedBoleto.barcode.includes("Aguardando") && (
                    <Button variant="ghost" size="sm" className="w-full text-[10px] font-black h-8 gap-2" onClick={() => {
                      navigator.clipboard.writeText(generatedBoleto?.barcode || "");
                      toast.success("Código copiado!");
                    }}>
                      COPIAR CÓDIGO DE BARRAS
                    </Button>
                  )}
                </div>

                {/* Off-screen Invoice for PDF Generation (must be in DOM but not visible to user) */}
                <div className="fixed top-0 left-[-9999px] pointer-events-none">
                  <div ref={invoiceRef} className="p-10 bg-white text-slate-900 w-[800px] font-sans">
                    <div className="flex justify-between items-start border-b-2 border-primary pb-8 mb-8">
                      <div>
                        <h1 className="text-4xl font-black text-primary tracking-tighter">TURBO CRM</h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Hub de Gestão Financeira</p>
                      </div>
                      <div className="text-right">
                        <h2 className="text-xl font-black uppercase">Fatura / Boleto</h2>
                        <p className="text-sm font-medium text-slate-500">#{Math.floor(Math.random() * 1000000)}</p>
                        <p className="text-sm font-medium text-slate-500">Emitido em: {new Date().toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-10">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sacado (Cliente)</p>
                        <p className="text-lg font-black text-slate-800">{generatedBoleto?.client}</p>
                        <p className="text-sm text-slate-500 font-medium">Contrato: {selectedClient?.clientId || "N/A"}</p>
                        <p className="text-sm text-slate-500 font-medium">Plano: {selectedClient?.plano || "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pagamento</p>
                        <p className="text-2xl font-black text-primary">{formatBRL(generatedBoleto?.value || 0)}</p>
                        <p className="text-sm font-bold text-slate-800">Vencimento: {generatedBoleto?.date}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Instruções de Pagamento</p>
                      <ul className="text-xs text-slate-600 space-y-2 font-medium">
                        <li>• Pagável em qualquer agência bancária ou casa lotérica até o vencimento.</li>
                        <li>• Após o vencimento, cobrar multa de 2% e juros de 1% ao mês.</li>
                        <li>• Não receber após 30 dias do vencimento.</li>
                      </ul>
                    </div>

                    <div className="border-2 border-slate-900 p-6 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Código de Barras / Linha Digitável</p>
                      <p className="font-mono text-sm font-bold tracking-wider mb-4">{generatedBoleto?.barcode}</p>
                      <div className="h-16 bg-slate-900 w-full rounded flex items-center justify-center">
                        <div className="w-[90%] h-8 bg-white flex gap-1 px-2">
                           {Array.from({length: 40}).map((_, i) => (
                             <div key={i} className="flex-1 bg-black" style={{ width: Math.random() > 0.5 ? '2px' : '4px' }} />
                           ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Autenticação Mecânica • Turbo CRM Hub</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 rounded-2xl font-black h-12 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground" 
                    onClick={() => {
                      if (generatedBoleto?.url && generatedBoleto.url !== "#") {
                        window.open(generatedBoleto.url, "_blank");
                        toast.success("Boleto oficial aberto em nova guia!");
                      } else {
                        toast.error("Link do boleto não disponível.");
                      }
                    }}
                  >
                    <Download size={16} className="mr-2" />
                    VER BOLETO OFICIAL (ASAAS)
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-2xl font-black h-12" onClick={() => {
                    setShowBoletoModal(false);
                    if (selectedClient) {
                      handleAction(selectedClient, "email");
                    }
                  }}>
                    <Send size={16} className="mr-2" /> ENVIAR EMAIL
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Plus = ({ size, className, ...props }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className} 
    {...props}
  >
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
);
