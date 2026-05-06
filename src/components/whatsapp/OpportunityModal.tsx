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
import { X, Loader2, Archive, ExternalLink, Search, FileText, Zap, Calendar, Phone, Mail } from 'lucide-react';
import { saveOpportunity, archiveOpportunity, getOpportunityById, type Task } from '@/hooks/useOpportunities';
import { useToast } from '@/hooks/use-toast';
import { useProfiles } from '@/hooks/useProfiles';
import { LeadFinanceTab } from '@/components/financeiro/LeadFinanceTab';
import { formatBRL, parseBRL, formatDate } from '@/lib/formatters';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useFinance } from '@/hooks/useFinance';
import { LeadDocumentsTab } from '@/components/financeiro/LeadDocumentsTab';

const PIPELINE_STAGES = [
  { key: "novo", label: "Novo" },
  { key: "qualificacao", label: "Qualif." },
  { key: "atendimento", label: "Contato" },
  { key: "reuniao", label: "Reunião" },
  { key: "fechamento", label: "Fechamento" },
  { key: "ganhou", label: "Fechado" },
];

const NICHO_SUGGESTIONS = ["Construtora", "Agro", "Dentista", "Advocacia", "Estética", "Varejo"];

interface OpportunityModalProps {
    open: boolean;
    onClose: () => void;
    contactName?: string;
    contactPhone?: string;
    stage?: string;
    onSaved?: () => void;
    opportunityId?: string;
}

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
        cpfCnpj: '',
        totalValue: 0,
        contractStartDate: '',
        contractEndDate: '',
    });

    const [allLeads, setAllLeads] = useState<any[]>([]);
    const [isSearchingLeads, setIsSearchingLeads] = useState(false);

    useEffect(() => {
        const fetchLeads = async () => {
            const { data } = await supabase.from('leads').select('id, company_name, phone, niche, created_at').order('created_at', { ascending: false });
            if (data) setAllLeads(data);
        };
        fetchLeads();
    }, []);

    const [tasks, setTasks] = useState<Task[]>([]);

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
                            cpfCnpj: (opp as any).cpf_cnpj || (opp as any).cpfCnpj || '',
                            totalValue: opp.total_value || 0,
                            contractStartDate: opp.contract_start_date || '',
                            contractEndDate: opp.contract_end_date || '',
                        });
                        setTasks(opp.tasks && opp.tasks.length > 0 ? opp.tasks : []);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setFetching(false);
                }
            };
            load();
        } else if (!opportunityId && open) {
            setFormData({ 
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
                cpfCnpj: '',
                totalValue: 0,
                contractStartDate: '',
                contractEndDate: '',
            });
            setTasks([]);
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
                cpf_cnpj: formData.cpfCnpj,
                total_value: formData.totalValue,
                contract_start_date: formData.contractStartDate || null,
                contract_end_date: formData.contractEndDate || null,
            } as any);

            toast({ title: 'Sucesso', description: opportunityId ? 'Oportunidade atualizada.' : 'Oportunidade criada com sucesso.' });
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

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-[90vw] w-[1100px] max-h-[92vh] p-0 border-0 bg-transparent shadow-none overflow-hidden">
                <DialogTitle className="sr-only">Oportunidade</DialogTitle>
                <DialogDescription className="sr-only">Detalhes da oportunidade de negócio</DialogDescription>

                <div className="flex flex-col bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden h-[92vh]">
                    {/* Header */}
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
                            {formData.priority && (
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                    formData.priority === 'high' ? 'bg-red-50 text-red-500 dark:bg-red-950/30' :
                                    formData.priority === 'medium' ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/30' :
                                    'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                                }`}>
                                    {formData.priority === 'high' ? 'Alta' : formData.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                            )}

                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="general" className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center px-8 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                            <TabsList className="h-10 bg-transparent gap-1 p-0">
                                {[
                                    { value: 'general', label: 'Geral' },
                                    { value: 'pipeline', label: 'Pipeline' },
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

                        {/* Geral */}
                        <TabsContent value="general" className="flex-1 overflow-y-auto mt-0">
                            {fetching ? (
                                <div className="flex-1 flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-zinc-200" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-0 h-full divide-x divide-zinc-100 dark:divide-zinc-800">
                                    {/* COLUNA ESQUERDA */}
                                    <div className="flex flex-col gap-6 p-8 overflow-y-auto">
                                        <Section title="Negócio" />

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
                                                    <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                                                        <div className="max-h-[200px] overflow-y-auto">
                                                            {allLeads.filter(l => (l.company_name || "").toLowerCase().includes(formData.leadIdentification.toLowerCase())).map(l => (
                                                                <button key={l.id} onClick={() => {
                                                                    setFormData(prev => ({ ...prev, leadIdentification: l.company_name, contact: l.phone || prev.contact, niche: l.niche || prev.niche }));
                                                                    setIsSearchingLeads(false);
                                                                }} className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex flex-col border-b last:border-0 transition-colors group">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors">{l.company_name}</span>
                                                                        <span className="text-[9px] font-medium text-zinc-400 flex items-center gap-1 shrink-0">
                                                                            <Calendar size={10} /> {formatDate(l.created_at)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 mt-1">
                                                                        {l.phone && (
                                                                            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                                                                <Phone size={10} className="text-zinc-300" /> {l.phone}
                                                                            </span>
                                                                        )}
                                                                        {l.niche && (
                                                                            <span className="text-[9px] font-black uppercase tracking-tighter bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded leading-none">
                                                                                {l.niche}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Field>

                                        <Field label="Valor da Oportunidade (R$)">
                                            <CurrencyInput 
                                                value={formData.totalValue} 
                                                onChange={val => setFormData(p => ({ ...p, totalValue: val }))}
                                                placeholder="0,00"
                                                className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                            />
                                        </Field>

                                        <div className="grid grid-cols-2 gap-5">
                                            <Field label="Status">
                                                <Select value={formData.status} onValueChange={v => setFormData(p => ({...p, status: v}))}>
                                                    <SelectTrigger className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="new_contact">Novo contato</SelectItem>
                                                        <SelectItem value="in_contact">Em contato</SelectItem>
                                                        <SelectItem value="presentation">Apresentação</SelectItem>
                                                        <SelectItem value="negotiation">Negociação</SelectItem>
                                                        <SelectItem value="ganhou">Ganhou / Cliente</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </Field>
                                            <Field label="Prioridade">
                                                <Select value={formData.priority} onValueChange={v => setFormData(p => ({...p, priority: v}))}>
                                                    <SelectTrigger className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
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

                                        <Field label="Nicho">
                                            <div className="space-y-2">
                                                <Input value={formData.niche} onChange={set('niche')} placeholder="Nicho" className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
                                                <div className="flex flex-wrap gap-1.5">
                                                    {NICHO_SUGGESTIONS.map(n => (
                                                        <button
                                                            key={n}
                                                            onClick={() => setFormData(p => ({...p, niche: n}))}
                                                            className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded transition-colors"
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </Field>

                                        <Field label="Responsável">
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
                                        </Field>

                                        <Section title="Observações" />
                                        <Field label="Notas internas">
                                            <Textarea value={formData.observation} onChange={set('observation')} rows={4} className="text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 resize-none" />
                                        </Field>
                                    </div>

                                    {/* COLUNA DIREITA */}
                                    <div className="flex flex-col gap-6 p-8 overflow-y-auto">
                                        <Section title="Contato & Documentos" />
                                        <div className="grid grid-cols-2 gap-5">
                                            <Field label="Telefone / WhatsApp">
                                                <Input value={formData.contact} onChange={set('contact')} placeholder="Telefone" className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
                                            </Field>
                                            <Field label="CPF / CNPJ">
                                                <Input value={formData.cpfCnpj} onChange={set('cpfCnpj')} placeholder="Documento" className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
                                            </Field>
                                        </div>
                                        <Field label="E-mail">
                                            <Input value={formData.email} onChange={set('email')} placeholder="Email" className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
                                        </Field>
                                        <Field label="Site / Landing Page">
                                            <div className="flex gap-2">
                                                <Input value={formData.siteUrl} onChange={set('siteUrl')} placeholder="https://..." className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
                                                {formData.siteUrl && (
                                                    <button onClick={() => window.open(formData.siteUrl, '_blank')} className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:text-zinc-900 transition-all shrink-0">
                                                        <ExternalLink size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </Field>

                                        <Section title="Vigência do Contrato" />
                                        <div className="grid grid-cols-2 gap-5">
                                            <Field label="Início do Contrato">
                                                <Input 
                                                    type="date" 
                                                    value={formData.contractStartDate} 
                                                    onChange={set('contractStartDate')} 
                                                    className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" 
                                                />
                                            </Field>
                                            <Field label="Término do Contrato">
                                                <Input 
                                                    type="date" 
                                                    value={formData.contractEndDate} 
                                                    onChange={set('contractEndDate')} 
                                                    className="h-9 text-[12px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" 
                                                />
                                            </Field>
                                        </div>
                                        <p className="text-[10px] text-zinc-400 font-medium italic">
                                            * Defina o período de validade para controle de renovações e faturamento.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* Pipeline */}
                        <TabsContent value="pipeline" className="flex-1 overflow-y-auto mt-0 p-8">
                            <div className="space-y-5">
                                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                        <Zap size={13} /> Posição no Funil
                                    </p>
                                    <div className="relative pt-1 pb-5">
                                        <div className="absolute top-[1.05rem] left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                        <div className="relative flex justify-between">
                                            {PIPELINE_STAGES.map((stage, idx) => {
                                                const currentStageIdx = PIPELINE_STAGES.findIndex(s => s.key === formData.status);
                                                const isActive = idx <= (currentStageIdx === -1 ? 0 : currentStageIdx);
                                                const isCurrent = idx === (currentStageIdx === -1 ? 0 : currentStageIdx);
                                                return (
                                                    <div key={stage.key} className="flex flex-col items-center gap-2 z-10">
                                                        <div className={`w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 transition-all ${isCurrent ? "bg-zinc-900 dark:bg-zinc-100 ring-2 ring-zinc-900/30 scale-125" : isActive ? "bg-zinc-500" : "bg-zinc-200 dark:bg-zinc-800"}`} />
                                                        <span className={`text-[9px] font-semibold uppercase ${isCurrent ? "text-zinc-900 dark:text-zinc-100" : isActive ? "text-zinc-500" : "text-zinc-300"}`}>
                                                            {stage.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-8 py-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div>
                            {opportunityId && (
                                <button onClick={handleArchive} disabled={archiving || loading} className="flex items-center gap-2 text-[11px] font-bold uppercase text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-30">
                                    {archiving ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
                                    Arquivar
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={onClose} className="px-5 py-2 text-[11px] font-black uppercase border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 transition-all">
                                Cancelar
                            </button>
                            <button onClick={handleSubmit} disabled={loading} className="px-8 py-2 text-[11px] font-black uppercase bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2">
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
