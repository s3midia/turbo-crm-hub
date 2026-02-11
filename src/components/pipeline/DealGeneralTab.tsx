import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
    id: string;
    name: string;
    quantity: number;
    price: number;
}

interface Task {
    id: string;
    title: string;
    scheduledFor: string;
    assignedTo: string;
    status: "pending" | "in_progress" | "completed";
}

interface Opportunity {
    id: string;
    title: string;
    client_name: string;
    phone?: string;
    email?: string;
    value: number;
    priority: "low" | "medium" | "high";
    created_at: string;
    stage: string;
    observation?: string;
    products?: Product[];
    tasks?: Task[];
}

interface DealGeneralTabProps {
    opportunity: Opportunity;
    onUpdate: (opportunity: Opportunity) => void;
}

export function DealGeneralTab({ opportunity, onUpdate }: DealGeneralTabProps) {
    const [formData, setFormData] = useState({
        title: opportunity.title,
        client_name: opportunity.client_name,
        phone: opportunity.phone || "",
        email: opportunity.email || "",
        value: opportunity.value,
        priority: opportunity.priority,
        observation: opportunity.observation || "",
    });

    const [products, setProducts] = useState<Product[]>(opportunity.products || []);
    const [tasks, setTasks] = useState<Task[]>(opportunity.tasks || []);

    // Sample product catalog (in real app, fetch from Supabase)
    const productCatalog = [
        { id: "p1", name: "Produto A", price: 100.00 },
        { id: "p2", name: "Produto B", price: 250.00 },
        { id: "p3", name: "Produto C", price: 500.00 },
        { id: "p4", name: "Serviço Premium", price: 1200.00 },
    ];

    const handleAddProduct = () => {
        setProducts([
            ...products,
            { id: `temp-${Date.now()}`, name: "", quantity: 1, price: 0 },
        ]);
    };

    const handleRemoveProduct = (index: number) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    const handleProductChange = (index: number, field: keyof Product, value: any) => {
        const updated = [...products];
        updated[index] = { ...updated[index], [field]: value };

        // If changing product name, auto-fill price
        if (field === "name") {
            const catalogProduct = productCatalog.find(p => p.name === value);
            if (catalogProduct) {
                updated[index].price = catalogProduct.price;
            }
        }

        setProducts(updated);
    };

    const handleAddTask = () => {
        setTasks([
            ...tasks,
            {
                id: `temp-${Date.now()}`,
                title: "",
                scheduledFor: new Date().toISOString().split('T')[0],
                assignedTo: "",
                status: "pending",
            },
        ]);
    };

    const handleRemoveTask = (index: number) => {
        setTasks(tasks.filter((_, i) => i !== index));
    };

    const handleTaskChange = (index: number, field: keyof Task, value: any) => {
        const updated = [...tasks];
        updated[index] = { ...updated[index], [field]: value };
        setTasks(updated);
    };

    const handleSave = () => {
        const updatedOpportunity = {
            ...opportunity,
            ...formData,
            products,
            tasks,
        };
        onUpdate(updatedOpportunity);
    };

    const totalProductsValue = products.reduce(
        (sum, p) => sum + (p.quantity * p.price),
        0
    );

    return (
        <div className="space-y-6">
            {/* Lead Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Informações do Lead</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Identificação</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Nome do lead"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Prioridade</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                            >
                                <SelectTrigger id="priority">
                                    <SelectValue />
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
                        <Label htmlFor="value">Valor Estimado (R$)</Label>
                        <Input
                            id="value"
                            type="number"
                            step="0.01"
                            value={formData.value}
                            onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="observation">Observação</Label>
                        <Textarea
                            id="observation"
                            value={formData.observation}
                            onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                            placeholder="Notas sobre este lead..."
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Collapsible Sections */}
            <Accordion type="multiple" defaultValue={["contact", "products", "tasks"]} className="space-y-4">
                {/* Contact Section */}
                <AccordionItem value="contact" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-lg font-semibold">
                        Contato
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="client_name">Nome</Label>
                            <Input
                                id="client_name"
                                value={formData.client_name}
                                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                placeholder="Nome do contato"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+55 11 99999-9999"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="contato@exemplo.com"
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Products Section */}
                <AccordionItem value="products" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-lg font-semibold">
                        Produtos ({products.length})
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        {products.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhum produto adicionado
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {products.map((product, index) => (
                                    <div key={product.id} className="flex gap-3 items-start p-3 border rounded-lg bg-muted/30">
                                        <div className="flex-1 grid grid-cols-4 gap-3">
                                            <div className="col-span-2 space-y-1">
                                                <Label className="text-xs">Produto</Label>
                                                <Select
                                                    value={product.name}
                                                    onValueChange={(value) => handleProductChange(index, "name", value)}
                                                >
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {productCatalog.map((p) => (
                                                            <SelectItem key={p.id} value={p.name}>
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs">Qtd</Label>
                                                <Input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={product.quantity}
                                                    onChange={(e) =>
                                                        handleProductChange(index, "quantity", parseFloat(e.target.value) || 0)
                                                    }
                                                    className="h-9"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs">Preço</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={product.price}
                                                    onChange={(e) =>
                                                        handleProductChange(index, "price", parseFloat(e.target.value) || 0)
                                                    }
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1 w-24">
                                            <Label className="text-xs">Total</Label>
                                            <div className="h-9 flex items-center px-2 bg-muted rounded-md text-sm font-semibold">
                                                R$ {(product.quantity * product.price).toFixed(2)}
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveProduct(index)}
                                            className="mt-6 h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="flex justify-between items-center pt-2 border-t">
                                    <span className="font-semibold">Total Geral:</span>
                                    <span className="text-lg font-bold text-primary">
                                        R$ {totalProductsValue.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <Button onClick={handleAddProduct} variant="outline" className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Produto
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                {/* Tasks Section */}
                <AccordionItem value="tasks" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-lg font-semibold">
                        Tarefas ({tasks.length})
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        {tasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhuma tarefa adicionada
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {tasks.map((task, index) => (
                                    <div key={task.id} className="flex gap-3 items-start p-3 border rounded-lg bg-muted/30">
                                        <div className="flex-1 grid grid-cols-4 gap-3">
                                            <div className="col-span-2 space-y-1">
                                                <Label className="text-xs">Título</Label>
                                                <Input
                                                    value={task.title}
                                                    onChange={(e) => handleTaskChange(index, "title", e.target.value)}
                                                    placeholder="Título da tarefa"
                                                    className="h-9"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs">Data</Label>
                                                <Input
                                                    type="date"
                                                    value={task.scheduledFor}
                                                    onChange={(e) => handleTaskChange(index, "scheduledFor", e.target.value)}
                                                    className="h-9"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs">Responsável</Label>
                                                <Input
                                                    value={task.assignedTo}
                                                    onChange={(e) => handleTaskChange(index, "assignedTo", e.target.value)}
                                                    placeholder="Nome"
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1 w-32">
                                            <Label className="text-xs">Status</Label>
                                            <Select
                                                value={task.status}
                                                onValueChange={(value: any) => handleTaskChange(index, "status", value)}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pendente</SelectItem>
                                                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                                                    <SelectItem value="completed">Finalizado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveTask(index)}
                                            className="mt-6 h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button onClick={handleAddTask} variant="outline" className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Tarefa
                        </Button>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button onClick={handleSave} className="px-8">
                    <Save className="mr-2 h-4 w-4" />
                    Atualizar Registro
                </Button>
            </div>
        </div>
    );
}
