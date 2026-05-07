export type EventType = "meeting" | "task" | "finance_in" | "finance_out" | "finance_overdue";

export interface AgendaEvent {
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

export type FilterMode = "all" | "meetings" | "finance";

export function filterAgendaEvents(events: AgendaEvent[], filter: FilterMode): AgendaEvent[] {
  if (filter === "all") return events;
  if (filter === "meetings") return events.filter(e => e.type === "meeting" || e.type === "task");
  if (filter === "finance") return events.filter(e => e.type.startsWith("finance"));
  return events;
}

export function calculateAgendaTotals(events: AgendaEvent[]) {
  const totalReceitas = events
    .filter(e => e.type === "finance_in")
    .reduce((acc, curr) => acc + (curr.value || 0), 0);
  
  const totalAtrasado = events
    .filter(e => e.type === "finance_overdue")
    .reduce((acc, curr) => acc + (curr.value || 0), 0);
    
  return { totalReceitas, totalAtrasado };
}

export function convertGoogleEvents(googleItems: any[]): AgendaEvent[] {
  return googleItems.map(item => {
    const startStr = item.start.dateTime || item.start.date;
    const dateObj = new Date(startStr);
    return {
      id: item.id,
      day: dateObj.getDate(),
      title: item.summary || "Evento Google",
      type: "meeting",
      time: item.start.dateTime ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Dia Inteiro",
      location: item.location,
      description: item.description,
    };
  });
}
