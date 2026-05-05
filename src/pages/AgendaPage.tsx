import React, { useState, useMemo } from "react";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, 
  DollarSign, Clock, Video, AlertTriangle, CheckCircle2, 
  Wallet, RefreshCw, Zap, Briefcase, Plus, Settings, MapPin, 
  PanelRightClose, PanelRightOpen, ArrowRight, Smartphone, Mail, Globe, AlignLeft, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL } from "@/lib/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

// --- Componente do Botão do Google ---
const GoogleButtonLogic = ({ googleConnected, setGoogleConnected, onEventsFetched }: { googleConnected: boolean, setGoogleConnected: (v: boolean) => void, onEventsFetched: (events: any[]) => void }) => {
  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      console.log('Login Success:', codeResponse);
      setGoogleConnected(true);
      
      try {
        // Fetch real events from Google Calendar
        const timeMin = new Date();
        timeMin.setDate(1); // Inicio do mes
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&maxResults=50&singleEvents=true&orderBy=startTime`, {
          headers: {
            Authorization: `Bearer ${codeResponse.access_token}`
          }
        });
        const data = await response.json();
        if (data.items) {
          onEventsFetched(data.items);
        }
      } catch (err) {
        console.error("Erro ao buscar eventos do Google Calendar:", err);
      }
    },
    onError: (error) => console.log('Login Failed:', error),
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
  });

  return (
    <Button 
      variant={googleConnected ? "outline" : "default"} 
      size="sm" 
      className={cn(
        "rounded-xl font-bold transition-all",
        !googleConnected && "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
        googleConnected && "border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
      )}
      onClick={() => !googleConnected ? login() : setGoogleConnected(false)}
    >
      {googleConnected ? <><CheckCircle2 size={14} className="mr-1.5" /> Conectado</> : "Conectar"}
    </Button>
  );
};

// --- Tipos de Eventos ---
type FilterMode = "all" | "meetings" | "finance";
type EventType = "meeting" | "task" | "finance_in" | "finance_out" | "finance_overdue";

interface AgendaEvent {
  id: string;
  day: number;
  title: string;
  type: EventType;
  time?: string;
  value?: number;
  client?: string;
  status?: string;
  location?: string;
  description?: string;
}

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function AgendaPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [filter, setFilter] = useState<FilterMode>("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [appleConnected, setAppleConnected] = useState(false);
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);

  // Form State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<EventType>("meeting");
  const [newEventDay, setNewEventDay] = useState(now.getDate());
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventClient, setNewEventClient] = useState("");
  const [newEventValue, setNewEventValue] = useState("");

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  // --- Mock Data turned into state ---
  const [events, setEvents] = useState<AgendaEvent[]>([
    { id: "1", day: 5, title: "Reunião de Kickoff", type: "meeting", time: "10:00 - 11:30", client: "Acme Corp", location: "Google Meet", description: "Alinhamento inicial do projeto e definição de cronogramas." },
    { id: "2", day: 5, title: "Fatura Mensal", type: "finance_in", value: 5000, client: "Acme Corp", status: "Pago", description: "Referente ao desenvolvimento do portal institucional." },
    { id: "3", day: 10, title: "Mensalidade Gestão", type: "finance_in", value: 3500, client: "TechFlow" },
    { id: "4", day: 10, title: "Pagamento Atrasado", type: "finance_overdue", value: 1200, client: "Loja Silva", description: "Entrar em contato com o financeiro da Loja Silva para negociação." },
    { id: "5", day: 12, title: "Apresentação de Layout", type: "meeting", time: "14:30 - 15:30", client: "Mega Imports", location: "Av. Paulista, 1000 - São Paulo, SP", description: "Apresentação presencial do protótipo de alta fidelidade." },
    { id: "6", day: 15, title: "Impostos (DAS)", type: "finance_out", value: 850 },
    { id: "7", day: 20, title: "Faturamento Final", type: "finance_in", value: 12000, client: "Global Tech" },
    { id: "8", day: 22, title: "Revisão Contratual", type: "task", time: "16:00" },
  ]);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: AgendaEvent = {
      id: Math.random().toString(36).substr(2, 9),
      day: newEventDay,
      title: newEventTitle,
      type: newEventType,
      time: newEventTime || undefined,
      client: newEventClient || undefined,
      value: newEventValue ? parseFloat(newEventValue) : undefined,
    };
    setEvents([...events, newEvent]);
    setIsNewEventOpen(false);
    // Reset Form
    setNewEventTitle("");
    setNewEventType("meeting");
    setNewEventDay(now.getDate());
    setNewEventTime("");
    setNewEventClient("");
    setNewEventValue("");
  };

  const handleGoogleEventsFetched = (googleItems: any[]) => {
    const converted: AgendaEvent[] = googleItems.map(item => {
       const startStr = item.start.dateTime || item.start.date;
       const dateObj = new Date(startStr);
       return {
         id: item.id,
         day: dateObj.getDate(),
         title: item.summary || "Evento Google",
         type: "meeting",
         time: item.start.dateTime ? dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Dia Inteiro",
         location: item.location,
         description: item.description,
       };
    });
    // Add to existing events avoiding duplicates by ID
    setEvents(prev => {
      const existingIds = new Set(prev.map(e => e.id));
      const novos = converted.filter(c => !existingIds.has(c.id));
      return [...prev, ...novos];
    });
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    if (filter === "meetings") return events.filter(e => e.type === "meeting" || e.type === "task");
    if (filter === "finance") return events.filter(e => e.type.startsWith("finance"));
    return events;
  }, [filter, events]);

  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  // Totais Rápidos do Mês (só de exemplo visual)
  const totalReceitas = events.filter(e => e.type === "finance_in").reduce((acc, curr) => acc + (curr.value || 0), 0);
  const totalAtrasado = events.filter(e => e.type === "finance_overdue").reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-500">
      {/* HEADER PRINCIPAL */}
      <div className="px-8 py-6 border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <CalendarIcon size={20} />
            </div>
            Agenda Hub
          </h1>
          <p className="text-sm font-semibold text-muted-foreground mt-1">Seu centro de previsibilidade e compromissos.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-2 rounded-2xl border border-border/40">
            <Button 
              variant={filter === "all" ? "default" : "ghost"} 
              size="sm" 
              className={cn("rounded-xl text-xs font-bold transition-all", filter === "all" && "shadow-md")}
              onClick={() => setFilter("all")}
            >
              <Zap size={14} className="mr-2" /> Visão Geral
            </Button>
            <Button 
              variant={filter === "meetings" ? "default" : "ghost"} 
              size="sm" 
              className={cn("rounded-xl text-xs font-bold transition-all", filter === "meetings" && "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20")}
              onClick={() => setFilter("meetings")}
            >
              <Video size={14} className="mr-2" /> Compromissos
            </Button>
            <Button 
              variant={filter === "finance" ? "default" : "ghost"} 
              size="sm" 
              className={cn("rounded-xl text-xs font-bold transition-all", filter === "finance" && "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20")}
              onClick={() => setFilter("finance")}
            >
              <Wallet size={14} className="mr-2" /> Financeiro
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            className={cn("rounded-xl transition-colors", isSidebarOpen ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground")}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Alternar Painel Lateral"
          >
            {isSidebarOpen ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden bg-muted/10 p-6 gap-6">
        
        {/* CALENDÁRIO MAIN (Mês) */}
        <div className="flex-1 flex flex-col min-w-0 bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b border-border/50 gap-4 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="h-7 w-7 rounded-lg hover:bg-background shadow-sm"><ChevronLeft size={14} /></Button>
                <span className="w-28 text-center text-[13px] font-black text-foreground tracking-tight">
                  {MONTHS[month]} <span className="text-primary">{year}</span>
                </span>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7 rounded-lg hover:bg-background shadow-sm"><ChevronRight size={14} /></Button>
              </div>

              {/* Previsibilidade ao lado do Mês (Botões Destacados) */}
              {filter !== "meetings" && (
                <div className="flex items-center gap-3 hidden lg:flex">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00E676] text-slate-900 font-black shadow-sm border border-[#00C853]/50">
                    <DollarSign size={14} className="opacity-70" />
                    <span className="text-xs tracking-tight">Receitas: {formatBRL(totalReceitas)}</span>
                  </div>
                  {totalAtrasado > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF3D00] text-white font-black shadow-sm shadow-red-500/20 border border-red-600/50">
                      <AlertTriangle size={14} className="opacity-90" />
                      <span className="text-xs tracking-tight">Atrasos: {formatBRL(totalAtrasado)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-xl h-9 w-9 border-border/60 shadow-sm bg-background hover:bg-muted"
                onClick={() => setIsSettingsOpen(true)}
                title="Configurações de Integração"
              >
                <Settings size={16} className="text-slate-600 dark:text-slate-400" />
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl h-9 text-xs font-bold border-border/40 shadow-sm bg-background"
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? <RefreshCw size={14} className="mr-2 animate-spin text-primary" /> : <RefreshCw size={14} className="mr-2 text-primary" />}
                {isSyncing ? "Sincronizando..." : "Sincronizar"}
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-background">
            {/* Header Dias da Semana */}
            <div className="grid grid-cols-7 border-b border-border/60 shrink-0 bg-slate-50/80 dark:bg-muted/10">
              {DAYS.map(d => (
                <div key={d} className="py-3 text-center text-[11px] font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-widest border-r border-border/60 last:border-0">
                  <span className="hidden md:inline">{d}</span>
                  <span className="md:hidden">{d.slice(0,3)}</span>
                </div>
              ))}
            </div>
            
            {/* Grid do Calendário com Design Melhorado */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-transparent">
              {cells.map((day, i) => {
                const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                const dayEvents = filteredEvents.filter(e => e.day === day);
                
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "min-h-[100px] border-r border-b border-slate-200 dark:border-border/60 p-1.5 transition-colors relative flex flex-col",
                      !day && "bg-slate-100/50 dark:bg-muted/5 opacity-50",
                      day && "hover:bg-slate-50 dark:hover:bg-muted/10",
                      isToday && "bg-blue-50/30 dark:bg-primary/[0.02]"
                    )}
                  >
                    {day && (
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={cn(
                          "text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full shrink-0",
                          isToday ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-slate-600 dark:text-muted-foreground"
                        )}>
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mr-1">{dayEvents.length}</span>
                        )}
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-0.5 pb-1">
                      {dayEvents.map(ev => {
                        let bg = "bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
                        let icon = <Clock size={10} />;
                        
                        if (ev.type === "meeting") {
                          bg = "bg-blue-100/80 text-blue-800 border-blue-200 hover:border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50";
                          icon = <Video size={10} />;
                        } else if (ev.type === "finance_in") {
                          bg = "bg-emerald-100/80 text-emerald-800 border-emerald-200 hover:border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50 font-bold";
                          icon = <DollarSign size={10} />;
                        } else if (ev.type === "finance_overdue") {
                          bg = "bg-rose-100 text-rose-800 border-rose-300 hover:border-rose-400 font-black shadow-sm dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-800";
                          icon = <AlertTriangle size={10} />;
                        } else if (ev.type === "finance_out") {
                          bg = "bg-amber-100/80 text-amber-800 border-amber-200 hover:border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50";
                          icon = <DollarSign size={10} />;
                        }

                        return (
                          <div 
                            key={ev.id} 
                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                            className={cn(
                              "text-[10px] px-2 py-1.5 rounded-lg border flex flex-col gap-0.5 leading-tight truncate transition-all cursor-pointer shadow-sm",
                              bg
                            )}
                            title={ev.title}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 font-bold truncate">
                                {ev.type.startsWith("finance") && ev.value ? formatBRL(ev.value) : ev.time}
                              </span>
                            </div>
                            <span className="truncate opacity-90 font-medium">{ev.client || ev.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR (Upcoming & Reminders) - Toggled via state */}
        {isSidebarOpen && (
          <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0 animate-in slide-in-from-right-8 duration-300">
            
            {/* Upcoming Events */}
            <div className="bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black text-slate-800 dark:text-foreground">Eventos Próximos</h3>
                <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[10px] text-blue-600 font-bold hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg"><Plus size={12} className="mr-1"/> Novo</Button>
              </div>
              
              <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {events.filter(e => e.type === "meeting" || e.type === "task").slice(0, 4).map((ev, i) => (
                  <div key={i} className="p-3.5 rounded-2xl border border-slate-100 dark:border-border/50 bg-slate-50/50 dark:bg-background hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors group cursor-pointer" onClick={() => setSelectedEvent(ev)}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", ev.type === "meeting" ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-purple-500")} />
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{ev.time || "10:00"}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-muted-foreground font-semibold leading-snug">{ev.title} {ev.client && `com ${ev.client}`}</p>
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="w-full mt-4 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 font-bold text-xs rounded-xl h-10 transition-colors">Ver todos os eventos</Button>
            </div>

            {/* Reminders / Alertas Financeiros */}
            <div className="bg-white dark:bg-card rounded-3xl border border-border/60 shadow-sm p-5 flex-1 flex flex-col">
              <h3 className="text-sm font-black text-slate-800 dark:text-foreground mb-5 flex items-center gap-2"><Bell size={16} className="text-amber-500"/> Lembretes Financeiros</h3>
              
              <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {events.filter(e => e.type.startsWith("finance")).slice(0, 3).map((ev, i) => {
                  const isOverdue = ev.type === "finance_overdue";
                  const isIncoming = ev.type === "finance_in";
                  return (
                    <div key={i} className="p-3 rounded-2xl border border-slate-100 dark:border-border/50 bg-slate-50/50 dark:bg-background flex gap-3 items-center group cursor-pointer hover:border-slate-300 dark:hover:border-border transition-colors" onClick={() => setSelectedEvent(ev)}>
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                        isOverdue ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" : 
                        isIncoming ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                      )}>
                        {isOverdue ? <AlertTriangle size={18} /> : isIncoming ? <DollarSign size={18} /> : <Wallet size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">{ev.title}</p>
                          {isOverdue && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 shadow-[0_0_5px_rgba(244,63,94,0.8)]" />}
                        </div>
                        <p className={cn(
                          "text-[10px] font-semibold mt-0.5 truncate",
                          isOverdue ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-muted-foreground"
                        )}>
                          {ev.client} • {ev.value && formatBRL(ev.value)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        )}
      </div>

      {/* --- MODAL DE DETALHES DO EVENTO (Estilo Google Calendar) --- */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-border/50 rounded-2xl">
          {selectedEvent && (
            <>
              <div className={cn(
                "h-16 w-full relative",
                selectedEvent.type === "meeting" ? "bg-blue-500" :
                selectedEvent.type === "finance_in" ? "bg-emerald-500" :
                selectedEvent.type === "finance_overdue" ? "bg-rose-500" :
                selectedEvent.type === "finance_out" ? "bg-amber-500" : "bg-purple-500"
              )}>
                <div className="absolute -bottom-6 left-6 w-12 h-12 rounded-2xl bg-white dark:bg-card border-4 border-white dark:border-card flex items-center justify-center shadow-sm">
                  {selectedEvent.type === "meeting" ? <Video size={20} className="text-blue-500" /> :
                   selectedEvent.type.startsWith("finance") ? <DollarSign size={20} className={
                     selectedEvent.type === "finance_overdue" ? "text-rose-500" :
                     selectedEvent.type === "finance_out" ? "text-amber-500" : "text-emerald-500"
                   } /> : <Briefcase size={20} className="text-purple-500" />}
                </div>
              </div>

              <div className="p-6 pt-10">
                <DialogHeader className="text-left mb-6">
                  <DialogTitle className="text-xl font-black text-slate-800 dark:text-slate-100">{selectedEvent.title}</DialogTitle>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {MONTHS[month]} {selectedEvent.day}, {year} {selectedEvent.time ? `• ${selectedEvent.time}` : ""}
                  </p>
                </DialogHeader>

                <div className="space-y-4">
                  {selectedEvent.client && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Briefcase size={14} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cliente / Contato</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedEvent.client}</p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.value && (
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        selectedEvent.type === "finance_overdue" ? "bg-rose-100 dark:bg-rose-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
                      )}>
                        <DollarSign size={14} className={selectedEvent.type === "finance_overdue" ? "text-rose-600" : "text-emerald-600"} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Valor</p>
                        <p className={cn(
                          "text-lg font-black",
                          selectedEvent.type === "finance_overdue" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                        )}>
                          {formatBRL(selectedEvent.value)}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.location && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin size={14} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Local / Link</p>
                        <p className="text-sm font-bold text-blue-600 hover:underline cursor-pointer">{selectedEvent.location}</p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.description && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <AlignLeft size={14} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Descrição</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-1">{selectedEvent.description}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <Button variant="outline" className="rounded-xl font-bold" onClick={() => setSelectedEvent(null)}>Fechar</Button>
                  <Button className="rounded-xl font-bold">Editar Evento</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE INTEGRAÇÕES DE CALENDÁRIO --- */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "dummy"}>
          <DialogContent className="sm:max-w-[500px] border-border/50 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <Settings className="text-primary" size={24} />
                Integrações de Calendário
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500 mt-2">
                Conecte suas contas do Google e Apple para sincronizar seus compromissos automaticamente com o Turbo CRM.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Google Calendar */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-border/50 bg-slate-50/50 dark:bg-muted/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-border/50 flex items-center justify-center shadow-sm">
                    <Mail size={24} className="text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Google Calendar</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {googleConnected ? "Sincronizado com sua conta Gmail" : "Sincronize com sua conta Gmail"}
                    </p>
                  </div>
                </div>
                <GoogleButtonLogic googleConnected={googleConnected} setGoogleConnected={setGoogleConnected} onEventsFetched={handleGoogleEventsFetched} />
              </div>

            {/* Apple Calendar */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-border/50 bg-slate-50/50 dark:bg-muted/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-border/50 flex items-center justify-center shadow-sm">
                  <Smartphone size={24} className="text-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Apple Calendar</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {appleConnected ? "Sincronizado via iCloud" : "Sincronize via iCloud"}
                  </p>
                </div>
              </div>
              <Button 
                variant={appleConnected ? "outline" : "outline"} 
                size="sm" 
                className={cn(
                  "rounded-xl font-bold transition-all border-slate-300 dark:border-border",
                  appleConnected && "border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                )}
                onClick={() => setAppleConnected(!appleConnected)}
              >
                {appleConnected ? (
                  <><CheckCircle2 size={14} className="mr-1.5" /> Conectado</>
                ) : (
                  "Conectar"
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-border/40">
              <Button variant="ghost" onClick={() => setIsSettingsOpen(false)} className="rounded-xl font-bold">Fechar</Button>
            </div>
          </DialogContent>
        </GoogleOAuthProvider>
      </Dialog>

      {/* --- MODAL DE NOVO EVENTO --- */}
      <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
        <DialogContent className="sm:max-w-[425px] border-border/50 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CalendarIcon size={20} className="text-primary" />
              Novo Evento
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddEvent} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold text-slate-500">Título do Evento</Label>
              <Input id="title" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} placeholder="Ex: Reunião com Cliente" required className="rounded-xl border-slate-200 dark:border-border/50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs font-bold text-slate-500">Tipo</Label>
                <Select value={newEventType} onValueChange={(val: any) => setNewEventType(val)}>
                  <SelectTrigger id="type" className="rounded-xl border-slate-200 dark:border-border/50">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-border/50">
                    <SelectItem value="meeting">Compromisso</SelectItem>
                    <SelectItem value="task">Tarefa</SelectItem>
                    <SelectItem value="finance_in">Receita</SelectItem>
                    <SelectItem value="finance_out">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="day" className="text-xs font-bold text-slate-500">Dia (1 a {daysInMonth})</Label>
                <Input id="day" type="number" min="1" max={daysInMonth} value={newEventDay} onChange={(e) => setNewEventDay(Number(e.target.value))} required className="rounded-xl border-slate-200 dark:border-border/50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client" className="text-xs font-bold text-slate-500">Cliente (Opcional)</Label>
              <Input id="client" value={newEventClient} onChange={(e) => setNewEventClient(e.target.value)} placeholder="Ex: Acme Corp" className="rounded-xl border-slate-200 dark:border-border/50" />
            </div>

            {newEventType.startsWith("finance") ? (
              <div className="space-y-2">
                <Label htmlFor="value" className="text-xs font-bold text-slate-500">Valor (R$)</Label>
                <Input id="value" type="number" step="0.01" value={newEventValue} onChange={(e) => setNewEventValue(e.target.value)} placeholder="0.00" required className="rounded-xl border-slate-200 dark:border-border/50" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="time" className="text-xs font-bold text-slate-500">Horário</Label>
                <Input id="time" type="time" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} className="rounded-xl border-slate-200 dark:border-border/50" />
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsNewEventOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
              <Button type="submit" className="rounded-xl font-bold">Salvar Evento</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
