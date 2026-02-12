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
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { saveOpportunity, type Product, type Task } from '@/hooks/useOpportunities';
import { useToast } from '@/hooks/use-toast';

interface OpportunityModalProps {
    open: boolean;
    onClose: () => void;
    contactName?: string;
    contactPhone?: string;
    stage?: string;
    onSaved?: () => void;
}



export const OpportunityModal = ({
    open,
    onClose,
    contactName = '',
    contactPhone = '',
    stage = 'new_contact',
    onSaved,
}: OpportunityModalProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        status: stage,
        leadIdentification: contactName,
        priority: '',
        contact: contactPhone,
        observation: '',
        responsible: '',
    });

    const [products, setProducts] = useState<Product[]>([
        { name: '', quantity: 0, price: 0 },
    ]);

    const [tasks, setTasks] = useState<Task[]>([
        { title: '', scheduledFor: '', assignedTo: '', status: 'pending' },
    ]);

    const [timeline, setTimeline] = useState('');

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
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const opportunity = {
                lead_identification: formData.leadIdentification,
                contact_phone: formData.contact,
                contact_name: contactName,
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
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <h3 className="font-semibold text-lg mb-4">Informações gerais</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                            <SelectTrigger>
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
                                        <Label htmlFor="priority">Prioridade</Label>
                                        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Baixa</SelectItem>
                                                <SelectItem value="medium">Média</SelectItem>
                                                <SelectItem value="high">Alta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="leadIdentification">Identificação do Lead</Label>
                                    <Input
                                        id="leadIdentification"
                                        value={formData.leadIdentification}
                                        onChange={(e) => setFormData({ ...formData, leadIdentification: e.target.value })}
                                        placeholder="Nome"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contact">Contato</Label>
                                    <Input
                                        id="contact"
                                        value={formData.contact}
                                        readOnly
                                        className="bg-muted"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="observation">Observação</Label>
                                    <Textarea
                                        id="observation"
                                        value={formData.observation}
                                        onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="responsible">Responsável</Label>
                                    <Select value={formData.responsible} onValueChange={(value) => setFormData({ ...formData, responsible: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Escolha, ou digite para buscar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user1">Vendedor 1</SelectItem>
                                            <SelectItem value="user2">Vendedor 2</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="link" size="sm" className="px-0">Me atribuir</Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contato */}
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="font-semibold text-lg mb-4">Contato</h3>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Nome</p>
                                        <p className="font-medium">{contactName || contactPhone}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">E-mail</p>
                                        <p className="font-medium">-</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Telefone</p>
                                        <p className="font-medium">{contactPhone}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Produtos */}
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg">Produtos</h3>
                                    <Button onClick={addProduct} variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Produto
                                    </Button>
                                </div>

                                {products.map((product, index) => (
                                    <div key={index} className="grid grid-cols-[2fr,1fr,1fr,1fr,auto] gap-3 items-end">
                                        <div>
                                            <Label>Nome</Label>
                                            <Select value={product.name} onValueChange={(value) => updateProduct(index, 'name', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="produto1">Produto 1</SelectItem>
                                                    <SelectItem value="produto2">Produto 2</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Qtde.</Label>
                                            <Input
                                                type="number"
                                                value={product.quantity || ''}
                                                onChange={(e) => updateProduct(index, 'quantity', Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <Label>Preço</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                                                <Input
                                                    type="number"
                                                    className="pl-8"
                                                    value={product.price || ''}
                                                    onChange={(e) => updateProduct(index, 'price', Number(e.target.value))}
                                                    step="0.01"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Total</Label>
                                            <div className="h-10 flex items-center px-3 border rounded-md bg-muted text-sm">
                                                R$ {calculateProductTotal(product.quantity, product.price).toFixed(2)}
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => removeProduct(index)}
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="flex justify-end border-t pt-3">
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Total</p>
                                        <p className="text-xl font-bold">
                                            R$ {calculateGrandTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tarefas */}
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-lg">Tarefas</h3>
                                    <Button onClick={addTask} variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Tarefa
                                    </Button>
                                </div>

                                {tasks.map((task, index) => (
                                    <div key={index} className="grid grid-cols-[2fr,1.5fr,1.5fr,1fr,auto] gap-3 items-end">
                                        <div>
                                            <Label>Título</Label>
                                            <Input
                                                value={task.title}
                                                onChange={(e) => updateTask(index, 'title', e.target.value)}
                                                placeholder="Título"
                                            />
                                        </div>
                                        <div>
                                            <Label>Agendado para</Label>
                                            <Input
                                                type="date"
                                                value={task.scheduledFor}
                                                onChange={(e) => updateTask(index, 'scheduledFor', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Atribuído a</Label>
                                            <Select value={task.assignedTo} onValueChange={(value) => updateTask(index, 'assignedTo', value)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="user1">Vendedor 1</SelectItem>
                                                    <SelectItem value="user2">Vendedor 2</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Status</Label>
                                            <Select value={task.status} onValueChange={(value) => updateTask(index, 'status', value)}>
                                                <SelectTrigger>
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
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <div className="flex justify-center">
                            <Button onClick={handleSubmit} size="lg" className="w-64" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    'Atualizar Registro'
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
