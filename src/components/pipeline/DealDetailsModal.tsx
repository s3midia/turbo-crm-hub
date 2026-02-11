import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { DealGeneralTab } from "./DealGeneralTab";
import { DealTimelineTab } from "./DealTimelineTab";

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

interface TimelineActivity {
    id: string;
    type: "comment" | "status_change" | "assignment_change" | "created";
    user: string;
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
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
    timeline?: TimelineActivity[];
}

interface DealDetailsModalProps {
    opportunity: Opportunity | null;
    open: boolean;
    onClose: () => void;
    onUpdate: (opportunity: Opportunity) => void;
}

export function DealDetailsModal({ opportunity, open, onClose, onUpdate }: DealDetailsModalProps) {
    const [activeTab, setActiveTab] = useState("general");

    if (!opportunity) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{opportunity.title}</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">Geral</TabsTrigger>
                        <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="mt-6">
                        <DealGeneralTab opportunity={opportunity} onUpdate={onUpdate} />
                    </TabsContent>

                    <TabsContent value="timeline" className="mt-6">
                        <DealTimelineTab opportunity={opportunity} onUpdate={onUpdate} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
