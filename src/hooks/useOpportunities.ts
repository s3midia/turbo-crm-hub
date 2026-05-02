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
    stage: string;
    observation?: string;
    responsible_id?: string;
    total_value: number;
    products?: Product[];
    tasks?: Task[];
    archived?: boolean;
    niche?: string;
    site_url?: string;
    created_at?: string;
    updated_at?: string;
}

export interface TimelineEntry {
    id: string;
    type: 'comment' | 'agent' | 'whatsapp';
    content: string;
    agent_id?: string;
    created_at: string;
}

// Create or update opportunity (OPPORTUNITIES TABLE VERSION)
export const saveOpportunity = async (opportunity: Opportunity) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    
    const opportunityData = {
        user_id: user.id,
        lead_identification: opportunity.lead_identification,
        contact_phone: opportunity.contact_phone,
        contact_name: opportunity.contact_name,
        contact_email: opportunity.contact_email,
        stage: opportunity.stage,
        priority: opportunity.priority,
        observation: opportunity.observation,
        responsible_id: opportunity.responsible_id || null,
        total_value: opportunity.total_value || 0,
        products: opportunity.products || [],
        tasks: opportunity.tasks || [],
        updated_at: new Date().toISOString(),
    };

    if (opportunity.id) {
        const { data, error } = await supabase
            .from('opportunities')
            .update(opportunityData)
            .eq('id', opportunity.id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase
            .from('opportunities')
            .insert([opportunityData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};

export const getOpportunityById = async (id: string) => {
    const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) throw error;
    
    return {
        id: data.id,
        lead_identification: data.lead_identification,
        contact_phone: data.contact_phone,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        stage: data.stage,
        priority: data.priority,
        observation: data.observation,
        responsible_id: data.responsible_id,
        total_value: data.total_value || 0,
        products: data.products || [],
        tasks: data.tasks || [],
        created_at: data.created_at,
        updated_at: data.updated_at,
    } as Opportunity;
};

export const updateOpportunityStage = async (id: string, stage: string) => {
    const { error } = await supabase
        .from('opportunities')
        .update({ stage, updated_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw error;
};

export const archiveOpportunity = async (id: string) => {
    const { error } = await supabase
        .from('opportunities')
        .update({ stage: 'arquivado' }) 
        .eq('id', id);
    if (error) throw error;
};

export const getTimelineEntries = async (opportunityId: string): Promise<TimelineEntry[]> => {
    const { data, error } = await supabase
        .from('opportunity_timeline')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(entry => ({
        id: entry.id,
        type: 'comment',
        content: entry.comment,
        created_at: entry.created_at
    }));
};

export const addTimelineComment = async (opportunityId: string, comment: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { error } = await supabase.from('opportunity_timeline').insert({
        opportunity_id: opportunityId,
        user_id: user.id,
        comment: comment
    });
    if (error) throw error;
};

export const getOpportunities = async (): Promise<Opportunity[]> => {
    const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(opp => ({
        id: opp.id,
        lead_identification: opp.lead_identification,
        contact_phone: opp.contact_phone,
        contact_name: opp.contact_name,
        contact_email: opp.contact_email,
        stage: opp.stage,
        priority: opp.priority,
        observation: opp.observation,
        responsible_id: opp.responsible_id,
        total_value: opp.total_value || 0,
        products: opp.products || [],
        tasks: opp.tasks || [],
        created_at: opp.created_at,
        updated_at: opp.updated_at,
    }));
};

export const initializeDemoData = async () => {
    return Promise.resolve();
};
