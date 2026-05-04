import React, { useState, useEffect } from "react";
import {
    Download, Plus, MessageSquareMore, Trash2, Globe,
    Loader2, MessageSquareText, Clock, AlertCircle,
    Search, TrendingUp, Zap, ChevronRight, ExternalLink, Settings, X, GripVertical
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { OpportunityModal } from "../components/whatsapp/OpportunityModal";
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { formatBRL } from "@/lib/formatters";

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
    value?: number | string;
    total_value?: number | string;
}

const DEFAULT_STAGES = [
    { key: "vendas_b2b",   label: "Vendas B2B",    emoji: "🎯", tw: "zinc"   },
    { key: "novo",         label: "Novo",           emoji: "✨", tw: "zinc"   },
    { key: "kanban_ready", label: "Qualificados",   emoji: "✅", tw: "zinc"  },
    { key: "site_pronto",  label: "Site Pronto",    emoji: "🌐", tw: "zinc"     },
    { key: "atendimento",  label: "Em Atendimento", emoji: "💬", tw: "zinc"    },
    { key: "qualificacao", label: "Qualificação",   emoji: "🔍", tw: "zinc"   },
    { key: "agendado",     label: "Agendado",       emoji: "📅", tw: "zinc"     },
    { key: "reuniao",      label: "Reunião",        emoji: "🤝", tw: "zinc"      },
    { key: "apresentacao", label: "Apresentação",   emoji: "📊", tw: "zinc"     },
    { key: "fechamento",   label: "Fechamento",     emoji: "🔥", tw: "zinc"   },
    { key: "ganhou",       label: "Ganhou",         emoji: "🏆", tw: "zinc"    },
    { key: "perdeu",       label: "Perdeu",         emoji: "💔", tw: "zinc"      },
];

