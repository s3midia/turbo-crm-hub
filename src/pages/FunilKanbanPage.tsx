import React, { useState, useEffect } from "react";
import {
    Download, Plus, MessageSquareMore, Trash2, Globe,
    Loader2, MessageSquareText, Clock, AlertCircle,
    Search, TrendingUp, Zap, ChevronRight, ExternalLink
} from "lucide-react";
import { OpportunityModal } from "../components/whatsapp/OpportunityModal";
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export interface Lead {
    id: string;
    company_name: string;
    phone: string;
    created_at: string;
    niche: string;
    status:
        | "vendas_b2b" | "novo" | "kanban_ready" | "gerando_site"
        | "site_pronto" | "atendimento" | "qualificacao" | "agendado"
        | "reuniao" | "apresentacao" | "fechamento" | "ganhou" | "perdeu";
    site_url?: string;
}

const STAGES = [
    { key: "vendas_b2b",   label: "Vendas B2B",    emoji: "🎯", tw: "indigo"   },
    { key: "novo",         label: "Novo",           emoji: "✨", tw: "violet"   },
    { key: "kanban_ready", label: "Qualificados",   emoji: "✅", tw: "emerald"  },
    { key: "site_pronto",  label: "Site Pronto",    emoji: "🌐", tw: "cyan"     },
    { key: "atendimento",  label: "Em Atendimento", emoji: "💬", tw: "amber"    },
    { key: "qualificacao", label: "Qualificação",   emoji: "🔍", tw: "purple"   },
    { key: "agendado",     label: "Agendado",       emoji: "📅", tw: "blue"     },
    { key: "reuniao",      label: "Reunião",        emoji: "🤝", tw: "sky"      },
    { key: "apresentacao", label: "Apresentação",   emoji: "📊", tw: "teal"     },
    { key: "fechamento",   label: "Fechamento",     emoji: "🔥", tw: "orange"   },
    { key: "ganhou",       label: "Ganhou",         emoji: "🏆", tw: "green"    },
    { key: "perdeu",       label: "Perdeu",         emoji: "💔", tw: "red"      },
] as const;

