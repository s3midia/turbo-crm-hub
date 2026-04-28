import React from 'react';
import { X, CheckCircle, XCircle, Settings, User, Building2, Tag, Calendar, Filter } from 'lucide-react';

interface Lead {
    id: string;
    name: string;
    phone: string;
    date: string;
    source: string;
    score?: number;
    stage: string;
}

interface LeadDetailsSidebarProps {
    lead: Lead | null;
    onClose: () => void;
}

export function LeadDetailsSidebar({ lead, onClose }: LeadDetailsSidebarProps) {
    if (!lead) return null;

    const pipelineStages = [
        "Vendas B2B", "Nova", "Em Atend...", "Qualificação", "Agendado", "Reunião", "Apresentação", "Fechamento", "Ganhou", "Perdeu"
    ];

    const timelineEvents = [
        { time: "9:57 AM", title: "Etapa alterada", detail: "Vazio → Fechar Contrato" },
        { time: "9:57 AM", title: "Atualizou o campo", detail: "Assinante é Sócio? Vazio → SIM" },
        { time: "9:57 AM", title: "Atualizou o campo", detail: "Vencimento: Vazio → 2025-04-02" },
        { time: "9:33 AM", title: "Atualizou o campo", detail: "Resumo da Call → Apresentação para clientes indicação do Augusto." },
    ];

    const tags = [
        "CNPJ", "Clientes com Instancia", "Formulário Assinatura", "Funil B2B - Fechar Contrato", "Leads ABERTOS e PERDIDOS", "Leads com Op Aberta B2B", "Origem", "TODOS"
    ];

    return (
        <div className="absolute inset-y-0 right-0 w-full max-w-[850px] bg-background shadow-[-10px_0_30px_rgba(0,0,0,0.5)] border-l border-border z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#1a1c2a] border-b border-border text-white">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold truncate max-w-[300px]">{lead.name}</h2>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-1.5 bg-green-500 hover:bg-green-600 font-bold rounded text-white text-sm transition-colors">
                        Ganhou
                    </button>
                    <button className="px-4 py-1.5 bg-red-500 hover:bg-red-600 font-bold rounded text-white text-sm transition-colors">
                        Perdeu
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-gray-600 mx-2" />
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Pipeline ribbon */}
            <div className="flex overflow-x-auto bg-[#1e2132] py-2 px-4 gap-1 hide-scrollbar border-b border-border">
                {pipelineStages.map((stageName, idx) => {
                    // Mapping lead.stage keys to display names in the ribbon
                    const stageMapping: Record<string, string> = {
                        "vendas_b2b": "Vendas B2B",
                        "novo": "Nova",
                        "atendimento": "Em Atend...",
                        "qualificacao": "Qualificação",
                        "agendado": "Agendado",
                        "reuniao": "Reunião",
                        "apresentacao": "Apresentação",
                        "fechamento": "Fechamento",
                        "ganhou": "Ganhou",
                        "perdeu": "Perdeu"
                    };
                    
                    const isActive = stageMapping[lead.stage] === stageName;

                    return (
                        <div key={idx} className="flex-shrink-0 relative group">
                            <div className={`
                                px-4 py-1.5 text-xs font-bold rounded cursor-pointer transition-colors
                                ${isActive ? 'bg-primary text-primary-foreground' : 'bg-[#2a2d40] text-gray-400 hover:bg-[#32364c]'}
                            `}>
                                {stageName}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Column - Details */}
                <div className="w-[350px] flex flex-col border-r border-border bg-card overflow-y-auto">
                    {/* Tabs */}
                    <div className="flex items-center px-4 pt-2 border-b border-border">
                        <button className="px-4 py-2 text-sm font-bold text-primary border-b-2 border-primary">Geral</button>
                        <button className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Asaas</button>
                        <button className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Call</button>
                    </div>

                    <div className="p-5 space-y-6">
                        <p className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Sobre o Negócio</p>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1"><Building2 className="w-3.5 h-3.5" /> Valor</p>
                                <p className="text-2xl font-bold">R$ 0,00</p>
                            </div>
                            
                            <div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5" /> Data de Criação</p>
                                <p className="text-sm">{lead.date}</p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">Status</p>
                                <p className="text-sm font-medium">Aberto</p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2"><User className="w-3.5 h-3.5" /> Responsável</p>
                                <div className="flex items-center gap-2 border border-border p-2 rounded-md bg-muted/20">
                                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-white">AH</div>
                                    <span className="text-sm font-medium">Afonso Henrique</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border pt-6">
                            <p className="text-xs text-muted-foreground mb-2">Cliente</p>
                            <div className="p-3 border border-border rounded-[var(--radius)] bg-muted/10 space-y-1">
                                <p className="text-xs text-muted-foreground">Contato</p>
                                <p className="text-sm font-bold">{lead.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{lead.phone}</p>
                            </div>
                        </div>

                        <div className="border-t border-border pt-6">
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3"><User className="w-3.5 h-3.5" /> Segmentos</p>
                            <div className="flex flex-col gap-2">
                                {tags.map(tag => (
                                    <div key={tag} className="text-xs font-medium text-primary border-l-2 border-primary pl-2 py-0.5">
                                        {tag}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - History */}
                <div className="flex-1 flex flex-col bg-muted/10 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 px-4 pt-2 border-b border-border bg-card overflow-x-auto hide-scrollbar">
                        <button className="px-4 py-2 text-sm font-bold text-primary border-b-2 border-primary whitespace-nowrap">Histórico</button>
                        <button className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground whitespace-nowrap">Comentários</button>
                        <button className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground whitespace-nowrap">Tarefas</button>
                        <button className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground whitespace-nowrap">Atendimento</button>
                        <button className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground whitespace-nowrap">E-mail</button>
                        <button className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground whitespace-nowrap">Ligações</button>
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6 border-b border-border pb-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            <button className="flex items-center gap-1.5 text-xs font-bold hover:text-primary transition-colors">
                                <Filter className="w-3.5 h-3.5" /> Filtrar
                            </button>
                        </div>

                        <div className="space-y-6">
                            {timelineEvents.map((evt, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="relative flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center z-10">
                                            <Settings className="w-4 h-4" />
                                        </div>
                                        {idx !== timelineEvents.length - 1 && (
                                            <div className="w-px h-full bg-border absolute top-8" />
                                        )}
                                    </div>
                                    <div className="flex-1 bg-card border border-border rounded-lg p-3 shadow-sm">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="text-sm font-bold text-foreground">{evt.title}</h4>
                                            <span className="text-xs text-muted-foreground">{evt.time}</span>
                                        </div>
                                        <div className="bg-muted/30 rounded p-2 text-sm border border-border/50 text-muted-foreground">
                                            {evt.detail}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
