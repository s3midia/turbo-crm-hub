import { supabase } from '@/integrations/supabase/client';

export interface Product {
    name: string;
    quantity: number;
    price: number;
}

export interface Task {
    title: string;
    scheduledFor: string;
    assignedTo: string;
    status: string;
}

export interface Opportunity {
    id?: string;
    user_id?: string;
    lead_identification: string;
    contact_phone?: string;
    contact_name?: string;
    contact_email?: string;
    priority?: 'low' | 'medium' | 'high';
    stage: 'new_contact' | 'in_contact' | 'presentation' | 'negotiation';
    observation?: string;
    responsible_id?: string;
    total_value: number;
    products: Product[];
    tasks: Task[];
    created_at?: string;
    updated_at?: string;
}

export interface TimelineEntry {
    id?: string;
    opportunity_id: string;
    user_id?: string;
    comment: string;
    created_at?: string;
}

// LocalStorage keys
const OPPORTUNITIES_KEY = 'crm_opportunities';
const TIMELINE_KEY = 'crm_timeline';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Create or update opportunity (LOCAL VERSION - no Supabase)
export const saveOpportunity = async (opportunity: Opportunity) => {
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const opportunities = getLocalOpportunities();

    if (opportunity.id) {
        // Update existing
        const index = opportunities.findIndex(o => o.id === opportunity.id);
        if (index !== -1) {
            opportunities[index] = {
                ...opportunity,
                updated_at: new Date().toISOString(),
            };
        }
    } else {
        // Create new
        const newOpp = {
            ...opportunity,
            id: generateId(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        opportunities.push(newOpp);
    }

    localStorage.setItem(OPPORTUNITIES_KEY, JSON.stringify(opportunities));
    return opportunity.id ? opportunity : opportunities[opportunities.length - 1];
};

// Get all opportunities (LOCAL VERSION)
export const getOpportunities = async () => {
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return getLocalOpportunities();
};

// Get opportunity by ID (LOCAL VERSION)
export const getOpportunityById = async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const opportunities = getLocalOpportunities();
    const opp = opportunities.find(o => o.id === id);
    if (!opp) throw new Error('Opportunity not found');
    return opp;
};

// Delete opportunity (LOCAL VERSION)
export const deleteOpportunity = async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const opportunities = getLocalOpportunities();
    const filtered = opportunities.filter(o => o.id !== id);
    localStorage.setItem(OPPORTUNITIES_KEY, JSON.stringify(filtered));
};

// Add timeline entry (LOCAL VERSION)
export const addTimelineEntry = async (entry: TimelineEntry) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const timeline = getLocalTimeline();
    const newEntry = {
        ...entry,
        id: generateId(),
        created_at: new Date().toISOString(),
    };
    timeline.push(newEntry);
    localStorage.setItem(TIMELINE_KEY, JSON.stringify(timeline));
    return newEntry;
};

// Get timeline for opportunity (LOCAL VERSION)
export const getTimelineEntries = async (opportunityId: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const timeline = getLocalTimeline();
    return timeline
        .filter(t => t.opportunity_id === opportunityId)
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
};

// Helper functions
function getLocalOpportunities(): Opportunity[] {
    const stored = localStorage.getItem(OPPORTUNITIES_KEY);
    return stored ? JSON.parse(stored) : [];
}

function getLocalTimeline(): TimelineEntry[] {
    const stored = localStorage.getItem(TIMELINE_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Initialize with demo data if empty
export const initializeDemoData = () => {
    const opportunities = getLocalOpportunities();
    if (opportunities.length === 0) {
        const demoData: Opportunity[] = [
            {
                id: '1',
                lead_identification: 'Gleidson de Souza',
                contact_name: 'Gleidson de Souza',
                contact_phone: '+55 77 9 9821268',
                priority: 'high',
                stage: 'in_contact',
                observation: 'Interessado em sistema completo de gestão',
                total_value: 8990,
                products: [
                    { name: 'Sistema CRM Completo', quantity: 1, price: 8990 }
                ],
                tasks: [
                    { title: 'Enviar proposta comercial', scheduledFor: '2026-02-12', assignedTo: 'Vendedor 1', status: 'pending' }
                ],
                created_at: '2026-02-10T10:00:00Z',
                updated_at: '2026-02-11T14:30:00Z',
            },
            {
                id: '2',
                lead_identification: 'Ingryd Vitória',
                contact_name: 'Ingryd Vitória',
                contact_phone: '+55 77 9 8765432',
                priority: 'medium',
                stage: 'new_contact',
                observation: 'Primeiro contato via WhatsApp',
                total_value: 0,
                products: [],
                tasks: [],
                created_at: '2026-02-11T09:00:00Z',
                updated_at: '2026-02-11T09:00:00Z',
            },
            {
                id: '3',
                lead_identification: 'Kelly Ribas',
                contact_name: 'Kelly Ribas',
                contact_phone: '+55 77 9 9988776',
                priority: 'medium',
                stage: 'presentation',
                observation: 'Agendada demonstração para amanhã',
                total_value: 5500,
                products: [
                    { name: 'Módulo WhatsApp', quantity: 1, price: 2500 },
                    { name: 'Módulo Pipeline', quantity: 1, price: 3000 }
                ],
                tasks: [
                    { title: 'Preparar demo personalizada', scheduledFor: '2026-02-12', assignedTo: 'Vendedor 2', status: 'in_progress' }
                ],
                created_at: '2026-02-09T15:00:00Z',
                updated_at: '2026-02-11T16:00:00Z',
            },
            {
                id: '4',
                lead_identification: 'Mateus Silva',
                contact_name: 'Mateus Silva',
                contact_phone: '+55 77 9 7654321',
                priority: 'high',
                stage: 'negotiation',
                observation: 'Negociando desconto para contrato anual',
                total_value: 12000,
                products: [
                    { name: 'Pacote Empresarial', quantity: 1, price: 12000 }
                ],
                tasks: [
                    { title: 'Enviar proposta com desconto', scheduledFor: '2026-02-13', assignedTo: 'Gerente', status: 'pending' },
                    { title: 'Follow-up telefônico', scheduledFor: '2026-02-14', assignedTo: 'Vendedor 1', status: 'pending' }
                ],
                created_at: '2026-02-08T11:00:00Z',
                updated_at: '2026-02-11T18:00:00Z',
            },
        ];

        localStorage.setItem(OPPORTUNITIES_KEY, JSON.stringify(demoData));
    }
};
