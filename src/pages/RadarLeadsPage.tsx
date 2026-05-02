import React, { useState, useEffect, useMemo } from "react";
import {
    Search, Plus, Bot, Filter, Download, Trash2, MapPin, 
    AlertCircle, Loader2, MessageSquare, X, Phone, Globe,
    Building2, ChevronRight, Star, Sparkles, Clock, Users,
    Target, Zap, Edit3, Image as ImageIcon, FileText, CheckCircle2,
    LayoutDashboard, CheckSquare, Square, ThumbsUp, ThumbsDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateAgentResponse } from "@/lib/gemini";
import { executeAgentTool } from "@/lib/agentActions";
import { formatDateTime } from "@/lib/formatters";

export interface Lead {
    id: string;
    company_name: string;
    phone: string | null;
    niche: string | null;
    region: string | null;
    status: string | null;
    site_url: string | null;
    created_at: string;
    // CRM
    estado?: string;
    cidade?: string;
    score?: number;
    flags?: string[];
    copy_h1?: string;
    copy_subheadline?: string;
    servicos?: string;
    proposta_valor?: string;
    diferenciais?: string;
    depoimentos?: string;
    // Deep Search
    instagram_url?: string;
    website_url?: string;
    logo_url?: string;
    feed_images?: string[];
    partners?: Array<{ name: string; role: string }>;
    cnpj?: string;
    assigned_agent?: string;
    full_copy?: string;
}