const STAGE_COLORS: Record<string, { accent: string; lightBg: string; darkBg: string; badge: string }> = {
    zinc:    { accent: "text-zinc-500",    lightBg: "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800", darkBg: "dark:bg-zinc-900 dark:border-zinc-800", badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
    indigo:  { accent: "text-indigo-500",  lightBg: "bg-indigo-50  border-indigo-200",  darkBg: "dark:bg-indigo-950/40  dark:border-indigo-800/50",  badge: "bg-indigo-100  text-indigo-700  dark:bg-indigo-900/50  dark:text-indigo-300" },
    violet:  { accent: "text-violet-500",  lightBg: "bg-violet-50  border-violet-200",  darkBg: "dark:bg-violet-950/40  dark:border-violet-800/50",  badge: "bg-violet-100  text-violet-700  dark:bg-violet-900/50  dark:text-violet-300" },
    emerald: { accent: "text-emerald-500", lightBg: "bg-emerald-50 border-emerald-200", darkBg: "dark:bg-emerald-950/40 dark:border-emerald-800/50", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
    cyan:    { accent: "text-cyan-500",    lightBg: "bg-cyan-50    border-cyan-200",    darkBg: "dark:bg-cyan-950/40    dark:border-cyan-800/50",    badge: "bg-cyan-100    text-cyan-700    dark:bg-cyan-900/50    dark:text-cyan-300" },
    amber:   { accent: "text-amber-500",   lightBg: "bg-amber-50   border-amber-200",   darkBg: "dark:bg-amber-950/40   dark:border-amber-800/50",   badge: "bg-amber-100   text-amber-700   dark:bg-amber-900/50   dark:text-amber-300" },
    purple:  { accent: "text-purple-500",  lightBg: "bg-purple-50  border-purple-200",  darkBg: "dark:bg-purple-950/40  dark:border-purple-800/50",  badge: "bg-purple-100  text-purple-700  dark:bg-purple-900/50  dark:text-purple-300" },
    blue:    { accent: "text-blue-500",    lightBg: "bg-blue-50    border-blue-200",    darkBg: "dark:bg-blue-950/40    dark:border-blue-800/50",    badge: "bg-blue-100    text-blue-700    dark:bg-blue-900/50    dark:text-blue-300" },
    sky:     { accent: "text-sky-500",     lightBg: "bg-sky-50     border-sky-200",     darkBg: "dark:bg-sky-950/40     dark:border-sky-800/50",    badge: "bg-sky-100     text-sky-700     dark:bg-sky-900/50     dark:text-sky-300" },
    teal:    { accent: "text-teal-500",    lightBg: "bg-teal-50    border-teal-200",    darkBg: "dark:bg-teal-950/40    dark:border-teal-800/50",    badge: "bg-teal-100    text-teal-700    dark:bg-teal-900/50    dark:text-teal-300" },
    orange:  { accent: "text-orange-500",  lightBg: "bg-orange-50  border-orange-200",  darkBg: "dark:bg-orange-950/40  dark:border-orange-800/50",  badge: "bg-orange-100  text-orange-700  dark:bg-orange-900/50  dark:text-orange-300" },
    green:   { accent: "text-green-500",   lightBg: "bg-green-50   border-green-200",   darkBg: "dark:bg-green-950/40   dark:border-green-800/50",   badge: "bg-green-100   text-green-700   dark:bg-green-900/50   dark:text-green-300" },
    red:     { accent: "text-red-500",     lightBg: "bg-red-50     border-red-200",     darkBg: "dark:bg-red-950/40     dark:border-red-800/50",     badge: "bg-red-100     text-red-700     dark:bg-red-900/50     dark:text-red-300" },
};

const parseCurrency = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/R\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

const PIPELINE_STEPS = [
    { key: "novo",       label: "Novo"      },
    { key: "qualificado",label: "Qualif."   },
    { key: "site",       label: "Site"      },
    { key: "contato",    label: "Contato"   },
    { key: "reuniao",    label: "Reunião"   },
    { key: "fechamento", label: "Fechado"   },
] as const;

function getPipelineStep(status: Lead["status"], stages: any[]): number {
    const index = stages.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
}

function PipelineStepper({ status, stages }: { status: Lead["status"], stages: any[] }) {
    const currentStep = getPipelineStep(status, stages);
    const isDone = status === "ganhou";
    const isLost = status === "perdeu";
    const total  = stages.length;

    return (
        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="relative flex items-center w-full mb-1 px-0.5">
                {stages.map((stage, i) => {
                    const completed = isLost ? false : (isDone ? true : i < currentStep);
                    const active    = !isLost && !isDone && i === currentStep;
                    const isLast    = i === total - 1;
                    return (
                        <React.Fragment key={stage.key}>
                            <div className={["relative z-10 w-2 h-2 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300", completed ? "bg-zinc-900 dark:bg-white" : active ? "bg-zinc-900 dark:bg-white ring-4 ring-zinc-900/10 dark:ring-white/10" : isLost && i <= currentStep ? "bg-red-400" : "bg-zinc-200 dark:bg-zinc-800"].join(" ")}>
                                {completed && <div className="w-1 h-1 rounded-full bg-white dark:bg-zinc-900" />}
                            </div>
                            {!isLast && <div className="flex-1 h-[1.5px] mx-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden"><div className={["h-full rounded-full transition-all duration-500", completed ? "bg-zinc-900 dark:bg-white w-full" : active ? "bg-zinc-900/30 dark:bg-white/30 w-1/2" : "w-0"].join(" ")} /></div>}
                        </React.Fragment>
                    );
                })}
            </div>
            <div className="flex items-start w-full px-0.5">
                {stages.map((stage, i) => {
                    const completed = isLost ? false : (isDone ? true : i < currentStep);
                    const active    = !isLost && !isDone && i === currentStep;
                    const isLast    = i === total - 1;
                    // Only show text for first, last, and active to avoid cluttering
                    const shouldShowText = i === 0 || isLast || active;
                    return (
                        <React.Fragment key={stage.key}>
                            <span className={["text-[7px] font-black flex-shrink-0 leading-none uppercase tracking-tighter transition-colors duration-300", i === 0 ? "text-left" : isLast ? "text-right" : "text-center", completed ? "text-zinc-400" : active ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-300 dark:text-zinc-700", !shouldShowText && "opacity-0"].join(" ")} style={{ minWidth: 0 }}>{stage.label}</span>
                            {!isLast && <div className="flex-1" />}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

function LeadCard({ lead, accentBar, onClick, stages }: { lead: Lead; accentBar: string; onClick: (l: Lead) => void; stages: any[]; }) {
    const idStr = String(lead.id || "");
    const tempText = (idStr.charCodeAt(0) || 0) % 2 === 0 ? "QUENTE" : (idStr.charCodeAt(1) || 0) % 5 === 0 ? "FRIO" : "MORNO";
    const d = new Date(lead.created_at || Date.now());
    const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear().toString().slice(-2)}`;
    
    const cardValue = parseCurrency(lead.total_value) || parseCurrency(lead.value) || 0;

    return (
        <div onClick={() => onClick(lead)} className="group relative bg-card border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 mb-2.5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-[2px] hover:border-zinc-300 dark:hover:border-zinc-700 overflow-hidden outline-none">
            <div className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-l-xl opacity-80 ${accentBar}`} />
            <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-zinc-400 tracking-widest">#{idStr.substring(0, 6).toUpperCase()}</span>
                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700"><div className="w-1.5 h-1.5 rounded-full bg-zinc-400" /><span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">Daniela</span></div>
            </div>
            <div className="flex items-start justify-between gap-2">
                <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug tracking-tight">{lead.company_name || 'Sem nome'}</p>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500 p-1 -mt-0.5" onClick={async (e) => { e.stopPropagation(); if (confirm("Deseja excluir este lead?")) await supabase.from("leads").delete().eq("id", lead.id); }}><Trash2 size={12} /></button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
                {lead.niche && <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">{lead.niche}</span>}
                <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full inline-block ${tempText === 'QUENTE' ? 'bg-red-500' : tempText === 'MORNO' ? 'bg-amber-500' : 'bg-blue-500'}`} />{tempText}</span>
            </div>
            <div className="flex items-center justify-between mt-2.5">
                <span className="text-[14px] font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{formatBRL(cardValue)}</span>
                <div className="flex items-center gap-1"><span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500"><Clock size={10} /> {dateStr}</span></div>
            </div>
            <PipelineStepper status={lead.status} stages={stages} />
        </div>
    );
}

function StageManagerModal({ stages, setStages }: { stages: any[], setStages: (s: any[]) => void }) {
    const [localStages, setLocalStages] = useState(stages);
    const [isAdding, setIsAdding] = useState(false);
    const [newStage, setNewStage] = useState({ label: '', emoji: '✨', tw: 'zinc' });

    const handleSave = () => {
        setStages(localStages);
        localStorage.setItem('turbo_crm_stages', JSON.stringify(localStages));
        toast.success("Pipeline atualizado com sucesso!");
    };

    const addStage = () => {
        if (!newStage.label) return;
        const key = newStage.label.toLowerCase().replace(/\s+/g, '_');
        setLocalStages([...localStages, { ...newStage, key }]);
        setNewStage({ label: '', emoji: '✨', tw: 'zinc' });
        setIsAdding(false);
    };

    const removeStage = (key: string) => {
        setLocalStages(localStages.filter(s => s.key !== key));
    };

    const updateStage = (key: string, updates: any) => {
        setLocalStages(localStages.map(s => s.key === key ? { ...s, ...updates } : s));
    };

    const moveStage = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= localStages.length) return;
        const updated = [...localStages];
        const temp = updated[index];
        updated[index] = updated[newIndex];
        updated[newIndex] = temp;
        setLocalStages(updated);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Settings size={14} />
                    Configurar Funil
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Gerenciar Etapas do Funil</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-3">
                            {localStages.map((stage, index) => (
                                <div key={stage.key} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => moveStage(index, 'up')} disabled={index === 0} className="text-zinc-400 hover:text-zinc-900 disabled:opacity-30"><GripVertical size={12} className="rotate-90" /></button>
                                        <button onClick={() => moveStage(index, 'down')} disabled={index === localStages.length - 1} className="text-zinc-400 hover:text-zinc-900 disabled:opacity-30"><GripVertical size={12} className="rotate-270" /></button>
                                    </div>
                                    <Input 
                                        className="w-12 h-9 text-center p-0 text-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" 
                                        value={stage.emoji} 
                                        onChange={(e) => updateStage(stage.key, { emoji: e.target.value })}
                                    />
                                    <Input 
                                        className="flex-1 h-9 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-bold" 
                                        value={stage.label} 
                                        onChange={(e) => updateStage(stage.key, { label: e.target.value })}
                                    />
                                    <select 
                                        className="h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold px-2"
                                        value={stage.tw}
                                        onChange={(e) => updateStage(stage.key, { tw: e.target.value })}
                                    >
                                        {Object.keys(STAGE_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => removeStage(stage.key)}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        
                        {isAdding ? (
                            <div className="mt-4 p-4 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <Input placeholder="✨" className="w-12 h-9 text-center" value={newStage.emoji} onChange={(e) => setNewStage({...newStage, emoji: e.target.value})} />
                                    <Input placeholder="Nome da etapa..." className="flex-1 h-9" value={newStage.label} onChange={(e) => setNewStage({...newStage, label: e.target.value})} />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancelar</Button>
                                    <Button size="sm" onClick={addStage} className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-950">Adicionar</Button>
                                </div>
                            </div>
                        ) : (
                            <Button variant="ghost" className="w-full mt-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 h-12 gap-2 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400" onClick={() => setIsAdding(true)}>
                                <Plus size={16} /> Nova Etapa
                            </Button>
                        )}
                    </ScrollArea>
                </div>
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <Button variant="ghost" className="font-bold">Cancelar</Button>
                    <Button className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-black px-8" onClick={handleSave}>Salvar Alterações</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function FunilKanbanPage() {
    const [search, setSearch]       = useState("");
    const [leads, setLeads]         = useState<Lead[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [stages, setStages]       = useState(() => {
        try {
            const saved = localStorage.getItem('turbo_crm_stages');
            return saved ? JSON.parse(saved) : DEFAULT_STAGES;
        } catch (e) {
            console.error("Erro ao carregar estágios do pipeline:", e);
            return DEFAULT_STAGES;
        }
    });

    const fetchData = async () => {
        // Fetch leads
        const { data: leadsData, error: leadsError } = await supabase
            .from("leads")
            .select("*")
            .order("created_at", { ascending: false });
        
        if (!leadsError && leadsData) setLeads(leadsData as any);

        // Fetch ALL transactions to sum them up in frontend for each lead
        const { data: transData, error: transError } = await supabase
            .from("financial_transactions")
            .select("lead_id, valor, tipo");
        
        if (!transError && transData) setTransactions(transData);
    };

    useEffect(() => {
        fetchData();
        
        // Realtime for both leads and transactions
        const leadsChannel = supabase.channel("kanban-leads")
            .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, fetchData)
            .subscribe();
            
        const transChannel = supabase.channel("kanban-trans")
            .on("postgres_changes", { event: "*", schema: "public", table: "financial_transactions" }, fetchData)
            .subscribe();

        return () => { 
            supabase.removeChannel(leadsChannel); 
            supabase.removeChannel(transChannel);
        };
    }, []);

    const onDragEnd = async (result: any) => {
        if (!result.destination) return;
        const { destination, draggableId } = result;
        const newStatus = destination.droppableId;
        setLeads((prev) => prev.map(l => l.id === draggableId ? { ...l, status: newStatus as Lead["status"] } : l));
        await supabase.from("leads").update({ status: newStatus }).eq("id", draggableId);
    };

    // Merge logic: calculate real value from transactions for each lead
    const leadsWithRealValues = leads.map(lead => {
        const leadTrans = transactions.filter(t => t.lead_id === lead.id);
        const transSum = leadTrans.reduce((acc, t) => {
            const v = parseCurrency(t.valor);
            return t.tipo === 'saida' ? acc - v : acc + v;
        }, 0);

        return {
            ...lead,
            // Prioritize transaction sum if it exists, otherwise use saved values
            displayValue: transSum || parseCurrency(lead.total_value) || parseCurrency(lead.value) || 0
        };
    });

    const filtered = leadsWithRealValues.filter(l => 
        (l.company_name || "").toLowerCase().includes(search.toLowerCase()) || 
        (l.niche && l.niche.toLowerCase().includes(search.toLowerCase()))
    );

    const totalValue = filtered.reduce((acc, l) => acc + l.displayValue, 0);

    return (
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-[15px] font-black text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase leading-none">Pipeline de Vendas</h1>
                        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest leading-none mt-0.5">Gestão de Performance</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black tracking-tighter text-zinc-900 dark:text-zinc-100">{leads.length}</span>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Leads</span>
                        </div>
                        <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-700" />
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black tracking-tighter text-zinc-900 dark:text-zinc-100">{formatBRL(totalValue)}</span>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Volume</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <StageManagerModal stages={stages} setStages={setStages} />
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[12px] font-black hover:opacity-90 transition-all active:scale-95">
                            <Plus size={13} /> Novo Lead
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
                <div className="flex items-center justify-between gap-4 shrink-0">
                    <div className="relative flex-1 max-w-2xl">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                            placeholder="Pesquisar por empresa, nicho ou valor..." 
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-[14px] font-medium outline-none focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/5 transition-all shadow-sm" 
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[13px] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm">
                            <Download size={14} /> Exportar CSV
                        </button>
                    </div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-4 flex-1 overflow-x-auto overflow-y-hidden pb-4">
                        {stages.map((stage) => {
                            const stageLeads = filtered.filter(l => {
                                if (stage.key === "novo") return l.status === "novo" || !l.status;
                                if (stage.key === "kanban_ready") return l.status === "kanban_ready" || l.status === "gerando_site";
                                return l.status === stage.key;
                            });
                            
                            const stageValue = stageLeads.reduce((acc, l) => acc + l.displayValue, 0);
                            const sc = STAGE_COLORS[stage.tw] || STAGE_COLORS.zinc;

                            return (
                                <div key={stage.key} className="flex flex-col w-64 min-w-[256px] shrink-0">
                                    <div className="flex items-center justify-between px-3 py-2 mb-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                        <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest leading-none">{stage.label}</span>
                                        <span className="text-[10px] font-black bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 w-5 h-5 flex items-center justify-center rounded-md">
                                            {stageLeads.length}
                                        </span>
                                    </div>

                                    <Droppable droppableId={stage.key}>
                                        {(provided) => (
                                            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar" ref={provided.innerRef} {...provided.droppableProps}>
                                                {stageLeads.map((lead, index) => (
                                                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                        {(provided) => (
                                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                                <LeadCard 
                                                                    lead={lead} 
                                                                    accentBar={sc.accent} 
                                                                    onClick={setSelectedLead} 
                                                                    stages={stages}
                                                                />
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>

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
