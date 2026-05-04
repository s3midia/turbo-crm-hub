import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Loader2, Archive, ExternalLink, MessageSquare, Bot, Plus, Search } from 'lucide-react';
import { saveOpportunity, archiveOpportunity, getTimelineEntries, addTimelineComment, getOpportunityById, type Task, type TimelineEntry } from '@/hooks/useOpportunities';
import { useToast } from '@/hooks/use-toast';
import { useProfiles } from '@/hooks/useProfiles';
import { LeadFinanceTab } from '@/components/financeiro/LeadFinanceTab';
import { formatBRL } from '@/lib/formatters';
import { useFinance } from '@/hooks/useFinance';
import { LeadDocumentsTab } from '@/components/financeiro/LeadDocumentsTab';

interface OpportunityModalProps {
    open: boolean;
    onClose: () => void;
    contactName?: string;
    contactPhone?: string;
    stage?: string;
    onSaved?: () => void;
    opportunityId?: string;
}

// ─── mini field ────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 leading-none">
                {label}
            </Label>
            {children}
        </div>
    );
}

// ─── section divider ──────────────────────────────────────────────────────────
function Section({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-3 py-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">{title}</span>
            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
        </div>
    );
}

export const OpportunityModal = ({
    open,
    onClose,
    contactName = '',
    contactPhone = '',
    stage = 'new_contact',
    onSaved,
    opportunityId,
}: OpportunityModalProps) => {
    const { toast } = useToast();
    const { data: profiles } = useProfiles();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [archiving, setArchiving] = useState(false);

    const { transactions } = useFinance(opportunityId);
    const transactionsTotal = transactions.reduce((acc, t) => {
        const v = typeof t.valor === 'string' ? parseFloat(t.valor) : Number(t.valor);
        return t.tipo === 'saida' ? acc - (isNaN(v) ? 0 : v) : acc + (isNaN(v) ? 0 : v);
    }, 0);

    const [formData, setFormData] = useState({
        status: stage,
        leadIdentification: contactName,
        priority: '',
        contact: contactPhone,
        email: '',
        observation: '',
        responsible: '',
        niche: '',
        siteUrl: '',
        template: '',
    });

    const [allLeads, setAllLeads] = useState<any[]>([]);
    const [isSearchingLeads, setIsSearchingLeads] = useState(false);

    useEffect(() => {
        const fetchLeads = async () => {
            const { data } = await supabase.from('leads').select('id, company_name, phone, niche').order('company_name');
            if (data) setAllLeads(data);
        };
        fetchLeads();
    }, []);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [comment, setComment] = useState('');
    const [timelineData, setTimelineData] = useState<TimelineEntry[]>([]);

    useEffect(() => {
        if (opportunityId && open) {
            const load = async () => {
                setFetching(true);
                try {
                    const opp = await getOpportunityById(opportunityId).catch(() => null);
                    if (opp) {
                        setFormData({
                            status: opp.stage || stage,
                            leadIdentification: opp.lead_identification || contactName,
                            priority: opp.priority || '',
                            contact: opp.contact_phone || contactPhone,
                            email: opp.contact_email || '',
                            observation: opp.observation || '',
                            responsible: opp.responsible_id || '',
                            niche: opp.niche || '',
                            siteUrl: opp.site_url || '',
                            template: '',
                        });
                        setTasks(opp.tasks && opp.tasks.length > 0 ? opp.tasks : []);
                    }
                    const entries = await getTimelineEntries(opportunityId);
                    setTimelineData(entries);
                } catch (e) {
                    console.error(e);
                } finally {
                    setFetching(false);
                }
            };
            load();
        } else if (!opportunityId && open) {
            setFormData({ status: stage, leadIdentification: contactName, priority: '', contact: contactPhone, email: '', observation: '', responsible: '', niche: '', siteUrl: '', template: '' });
            setTasks([]);
            setTimelineData([]);
        }
    }, [opportunityId, open, stage, contactName, contactPhone]);

    const set = (key: keyof typeof formData) => (e: any) =>
        setFormData(prev => ({ ...prev, [key]: e.target?.value ?? e }));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await saveOpportunity({
                id: opportunityId,
                stage: formData.status,
                lead_identification: formData.leadIdentification,
                priority: formData.priority as any,
                contact_phone: formData.contact,
                contact_name: formData.leadIdentification,
                contact_email: formData.email,
                observation: formData.observation,
                responsible_id: formData.responsible || undefined,
                products: [],
                tasks: tasks.filter(t => t.title),
                niche: formData.niche,
                site_url: formData.siteUrl,
            } as any);
            toast({ title: 'Salvo', description: 'Oportunidade atualizada.' });
            if (onSaved) onSaved();
            onClose();
        } catch (err: any) {
            toast({ title: 'Erro', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async () => {
        if (!opportunityId) return;
        setArchiving(true);
        try {
            await archiveOpportunity(opportunityId);
            toast({ title: 'Arquivado' });
            if (onSaved) onSaved();
            onClose();
        } catch (err: any) {
            toast({ title: 'Erro', description: err.message, variant: 'destructive' });
        } finally {
            setArchiving(false);
        }
    };

    const handleAddComment = async () => {
        if (!opportunityId || !comment.trim()) return;
        try {
            await addTimelineComment(opportunityId, comment);
            setComment('');
            setTimelineData(await getTimelineEntries(opportunityId));
            toast({ title: 'Comentário adicionado' });
        } catch {
            toast({ title: 'Erro ao comentar', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-[90vw] w-[1100px] max-h-[92vh] p-0 border-0 bg-transparent shadow-none overflow-hidden">
                <DialogTitle className="sr-only">Oportunidade</DialogTitle>
                <DialogDescription className="sr-only">Detalhes da oportunidade de negócio</DialogDescription>

                {/* ── Shell ─────────────────────────────────────────────────── */}
                <div className="flex flex-col bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden h-[92vh]">

                    {/* ── Header ─────────────────────────────────────────────── */}
                    <div className="flex items-center justify-between px-8 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                        <div>
                            <h2 className="text-[17px] font-black tracking-tighter text-zinc-900 dark:text-zinc-100 leading-none">
                                {fetching ? '...' : (formData.leadIdentification || 'Nova Oportunidade')}
                            </h2>
                            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mt-0.5 leading-none">
                                {formData.niche || 'Oportunidade'}
                            </p>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* KPI: valor */}
                            <div className="text-right">
                                <div className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 leading-none">
                                    {formatBRL(transactionsTotal)}
                                </div>
                                <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                                    Valor
                                </div>
                            </div>

                            {/* Priority pill */}
                            {formData.priority && (
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                    formData.priority === 'high' ? 'bg-red-50 text-red-500 dark:bg-red-950/30' :
                                    formData.priority === 'medium' ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/30' :
                                    'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                                }`}>
                                    {formData.priority === 'high' ? 'Alta' : formData.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                            )}

                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* ── Tabs ───────────────────────────────────────────────── */}
                    <Tabs defaultValue="general" className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center px-8 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                            <TabsList className="h-10 bg-transparent gap-1 p-0">
                                {[
                                    { value: 'general', label: 'Geral' },
                                    { value: 'finance', label: 'Financeiro' },
                                    { value: 'documents', label: 'Documentos' },
                                    { value: 'timeline', label: 'Histórico' },
                                ].map(tab => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="h-10 px-4 text-[11px] font-black uppercase tracking-wider rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 text-zinc-400 hover:text-zinc-700 transition-all"
                                    >
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {/* ── TAB: Geral ─────────────────────────────────────── */}
                        <TabsContent value="general" className="flex-1 overflow-y-auto mt-0">
                            {fetching ? (
                                <div className="flex-1 flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-zinc-200" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-0 h-full divide-x divide-zinc-100 dark:divide-zinc-800">
                                    {/* LEFT col */}
                                    <div className="flex flex-col gap-6 p-8 overflow-y-auto">
                                        <Section title="Negócio" />

                                        <div className="grid grid-cols-2 gap-5">
                                            <Field label="Status">
                                                <Select value={formData.status} onValueChange={v => setFormData(p => ({...p, status: v}))}>
                                                    <SelectTrigger className="h-9 text-[12px] font-semibold bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="new_contact">Novo contato</SelectItem>
                                                        <SelectItem value="in_contact">Em contato</SelectItem>
                                                        <SelectItem value="presentation">Apresentação</SelectItem>
                                                        <SelectItem value="negotiation">Negociação</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </Field>

                                            <Field label="Prioridade">
                                                <Select value={formData.priority} onValueChange={v => setFormData(p => ({...p, priority: v}))}>
                                                    <SelectTrigger className="h-9 text-[12px] font-semibold bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                                        <SelectValue placeholder="Selecionar" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="low">Baixa</SelectItem>
                                                        <SelectItem value="medium">Média</SelectItem>
                                                        <SelectItem value="high">Alta</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </Field>
                                        </div>

                                        <div className="grid grid-cols-2 gap-5">
                                            <Field label="Empresa / Lead">
                                                <div className="relative group">
                                                    <Input
                                                        value={formData.leadIdentification}
                                                        onChange={(e) => {
                                                            set('leadIdentification')(e);
                                                            setIsSearchingLeads(true);
                                                        }}
                                                        onFocus={() => setIsSearchingLeads(true)}
                                                        placeholder="Nome da empresa"
                                                        className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 pr-8"
                                                    />
                                                    <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-zinc-400 opacity-50" />
                                                    
                                                    {isSearchingLeads && formData.leadIdentification.length > 1 && (
                                                        <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                                                {allLeads.filter(l => 
                                                                    l.company_name.toLowerCase().includes(formData.leadIdentification.toLowerCase())
                                                                ).map(l => (
                                                                    <button
                                                                        key={l.id}
                                                                        onClick={() => {
                                                                            setFormData(prev => ({
                                                                                ...prev,
                                                                                leadIdentification: l.company_name,
                                                                                contact: l.phone || prev.contact,
                                                                                niche: l.niche || prev.niche
                                                                            }));
                                                                            setIsSearchingLeads(false);
                                                                        }}
                                                                        className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-zinc-50 dark:hover:bg-zinc-800 flex flex-col gap-0.5 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0"
                                                                    >
                                                                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{l.company_name}</span>
                                                                        <span className="text-[10px] text-zinc-400">{l.phone || 'Sem telefone'} • {l.niche || 'Geral'}</span>
                                                                    </button>
                                                                ))}
                                                                {allLeads.filter(l => l.company_name.toLowerCase().includes(formData.leadIdentification.toLowerCase())).length === 0 && (
                                                                    <div className="px-4 py-3 text-[11px] text-zinc-400 italic">Nenhum cliente encontrado.</div>
                                                                )}
                                                            </div>
                                                            <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 flex justify-end">
                                                                <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold" onClick={() => setIsSearchingLeads(false)}>Fechar</Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Field>
                                            <Field label="Nicho">
                                                <Input
                                                    value={formData.niche}
                                                    onChange={set('niche')}
                                                    placeholder="Ex: Clínicas, Advocacia"
                                                    className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                                />
                                            </Field>
                                        </div>

                                        <Field label="Responsável">
                                            <div className="flex gap-2">
                                                <Select value={formData.responsible} onValueChange={v => setFormData(p => ({...p, responsible: v}))}>
                                                    <SelectTrigger className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                                        <SelectValue placeholder="Selecionar responsável" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {profiles?.filter(p => p.is_active).map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </Field>

                                        <Section title="Observações" />

                                        <Field label="Notas internas">
                                            <Textarea
                                                value={formData.observation}
                                                onChange={set('observation')}
                                                rows={4}
                                                placeholder="Anotações sobre este negócio..."
                                                className="text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 resize-none"
                                            />
                                        </Field>
                                    </div>

                                    {/* RIGHT col */}
                                    <div className="flex flex-col gap-6 p-8 overflow-y-auto">
                                        <Section title="Contato" />

                                        <div className="grid grid-cols-2 gap-5">
                                            <Field label="Telefone / WhatsApp">
                                                <Input
                                                    value={formData.contact}
                                                    onChange={set('contact')}
                                                    placeholder="(00) 00000-0000"
                                                    className="h-9 text-[12px] font-mono bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                                />
                                            </Field>
                                            <Field label="E-mail">
                                                <Input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={set('email')}
                                                    placeholder="email@exemplo.com"
                                                    className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                                />
                                            </Field>
                                        </div>

                                        <Field label="Site / Landing Page">
                                            <div className="flex gap-2">
                                                <Input
                                                    value={formData.siteUrl}
                                                    onChange={set('siteUrl')}
                                                    placeholder="https://..."
                                                    className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                                />
                                                {formData.siteUrl && (
                                                    <button
                                                        onClick={() => window.open(formData.siteUrl, '_blank')}
                                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 hover:border-zinc-400 transition-all shrink-0"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </Field>

                                        <Section title="Template" />

                                        <Field label="Template para Deploy (Dani)">
                                            <Select value={formData.template} onValueChange={v => setFormData(p => ({...p, template: v}))}>
                                                <SelectTrigger className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                                    <SelectValue placeholder="Selecione o template" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="saude">Saúde / Médicos</SelectItem>
                                                    <SelectItem value="advocacia">Advocacia / Jurídico</SelectItem>
                                                    <SelectItem value="construcao">Engenharia / Construção</SelectItem>
                                                    <SelectItem value="varejo">Varejo / Ecommerce</SelectItem>
                                                    <SelectItem value="beleza">Beleza / Estética</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* ── TAB: Financeiro ────────────────────────────────── */}
                        <TabsContent value="finance" className="flex-1 overflow-y-auto mt-0 p-8">
                            {opportunityId ? (
                                <LeadFinanceTab
                                    leadId={opportunityId}
                                    leadName={formData.leadIdentification}
                                    siteUrl={formData.siteUrl}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-zinc-300 gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                        <Archive size={18} className="text-zinc-400" />
                                    </div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 text-center">
                                        Salve o negócio primeiro
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                        
                        {/* ── TAB: Documentos ────────────────────────────────── */}
                        <TabsContent value="documents" className="flex-1 overflow-y-auto mt-0 p-8">
                            {opportunityId ? (
                                <LeadDocumentsTab
                                    leadId={opportunityId}
                                    leadName={formData.leadIdentification}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-zinc-300 gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                        <FileText size={18} className="text-zinc-400" />
                                    </div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 text-center">
                                        Salve o negócio primeiro
                                    </p>
                                </div>
                            )}
                        </TabsContent>

                        {/* ── TAB: Histórico ─────────────────────────────────── */}
                        <TabsContent value="timeline" className="flex-1 overflow-y-auto mt-0">
                            <div className="grid grid-cols-2 gap-0 divide-x divide-zinc-100 dark:divide-zinc-800 h-full">
                                {/* Add comment */}
                                <div className="p-8 flex flex-col gap-4">
                                    <Section title="Nova atividade" />
                                    <Textarea
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        placeholder="Descreva o que aconteceu..."
                                        rows={6}
                                        className="text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 resize-none"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!opportunityId || !comment.trim()}
                                            className="px-6 py-2 text-[11px] font-black uppercase tracking-wider bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:opacity-90 disabled:opacity-30 transition-all"
                                        >
                                            Registrar
                                        </button>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="p-8 overflow-y-auto flex flex-col gap-4">
                                    <Section title="Histórico" />
                                    {timelineData.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-zinc-300 gap-2">
                                            <MessageSquare size={20} />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Sem registros</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {timelineData.map(entry => (
                                                <div key={entry.id} className="flex gap-3">
                                                    <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0">
                                                        {entry.type === 'agent'
                                                            ? <Bot size={12} className="text-zinc-500" />
                                                            : <MessageSquare size={12} className="text-zinc-500" />
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                                                {entry.type === 'agent' ? `Agente` : 'Usuário'}
                                                            </span>
                                                            <span className="text-[9px] text-zinc-400">
                                                                {new Date(entry.created_at).toLocaleString('pt-BR')}
                                                            </span>
                                                        </div>
                                                        <p className="text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg px-3 py-2 leading-relaxed">
                                                            {entry.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* ── Footer ─────────────────────────────────────────────── */}
                    <div className="flex items-center justify-between px-8 py-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div>
                            {opportunityId && (
                                <button
                                    onClick={handleArchive}
                                    disabled={archiving || loading}
                                    className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-30"
                                >
                                    {archiving ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
                                    Arquivar
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-5 py-2 text-[11px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-400 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-8 py-2 text-[11px] font-black uppercase tracking-wider bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {loading && <Loader2 size={12} className="animate-spin" />}
                                {opportunityId ? 'Salvar' : 'Criar'}
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
