import React, { useState, useMemo } from "react";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, 
  DollarSign, Clock, Video, AlertTriangle, CheckCircle2, 
  Wallet, RefreshCw, Zap, Briefcase, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/formatters";

// --- Tipos de Eventos ---
type FilterMode = "all" | "meetings" | "finance";
type EventType = "meeting" | "task" | "finance_in" | "finance_out" | "finance_overdue";

interface AgendaEvent {
  id: string;
  day: number; // dia do mês atual para o mock
  title: string;
  type: EventType;
  time?: string;
  value?: number;
  client?: string;
  status?: string;
}

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function AgendaPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [filter, setFilter] = useState<FilterMode>("all");
  const [isSyncing, setIsSyncing] = useState(false);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  // --- Mock Data ---
  const mockEvents = useMemo<AgendaEvent[]>(() => {
    return [
      { id: "1", day: 5, title: "Reunião de Kickoff", type: "meeting", time: "10:00", client: "Acme Corp" },
      { id: "2", day: 5, title: "Fatura Mensal", type: "finance_in", value: 5000, client: "Acme Corp", status: "Pago" },
      { id: "3", day: 10, title: "Mensalidade Gestão", type: "finance_in", value: 3500, client: "TechFlow" },
      { id: "4", day: 10, title: "Pagamento Atrasado", type: "finance_overdue", value: 1200, client: "Loja Silva" },
      { id: "5", day: 12, title: "Apresentação de Layout", type: "meeting", time: "14:30", client: "Mega Imports" },
      { id: "6", day: 15, title: "Impostos (DAS)", type: "finance_out", value: 850 },
      { id: "7", day: 20, title: "Faturamento Final", type: "finance_in", value: 12000, client: "Global Tech" },
      { id: "8", day: 22, title: "Revisão Contratual", type: "task", time: "16:00" },
    ];
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const filteredEvents = useMemo(() => {
    if (filter === "all") return mockEvents;
    if (filter === "meetings") return mockEvents.filter(e => e.type === "meeting" || e.type === "task");
    if (filter === "finance") return mockEvents.filter(e => e.type.startsWith("finance"));
    return mockEvents;
  }, [filter, mockEvents]);

  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  // Totais Rápidos do Mês (só de exemplo visual)
  const totalReceitas = mockEvents.filter(e => e.type === "finance_in").reduce((acc, curr) => acc + (curr.value || 0), 0);
  const totalAtrasado = mockEvents.filter(e => e.type === "finance_overdue").reduce((acc, curr) => acc + (curr.value || 0), 0);

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

        <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-2 rounded-2xl border border-border/40">
          <Button 
            variant={filter === "all" ? "default" : "ghost"} 
            size="sm" 
            className={cn("rounded-xl text-xs font-bold", filter === "all" && "shadow-md")}
            onClick={() => setFilter("all")}
          >
            <Zap size={14} className="mr-2" /> Visão Geral
          </Button>
          <Button 
            variant={filter === "meetings" ? "default" : "ghost"} 
            size="sm" 
            className={cn("rounded-xl text-xs font-bold", filter === "meetings" && "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20")}
            onClick={() => setFilter("meetings")}
          >
            <Video size={14} className="mr-2" /> Compromissos
          </Button>
          <Button 
            variant={filter === "finance" ? "default" : "ghost"} 
            size="sm" 
            className={cn("rounded-xl text-xs font-bold", filter === "finance" && "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20")}
            onClick={() => setFilter("finance")}
          >
            <Wallet size={14} className="mr-2" /> Financeiro
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

              {/* Previsibilidade ao lado do Mês (Pequeno e Organizado) */}
              {filter !== "meetings" && (
                <div className="flex items-center gap-2 hidden md:flex">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Receitas: {formatBRL(totalReceitas)}</span>
                  </div>
                  {totalAtrasado > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-rose-700 uppercase">Atrasos: {formatBRL(totalAtrasado)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl h-8 text-[10px] font-bold border-border/40 shadow-sm bg-background"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? <RefreshCw size={12} className="mr-2 animate-spin text-primary" /> : <RefreshCw size={12} className="mr-2 text-primary" />}
              {isSyncing ? "Sincronizando..." : "Sincronizar CRM"}
            </Button>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-background">
            {/* Header Dias da Semana */}
            <div className="grid grid-cols-7 border-b border-border/50 shrink-0">
              {DAYS.map(d => (
                <div key={d} className="py-2.5 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest border-r border-border/50 last:border-0">
                  <span className="hidden md:inline">{d}</span>
                  <span className="md:hidden">{d.slice(0,3)}</span>
                </div>
              ))}
            </div>
            
            {/* Grid do Calendário */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto custom-scrollbar">
              {cells.map((day, i) => {
                const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                const dayEvents = filteredEvents.filter(e => e.day === day);
                
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "min-h-[90px] border-r border-b border-border/50 p-1.5 transition-colors relative flex flex-col",
                      !day && "bg-muted/5 opacity-50",
                      day && "hover:bg-muted/10 cursor-pointer",
                      isToday && "bg-primary/[0.03]"
                    )}
                  >
                    {day && (
                      <span className={cn(
                        "text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 shrink-0",
                        isToday ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                      )}>
                        {day}
                      </span>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-0.5 pb-1">
                      {dayEvents.map(ev => {
                        let bg = "bg-slate-100 text-slate-700 border-slate-200";
                        let icon = <Clock size={8} />;
                        
                        if (ev.type === "meeting") {
                          bg = "bg-blue-50 text-blue-700 border-blue-200/50";
                          icon = <Video size={8} />;
                        } else if (ev.type === "finance_in") {
                          bg = "bg-emerald-50 text-emerald-700 border-emerald-200/50 font-bold";
                          icon = <DollarSign size={8} />;
                        } else if (ev.type === "finance_overdue") {
                          bg = "bg-rose-500 text-white border-rose-600 font-black shadow-sm animate-pulse";
                          icon = <AlertTriangle size={8} />;
                        } else if (ev.type === "finance_out") {
                          bg = "bg-amber-50 text-amber-700 border-amber-200/50";
                          icon = <DollarSign size={8} />;
                        }

                        return (
                          <div 
                            key={ev.id} 
                            className={cn(
                              "text-[9px] px-1.5 py-1 rounded border flex flex-col gap-0.5 leading-tight truncate hover:brightness-95 transition-all",
                              bg
                            )}
                            title={ev.title}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 font-semibold truncate">
                                {ev.type.startsWith("finance") && ev.value ? formatBRL(ev.value) : ev.time}
                              </span>
                            </div>
                            <span className="truncate opacity-90">{ev.client || ev.title}</span>
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

        {/* RIGHT SIDEBAR (Upcoming & Reminders - Reference Image Style) */}
        <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
          
          {/* Upcoming Events */}
          <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black text-foreground">Up Coming Events</h3>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-blue-600 font-bold hover:text-blue-700 hover:bg-blue-50"><Plus size={10} className="mr-1"/> Add events</Button>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {mockEvents.filter(e => e.type === "meeting" || e.type === "task").slice(0, 4).map((ev, i) => (
                <div key={i} className="p-3 rounded-2xl border border-border/50 bg-background hover:border-border transition-colors group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-[3px]", ev.type === "meeting" ? "bg-blue-500" : "bg-purple-500")} />
                      <span className="text-[11px] font-black text-slate-700">{ev.time || "10:00"} - 11:00</span>
                    </div>
                    <button className="text-muted-foreground opacity-0 group-hover:opacity-100"><span className="text-lg leading-none">⋯</span></button>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium pl-5">{ev.title} {ev.client && `with ${ev.client}`}</p>
                </div>
              ))}
            </div>
            <Button variant="secondary" className="w-full mt-4 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[11px] rounded-xl h-9">View all events</Button>
          </div>

          {/* Reminders / Alertas Financeiros */}
          <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-5 flex-1 flex flex-col">
            <h3 className="text-sm font-black text-foreground mb-5">Reminders & Alerts</h3>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {mockEvents.filter(e => e.type.startsWith("finance")).slice(0, 3).map((ev, i) => {
                const isOverdue = ev.type === "finance_overdue";
                const isIncoming = ev.type === "finance_in";
                return (
                  <div key={i} className="p-3 rounded-2xl border border-border/50 bg-background flex gap-3 items-center group">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      isOverdue ? "bg-rose-50 text-rose-500" : 
                      isIncoming ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500"
                    )}>
                      {isOverdue ? <AlertTriangle size={16} /> : isIncoming ? <DollarSign size={16} /> : <Wallet size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-700 truncate pr-2">{ev.title}</p>
                        {isOverdue && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                      </div>
                      <p className={cn(
                        "text-[9px] font-medium truncate",
                        isOverdue ? "text-rose-500" : "text-muted-foreground"
                      )}>
                        {ev.client} • {ev.value && formatBRL(ev.value)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="secondary" className="w-full mt-4 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[11px] rounded-xl h-9">View all</Button>
          </div>
          
        </div>

      </div>
    </div>
  );
}