// Tailwind color mappings per stage (bg, text, ring variants)
const STAGE_COLORS: Record<string, { accent: string; lightBg: string; darkBg: string; badge: string }> = {
    indigo:  { accent: "text-indigo-500",  lightBg: "bg-indigo-50  border-indigo-200",  darkBg: "dark:bg-indigo-950/40  dark:border-indigo-800/50",  badge: "bg-indigo-100  text-indigo-700  dark:bg-indigo-900/50  dark:text-indigo-300" },
    violet:  { accent: "text-violet-500",  lightBg: "bg-violet-50  border-violet-200",  darkBg: "dark:bg-violet-950/40  dark:border-violet-800/50",  badge: "bg-violet-100  text-violet-700  dark:bg-violet-900/50  dark:text-violet-300" },
    emerald: { accent: "text-emerald-500", lightBg: "bg-emerald-50 border-emerald-200", darkBg: "dark:bg-emerald-950/40 dark:border-emerald-800/50", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
    cyan:    { accent: "text-cyan-500",    lightBg: "bg-cyan-50    border-cyan-200",    darkBg: "dark:bg-cyan-950/40    dark:border-cyan-800/50",    badge: "bg-cyan-100    text-cyan-700    dark:bg-cyan-900/50    dark:text-cyan-300" },
    amber:   { accent: "text-amber-500",   lightBg: "bg-amber-50   border-amber-200",   darkBg: "dark:bg-amber-950/40   dark:border-amber-800/50",   badge: "bg-amber-100   text-amber-700   dark:bg-amber-900/50   dark:text-amber-300" },
    purple:  { accent: "text-purple-500",  lightBg: "bg-purple-50  border-purple-200",  darkBg: "dark:bg-purple-950/40  dark:border-purple-800/50",  badge: "bg-purple-100  text-purple-700  dark:bg-purple-900/50  dark:text-purple-300" },
    blue:    { accent: "text-blue-500",    lightBg: "bg-blue-50    border-blue-200",    darkBg: "dark:bg-blue-950/40    dark:border-blue-800/50",    badge: "bg-blue-100    text-blue-700    dark:bg-blue-900/50    dark:text-blue-300" },
    sky:     { accent: "text-sky-500",     lightBg: "bg-sky-50     border-sky-200",     darkBg: "dark:bg-sky-950/40     dark:border-sky-800/50",     badge: "bg-sky-100     text-sky-700     dark:bg-sky-900/50     dark:text-sky-300" },
    teal:    { accent: "text-teal-500",    lightBg: "bg-teal-50    border-teal-200",    darkBg: "dark:bg-teal-950/40    dark:border-teal-800/50",    badge: "bg-teal-100    text-teal-700    dark:bg-teal-900/50    dark:text-teal-300" },
    orange:  { accent: "text-orange-500",  lightBg: "bg-orange-50  border-orange-200",  darkBg: "dark:bg-orange-950/40  dark:border-orange-800/50",  badge: "bg-orange-100  text-orange-700  dark:bg-orange-900/50  dark:text-orange-300" },
    green:   { accent: "text-green-500",   lightBg: "bg-green-50   border-green-200",   darkBg: "dark:bg-green-950/40   dark:border-green-800/50",   badge: "bg-green-100   text-green-700   dark:bg-green-900/50   dark:text-green-300" },
    red:     { accent: "text-red-500",     lightBg: "bg-red-50     border-red-200",     darkBg: "dark:bg-red-950/40     dark:border-red-800/50",     badge: "bg-red-100     text-red-700     dark:bg-red-900/50     dark:text-red-300" },
};

// Niche badge style
function getNicheClass(niche: string): string {
    const lower = niche.toLowerCase();
    if (lower.includes("white")) return "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/40";
    if (lower.includes("revenda")) return "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600/40";
    if (lower.includes("cliente")) return "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/40";
    return "bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700/40";
}

function getTempClass(temp: string): string {
    if (temp === "QUENTE") return "bg-red-100 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/30";
    if (temp === "FRIO")   return "bg-cyan-100 text-cyan-600 border border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700/30";
    return "bg-amber-100 text-amber-600 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/30";
}

function getTempDot(temp: string): string {
    if (temp === "QUENTE") return "bg-red-500";
    if (temp === "FRIO")   return "bg-cyan-500";
    return "bg-amber-500";
}

// ─── Pipeline progress stepper ───────────────────────────────────────────────

const PIPELINE_STEPS = [
    { key: "novo",       label: "Novo"      },
    { key: "qualificado",label: "Qualif."   },
    { key: "site",       label: "Site"      },
    { key: "contato",    label: "Contato"   },
    { key: "reuniao",    label: "Reunião"   },
    { key: "fechamento", label: "Fechado"   },
] as const;

type StepKey = typeof PIPELINE_STEPS[number]["key"];

function getPipelineStep(status: Lead["status"]): number {
    // Returns the 0-based index of the CURRENT step
    const map: Partial<Record<Lead["status"], number>> = {
        vendas_b2b:   0,
        novo:         0,
        kanban_ready: 1,
        gerando_site: 2,
        site_pronto:  2,
        atendimento:  3,
        qualificacao: 3,
        agendado:     4,
        reuniao:      4,
        apresentacao: 4,
        fechamento:   5,
        ganhou:       5,
        perdeu:       5,
    };
    return map[status] ?? 0;
}

function PipelineStepper({ status }: { status: Lead["status"] }) {
    const currentStep = getPipelineStep(status);
    const isDone = status === "ganhou";
    const isLost = status === "perdeu";
    const total  = PIPELINE_STEPS.length;

    return (
        <div className="mt-3 pt-3 border-t border-border/50">
            {/* Circles + lines row */}
            <div className="relative flex items-center w-full mb-1">
                {PIPELINE_STEPS.map((step, i) => {
                    const completed = isLost ? false : (isDone ? true : i < currentStep);
                    const active    = !isLost && !isDone && i === currentStep;
                    const isLast    = i === total - 1;

                    return (
                        <React.Fragment key={step.key}>
                            {/* Circle */}
                            <div
                                className={[
                                    "relative z-10 w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200",
                                    completed
                                        ? "bg-emerald-500"
                                        : active
                                            ? "bg-primary ring-2 ring-primary/30"
                                            : isLost && i <= currentStep
                                                ? "bg-red-400"
                                                : "bg-background border-2 border-muted-foreground/30",
                                ].join(" ")}
                            >
                                {completed && (
                                    <svg viewBox="0 0 10 10" className="w-1.5 h-1.5" fill="none">
                                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>

                            {/* Line between dots */}
                            {!isLast && (
                                <div className="flex-1 h-[2px] mx-[2px] rounded-full bg-muted-foreground/15 overflow-hidden">
                                    <div
                                        className={[
                                            "h-full rounded-full transition-all duration-300",
                                            completed
                                                ? "bg-emerald-500 w-full"
                                                : active
                                                    ? "bg-primary w-1/2"
                                                    : "w-0",
                                        ].join(" ")}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Labels row */}
            <div className="flex items-start w-full">
                {PIPELINE_STEPS.map((step, i) => {
                    const completed = isLost ? false : (isDone ? true : i < currentStep);
                    const active    = !isLost && !isDone && i === currentStep;
                    const isLast    = i === total - 1;

                    return (
                        <React.Fragment key={step.key}>
                            <span
                                className={[
                                    "text-[8px] font-bold flex-shrink-0 leading-none",
                                    i === 0 ? "text-left" : isLast ? "text-right" : "text-center",
                                    completed
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : active
                                            ? "text-primary"
                                            : isLost && i <= currentStep
                                                ? "text-red-400"
                                                : "text-muted-foreground/35",
                                ].join(" ")}
                                style={{ minWidth: 0 }}
                            >
                                {step.label}
                            </span>
                            {!isLast && <div className="flex-1" />}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────

function getAccentBar(tw: string): string {
    const map: Record<string, string> = {
        indigo: "bg-indigo-400", violet: "bg-violet-400", emerald: "bg-emerald-400",
        cyan: "bg-cyan-400", amber: "bg-amber-400", purple: "bg-purple-400",
        blue: "bg-blue-400", sky: "bg-sky-400", teal: "bg-teal-400",
        orange: "bg-orange-400", green: "bg-green-400", red: "bg-red-400",
    };
    return map[tw] ?? "bg-primary";
}

function LeadCard({ 
    lead, 
    accentBar, 
    onClick,
    innerRef,
    draggableProps,
    dragHandleProps
}: { 
    lead: Lead; 
    accentBar: string; 
    onClick: (l: Lead) => void;
    innerRef?: React.Ref<HTMLDivElement>;
    draggableProps?: any;
    dragHandleProps?: any;
}) {
    const idStr = String(lead.id || "");
    const isHot  = (idStr.charCodeAt(0) || 0) % 2 === 0;
    const isCold = (idStr.charCodeAt(1) || 0) % 5 === 0;
    const tempText = isHot ? "QUENTE" : isCold ? "FRIO" : "MORNO";

    const d = new Date(lead.created_at || Date.now());
    const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear().toString().slice(-2)}`;
    const isAtrasado = tempText === "QUENTE" && d.getDate() % 3 === 0;

    return (
        <div
            onClick={() => onClick(lead)}
            ref={innerRef}
            {...draggableProps}
            {...dragHandleProps}
            className="group relative bg-card border border-border rounded-xl p-3.5 mb-2.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] hover:border-border/80 dark:hover:border-white/10 overflow-hidden outline-none"
        >
            {/* Accent bar left */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl opacity-60 ${accentBar}`} />

            {/* Top row */}
            <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-muted-foreground/40 tracking-widest">
                    #{idStr.substring(0, 6).toUpperCase()}
                </span>
                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-full border border-border/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    <span className="text-[10px] font-bold text-muted-foreground">Daniela</span>
                </div>
            </div>

            {/* Name */}
            <div className="flex items-start justify-between gap-2">
                <p className="text-[15px] font-extrabold text-foreground leading-snug tracking-tight">
                    {lead.company_name || 'Sem nome'}
                </p>
                <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/30 hover:text-destructive p-1 -mt-0.5"
                    onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm("Deseja excluir este lead?")) {
                            await supabase.from("leads").delete().eq("id", lead.id);
                        }
                    }}
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
                {lead.niche && (
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${getNicheClass(lead.niche)}`}>
                        {lead.niche}
                    </span>
                )}
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${getTempClass(tempText)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${getTempDot(tempText)}`} />
                    {tempText}
                </span>
            </div>

            {/* Value + Date row */}
            <div className="flex items-center justify-between mt-2.5">
                <span className="text-[13px] font-black text-foreground tracking-tight">R$ 240,00</span>
                <div className="flex items-center gap-1">
                    {isAtrasado ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                            <AlertCircle size={10} /> Atrasado
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/60">
                            <Clock size={10} /> {dateStr}
                        </span>
                    )}
                </div>
            </div>

            {/* Pipeline progress stepper */}
            <PipelineStepper status={lead.status} />

            {/* Agent status pills */}
            {lead.status === "gerando_site" && (
                <div className="mt-2 flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-800/50 rounded-lg px-2.5 py-1.5">
                    <Loader2 size={10} className="text-indigo-500 animate-spin" />
                    <span className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Dani gerando site...</span>
                </div>
            )}
            {lead.status === "atendimento" && (
                <div className="mt-2 flex items-center gap-1.5 bg-amber-50 border border-amber-200 dark:bg-amber-950/50 dark:border-amber-800/50 rounded-lg px-2.5 py-1.5">
                    <MessageSquareText size={10} className="text-amber-500" />
                    <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Malu em contato</span>
                </div>
            )}
            {lead.site_url && (
                <div className="mt-2 flex items-center justify-between gap-1.5 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800/50 rounded-lg px-2.5 py-1.5 group/site">
                    <div className="flex items-center gap-1.5">
                        <Globe size={10} className="text-emerald-500" />
                        <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Site disponível</span>
                    </div>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(lead.site_url, '_blank');
                        }}
                        className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
                    >
                        VER SITE <ExternalLink size={8} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default function FunilKanbanPage() {
    const [search, setSearch]       = useState("");
    const [leads, setLeads]         = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [focused, setFocused]     = useState(false);

    const fetchLeads = async () => {
        const { data, error } = await supabase
            .from("leads").select("*").order("created_at", { ascending: false });
        if (!error && data) setLeads(data as any);
    };

    useEffect(() => {
        fetchLeads();
        const channel = supabase
            .channel("kanban-leads")
            .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, fetchLeads)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const onDragEnd = async (result: any) => {
        if (!result.destination) return;
        
        const { source, destination, draggableId } = result;
        if (source.droppableId === destination.droppableId) return;

        const newStatus = destination.droppableId;
        
        // Optimistic update
        setLeads((prev) => prev.map(l => 
            l.id === draggableId ? { ...l, status: newStatus as Lead["status"] } : l
        ));

        // Update DB
        const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", draggableId);
        if (error) {
            console.error("Error updating lead status:", error);
            // Revert optimisic update could be handled here by re-fetching
            fetchLeads();
        }
    };

    const filtered = search
        ? leads.filter((l) =>
            l.company_name.toLowerCase().includes(search.toLowerCase()) ||
            (l.niche && l.niche.toLowerCase().includes(search.toLowerCase()))
          )
        : leads;

    const totalValue = leads.length * 240;
    const wonLeads   = leads.filter(l => l.status === "ganhou").length;

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-card/60 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary text-primary-foreground rounded-lg w-8 h-8 flex items-center justify-center">
                        <TrendingUp size={15} />
                    </div>
                    <span className="text-[15px] font-extrabold text-foreground tracking-tight">CRM & Pipeline</span>
                </div>

                {/* Stats strip */}
                <div className="flex items-center gap-6">
                    {[
                        { label: "Leads",    value: leads.length,                                  cls: "text-indigo-500"  },
                        { label: "Pipeline", value: `R$ ${totalValue.toLocaleString("pt-BR")},00`, cls: "text-emerald-500" },
                        { label: "Ganhos",   value: wonLeads,                                      cls: "text-amber-500"   },
                    ].map(s => (
                        <div key={s.label} className="text-right">
                            <div className={`text-base font-black tracking-tight ${s.cls}`}>{s.value}</div>
                            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden p-5 gap-4">

                {/* ── Title + Actions ── */}
                <div className="flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Funil de Leads</h1>
                        <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5">
                            <Zap size={9} className="text-primary" />
                            <span className="text-[10px] font-extrabold text-primary">LIVE</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-border text-foreground text-[13px] font-bold hover:bg-muted transition-all">
                            <Download size={13} /> Exportar
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-bold hover:opacity-90 transition-all shadow-sm">
                            <Plus size={13} /> Novo Lead
                        </button>
                    </div>
                </div>

                {/* ── Search ── */}
                <div className="relative shrink-0">
                    <Search
                        size={14}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focused ? "text-primary" : "text-muted-foreground/40"}`}
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="Buscar leads por nome ou nicho..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-foreground text-[13px] placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    />
                </div>

                {/* ── Kanban Board ── */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-3 flex-1 overflow-x-auto overflow-y-hidden pb-2">
                        {STAGES.map((stage) => {
                            const stageLeads = filtered.filter((l) => {
                                if (stage.key === "kanban_ready") return l.status === "kanban_ready" || l.status === "gerando_site";
                                if (stage.key === "novo") return l.status === "novo" || !l.status;
                                return l.status === stage.key;
                            });
                            const stageValue = stageLeads.length * 240;
                            const sc = STAGE_COLORS[stage.tw];

                            return (
                                <div key={stage.key} className="flex flex-col w-56 min-w-[224px] shrink-0">

                                    {/* Column Header */}
                                    <div className={`rounded-xl border p-2.5 mb-2.5 ${sc.lightBg} ${sc.darkBg}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{stage.emoji}</span>
                                                <span className="text-[12px] font-extrabold text-foreground leading-none">{stage.label}</span>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${sc.badge}`}>
                                                {stageLeads.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className={`text-[11px] font-bold ${sc.accent}`}>
                                                R$ {stageValue.toLocaleString("pt-BR")},00
                                            </span>
                                            <ChevronRight size={10} className={`${sc.accent} opacity-40`} />
                                        </div>
                                    </div>

                                    {/* Cards */}
                                    <Droppable droppableId={stage.key}>
                                        {(provided) => (
                                            <div 
                                                className="flex-1 overflow-y-auto pr-0.5"
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                            >
                                                {stageLeads.map((lead, index) => (
                                                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                        {(provided) => (
                                                            <LeadCard
                                                                lead={lead}
                                                                accentBar={getAccentBar(stage.tw)}
                                                                onClick={setSelectedLead}
                                                                innerRef={provided.innerRef}
                                                                draggableProps={provided.draggableProps}
                                                                dragHandleProps={provided.dragHandleProps}
                                                            />
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                                {stageLeads.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center py-8 rounded-xl bg-muted/20 border border-border/40 border-dashed m-1">
                                                        <MessageSquareMore size={20} className="text-muted-foreground/30 mb-2" />
                                                        <p className="text-[11px] font-semibold text-muted-foreground/40 text-center">
                                                            Nenhum lead<br />nesta etapa
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>

            {/* Modal */}
            <OpportunityModal
                open={!!selectedLead}
                onClose={() => setSelectedLead(null)}
                opportunityId={selectedLead?.id}
                contactName={selectedLead?.company_name}
                contactPhone={selectedLead?.phone}
                stage={selectedLead?.status}
            />
        </div>
    );
}
