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
import { CurrencyInput } from "@/components/ui/currency-input";

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

import { DealTimelineTab } from "./DealTimelineTab";

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

    const [tasks, setTasks] = useState<Task[]>(opportunity.tasks || []);

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
            tasks,
        };
        onUpdate(updatedOpportunity);
    };

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
                        <CurrencyInput
                            id="value"
                            value={Number(formData.value || 0)}
                            onChange={(val) => setFormData({ ...formData, value: val })}
                            placeholder="0,00"
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
            <Accordion type="multiple" defaultValue={["contact", "timeline"]} className="space-y-4">
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

                {/* Timeline Section */}
                <AccordionItem value="timeline" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-lg font-semibold">
                        Linha do Tempo
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        <DealTimelineTab deal={opportunity as any} onUpdate={onUpdate as any} />
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
