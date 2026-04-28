import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function AgendaPage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
    const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

    const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="px-6 py-3 border-b border-border">
                <span className="text-base font-semibold text-foreground">Painel</span>
            </div>
            <div className="flex-1 p-6 space-y-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-7 h-7 text-[hsl(265,85%,65%)]" /> Agenda
                </h1>
                <div className="bg-card border border-border rounded-xl p-5 max-w-md">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prev} className="p-1.5 rounded hover:bg-accent text-[hsl(220,15%,70%)]"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="text-[14px] font-bold text-foreground">{MONTHS[month]} {year}</span>
                        <button onClick={next} className="p-1.5 rounded hover:bg-accent text-[hsl(220,15%,70%)]"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map(d => <span key={d} className="text-center text-[11px] text-muted-foreground font-semibold py-1">{d}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {cells.map((day, i) => (
                            <button key={i} disabled={!day}
                                className={`aspect-square rounded-lg text-[12px] font-medium flex items-center justify-center transition-colors
                  ${!day ? "" : day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
                                        ? "bg-[hsl(265,85%,60%)] text-white"
                                        : "text-[hsl(220,15%,70%)] hover:bg-accent"}`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>
                <p className="text-[13px] text-muted-foreground">Nenhum compromisso agendado para este mês.</p>
            </div>
        </div>
    );
}