const STATUS_CONFIG: Record<string, any> = {
    novo: { label: 'Aguardando', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
    qualificado: { label: 'Qualificado', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: Star },
    kanban_ready: { label: 'No Funil', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: Target },
    gerando_site: { label: 'Criando Site', color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200', icon: Loader2 },
    site_pronto: { label: 'Site Pronto', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
    atendimento: { label: 'Em Atendimento', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: MessageSquare },
    perdido: { label: 'Descartado', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: X },
    pesquisa_profunda: { label: 'Icarus Pesquisando', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: Loader2 }
};

function getStatusConfig(status: string | null) {
    return STATUS_CONFIG[status || 'novo'] || STATUS_CONFIG['novo'];
}

// 🎯 SCORING ENGINE (0-100)
function calculateLeadScore(lead: Lead) {
    let score = 0;
    const breakdown = [];
    const flags = [];

    // 1. Digital Presence (Site) - 25 pts
    if (!lead.website_url && !lead.site_url) {
        score += 25;
        breakdown.push({ label: 'Sem Site (Oportunidade)', pts: 25 });
        flags.push('Sem site estruturado');
    } else {
        score += 5; // Has site, but we assume it can be improved
        breakdown.push({ label: 'Possui Site (Melhoria)', pts: 5 });
    }

    // 2. Instagram - 15 pts
    if (!lead.instagram_url) {
        score += 15;
        breakdown.push({ label: 'Sem Instagram', pts: 15 });
        flags.push('Sem presença social');
    } else if (!lead.feed_images || lead.feed_images.length === 0) {
        score += 10;
        breakdown.push({ label: 'Instagram Fraco', pts: 10 });
        flags.push('Instagram com baixo engajamento/visual');
    } else {
        score += 5;
        breakdown.push({ label: 'Instagram Ativo', pts: 5 });
    }

    // 3. Google Reviews - 15 pts (Simulated logic based on AI / future data)
    score += 10; // Base score for reviews potential
    breakdown.push({ label: 'Potencial Google', pts: 10 });

    // 4. Financial Potential (Niche) - 20 pts
    const highTicket = ['clinica', 'medico', 'dentista', 'construtora', 'engenharia', 'agro', 'imobiliaria'];
    const isHighTicket = highTicket.some(n => lead.niche?.toLowerCase().includes(n));
    if (isHighTicket) {
        score += 20;
        breakdown.push({ label: 'Nicho Alto Ticket', pts: 20 });
    } else {
        score += 10;
        breakdown.push({ label: 'Nicho Médio', pts: 10 });
    }

    // 5. Company Structure - 10 pts
    if (lead.partners && lead.partners.length > 1) {
        score += 10;
        breakdown.push({ label: 'Sociedade Estabelecida', pts: 10 });
    } else {
        score += 5;
        breakdown.push({ label: 'Estrutura Base', pts: 5 });
    }

    // 6. Marketing Needs - 15 pts
    if (!lead.site_url) {
        score += 15;
        breakdown.push({ label: 'Falta Funil Escala', pts: 15 });
        flags.push('Necessita Landing Page Urgente');
    } else {
        score += 5;
        breakdown.push({ label: 'Funil Básico', pts: 5 });
    }

    let classification = { label: 'Frio', color: 'bg-slate-100 text-slate-600', icon: '🟡' };
    if (score >= 80) classification = { label: 'Quente!', color: 'bg-rose-100 text-rose-700', icon: '🔥' };
    else if (score >= 60) classification = { label: 'Morno', color: 'bg-amber-100 text-amber-700', icon: '⚡' };
    else if (score >= 40) classification = { label: 'Frio', color: 'bg-blue-100 text-blue-700', icon: '🧊' };

    let salesMessage = '';
    if (!lead.website_url && !lead.site_url) {
        salesMessage = `Fala, [Nome]!\nAnalisei a presença digital da ${lead.company_name} e vi que vocês ainda não possuem um site estruturado.\nHoje isso pode estar fazendo vocês perderem clientes todos os dias no Google.\nTrabalho ajudando empresas a criar páginas que realmente geram clientes.\nPosso te mostrar uma ideia rápida aplicada ao seu negócio?`;
    } else {
        salesMessage = `Fala, [Nome]!\nDei uma olhada na presença digital da ${lead.company_name} e vi alguns pontos que podem estar reduzindo suas conversões.\nHoje não basta só ter presença, ela precisa vender.\nPosso te mostrar melhorias rápidas que aumentam a entrada de clientes?`;
    }
    if(isHighTicket) {
        salesMessage = `Fala, [Nome]!\nAnalisei a presença digital da ${lead.company_name} e identifiquei oportunidades claras de aumentar o número de clientes usando páginas de alta conversão.\nHoje muitas empresas do seu setor estão escalando com isso.\nSe fizer sentido, posso mostrar como aplicar isso rápido para vocês.`;
    }

    return { total: Math.min(score, 100), breakdown, classification, flags, salesMessage, isPremium: isHighTicket };
}

// ─────────────────────────────────────────────────────────
// TIMELINE COMPONENT
// ─────────────────────────────────────────────────────────
function TimelineTab({ leadId }: { leadId: string }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        const { data, error } = await supabase
            .from('agent_logs')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });
        
        if (!error) setLogs(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
        const sub = supabase.channel(`timeline-${leadId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_logs', filter: `lead_id=eq.${leadId}` }, fetchLogs)
            .subscribe();
        return () => { supabase.removeChannel(sub); };
    }, [leadId]);

    if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-600" /> Histórico de Atividades
            </h3>
            <div className="relative border-l-2 border-slate-100 ml-3 pl-8 space-y-8">
                {logs.length > 0 ? logs.map((log, i) => (
                    <div key={log.id} className="relative">
                        <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center">
                            <div className={`w-2 h-2 rounded-full ${log.type === 'success' ? 'bg-emerald-500' : log.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                    Agent: {log.agent_id}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {formatDateTime(log.created_at)}
                                </span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                {log.message}
                            </p>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 -ml-8">
                        <p className="text-sm text-slate-400">Nenhuma atividade registrada para este lead.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function RadarDeLeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    
    // CRM
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [activeTab, setActiveTab] = useState<'gerais' | 'inteligencia' | 'copy' | 'arquivos' | 'landing' | 'timeline'>('gerais');
    const [qualifying, setQualifying] = useState<string | null>(null);
    const [scores, setScores] = useState<Record<string, any>>({});
    
    // Filters
    const [filterParams, setFilterParams] = useState({ search: '', status: 'all', niche: '', minScore: 0 });
    
    // Prospect inputs
    const [nicheInput, setNicheInput] = useState(localStorage.getItem('rafa_current_niche') || "Dentistas");
    const [locationInput, setLocationInput] = useState("São Paulo SP");
    const [cnpjInput, setCnpjInput] = useState("");
    const [searchingCnpj, setSearchingCnpj] = useState(false);

    // Edit Copy
    const [copyData, setCopyData] = useState<any>({});
    const [savingCopy, setSavingCopy] = useState(false);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            
            const fetched = data || [];
            
            // Auto calc scores for UI
            const newScores: any = {};
            fetched.forEach(l => {
                newScores[l.id] = calculateLeadScore(l);
            });
            setScores(newScores);
            setLeads(fetched);
            
        } catch (error: any) {
            toast.error("Erro ao carregar leads: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
        const sub = supabase.channel('radar-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads).subscribe();
        return () => { supabase.removeChannel(sub); };
    }, []);

    const handleScan = async () => {
        setScanning(true);
        toast.info(`Agente Bia prospectando "${nicheInput}" em ${locationInput}...`);
        try {
            const res = await fetch('http://localhost:3500/apify-search', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: nicheInput, location: locationInput })
            });
            const data = await res.json();

            if (data.results?.length > 0) {
                const toSave = data.results.map((i: any) => ({
                    company_name: i.title || i.name || 'Empresa',
                    phone: i.phone || i.phoneNumber || null,
                    niche: nicheInput, region: i.address || i.street || locationInput,
                    status: 'novo'
                }));
                const { error } = await supabase.from('leads').insert(toSave);
                if (error) throw error;
                toast.success(`${toSave.length} leads encontrados!`);
            } else {
                toast.warning("Nenhum lead encontrado.");
            }
        } catch (err: any) {
            toast.error("Erro: " + err.message);
        } finally {
            setScanning(false);
        }
    };

    const handleDeepSearch = async (lead: Lead) => {
        setQualifying(lead.id);
        toast.info(`Icarus iniciou Pesquisa Profunda para "${lead.company_name}"...`);
        try {
            const result = await executeAgentTool({
                name: "deep_research",
                parameters: { lead_id: lead.id, company_name: lead.company_name, region: lead.region, cnpj: lead.cnpj || "" },
                agentId: "icarus"
            });
            if (result.success && 'data' in result) {
                toast.success(`Pesquisa finalizada!`);
                fetchLeads(); // refresh for new data
            }
        } catch (err: any) {
            toast.error("Erro: " + err.message);
        } finally {
            setQualifying(null);
        }
    };

    const handleQualifyWithAI = async (lead: Lead) => {
        setQualifying(lead.id);
        try {
            await supabase.from('agent_logs').insert({ agent_id: 'clara', message: `🔍 [Lead:${lead.id}] Clara Analisando ${lead.company_name}...`, type: 'loading' });
            
            // Enrich copy via AI
            const prompt = `
                Você é a Rafa, especialista em copy e vendas.
                Analise esta empresa e crie dados persuasivos para uma futura Landing Page.
                Empresa: ${lead.company_name} / Nicho: ${lead.niche} / Região: ${lead.region}
                
                Responda com um JSON:
                {
                  "copy_h1": "Headline forte e direta",
                  "copy_subheadline": "Explicação complementar do benefício",
                  "servicos": "Lista de 3 serviços principais (separados por vírgula)",
                  "proposta_valor": "Por que escolher essa empresa?",
                  "recomendacao": "Enviar para Kanban"
                }
            `;
            
            const resp = await generateAgentResponse(prompt);
            const match = resp.match(/\{[\s\S]*\}/);
            if(match) {
                const aiData = JSON.parse(match[0]);
                
                // Formatar Copy Estruturada padrão I.A.
                const fullCopy = `
# ${aiData.copy_h1}
${aiData.copy_subheadline}

## Nossos Serviços
${aiData.servicos.split(',').map((s:string) => `- ${s.trim()}`).join('\n')}

## Por que nos escolher?
${aiData.proposta_valor}

---
*Gerado automaticamente pela Clara (Copymaker)*
                `.trim();

                await supabase.from('leads').update({
                    status: 'qualificado',
                    assigned_agent: 'clara',
                    copy_h1: aiData.copy_h1,
                    copy_subheadline: aiData.copy_subheadline,
                    servicos: aiData.servicos,
                    proposta_valor: aiData.proposta_valor,
                    full_copy: fullCopy
                }).eq('id', lead.id);

                await supabase.from('agent_logs').insert({ 
                    agent_id: 'clara', 
                    lead_id: lead.id,
                    message: `📝 [COPY] Clara gerou copy estruturada para ${lead.company_name}.`, 
                    type: 'success' 
                });

                toast.success(`Lead ${lead.company_name} qualificado e Copy gerada!`);
                fetchLeads();
            }
        } catch(err:any) {
            console.error("Erro na qualificação Rafa:", err);
            const errorMsg = `❌ Falha na qualificação: ${err.message || "Erro desconhecido"}`;
            
            await supabase.from('agent_logs').insert({ 
                agent_id: 'clara', 
                lead_id: lead.id,
                message: errorMsg, 
                type: 'error' 
            });

            toast.error(errorMsg);
        } finally {
            setQualifying(null);
        }
    };

    const saveCopyTab = async () => {
        if(!selectedLead) return;
        setSavingCopy(true);
        try {
            await supabase.from('leads').update(copyData).eq('id', selectedLead.id);
            toast.success("Dados de Copy salvos!");
            fetchLeads();
        } catch(e) { toast.error("Erro ao salvar copy"); }
        finally { setSavingCopy(false); }
    };

    const handleSendToKanban = async (lead: Lead) => {
        await supabase.from('leads').update({ 
            status: 'kanban_ready',
            assigned_agent: 'dani' 
        }).eq('id', lead.id);
        toast.success("Lead no Funil prado deploy da Dani!");
        fetchLeads();
    };

    const filtered = useMemo(() => leads.filter(l => {
        const sc = scores[l.id]?.total || 0;
        if(filterParams.minScore > 0 && sc < filterParams.minScore) return false;
        if(filterParams.status !== 'all' && getStatusConfig(l.status).label !== filterParams.status && l.status !== filterParams.status) return false;
        if(filterParams.niche && !l.niche?.toLowerCase().includes(filterParams.niche.toLowerCase())) return false;
        if(filterParams.search && !l.company_name.toLowerCase().includes(filterParams.search.toLowerCase())) return false;
        return true;
    }).sort((a,b) => (scores[b.id]?.total || 0) - (scores[a.id]?.total || 0)), [leads, filterParams, scores]);

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Hbar */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Target className="w-6 h-6 text-rose-600" /> Radar CRM
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">Capture e qualifique leads (Rafa), prepare páginas (Dani).</p>
                </div>
                <div className="flex gap-2">
                    <input value={nicheInput} onChange={e => setNicheInput(e.target.value)} placeholder="Nicho..." className="border rounded-lg px-3 py-2 text-sm w-32" />
                    <input value={locationInput} onChange={e => setLocationInput(e.target.value)} placeholder="Região..." className="border rounded-lg px-3 py-2 text-sm w-32" />
                    <button onClick={handleScan} disabled={scanning} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 flex-shrink-0 transition-colors">
                        {scanning ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>} Prospecção Bia
                    </button>
                    <button onClick={() => setViewMode(v => v === 'grid' ? 'table' : 'grid')} className="ml-2 p-2 border rounded-lg bg-white hover:bg-slate-50">
                        {viewMode === 'grid' ? <LayoutDashboard className="w-5 h-5 text-slate-600"/> : <Filter className="w-5 h-5 text-slate-600"/>}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="px-8 py-3 bg-white border-b border-slate-100 flex gap-4 shrink-0 items-center">
                <input placeholder="Buscar empresa..." className="border rounded-lg px-3 py-1.5 text-sm" onChange={e => setFilterParams(p => ({...p, search: e.target.value}))} />
                <select className="border rounded-lg px-3 py-1.5 text-sm outline-none" onChange={e => setFilterParams(p => ({...p, status: e.target.value}))}>
                    <option value="all">Ver Todos os Status</option>
                    <option value="novo">Aguardando</option>
                    <option value="qualificado">Qualificado</option>
                    <option value="kanban_ready">No Funil</option>
                </select>
                <select className="border rounded-lg px-3 py-1.5 text-sm outline-none bg-rose-50 border-rose-200 text-rose-700 font-bold" onChange={e => setFilterParams(p => ({...p, minScore: Number(e.target.value)}))}>
                    <option value="0">Todos os Scores</option>
                    <option value="80">🔥 Score 80+ (Quentes)</option>
                    <option value="60">⚡ Score 60+ (Mornos+)</option>
                </select>
                <span className="text-xs text-slate-400 ml-auto font-medium">{filtered.length} leads listados</span>
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-y-auto p-8 relative">
                {loading ? (
                    <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>
                ) : viewMode === 'grid' ? (
                    /* CRM CARDS GRID */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map(l => {
                            const sc = scores[l.id];
                            const st = getStatusConfig(l.status);
                            return (
                                <div key={l.id} onClick={() => { setSelectedLead(l); setCopyData({
                                    full_copy: l.full_copy||''
                                }); }} className={`bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:border-rose-400 hover:shadow-xl hover:-translate-y-1 transition-all ${sc?.total >= 80 ? 'ring-2 ring-rose-100' : ''}`}>
                                     <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`px-2 py-1 rounded text-xs font-black flex items-center gap-1 ${sc?.classification.color}`}>
                                                <span>{sc?.classification.icon}</span> {sc?.total}
                                            </div>
                                            {sc?.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">Premium</span>}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[10px] uppercase font-bold ${st.color}`}>{st.label}</span>
                                            {l.assigned_agent && (
                                                <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                                    <Bot className="w-2.5 h-2.5 text-slate-500" />
                                                    <span className="text-[9px] font-black text-slate-500 uppercase">{l.assigned_agent}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-1 truncate">{l.company_name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 font-medium">
                                        <MapPin className="w-3 h-3"/> <span className="truncate">{l.region || 'Sem região'}</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {sc?.flags.slice(0, 2).map((f:string, i:number) => (
                                            <div key={i} className="bg-red-50 border border-red-100 text-red-600 text-[10.px] py-1 px-2 rounded-lg flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3"/> <span className="truncate">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-xs text-slate-400 font-mono">{l.niche || 'Geral'}</span>
                                        {l.phone && <Phone className="w-3.5 h-3.5 text-emerald-500" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider">Empresa</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider">Lead Score</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider">Região</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider text-center">Contato</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(l => {
                                    const sc = scores[l.id];
                                    const st = getStatusConfig(l.status);
                                    return (
                                        <tr key={l.id} 
                                            onClick={() => { setSelectedLead(l); setCopyData({
                                                full_copy: l.full_copy||''
                                            }); }}
                                            className="hover:bg-slate-50 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                                        {l.company_name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 leading-none mb-1">{l.company_name}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium">{l.niche || 'Geral'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`px-2 py-1 rounded text-[10px] font-black flex items-center gap-1 ${sc?.classification.color}`}>
                                                        <span>{sc?.classification.icon}</span> {sc?.total}
                                                    </div>
                                                    {sc?.isPremium && <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">Premium</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${st.bg} ${st.color} border ${st.border}`}>
                                                    <st.icon className="w-3 h-3" /> {st.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                    <MapPin className="w-3 h-3"/> {l.region || 'Sem região'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {l.phone ? (
                                                    <a href={`https://wa.me/${l.phone.replace(/\D/g, '')}`} target="_blank" onClick={(e) => e.stopPropagation()} className="inline-flex p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                                                        <MessageSquare className="w-4 h-4" />
                                                    </a>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-rose-600 border border-transparent hover:border-slate-200">
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="p-12 text-center text-slate-400 font-medium">Nenhum lead encontrado com os filtros atuais.</div>
                        )}
                    </div>
                )}
            </div>

            {/* 🪟 CRM 5-TAB LEAD MODAL */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white p-6 shrink-0 flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center font-black text-2xl">
                                    {selectedLead.logo_url ? <img src={selectedLead.logo_url} className="w-full h-full object-cover rounded-2xl"/> : selectedLead.company_name[0]}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">{selectedLead.company_name}</h2>
                                    <div className="flex items-center gap-3 mt-1.5 text-sm text-white/60 font-medium">
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {selectedLead.region || 'Local desconhecido'}</span>
                                        <span className="flex items-center gap-1"><Building2 className="w-4 h-4"/> {selectedLead.niche || 'Sem nicho'}</span>
                                        {selectedLead.cnpj && <span className="font-mono bg-white/10 px-2 rounded">CNPJ: {selectedLead.cnpj}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {(selectedLead.status === 'novo' || selectedLead.status === 'qualificado') && (
                                <button onClick={() => { handleSendToKanban(selectedLead); setSelectedLead(null); }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition">
                                    <Zap className="w-4 h-4"/> Enviar p/ Deploy (Dani)
                                </button>
                                )}
                                <button onClick={() => setSelectedLead(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition"><X className="w-5 h-5"/></button>
                            </div>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex bg-slate-50 border-b border-slate-200 px-6 pt-2 shrink-0">
                            {[
                                { id: 'gerais', icon: Target, label: 'Gerais e Contato' },
                                { id: 'inteligencia', icon: Sparkles, label: 'Inteligência Icarus' },
                                { id: 'copy', icon: Edit3, label: 'Copy & AI' },
                                { id: 'arquivos', icon: ImageIcon, label: 'Mídia' },
                                { id: 'timeline', icon: Clock, label: 'Linha do Tempo' },
                                { id: 'landing', icon: Globe, label: 'Landing Page' },
                            ].map(t => (
                                <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === t.id ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                                    <t.icon className="w-4 h-4" /> {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white">
                            {/* TAB 1: GERAIS */}
                            {activeTab === 'gerais' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-black text-slate-800">Dados do Contato</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">WhatsApp</p>
                                            <div className="flex items-center justify-between">
                                                <p className="font-bold text-lg text-slate-800">{selectedLead.phone || 'Não informado'}</p>
                                                {selectedLead.phone && (
                                                    <a href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`} target="_blank" className="bg-[#25D366] text-white p-2 rounded-lg hover:bg-[#128C7E]">
                                                        <MessageSquare className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status no CRM</p>
                                            <p className="font-bold text-lg text-slate-800">{getStatusConfig(selectedLead.status).label}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Criação do Lead</p>
                                            <p className="font-bold text-lg text-slate-800">{formatDateTime(selectedLead.created_at)}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sócios / Sócios Diretores</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedLead.partners && selectedLead.partners.length > 0 ? (
                                                    selectedLead.partners.map((p:any, i:number) => (
                                                        <div key={i} className="bg-white border rounded-xl px-3 py-2 shadow-sm flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-rose-500" />
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">{p.name}</p>
                                                                <p className="text-[10px] text-slate-500 font-medium uppercase">{p.role}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : <p className="text-sm text-slate-400 italic">Nenhum sócio identificado ainda.</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-between bg-slate-50">
                                        <div>
                                            <h4 className="font-bold text-slate-800">Precisa encontrar os sócios?</h4>
                                            <p className="text-sm text-slate-500">Icarus pode buscar na Receita e cruzar Instagrams.</p>
                                        </div>
                                        <button onClick={() => handleDeepSearch(selectedLead)} disabled={qualifying === selectedLead.id} className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2">
                                            {qualifying === selectedLead.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4"/>} Cruzar Dados (Bia)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: INTELIGÊNCIA */}
                            {activeTab === 'inteligencia' && (() => {
                                const sc = scores[selectedLead.id] || calculateLeadScore(selectedLead);
                                return (
                                <div className="grid grid-cols-2 gap-6 relative">
                                    {/* Left Col - Score Card */}
                                    <div className="space-y-6">
                                        <div className={`p-6 rounded-3xl ${sc.classification.color} bg-opacity-20 border-2 ${sc.total>=80 ? 'border-rose-200' : 'border-transparent'}`}>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-sm font-black uppercase tracking-wider opacity-60">Lead Score</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-black ${sc.classification.color}`}>
                                                    {sc.classification.icon} {sc.classification.label}
                                                </span>
                                            </div>
                                            <div className="flex items-end gap-2 text-6xl font-black">
                                                {sc.total}<span className="text-2xl opacity-40 mb-2">/100</span>
                                            </div>
                                            <div className="w-full bg-black/5 rounded-full h-3 mt-4 overflow-hidden">
                                                <div className="h-full bg-current rounded-full transition-all duration-1000" style={{width: `${sc.total}%`}}></div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                            <h4 className="text-xs font-black uppercase text-slate-400 mb-4">Critérios (Por que?)</h4>
                                            <div className="space-y-3">
                                                {sc.breakdown.map((b:any, i:number) => (
                                                    <div key={i} className="flex items-center justify-between text-sm">
                                                        <span className="font-bold text-slate-700">{b.label}</span>
                                                        <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded">+{b.pts}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Col - Oportunities */}
                                    <div className="space-y-6">
                                        {sc.flags.length > 0 && (
                                            <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-xl">
                                                <h4 className="flex items-center gap-2 text-red-800 font-bold mb-3"><AlertCircle className="w-5 h-5"/> Oportunidades Claras</h4>
                                                <ul className="space-y-2">
                                                    {sc.flags.map((f:string, i:number) => (
                                                        <li key={i} className="text-red-700 text-sm font-medium flex items-start gap-2">
                                                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0"/> {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Template de Abordagem Mágica</h4>
                                                <button onClick={() => { navigator.clipboard.writeText(sc.salesMessage); toast.success("Copiado!"); }} className="text-sm font-bold text-indigo-600 hover:underline">
                                                    Copiar texto
                                                </button>
                                            </div>
                                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-sm text-indigo-900 whitespace-pre-line font-medium leading-relaxed">
                                                {sc.salesMessage}
                                            </div>
                                        </div>
                                        
                                        {(selectedLead.status === 'novo' || !selectedLead.status) && (
                                            <button onClick={() => handleQualifyWithAI(selectedLead)} disabled={qualifying === selectedLead.id} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2">
                                                {qualifying === selectedLead.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>} Re-Qualificar com IA
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )})()}

                            {/* TAB 3: COPY EDITÁVEL */}
                            {activeTab === 'copy' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-slate-500 text-sm">A Dani usará esses textos automaticamente para criar a Landing Page do cliente.</p>
                                        <button onClick={saveCopyTab} disabled={savingCopy} className="bg-rose-600 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 text-sm disabled:opacity-50">
                                            {savingCopy ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckSquare className="w-4 h-4"/>} Salvar Copy
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-5">
                                        <div>
                                            <label className="block text-xs font-black uppercase text-slate-500 mb-2">Copy Estruturada (Proposta Comercial)</label>
                                            <textarea 
                                                value={copyData.full_copy} 
                                                onChange={e => setCopyData({...copyData, full_copy: e.target.value})} 
                                                className="w-full border-2 border-slate-200 rounded-2xl p-6 text-sm text-slate-700 font-mono focus:border-rose-400 focus:outline-none bg-slate-50 leading-relaxed shadow-inner" 
                                                rows={12} 
                                                placeholder="# Título do Site\nSubtítulo impactante...\n\n## Serviços\n- Serviço 1\n- Serviço 2" 
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="bg-indigo-50 p-4 border border-indigo-100 rounded-2xl flex items-start gap-4 mt-6">
                                        <Bot className="w-8 h-8 text-indigo-500 bg-white p-1.5 rounded-lg shrink-0"/>
                                        <div>
                                            <h4 className="font-bold text-indigo-900 mb-1">Texto Corrido e Estruturado</h4>
                                            <p className="text-sm text-indigo-700">Utilizamos o padrão de I.A para criar textos persuasivos. Você pode editar o Markdown acima diretamente.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: MÍDIA */}
                            {activeTab === 'arquivos' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-black uppercase text-slate-400 tracking-wider">Identidade (Logo)</h4>
                                            <div className="aspect-square w-32 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                                                {selectedLead.logo_url ? (
                                                    <img src={selectedLead.logo_url} className="w-full h-full object-contain p-2" />
                                                ) : <ImageIcon className="w-8 h-8 text-slate-300" />}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-black uppercase text-slate-400 tracking-wider">Ação</h4>
                                            <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                                                <Plus className="w-4 h-4"/> Adicionar Mídia
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-black uppercase text-slate-400 tracking-wider mb-4">Galeria de Fotos / Feed</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            {selectedLead.feed_images && selectedLead.feed_images.length > 0 ? (
                                                selectedLead.feed_images.map((img, i) => (
                                                    <div key={i} className="aspect-square rounded-xl overflow-hidden border-2 border-slate-100 hover:border-rose-200 transition-colors">
                                                        <img src={img} className="w-full h-full object-cover" />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-4 py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                    <p className="text-sm text-slate-400">Nenhuma foto encontrada no Instagram ainda.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 6: TIMELINE */}
                            {activeTab === 'timeline' && <TimelineTab leadId={selectedLead.id} />}

                            {/* TAB 5: LANDING PAGE */}
                            {activeTab === 'landing' && (
                                <div className="flex flex-col items-center justify-center py-10">
                                    {selectedLead.status === 'gerando_site' ? (
                                        <div className="text-center">
                                            <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-6" />
                                            <h3 className="text-2xl font-black text-slate-800">Dani está codando...</h3>
                                            <p className="text-slate-500 mt-2">Gerando infra, aplicando copy e estilos React.</p>
                                        </div>
                                    ) : selectedLead.site_url ? (
                                        <div className="text-center w-full max-w-lg">
                                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10"/></div>
                                            <h3 className="text-2xl font-black text-slate-800 mb-2">Página Finalizada!</h3>
                                            <div className="bg-slate-100 p-4 rounded-xl font-mono text-sm text-slate-700 mb-6 border select-all">{selectedLead.site_url}</div>
                                            <a href={selectedLead.site_url} target="_blank" className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-200">
                                                <Globe className="w-5 h-5"/> Abrir Landing Page Real
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="text-center max-w-lg">
                                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"><Target className="w-10 h-10 text-slate-400"/></div>
                                            <h3 className="text-xl font-black text-slate-800">Site não gerado</h3>
                                            <p className="text-slate-500 mt-2 mb-8">Revise a copy e as mídias, depois envie The Lead para a Dani iniciar o deploy.</p>
                                            <button onClick={() => { handleSendToKanban(selectedLead); setSelectedLead(null); }} className="bg-indigo-600 text-white w-full py-4 rounded-xl font-bold shadow-xl flex justify-center gap-2 hover:bg-indigo-700 transition">
                                                <Zap className="w-5 h-5"/> Autorizar Deploy (Dani Kanban)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
