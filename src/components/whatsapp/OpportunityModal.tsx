import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';
import { X, Plus, Trash2, Loader2, Archive, User, Mail, Phone, Info, Briefcase, Calendar, CheckCircle2, DollarSign, Target, Tag, ExternalLink, Bot, Globe, Search, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { saveOpportunity, archiveOpportunity, getTimelineEntries, addTimelineComment, getOpportunityById, type Product, type Task, type TimelineEntry } from '@/hooks/useOpportunities';
import { useToast } from '@/hooks/use-toast';
import { useProfiles } from '@/hooks/useProfiles';
import { LeadFinanceTab } from '@/components/financeiro/LeadFinanceTab';

interface OpportunityModalProps {
    open: boolean;
    onClose: () => void;
    contactName?: string;
    contactPhone?: string;
    stage?: string;
    onSaved?: () => void;
    opportunityId?: string;
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


    const [products, setProducts] = useState<Product[]>([
        { name: '', quantity: 0, price: 0 },
    ]);

    const [tasks, setTasks] = useState<Task[]>([
        { title: '', scheduledFor: '', assignedTo: '', status: 'pending' },
    ]);

    const [comment, setComment] = useState('');
    const [timelineData, setTimelineData] = useState<TimelineEntry[]>([]);

    // Load opportunity data if editing
    useEffect(() => {
        if (opportunityId && open) {
            const loadData = async () => {
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
                        setProducts(opp.products && opp.products.length > 0 ? opp.products : [{ name: '', quantity: 1, price: 0 }]);
                        setTasks(opp.tasks && opp.tasks.length > 0 ? opp.tasks : []);
                    }

                    // Fetch Timeline
                    const entries = await getTimelineEntries(opportunityId);
                    setTimelineData(entries);

                } catch (error) {
                    console.error('Error fetching opportunity:', error);
                } finally {
                    setFetching(false);
                }
            };
            loadData();
        } else if (!opportunityId && open) {
            // Reset for new opportunity
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
            });
            setProducts([{ name: '', quantity: 1, price: 0 }]);
            setTasks([]);
            setTimelineData([]);
        }
    }, [opportunityId, open, stage, contactName, contactPhone]);

    const handleAssignToMe = () => {
        if (profiles && profiles.length > 0) {
            const me = profiles.find(p => p.email === 'me@example.com') || profiles[0];
            setFormData(prev => ({ ...prev, responsible: me.id }));
            toast({
                title: "Atribuído a você",
                description: `A oportunidade foi atribuída a ${me.full_name}`,
            });
        }
    };

    const calculateProductTotal = (quantity: number, price: number) => {
        return quantity * price;
    };

    const calculateGrandTotal = () => {
        return products.reduce((sum, product) => {
            return sum + calculateProductTotal(product.quantity, product.price);
        }, 0);
    };

    const addProduct = () => {
        setProducts([...products, { name: '', quantity: 0, price: 0 }]);
    };

    const removeProduct = (index: number) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    const updateProduct = (index: number, field: keyof Product, value: any) => {
        const updated = [...products];
        updated[index] = { ...updated[index], [field]: value };
        setProducts(updated);
    };

    const addTask = () => {
        setTasks([...tasks, { title: '', scheduledFor: '', assignedTo: '', status: 'pending' }]);
    };

    const removeTask = (index: number) => {
        setTasks(tasks.filter((_, i) => i !== index));
    };

    const updateTask = (index: number, field: keyof Task, value: string) => {
        const updated = [...tasks];
        updated[index] = { ...updated[index], [field]: value };
        setTasks(updated);

        // Auto-sync: when assigning a task to a vendor, also set opportunity responsible
        if (field === 'assignedTo' && value) {
            setFormData(prev => ({ ...prev, responsible: value }));
        }
    };

    const handleAddComment = async () => {
        if (!opportunityId || !comment.trim()) return;
        try {
            await addTimelineComment(opportunityId, comment);
            setComment('');
            const entries = await getTimelineEntries(opportunityId);
            setTimelineData(entries);
            toast({ title: 'Comentário adicionado' });
        } catch (error) {
            toast({ title: 'Erro ao comentar', variant: 'destructive' });
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const opportunity = {
                id: opportunityId,
                stage: formData.status,
                lead_identification: formData.leadIdentification,
                priority: formData.priority as any,
                contact_phone: formData.contact,
                contact_name: formData.leadIdentification,
                contact_email: formData.email,
                observation: formData.observation,
                responsible_id: formData.responsible || undefined,
                total_value: calculateGrandTotal(),
                products: products.filter(p => p.name),
                tasks: tasks.filter(t => t.title),
                niche: formData.niche,
                site_url: formData.siteUrl,
            };

            await saveOpportunity(opportunity as any);

            toast({
                title: '✓ Oportunidade salva',
                description: 'A oportunidade foi salva com sucesso!',
                duration: 3000,
            });

            if (onSaved) onSaved();
            onClose();
        } catch (error: any) {
            console.error('Error saving opportunity:', error);
            toast({
                title: '✗ Erro ao salvar',
                description: error.message || 'Não foi possível salvar a oportunidade.',
                variant: 'destructive',
                duration: 4000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async () => {
        if (!opportunityId) return;
        setArchiving(true);
        try {
            await archiveOpportunity(opportunityId);
            toast({
                title: '📦 Oportunidade arquivada',
                description: 'A oportunidade foi movida para o arquivo.',
                duration: 3000,
            });
            if (onSaved) onSaved();
            onClose();
        } catch (error: any) {
            toast({
                title: '✗ Erro ao arquivar',
                description: error.message || 'Não foi possível arquivar.',
                variant: 'destructive',
            });
        } finally {
            setArchiving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
                <Card className="border-none shadow-2xl bg-background/95 backdrop-blur-md overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-background border-b pb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Target className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black tracking-tight">
                                        {fetching ? 'Carregando...' : (formData.leadIdentification || 'Nova Oportunidade')}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Info className="h-3.5 w-3.5" /> Detalhes da negociação comercial
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Valor Total</p>
                                    <div className="flex items-center gap-2 text-3xl font-black text-green-500">
                                        <DollarSign className="h-6 w-6" />
                                        <span>{calculateGrandTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <Tabs defaultValue="general" className="w-full">
                        <div className="px-6 border-b bg-muted/30">
                            <TabsList className="h-12 bg-transparent gap-6">
                                <TabsTrigger value="general" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 font-bold transition-all">
                                    Geral
                                </TabsTrigger>
                                <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 font-bold transition-all">
                                    Linha do tempo
                                </TabsTrigger>
                                <TabsTrigger value="financeiro" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 font-bold transition-all">
                                    Financeiro
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="general" className="p-6 space-y-6 mt-0">
                            {fetching ? (
                                <div className="h-64 flex items-center justify-center">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Informações gerais */}
                                        <Card className="bg-white/50 backdrop-blur-sm shadow-sm border-muted">
                                            <CardHeader className="pb-3 pt-4">
                                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                                                    <Info className="h-4 w-4" /> Informações do Negócio
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                                            <CheckCircle2 className="h-3 w-3" /> Status
                                                        </Label>
                                                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                                            <SelectTrigger className="h-9 text-xs font-semibold bg-white">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="new_contact">Novo contato</SelectItem>
                                                                <SelectItem value="in_contact">Em contato</SelectItem>
                                                                <SelectItem value="presentation">Apresentação</SelectItem>
                                                                <SelectItem value="negotiation">Negociação</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                                            <Plus className="h-3 w-3" /> Prioridade
                                                        </Label>
                                                        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                                                            <SelectTrigger className={cn(
                                                                "h-9 text-xs font-bold bg-white transition-colors",
                                                                formData.priority === 'high' && "text-red-500 border-red-200 bg-red-50",
                                                                formData.priority === 'medium' && "text-yellow-600 border-yellow-200 bg-yellow-50",
                                                                formData.priority === 'low' && "text-green-600 border-green-200 bg-green-50"
                                                            )}>
                                                                <SelectValue placeholder="Selecione" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="low" className="text-green-600 font-bold">Baixa</SelectItem>
                                                                <SelectItem value="medium" className="text-yellow-600 font-bold">Média</SelectItem>
                                                                <SelectItem value="high" className="text-red-600 font-bold">Alta</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                                            <User className="h-3 w-3" /> Identificação do Lead
                                                        </Label>
                                                        <Input
                                                            value={formData.leadIdentification}
                                                            onChange={(e) => setFormData({ ...formData, leadIdentification: e.target.value })}
                                                            placeholder="Nome do cliente ou empresa"
                                                            className="h-9 text-xs bg-white font-medium"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                                            <Tag className="h-3 w-3" /> Nicho / Segmento
                                                        </Label>
                                                        <Input
                                                            value={formData.niche}
                                                            onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                                                            placeholder="Ex: Clínicas, Advocacia..."
                                                            className="h-9 text-xs bg-white font-medium"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                                        <Briefcase className="h-3 w-3" /> Responsável
                                                    </Label>
                                                    <div className="flex gap-2">
                                                        <Select value={formData.responsible} onValueChange={(value) => setFormData({ ...formData, responsible: value })}>
                                                            <SelectTrigger className="h-9 text-xs bg-white">
                                                                <SelectValue placeholder="Escolha um responsável" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {profiles?.filter(p => p.is_active).map(profile => (
                                                                    <SelectItem key={profile.id} value={profile.id}>{profile.full_name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleAssignToMe}
                                                            className="h-9 text-[10px] font-bold uppercase px-3 shadow-sm border-primary/20 hover:bg-primary/5 hover:text-primary transition-all shrink-0"
                                                        >
                                                            Me atribuir
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Contato */}
                                        <Card className="bg-white/50 backdrop-blur-sm shadow-sm border-muted">
                                            <CardHeader className="pb-3 pt-4">
                                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                                                    <Mail className="h-4 w-4" /> Dados de Contato
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                                            <Phone className="h-3 w-3" /> Telefone / WhatsApp
                                                        </Label>
                                                        <Input
                                                            value={formData.contact}
                                                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                                            className="h-9 text-xs bg-white font-mono"
                                                            placeholder="(00) 00000-0000"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                                            <Globe className="h-3 w-3" /> Site / Landing Page
                                                        </Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                value={formData.siteUrl}
                                                                onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                                                                placeholder="https://..."
                                                                className="h-9 text-xs bg-white font-medium"
                                                            />
                                                            {formData.siteUrl && (
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="icon" 
                                                                    className="h-9 w-9 shrink-0"
                                                                    onClick={() => window.open(formData.siteUrl, '_blank')}
                                                                >
                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3 w-3" /> E-mail Comercial
                                                        </Label>
                                                        <Input
                                                            type="email"
                                                            value={formData.email}
                                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                            placeholder="email@exemplo.com"
                                                            className="h-9 text-xs bg-white font-medium"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                                            <Bot className="h-3 w-3" /> Template para Deploy (Dani)
                                                        </Label>
                                                        <Select value={formData.template} onValueChange={(value) => setFormData({ ...formData, template: value })}>
                                                            <SelectTrigger className="h-9 text-xs bg-white">
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
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                                        <Info className="h-3 w-3" /> Observações Internas
                                                    </Label>
                                                    <Textarea
                                                        value={formData.observation}
                                                        onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                                                        rows={3}
                                                        placeholder="Notas importantes sobre este negócio..."
                                                        className="text-xs bg-white resize-none"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Produtos */}
                                    <Card className="bg-white/50 backdrop-blur-sm shadow-sm border-muted">
                                        <CardHeader className="pb-4 pt-4 flex flex-row items-center justify-between">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                                                <DollarSign className="h-4 w-4" /> Composição de Preço
                                            </CardTitle>
                                            <Button onClick={addProduct} variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase gap-1.5 border-primary/20 hover:bg-primary/5">
                                                <Plus className="h-3 w-3" /> Adicionar Item
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {products.map((product, index) => (
                                                <div key={index} className="grid grid-cols-[3fr,1fr,1fr,1fr,auto] gap-3 items-end bg-background/40 p-3 rounded-lg border border-muted/50 transition-all hover:bg-background/80 group">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Produto / Serviço</Label>
                                                        <Input
                                                            value={product.name}
                                                            onChange={(e) => updateProduct(index, 'name', e.target.value)}
                                                            placeholder="Nome do produto"
                                                            className="h-8 text-xs bg-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Qtde</Label>
                                                        <Input
                                                            type="number"
                                                            value={product.quantity || ''}
                                                            onChange={(e) => updateProduct(index, 'quantity', Math.max(1, Number(e.target.value)))}
                                                            className="h-8 text-xs bg-white text-center"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Valor Un.</Label>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">R$</span>
                                                            <Input
                                                                type="number"
                                                                className="h-8 text-xs pl-7 bg-white"
                                                                value={product.price || ''}
                                                                onChange={(e) => updateProduct(index, 'price', Number(e.target.value))}
                                                                step="0.01"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5 text-right">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground block">Subtotal</Label>
                                                        <p className="h-8 flex items-center justify-end text-xs font-bold text-foreground pr-2 font-mono">
                                                            R$ {calculateProductTotal(product.quantity, product.price).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        onClick={() => removeProduct(index)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}

                                            <div className="flex justify-end pt-2">
                                                <div className="text-right bg-primary/5 px-6 py-2 rounded-xl border border-primary/10 shadow-inner">
                                                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Total da Oportunidade</p>
                                                    <p className="text-2xl font-black text-primary font-mono tracking-tighter">
                                                        R$ {calculateGrandTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Tarefas */}
                                    <Card className="bg-white/50 backdrop-blur-sm shadow-sm border-muted">
                                        <CardHeader className="pb-4 pt-4 flex flex-row items-center justify-between">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                                                <Calendar className="h-4 w-4" /> Plano de Ação (Tarefas)
                                            </CardTitle>
                                            <Button onClick={addTask} variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase gap-1.5 border-primary/20 hover:bg-primary/5">
                                                <Plus className="h-3 w-3" /> Nova Tarefa
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {tasks.length === 0 ? (
                                                <div className="text-center py-6 border-2 border-dashed rounded-xl bg-muted/20">
                                                    <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                                    <p className="text-xs font-medium text-muted-foreground">Nenhuma tarefa agendada para este contrato</p>
                                                </div>
                                            ) : (
                                                tasks.map((task, index) => (
                                                    <div key={index} className="grid grid-cols-[2fr,1.5fr,1.5fr,1fr,auto] gap-3 items-end bg-background/40 p-3 rounded-lg border border-muted/50 group">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Descrição</Label>
                                                            <Input
                                                                value={task.title}
                                                                onChange={(e) => updateTask(index, 'title', e.target.value)}
                                                                placeholder="O que precisa ser feito?"
                                                                className="h-8 text-xs bg-white"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Vencimento</Label>
                                                            <Input
                                                                type="date"
                                                                value={task.scheduledFor}
                                                                onChange={(e) => updateTask(index, 'scheduledFor', e.target.value)}
                                                                className="h-8 text-[11px] bg-white"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Execução</Label>
                                                            <Select value={task.assignedTo} onValueChange={(value) => updateTask(index, 'assignedTo', value)}>
                                                                <SelectTrigger className="h-8 text-[11px] bg-white font-medium">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {profiles?.filter(p => p.is_active).map(profile => (
                                                                        <SelectItem key={profile.id} value={profile.id} className="text-[11px]">{profile.full_name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Status</Label>
                                                            <Select value={task.status} onValueChange={(value) => updateTask(index, 'status', value)}>
                                                                <SelectTrigger className={cn(
                                                                    "h-8 text-[11px] font-bold bg-white",
                                                                    task.status === 'completed' && "text-green-600 bg-green-50 border-green-200",
                                                                    task.status === 'in_progress' && "text-blue-600 bg-blue-50 border-blue-200"
                                                                )}>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="pending" className="text-xs">Pendente</SelectItem>
                                                                    <SelectItem value="in_progress" className="text-xs">Em andamento</SelectItem>
                                                                    <SelectItem value="completed" className="text-xs">Concluído</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <Button
                                                            onClick={() => removeTask(index)}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </CardContent>
                                    </Card>

                                    <div className="flex items-center justify-between pt-4 border-t gap-4">
                                        <div className="flex items-center gap-2">
                                            {opportunityId && (
                                                <Button
                                                    variant="ghost"
                                                    onClick={handleArchive}
                                                    disabled={archiving || loading}
                                                    className="h-10 text-[11px] font-bold uppercase tracking-tight text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-2 px-4 shadow-none"
                                                >
                                                    {archiving ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Archive className="h-4 w-4" />
                                                    )}
                                                    Arquivar Negócio
                                                </Button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button variant="outline" onClick={onClose} className="h-10 text-[11px] font-bold uppercase tracking-tight px-6 rounded-lg">
                                                Cancelar
                                            </Button>
                                            <Button onClick={handleSubmit} size="lg" className="h-12 w-64 text-sm font-black uppercase tracking-tight rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={loading}>
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processando...
                                                    </>
                                                ) : (
                                                    opportunityId ? 'Atualizar Oportunidade' : 'Ativar Negócio'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="timeline" className="p-6 space-y-4 mt-0">
                            <Card className="bg-white/50 backdrop-blur-sm border-muted shadow-sm overflow-hidden">
                                <CardHeader className="pb-3 bg-muted/20">
                                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                        <Plus className="h-3.5 w-3.5 text-primary" /> Registrar Atividade Comercial
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    <Textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Descreva o que aconteceu em sua última interação..."
                                        rows={4}
                                        className="text-xs bg-white border-muted/50 resize-none focus:ring-1 focus:ring-primary/20"
                                    />
                                    <div className="flex justify-end">
                                        <Button 
                                            onClick={handleAddComment}
                                            disabled={!opportunityId || !comment.trim()}
                                            className="h-9 px-6 text-[11px] font-bold uppercase tracking-tight rounded-lg"
                                        >
                                            Enviar Comentário
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-4 mt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-px flex-1 bg-border" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Histórico Completo</span>
                                    <div className="h-px flex-1 bg-border" />
                                </div>
                                
                                {timelineData.length === 0 ? (
                                    <Card className="border-dashed bg-muted/5">
                                        <CardContent className="h-40 flex flex-col items-center justify-center opacity-40">
                                            <Info className="h-8 w-8 mb-2" />
                                            <p className="text-xs font-bold">Sem registros nesta linha do tempo</p>
                                            <p className="text-[10px]">As ações dos agentes e comentários aparecerão aqui</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-4">
                                        {timelineData.map((entry) => (
                                            <div key={entry.id} className="relative pl-6 border-l-2 border-primary/20 pb-4 last:pb-0">
                                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                                                    {entry.type === 'agent' ? <Bot className="w-2 h-2 text-primary" /> : <MessageSquare className="w-2 h-2 text-primary" />}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                                                            {entry.type === 'agent' ? `AGENTE ${entry.agent_id?.toUpperCase()}` : 'USUÁRIO'}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                            {new Date(entry.created_at).toLocaleString('pt-BR')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-foreground bg-muted/30 p-3 rounded-lg border border-muted/50">
                                                        {entry.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="financeiro" className="p-6 space-y-4 mt-0">
                            {opportunityId ? (
                                <LeadFinanceTab 
                                    leadId={opportunityId} 
                                    leadName={formData.leadIdentification} 
                                    products={products}
                                    siteUrl={formData.siteUrl}
                                />
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center opacity-40">
                                    <DollarSign className="h-12 w-12 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest text-center">
                                        Ative o negócio primeiro para<br />acessar os recursos financeiros
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </Card>
            </DialogContent>
        </Dialog>
    );
};
