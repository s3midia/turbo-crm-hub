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

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* SIDEBAR PREVISIBILIDADE (Exibida quando Tudo ou Financeiro está ativo) */}
        {filter !== "meetings" && (
          <div className="w-full lg:w-80 border-r border-border/40 bg-muted/10 p-6 overflow-y-auto shrink-0 flex flex-col gap-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Previsibilidade do Mês</h3>
              
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/20 rounded-full blur-2xl" />
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">A Receber / Entradas</p>
                <p className="text-2xl font-black text-emerald-600">{formatBRL(totalReceitas)}</p>
              </div>

              {totalAtrasado > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500/20 rounded-full blur-2xl group-hover:bg-rose-500/30 transition-all" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <AlertTriangle size={10} className="animate-pulse" /> Atrasados
                      </p>
                      <p className="text-xl font-black text-rose-600">{formatBRL(totalAtrasado)}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3 h-7 text-[10px] font-black border-rose-500/30 text-rose-600 hover:bg-rose-500/10">COBRAR AGORA</Button>
                </div>
              )}
            </div>

            <div className="space-y-4 flex-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronização Externa</h3>
              <div className="bg-card border border-border/40 rounded-2xl p-4 text-center space-y-3 shadow-sm">
                <div className="flex justify-center -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-background flex items-center justify-center text-blue-600 font-bold text-[10px]">G</div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-background flex items-center justify-center text-slate-800 font-bold text-[10px]">A</div>
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground leading-relaxed">Conecte com Google Calendar ou Apple Calendar para bidirecionalidade.</p>
                <Button variant="secondary" size="sm" className="w-full rounded-xl text-[10px] font-bold h-8">
                  <Plus size={12} className="mr-1" /> CONECTAR
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CALENDÁRIO MAIN */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="flex items-center gap-2 bg-card border border-border/40 p-1 rounded-2xl shadow-sm">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-xl hover:bg-muted"><ChevronLeft size={16} /></Button>
              <span className="w-32 text-center text-sm font-black text-foreground tracking-tight">
                {MONTHS[month]} <span className="text-primary">{year}</span>
              </span>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-xl hover:bg-muted"><ChevronRight size={16} /></Button>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl h-9 text-[11px] font-bold border-border/40 shadow-sm"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? <RefreshCw size={14} className="mr-2 animate-spin text-primary" /> : <RefreshCw size={14} className="mr-2 text-primary" />}
              {isSyncing ? "Sincronizando..." : "Sincronizar CRM"}
            </Button>
          </div>

          <div className="flex-1 flex flex-col min-h-0 border border-border/40 rounded-3xl overflow-hidden shadow-sm bg-card">
            {/* Header Dias da Semana */}
            <div className="grid grid-cols-7 border-b border-border/40 bg-muted/20 shrink-0">
              {DAYS.map(d => (
                <div key={d} className="p-3 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest border-r border-border/40 last:border-0">
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
                      "min-h-[100px] border-r border-b border-border/40 p-1.5 transition-colors relative flex flex-col",
                      !day && "bg-muted/10 opacity-50",
                      day && "hover:bg-muted/5",
                      isToday && "bg-primary/[0.02]"
                    )}
                  >
                    {day && (
                      <span className={cn(
                        "text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-lg mb-1 shrink-0",
                        isToday ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                      )}>
                        {day}
                      </span>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-0.5 pb-1">
                      {dayEvents.map(ev => {
                        
                        // Estilização baseada no tipo de evento
                        let bg = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
                        let icon = <Clock size={9} />;
                        
                        if (ev.type === "meeting") {
                          bg = "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400";
                          icon = <Video size={9} />;
                        } else if (ev.type === "finance_in") {
                          bg = "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 font-bold";
                          icon = <DollarSign size={9} />;
                        } else if (ev.type === "finance_overdue") {
                          bg = "bg-rose-500 text-white border-rose-600 font-black shadow-sm animate-pulse";
                          icon = <AlertTriangle size={9} />;
                        } else if (ev.type === "finance_out") {
                          bg = "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400";
                          icon = <DollarSign size={9} />;
                        }

                        return (
                          <div 
                            key={ev.id} 
                            className={cn(
                              "text-[9px] px-1.5 py-1 rounded-md border flex flex-col gap-0.5 leading-tight truncate cursor-pointer hover:brightness-95 transition-all",
                              bg
                            )}
                            title={ev.title}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 font-semibold truncate">
                                {icon} {ev.type.startsWith("finance") && ev.value ? formatBRL(ev.value) : ev.time}
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

      </div>
    </div>
  );
}
