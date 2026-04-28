import React, { useState, useEffect } from "react";
import { 
  FileText, Receipt, RefreshCw, CheckCircle2, AlertCircle, 
  ExternalLink, Zap, Loader2, Mail, Download, Paperclip, 
  History, User, MoreVertical, Send, Check
} from "lucide-react";
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

function formatBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

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
  clientId: string; // Added Unique ID
  cliente: string;
  plano: string;
  valor: number;
  diaVencimento: number;
  recorrencia: "mensal" | "trimestral" | "anual";
  ativo: boolean;
  proximoVencimento: string;
  ultimoEnvio: string;
  status: "pago" | "pendente" | "atrasado";
}

const CONTRATOS: Contrato[] = [
  { id: 1, clientId: "CL-001", cliente: "Clínica Academias 6", plano: "Plano Manutenção CRM", valor: 1200, diaVencimento: 5, recorrencia: "mensal", ativo: true, proximoVencimento: "05/05/2026", ultimoEnvio: "05/04/2026", status: "pago" },
  { id: 2, clientId: "CL-002", cliente: "ANDREA OLIVEIRA", plano: "Licença Anual Sistema", valor: 4800, diaVencimento: 15, recorrencia: "anual", ativo: true, proximoVencimento: "15/12/2026", ultimoEnvio: "15/12/2025", status: "pendente" },
  { id: 3, clientId: "CL-003", cliente: "Giovanna Martins", plano: "Hospedagem + Suporte", valor: 350, diaVencimento: 20, recorrencia: "mensal", ativo: false, proximoVencimento: "Pausado", ultimoEnvio: "20/03/2026", status: "atrasado" },
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

export default function CobrancasFiscalTab() {
  const [contratos, setContratos] = useState(CONTRATOS);
  const [intStates, setIntStates] = useState<IntState[]>(integracoes.map(defaultIntState));
  const [selectedClient, setSelectedClient] = useState<Contrato | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Simulation of timeline events
  const [timelineEvents, setTimelineEvents] = useState<Record<string, TimelineEvent[]>>({
    "CL-001": [
      { id: "1", type: "payment", title: "Pagamento Confirmado", description: "Mensalidade Abril/2026", date: "05/04/2026", status: "success" },
      { id: "2", type: "email", title: "Email Enviado", description: "Boleto de Abril enviado para cliente", date: "01/04/2026", status: "success" },
      { id: "3", type: "contract", title: "Contrato Anexado", description: "Contrato_Manutencao_V2.pdf", date: "10/01/2026" },
    ],
    "CL-002": [
      { id: "4", type: "system", title: "Cobrança Gerada", description: "Licença Anual 2026", date: "15/12/2025" },
    ]
  });

  useEffect(() => {
    async function loadIntegrations() {
      const { data, error } = await (supabase as any)
        .from("api_manager")
        .select("*")
        .eq("category", "cobranca");

      if (error) {
        console.error("Erro ao carregar integrações:", error);
        return;
      }

      if (data && data.length > 0) {
        setIntStates(prev =>
          prev.map((s, i) => {
            const saved = data.find((d: any) => d.name === integracoes[i].nome);
            if (saved) {
              return {
                ...s,
                connected: saved.status === "stable",
                connectedProvider: saved.url ?? "",
                apiKey: saved.api_key ?? "",
              };
            }
            return s;
          })
        );
      }
    }
    loadIntegrations();
  }, []);

  function updateInt(i: number, patch: Partial<IntState>) {
    setIntStates(prev => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  const handleAction = async (contrato: Contrato, action: "boleto" | "email" | "contract") => {
    setLoadingAction(`${contrato.id}-${action}`);
    
    // Simulate API Delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newEvent: TimelineEvent = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString("pt-BR"),
      status: "success",
      type: action === "boleto" ? "payment" : action === "email" ? "email" : "contract",
      title: action === "boleto" ? "Boleto Gerado" : action === "email" ? "Email Enviado" : "Documento Anexado",
      description: action === "boleto" ? `Boleto no valor de ${formatBRL(contrato.valor)} gerado via ${intStates[0].connectedProvider || 'Sistema'}` : 
                   action === "email" ? `Cobranca enviada para o cliente ${contrato.cliente}` :
                   `Contrato de ${contrato.plano} anexado ao perfil.`
    };

    setTimelineEvents(prev => ({
      ...prev,
      [contrato.clientId]: [newEvent, ...(prev[contrato.clientId] || [])]
    }));

    toast.success(`${newEvent.title} com sucesso!`);
    setLoadingAction(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Section with Profile Info if selected */}
      {selectedClient && showTimeline && (
        <div className="bg-card border border-primary/20 rounded-3xl p-6 mb-6 shadow-lg animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="text-primary w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">{selectedClient.cliente}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                    ID: {selectedClient.clientId}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                    selectedClient.status === "pago" ? "bg-emerald-500/10 text-emerald-500" :
                    selectedClient.status === "atrasado" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {selectedClient.status}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowTimeline(false)}
              className="text-xs font-bold text-muted-foreground hover:text-foreground p-2"
            >
              Fechar Perfil
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Timeline Column */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <History size={14} /> Linha do Tempo
              </h3>
              <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/50">
                {(timelineEvents[selectedClient.clientId] || []).map((event) => (
                  <div key={event.id} className="relative">
                    <div className={cn(
                      "absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-background",
                      event.type === "payment" ? "bg-emerald-500" : 
                      event.type === "email" ? "bg-blue-500" :
                      event.type === "contract" ? "bg-purple-500" : "bg-slate-500"
                    )} />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-bold text-foreground">{event.title}</p>
                        <span className="text-[10px] text-muted-foreground font-medium">{event.date}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions & Details */}
            <div className="space-y-4">
               <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Zap size={14} /> Detalhes do Contrato
              </h3>
              <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Plano Atual:</span>
                  <span className="font-bold">{selectedClient.plano}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Valor Mensal:</span>
                  <span className="font-bold text-primary">{formatBRL(selectedClient.valor)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Dia Vencimento:</span>
                  <span className="font-bold">Todo dia {selectedClient.diaVencimento}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="rounded-xl h-12 flex flex-col items-center justify-center gap-1 border-primary/20 hover:bg-primary/5"
                  onClick={() => handleAction(selectedClient, "boleto")}
                  disabled={loadingAction?.includes("boleto")}
                >
                  {loadingAction === `${selectedClient.id}-boleto` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-primary" />}
                  <span className="text-[10px] font-bold">Gerar Boleto</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-xl h-12 flex flex-col items-center justify-center gap-1 border-blue-500/20 hover:bg-blue-500/5"
                  onClick={() => handleAction(selectedClient, "email")}
                  disabled={loadingAction?.includes("email")}
                >
                  {loadingAction === `${selectedClient.id}-email` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-blue-500" />}
                  <span className="text-[10px] font-bold">Enviar Email</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-xl h-12 flex flex-col items-center justify-center gap-1 border-purple-500/20 hover:bg-purple-500/5"
                  onClick={() => handleAction(selectedClient, "contract")}
                >
                  <Paperclip className="w-4 h-4 text-purple-500" />
                  <span className="text-[10px] font-bold">Anexar Contrato</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-xl h-12 flex flex-col items-center justify-center gap-1 border-emerald-500/20 hover:bg-emerald-500/5"
                >
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold">Marcar Pago</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centralized Integrations CTA */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-blue-500/5 border border-primary/20 rounded-3xl p-6 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
          <Zap size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <Zap size={20} className="text-primary animate-pulse" />
              Gestão Centralizada de Integrações
            </h3>
            <p className="text-sm text-muted-foreground max-w-xl">
              As configurações de <strong>Boleto Bancário</strong>, <strong>NF-e</strong> e <strong>Gateways de Pagamento</strong> foram movidas para o painel central de integrações para maior segurança e controle global.
            </p>
          </div>
          <Button 
            className="rounded-2xl px-8 font-black shadow-lg shadow-primary/20 h-12"
            onClick={() => window.location.href = '/integracoes'}
          >
            CONFIGURAR AGORA <ExternalLink size={16} className="ml-2" />
          </Button>
        </div>
      </div>

      {/* Cobranças Recorrentes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <RefreshCw size={16} className="text-muted-foreground" />
            Contratos e Cobranças
          </h3>
          <Button variant="outline" size="sm" className="rounded-xl text-[11px] font-bold h-8">
            <Plus className="w-3.5 h-3.5 mr-1" /> Novo Contrato
          </Button>
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
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-foreground">{c.cliente}</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">{c.clientId}</span>
                    </div>
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
                      onClick={() => {
                        setSelectedClient(c);
                        setShowTimeline(true);
                      }}
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
