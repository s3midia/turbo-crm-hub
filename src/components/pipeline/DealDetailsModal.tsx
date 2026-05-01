import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { User, DollarSign } from "lucide-react";
import { DealGeneralTab } from "./DealGeneralTab";
import { LeadFinanceTab } from "../financeiro/LeadFinanceTab";

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
    if (!opportunity) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{opportunity.title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-8 mt-4">
                    {/* Seção: Informações do Usuário / Contato */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                            <User className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-bold uppercase tracking-wider text-primary">
                                Informações do Usuário
                            </h2>
                        </div>
                        <DealGeneralTab opportunity={opportunity} onUpdate={onUpdate} />
                    </section>

                    <Separator className="my-2" />

                    {/* Seção: Informações Financeiras */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                            <h2 className="text-lg font-bold uppercase tracking-wider text-emerald-600">
                                Informações Financeiras
                            </h2>
                        </div>
                        <LeadFinanceTab
                            leadId={opportunity.id}
                            leadName={opportunity.client_name}
                            products={opportunity.products}
                            onUpdateProducts={(products) => onUpdate({ ...opportunity, products })}
                        />
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}
