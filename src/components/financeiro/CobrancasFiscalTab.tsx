import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { 
  FileText, Receipt, RefreshCw, CheckCircle2, AlertCircle, 
  ExternalLink, Zap, Loader2, Mail, Download, Paperclip, 
  History, User, MoreVertical, Send, Check, X, Building2, Calendar, Phone, DollarSign,
  MessageSquare, Edit2, FilePlus, ChevronRight, MessageCircle
} from "lucide-react";
import { AsaasService } from "@/services/asaasService";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  id: number;
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
}

const CONTRATOS: Contrato[] = [];

const PIPELINE_STAGES = [
  { key: "novo", label: "Novo", color: "bg-slate-400" },
  { key: "qualificacao", label: "Qualif.", color: "bg-purple-500" },
  { key: "site_pronto", label: "Site", color: "bg-cyan-500" },
  { key: "atendimento", label: "Contato", color: "bg-amber-500" },
  { key: "reuniao", label: "Reunião", color: "bg-sky-500" },
  { key: "fechamento", label: "Fechamento", color: "bg-orange-500" },
  { key: "ganhou", label: "Contratado", color: "bg-emerald-500" },
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
  const [intStates, setIntStates] = useState<IntState[]>(
    integracoes.map(() => ({ ...defaultIntState(), connected: false, connectedProvider: "", apiKey: "" }))
  );
  
  const selectedClient = externalSelectedClient;
  const showTimeline = externalShowProfile;
  
  const handleOpenProfile = (client: any) => {
    // Delegate to the unified drawer in FinanceiroPage
    onProfileChange?.(true, client);
  };

  const handleCloseProfile = () => {
    onProfileChange?.(false, selectedClient);
  };
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const navigate = useNavigate();

  // Profile Tabs State
  const [activeProfileTab, setActiveProfileTab] = useState<"historico" | "whatsapp" | "documentos">("historico");


  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<any>(null);

  useEffect(() => {
    if (selectedClient) {
      setEditedClient(selectedClient);
    }
  }, [selectedClient]);

  const handleSaveProfile = () => {
    handleOpenProfile(editedClient);
    setIsEditing(false);
    toast.success("Perfil atualizado com sucesso!");
  };

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
        const mappedContratos: Contrato[] = leadsData.map((lead: any, index: number) => ({
          id: index + 10,
          clientId: `CL-${lead.id.substring(0, 3).toUpperCase()}`,
          cliente: lead.company_name || "Cliente Sem Nome",
          email: lead.email || "contato@empresa.com",
          telefone: lead.phone || "(11) 99999-9999",
          empresa: lead.company_name || "N/A",
          cpfCnpj: lead.documento || lead.cpf_cnpj || "",
          plano: lead.plano || "N/A",
          valor: lead.valor || 0,
          diaVencimento: 10,
          recorrencia: "mensal",
          ativo: lead.status !== "perdeu",
          proximoVencimento: lead.status === "ganhou" ? "10/05/2026" : "Pendente",
          ultimoEnvio: "N/A",
          status: lead.status === "ganhou" ? "pago" : "pendente",
          kanbanStage: lead.status || "novo",
          totalPago: lead.status === "ganhou" ? 12500 : 0,
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Profile is now handled by the unified ClientePerfilDrawer in FinanceiroPage */}
      <Dialog open={false} onOpenChange={handleCloseProfile}>
        <DialogContent className="max-w-[95vw] w-[1200px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-card">
          <DialogHeader className="sr-only">
            <DialogTitle>Perfil do Cliente: {selectedClient?.cliente || "Cliente"}</DialogTitle>
            <DialogDescription>Detalhes, histórico e ações para o cliente selecionado.</DialogDescription>
          </DialogHeader>
            {selectedClient && (
              <div className="max-h-[90vh] overflow-y-auto custom-scrollbar">
          {/* Profile Header Banner */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 border-b border-border/40 relative">
            <div className="absolute top-6 right-8 flex gap-2">
              <button 
                onClick={handleCloseProfile}
                className="bg-background/80 hover:bg-background border border-border/50 px-4 py-2 rounded-2xl transition-all shadow-sm group flex items-center gap-2"
                title="Fechar Perfil (Esc)"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground">FECHAR</span>
                <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-20 h-20 rounded-[2rem] bg-primary flex items-center justify-center border-4 border-background shadow-xl">
                <User className="text-white w-10 h-10" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-3xl font-black text-foreground tracking-tight">{selectedClient?.cliente || "Sem Nome"}</h2>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    CLIENTE ATIVO
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                  {isEditing ? (
                    <div className="flex flex-col gap-2 w-full max-w-md mt-2">
                      <Input 
                        value={editedClient?.empresa} 
                        onChange={(e) => setEditedClient({...editedClient, empresa: e.target.value})}
                        className="bg-background border-primary/20 h-8 text-xs font-bold"
                        placeholder="Nome da Empresa"
                      />
                      <div className="flex gap-2">
                        <Input 
                          value={editedClient?.email} 
                          onChange={(e) => setEditedClient({...editedClient, email: e.target.value})}
                          className="bg-background border-primary/20 h-8 text-xs font-bold"
                          placeholder="E-mail"
                        />
                        <Input 
                          value={editedClient?.telefone} 
                          onChange={(e) => setEditedClient({...editedClient, telefone: e.target.value})}
                          className="bg-background border-primary/20 h-8 text-xs font-bold"
                          placeholder="Telefone"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          value={editedClient?.plano} 
                          onChange={(e) => setEditedClient({...editedClient, plano: e.target.value})}
                          className="bg-background border-primary/20 h-8 text-xs font-bold"
                          placeholder="Plano"
                        />
                        <CurrencyInput 
                          value={editedClient?.valor || 0} 
                          onChange={(val) => setEditedClient({...editedClient, valor: val})}
                          className="bg-background border-primary/20 h-8 text-xs font-bold"
                          placeholder="Valor"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          value={editedClient?.cpfCnpj} 
                          onChange={(e) => setEditedClient({...editedClient, cpfCnpj: e.target.value})}
                          className="bg-background border-primary/20 h-8 text-xs font-bold w-full"
                          placeholder="CPF / CNPJ (Opcional)"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-[10px] font-black" onClick={handleSaveProfile}>SALVAR</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] font-black" onClick={() => setIsEditing(false)}>CANCELAR</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5"><Building2 size={14} className="text-primary/60" /> {selectedClient?.empresa || "N/A"}</span>
                      {selectedClient?.cpfCnpj && (
                        <span className="flex items-center gap-1.5"><FileText size={14} className="text-primary/60" /> {selectedClient.cpfCnpj}</span>
                      )}
                      <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary/60" /> Início: {selectedClient?.dataInicio || "N/A"}</span>
                      <span className="bg-muted px-2 py-0.5 rounded text-[10px] uppercase tracking-tighter">ID: {formatDisplayId(selectedClient?.clientId || selectedClient?.id)}</span>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 text-primary hover:underline ml-2"
                      >
                        <Edit2 size={12} /> Editar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Navigation Tabs */}
          <div className="flex px-8 border-b border-border/40 bg-muted/5">
            {[
              { id: "historico", label: "Histórico Unificado", icon: History },
              { id: "whatsapp", label: "WhatsApp Chat", icon: MessageSquare, badge: "LIVE" },
              { id: "documentos", label: "Documentos", icon: Paperclip },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveProfileTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-[11px] font-black uppercase tracking-widest transition-all relative",
                  activeProfileTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
                {tab.badge && (
                  <span className="ml-1 text-[8px] bg-primary text-white px-1.5 py-0.5 rounded-full animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left Column: Content based on Active Tab */}
            <div className="lg:col-span-7 border-r border-border/40 bg-muted/5">
              <div className="p-8">
                {activeProfileTab === "historico" && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <History size={16} className="text-primary" /> Timeline de Atividades
                      </h3>
                    </div>

                    <div className="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-primary/50 before:via-border before:to-border/20">
                      {(timelineEvents[selectedClient.clientId] || []).map((event) => (
                        <div key={event.id} className="relative group/item">
                          <div className={cn(
                            "absolute -left-[25px] top-1 w-5 h-5 rounded-full border-4 border-card z-10 transition-transform group-hover/item:scale-125 shadow-sm",
                            event.type === "payment" ? "bg-emerald-500" : 
                            event.type === "email" ? "bg-blue-500" :
                            event.type === "contract" ? "bg-purple-500" : "bg-slate-500"
                          )} />
                          <div className="space-y-2 bg-background/50 p-4 rounded-2xl border border-border/30 group-hover/item:border-primary/20 transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <p className="text-[14px] font-black text-foreground">{event.title}</p>
                                {event.type === "email" && (
                                  <button 
                                    onClick={() => setActiveProfileTab("whatsapp")}
                                    className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                                    title="Ver conversa relacionada"
                                  >
                                    <MessageCircle size={10} />
                                  </button>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{event.date}</span>
                            </div>
                            <p className="text-[12px] text-muted-foreground leading-relaxed font-medium">{event.description}</p>
                            {event.status && (
                              <div className="flex items-center gap-1.5 mt-2">
                                 <CheckCircle2 size={12} className="text-emerald-500" />
                                 <span className="text-[9px] font-black text-emerald-600 uppercase">Processado com sucesso</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Simulated CRM Integration Events */}
                      <div className="relative group/item opacity-60">
                         <div className="absolute -left-[25px] top-1 w-5 h-5 rounded-full border-4 border-card z-10 bg-indigo-500" />
                         <div className="space-y-2 bg-background/50 p-4 rounded-2xl border border-border/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <p className="text-[14px] font-black text-foreground">Kanban: Movido para Fechamento</p>
                                <button 
                                  onClick={() => setActiveProfileTab("whatsapp")}
                                  className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                                >
                                  <MessageCircle size={10} />
                                </button>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">10/04/2026</span>
                            </div>
                            <p className="text-[12px] text-muted-foreground leading-relaxed font-medium">Lead qualificado pela Malu e movido para etapa final do funil.</p>
                          </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeProfileTab === "whatsapp" && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-black text-foreground">Chat em Tempo Real</h3>
                        <p className="text-xs text-muted-foreground">Sincronizado via WhatsApp Business API</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase">Rafa S3 Online</span>
                      </div>
                    </div>

                    <div className="bg-background/80 rounded-3xl border border-emerald-500/20 overflow-hidden shadow-sm flex flex-col h-[500px]">
                      <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar bg-[url('https://w0.peakpx.com/wallpaper/580/678/HD-wallpaper-whatsapp-dark-pattern-background-grey-monochrome.jpg')] bg-repeat bg-center opacity-90">
                        <div className="flex flex-col items-start max-w-[85%]">
                          <div className="bg-card p-3.5 rounded-2xl rounded-tl-none text-[13px] font-medium text-foreground shadow-sm border border-border/40">
                            Olá {selectedClient?.cliente || "Cliente"}, tudo bem? Aqui é o Rafa da Torre S3. Vi que o contrato foi assinado!
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-1 ml-1 font-bold">10:45</span>
                        </div>
                        <div className="flex flex-col items-end w-full">
                          <div className="bg-emerald-600 text-white p-3.5 rounded-2xl rounded-tr-none text-[13px] font-medium max-w-[85%] shadow-md">
                            Olá Rafa! Sim, acabamos de assinar. Muito animados com o novo site!
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-1 mr-1 font-bold">10:48 · Lida</span>
                        </div>
                        <div className="flex flex-col items-start max-w-[85%]">
                          <div className="bg-card p-3.5 rounded-2xl rounded-tl-none text-[13px] font-medium text-foreground shadow-sm border border-border/40">
                            Show! Já estamos iniciando o setup aqui. Vou te enviar o primeiro boleto por e-mail agora.
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-1 ml-1 font-bold">10:50</span>
                        </div>
                        <div className="flex justify-center my-4">
                          <span className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black text-muted-foreground border border-border/40 uppercase tracking-widest">
                            Hoje
                          </span>
                        </div>
                        <div className="flex flex-col items-end w-full">
                          <div className="bg-emerald-600 text-white p-3.5 rounded-2xl rounded-tr-none text-[13px] font-medium max-w-[85%] shadow-md">
                            Perfeito! Algum prazo estimado para a primeira versão do design?
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-1 mr-1 font-bold">11:12 · Lida</span>
                        </div>
                      </div>
                      <div className="p-4 bg-muted/30 border-t border-border/40 flex gap-3">
                        <Input className="h-11 text-sm bg-background border-border/40 rounded-2xl px-5 focus-visible:ring-primary/20" placeholder="Digite sua mensagem..." />
                        <Button className="h-11 w-11 p-0 bg-emerald-500 hover:bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                          <Send size={18} className="text-white" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeProfileTab === "documentos" && (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                      <Paperclip size={16} className="text-primary" /> Repositório de Arquivos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: "Contrato_Servicos_Assinado.pdf", size: "2.4 MB", type: "PDF", date: "10/04/2026" },
                        { name: "Proposta_Comercial_V2.pdf", size: "1.8 MB", type: "PDF", date: "05/04/2026" },
                        { name: "Briefing_Identidade_Visual.docx", size: "850 KB", type: "DOCX", date: "02/04/2026" }
                      ].map((doc, i) => (
                        <div key={i} className="p-4 rounded-2xl border border-border/40 bg-background hover:border-primary/20 transition-all group cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-bold text-foreground truncate">{doc.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                <span>{doc.size}</span>
                                <span>•</span>
                                <span>{doc.date}</span>
                              </div>
                            </div>
                            <Download size={14} className="text-muted-foreground group-hover:text-primary" />
                          </div>
                        </div>
                      ))}
                      <button className="p-4 rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 transition-all flex flex-col items-center justify-center gap-2 bg-muted/5 group">
                        <FilePlus size={24} className="text-muted-foreground group-hover:text-primary" />
                        <span className="text-[11px] font-black uppercase text-muted-foreground group-hover:text-primary">Upload de Arquivo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Cards & Insights */}
            <div className="lg:col-span-5 p-8 space-y-6">
              {/* Kanban Integration Card: Robust Pipeline Progress */}
              <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/5 rounded-3xl p-6 border border-indigo-500/20">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Zap size={14} /> Progresso no Pipeline</div>
                  <Badge className="bg-indigo-500 text-white border-none font-black text-[9px] px-3">
                    REAL-TIME SYNC
                  </Badge>
                </h4>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xl font-black text-foreground capitalize">{selectedClient?.kanbanStage?.replace('_', ' ') || "N/A"}</p>
                      <p className="text-[11px] font-bold text-muted-foreground">Etapa atual do fechamento</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[9px] font-black text-indigo-600 hover:bg-indigo-500/10 h-7"
                      onClick={() => navigate('/pipeline')}
                    >
                      IR PARA KANBAN <ChevronRight size={12} className="ml-0.5" />
                    </Button>
                  </div>
                  
                  {/* Stepper Component */}
                  <div className="relative pt-2 pb-6 cursor-pointer hover:opacity-80 transition-all" onClick={() => navigate('/pipeline')}>
                     <div className="absolute top-[1.15rem] left-0 right-0 h-1 bg-muted rounded-full" />
                     <div className="relative flex justify-between">
                        {PIPELINE_STAGES.map((step, idx) => {
                          const currentIdx = PIPELINE_STAGES.findIndex(s => s.key === (selectedClient.kanbanStage === 'ganhou' ? 'ganhou' : selectedClient.kanbanStage === 'site_pronto' ? 'site_pronto' : 'novo'));
                          const isActive = idx <= currentIdx;
                          return (
                            <div key={step.key} className="flex flex-col items-center gap-2 z-10">
                               <div className={cn(
                                 "w-4 h-4 rounded-full border-4 border-card transition-all",
                                 isActive ? "bg-primary scale-125" : "bg-muted"
                               )} />
                               <span className={cn("text-[8px] font-black uppercase tracking-tighter", isActive ? "text-primary" : "text-muted-foreground")}>
                                 {step.label}
                               </span>
                            </div>
                          );
                        })}
                     </div>
                  </div>
                </div>
              </div>

              {/* Services & Done Card */}
              <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Receipt size={14} className="text-amber-500" /> Serviços Contratados
                </h4>
                <div className="space-y-2">
                   {[
                     { name: "Criação de Site Institucional", status: "Entregue", tab: "site" },
                     { name: "Licença de Software (SaaS)", status: "Ativo", tab: "saas" },
                     { name: "Hospedagem & Manutenção", status: "Ativo", tab: "hosting" }
                   ].map((s, i) => (
                     <button 
                       key={i} 
                       className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/10 hover:bg-primary/5 hover:border-primary/20 transition-all group/svc text-left"
                       onClick={() => navigate('/servicos')}
                     >
                        <span className="text-[12px] font-bold text-foreground group-hover/svc:text-primary transition-colors">{s.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-black">{s.status}</Badge>
                          <ChevronRight size={12} className="text-muted-foreground group-hover/svc:text-primary" />
                        </div>
                     </button>
                   ))}
                </div>
              </div>

              {/* Monthly Payment Grid - NEW */}
              <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} className="text-emerald-500" /> Fluxo de Mensalidades
                  </h4>
                  <Badge variant="outline" className="text-[8px] font-black uppercase border-emerald-500/20 text-emerald-600">2026</Badge>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO'].map((mes, idx) => {
                    const status = idx < 3 ? 'pago' : idx === 3 ? 'pago' : 'pendente';
                    return (
                      <div 
                        key={mes} 
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-xl border transition-all",
                          status === 'pago' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/30 border-border/40"
                        )}
                      >
                        <span className="text-[9px] font-black mb-1">{mes}</span>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          status === 'pago' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30"
                        )} />
                        <span className={cn("text-[7px] font-bold mt-1 uppercase", status === 'pago' ? "text-emerald-600" : "text-muted-foreground")}>
                          {status === 'pago' ? 'PAGO' : 'AGUARD.'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contracts & Proposals - NEW */}
              <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <FilePlus size={14} className="text-purple-500" /> Documentos & Propostas
                </h4>
                <div className="space-y-3">
                   <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-border/60 hover:border-primary/40 transition-all cursor-pointer group/doc">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                          <Paperclip size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-foreground">Anexar Novo Contrato</p>
                          <p className="text-[9px] text-muted-foreground">PDF, DOCX até 10MB</p>
                        </div>
                      </div>
                      <Plus size={16} className="text-muted-foreground group-hover/doc:text-primary" />
                   </div>
                   <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-border/60 hover:border-primary/40 transition-all cursor-pointer group/doc">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-foreground">Vincular Proposta</p>
                          <p className="text-[9px] text-muted-foreground">Importar do Módulo de Docs</p>
                        </div>
                      </div>
                      <Plus size={16} className="text-muted-foreground group-hover/doc:text-primary" />
                   </div>
                </div>
              </div>

              {/* Financial Dashboard Card */}
              <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <DollarSign size={14} className="text-primary" /> Resumo Financeiro
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-muted/20 p-3 rounded-2xl border border-border/20">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Total Pago</p>
                      <p className="text-lg font-black text-emerald-600">{formatBRL(selectedClient.totalPago || 0)}</p>
                   </div>
                   <div className="bg-muted/20 p-3 rounded-2xl border border-border/20">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">MRR Atual</p>
                      <p className="text-lg font-black text-primary">{formatBRL(selectedClient?.valor)}</p>
                   </div>
                </div>
                <div className="pt-2 border-t border-border/40 space-y-2">
                   <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground font-medium">Próximo Faturamento:</span>
                      <span className="font-bold text-foreground">{selectedClient?.proximoVencimento || "N/A"}</span>
                   </div>
                   <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground font-medium">Método Preferencial:</span>
                      <span className="font-bold text-foreground">Boleto Bancário (Asaas)</span>
                   </div>
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Mail size={14} className="text-blue-500" /> Dados de Contato
                </h4>
                <div className="space-y-3">
                   <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Mail size={16} />
                      </div>
                      <span className="font-bold text-foreground">{selectedClient?.email || "N/A"}</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Phone size={16} />
                      </div>
                      <span className="font-bold text-foreground">{selectedClient?.telefone || "N/A"}</span>
                   </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="rounded-2xl h-14 flex flex-col items-center justify-center gap-0.5 border-primary/20 hover:bg-primary/5 group"
                  onClick={() => selectedClient && handleAction(selectedClient, "boleto")}
                >
                  <Download className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Gerar Boleto</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-2xl h-14 flex flex-col items-center justify-center gap-0.5 border-blue-500/20 hover:bg-blue-500/5 group"
                  onClick={() => selectedClient && handleAction(selectedClient, "email")}
                >
                  <Send className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Enviar Email</span>
                </Button>
              </div>
            </div>
          </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Cobranças Recorrentes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <RefreshCw size={16} className={cn("text-muted-foreground", isSyncing && "animate-spin text-primary")} />
            Contratos e Cobranças
            {lastSync && <span className="text-[10px] font-medium text-muted-foreground/60 ml-2">Último sync: {lastSync}</span>}
          </h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl text-[11px] font-bold h-8 border-primary/20 hover:bg-primary/5 text-primary"
              onClick={fetchRealData}
              disabled={isSyncing}
            >
              {isSyncing ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
              Sincronizar API
            </Button>
            <Button variant="default" size="sm" className="rounded-xl text-[11px] font-bold h-8">
              <Plus className="w-3.5 h-3.5 mr-1" /> Novo Contrato
            </Button>
          </div>
        </div>
        
        <div className="rounded-3xl border border-border/40 bg-card overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-black">Cliente / ID</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-black">Plano / Valor</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-black">Status</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-black text-center">Ações Rápidas</th>
                <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-black text-right">Perfil</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((c, idx) => (
                <tr key={c.id} className="border-b border-border/20 hover:bg-muted/10 transition-all">
                  <td className="px-5 py-4">
                    <button 
                      onClick={() => handleOpenProfile(c)}
                      className="flex flex-col items-start group/name text-left hover:opacity-80 transition-all"
                    >
                      <span className="text-[13px] font-bold text-foreground group-hover/name:text-primary transition-colors">{c.cliente}</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase group-hover/name:text-primary/70 transition-colors">{c.clientId}</span>
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold text-foreground">{c.plano}</span>
                      <span className="text-[11px] text-primary font-bold">{formatBRL(c.valor)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge className={cn(
                      "text-[9px] uppercase font-black px-2 py-0.5 rounded-lg",
                      c.status === "pago" ? "bg-emerald-500/10 text-emerald-500" :
                      c.status === "atrasado" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleAction(c, "boleto")}
                        className="p-2 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all"
                        title="Gerar Boleto"
                        disabled={loadingAction === `${c.id}-boleto`}
                      >
                        {loadingAction === `${c.id}-boleto` ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      </button>
                      <button 
                        onClick={() => handleAction(c, "email")}
                        className="p-2 rounded-lg bg-blue-500/5 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                        title="Enviar por Email"
                        disabled={loadingAction === `${c.id}-email`}
                      >
                        {loadingAction === `${c.id}-email` ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                      </button>
                      <button 
                         onClick={() => handleAction(c, "contract")}
                        className="p-2 rounded-lg bg-purple-500/5 text-purple-500 hover:bg-purple-500 hover:text-white transition-all"
                        title="Anexar Contrato"
                      >
                        <Paperclip size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-xl text-[11px] font-black hover:bg-primary/10 hover:text-primary transition-all"
                      onClick={() => handleOpenProfile(c)}
                    >
                      VER TIMELINE <History size={14} className="ml-1.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
        <AlertCircle size={18} className="text-primary shrink-0" />
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
