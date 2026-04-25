import { useState } from 'react';
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
import { X, Plus, Trash2, Loader2, Archive, User, Phone, Mail, FileText, Tag, DollarSign, Calendar, Clock, AlertCircle, ShoppingBag, CheckSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { saveOpportunity, archiveOpportunity, type Product, type Task } from '@/hooks/useOpportunities';
import { useToast } from '@/hooks/use-toast';
import { useProfiles } from '@/hooks/useProfiles';

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
    });

    const [products, setProducts] = useState<Product[]>([
        { name: '', quantity: 1, price: 0 },
    ]);

    const [tasks, setTasks] = useState<Task[]>([
        { title: '', scheduledFor: '', assignedTo: '', status: 'pending' },
    ]);

    const [timeline, setTimeline] = useState('');

    // Load opportunity data if editing
    useState(() => {
        if (opportunityId && open) {
            const loadData = async () => {
                setFetching(true);
                try {
                    const { getOpportunityById } = await import('@/hooks/useOpportunities');
                    const opp = await getOpportunityById(opportunityId);
                    setFormData({
                        status: opp.stage,
                        leadIdentification: opp.lead_identification,
                        priority: opp.priority || '',
                        contact: opp.contact_phone || '',
                        email: opp.contact_email || '',
                        observation: opp.observation || '',
                        responsible: opp.responsible_id || '',
                    });
                    setProducts(opp.products && opp.products.length > 0 ? opp.products : [{ name: '', quantity: 1, price: 0 }]);
                    setTasks(opp.tasks && opp.tasks.length > 0 ? opp.tasks : []);
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
            });
            setProducts([{ name: '', quantity: 1, price: 0 }]);
            setTasks([]);
        }
    });

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

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const opportunity = {
                id: opportunityId,
                lead_identification: formData.leadIdentification,
                contact_phone: formData.contact,
                contact_name: formData.leadIdentification,
                contact_email: formData.email,
                priority: formData.priority as 'low' | 'medium' | 'high' | undefined,
                stage: formData.status as 'new_contact' | 'in_contact' | 'presentation' | 'negotiation',
                observation: formData.observation,
                responsible_id: formData.responsible || undefined,
                total_value: calculateGrandTotal(),
                products: products.filter(p => p.name),
                tasks: tasks.filter(t => t.title),
            };

            await saveOpportunity(opportunity);

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

    const handleAssignToMe = () => {
        const myProfile = profiles?.find(p => p.email === 'me@example.com'); // This should ideally come from user context
        // Use currentUser from context if available, for now just a placeholder logic that works with the existing profiles list
        if (profiles && profiles.length > 0) {
            setFormData(prev => ({ ...prev, responsible: profiles[0].id }));
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl">{contactName || 'Nova Oportunidade'}</DialogTitle>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Valor total:</p>
                                <p className="text-2xl font-bold text-green-600">
                                    R$ {calculateGrandTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="general" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">Geral</TabsTrigger>
                        <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6 mt-4">
                        {/* Informações gerais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold text-lg">Informações gerais</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="status" className="flex items-center gap-2">
                                                <Tag className="h-3.5 w-3.5" /> Estatuto
                                            </Label>
                                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                                <SelectTrigger className="bg-white/70">
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

                                        <div className="space-y-2">
                                            <Label htmlFor="priority" className="flex items-center gap-2">
                                                <AlertCircle className="h-3.5 w-3.5" /> Prioridade
                                            </Label>
                                            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                                                <SelectTrigger className="bg-white/70">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low" className="text-green-600">Baixa</SelectItem>
                                                    <SelectItem value="medium" className="text-yellow-600">Média</SelectItem>
                                                    <SelectItem value="high" className="text-red-600">Alta</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="leadIdentification" className="flex items-center gap-2">
                                            <User className="h-3.5 w-3.5" /> Identificação do Lead
                                        </Label>
                                        <Input
                                            id="leadIdentification"
                                            value={formData.leadIdentification}
                                            onChange={(e) => setFormData({ ...formData, leadIdentification: e.target.value })}
                                            placeholder="Ex: Nome da Empresa ou Cliente"
                                            className="bg-white/70 focus-visible:ring-primary"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="responsible" className="flex items-center gap-2">
                                            <User className="h-3.5 w-3.5" /> Responsável
                                        </Label>
                                        <div className="flex gap-2">
                                            <Select value={formData.responsible} onValueChange={(value) => setFormData({ ...formData, responsible: value })}>
                                                <SelectTrigger className="bg-white/70 flex-1">
                                                    <SelectValue placeholder="Escolha um responsável" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {profiles.filter(p => p.is_active).map(profile => (
                                                        <SelectItem key={profile.id} value={profile.id}>{profile.full_name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button variant="outline" size="sm" onClick={handleAssignToMe} className="whitespace-nowrap">
                                                Me atribuir
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Phone className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold text-lg">Contato</h3>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contact" className="flex items-center gap-2">
                                            <Phone className="h-3.5 w-3.5" /> Telefone
                                        </Label>
                                        <Input
                                            id="contact"
                                            value={formData.contact}
                                            readOnly
                                            className="bg-muted/50 cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5" /> E-mail
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="email@exemplo.com"
                                            className="bg-white/70 focus-visible:ring-primary"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="observation" className="flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5" /> Observação
                                        </Label>
                                        <Textarea
                                            id="observation"
                                            value={formData.observation}
                                            onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                                            rows={3}
                                            placeholder="Detalhes importantes..."
                                            className="bg-white/70 resize-none focus-visible:ring-primary"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Produtos */}
                        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm overflow-hidden">
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <ShoppingBag className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold text-lg">Produtos</h3>
                                    </div>
                                    <Button onClick={addProduct} variant="outline" size="sm" className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Adicionar Produto
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {products.map((product, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,1fr,auto] gap-3 items-end p-4 rounded-lg bg-white/40 border border-border/50 shadow-sm transition-all hover:shadow-md">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</Label>
                                                <Input
                                                    value={product.name}
                                                    onChange={(e) => updateProduct(index, 'name', e.target.value)}
                                                    placeholder="Nome do produto"
                                                    className="bg-white/70"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qtde.</Label>
                                                <Input
                                                    type="number"
                                                    value={product.quantity || ''}
                                                    onChange={(e) => updateProduct(index, 'quantity', Number(e.target.value))}
                                                    className="bg-white/70"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preço</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                                                    <Input
                                                        type="number"
                                                        className="pl-8 bg-white/70"
                                                        value={product.price || ''}
                                                        onChange={(e) => updateProduct(index, 'price', Number(e.target.value))}
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subtotal</Label>
                                                <div className="h-10 flex items-center px-3 border rounded-md bg-muted/30 font-medium">
                                                    R$ {calculateProductTotal(product.quantity, product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => removeProduct(index)}
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-4 mt-2">
                                    <div className="bg-primary/5 px-6 py-3 rounded-xl border border-primary/10">
                                        <p className="text-sm text-muted-foreground text-right mb-1">Total da Proposta</p>
                                        <p className="text-3xl font-extrabold text-primary">
                                            R$ {calculateGrandTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tarefas */}
                        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <CheckSquare className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold text-lg">Tarefas Agendadas</h3>
                                    </div>
                                    <Button onClick={addTask} variant="outline" size="sm" className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Nova Tarefa
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {tasks.map((task, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-[2fr,1.5fr,1.5fr,1fr,auto] gap-3 items-end p-4 rounded-lg bg-white/40 border border-border/50 shadow-sm">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Título</Label>
                                                <Input
                                                    value={task.title}
                                                    onChange={(e) => updateTask(index, 'title', e.target.value)}
                                                    placeholder="O que precisa ser feito?"
                                                    className="bg-white/70"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agendado para</Label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        type="date"
                                                        value={task.scheduledFor}
                                                        onChange={(e) => updateTask(index, 'scheduledFor', e.target.value)}
                                                        className="pl-9 bg-white/70"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Atribuído a</Label>
                                                <Select value={task.assignedTo} onValueChange={(value) => updateTask(index, 'assignedTo', value)}>
                                                    <SelectTrigger className="bg-white/70">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {profiles.filter(p => p.is_active).map(profile => (
                                                            <SelectItem key={profile.id} value={profile.id}>{profile.full_name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
                                                <Select value={task.status} onValueChange={(value) => updateTask(index, 'status', value)}>
                                                    <SelectTrigger className="bg-white/70">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pendente</SelectItem>
                                                        <SelectItem value="in_progress">Em andamento</SelectItem>
                                                        <SelectItem value="completed">Concluído</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                onClick={() => removeTask(index)}
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {tasks.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground italic bg-muted/20 rounded-lg border border-dashed">
                                            Nenhuma tarefa agendada
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex items-center justify-between">
                            {opportunityId ? (
                                <Button
                                    variant="outline"
                                    onClick={handleArchive}
                                    disabled={archiving || loading}
                                    className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
                                >
                                    {archiving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Archive className="h-4 w-4" />
                                    )}
                                    Arquivar
                                </Button>
                            ) : (
                                <div />
                            )}
                            <Button onClick={handleSubmit} size="lg" className="w-64" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    opportunityId ? 'Atualizar Registro' : 'Criar Oportunidade'
                                )}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="timeline" className="space-y-4 mt-4">
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <h3 className="font-semibold text-lg">Novo comentário</h3>
                                <Textarea
                                    value={timeline}
                                    onChange={(e) => setTimeline(e.target.value)}
                                    placeholder="Novo comentário"
                                    rows={4}
                                />
                                <div className="flex justify-end">
                                    <Button>Comentar</Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lista de comentários anteriores */}
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Nenhuma atividade registrada ainda
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
