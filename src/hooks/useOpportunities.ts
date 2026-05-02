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

// Create or update opportunity (HYBRID VERSION: UPDATES BOTH LEADS AND OPPORTUNITIES)
export const saveOpportunity = async (opportunity: Opportunity) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    
    // Data for the 'leads' table (used by FunilKanbanPage)
    const leadData = {
        company_name: opportunity.lead_identification,
        phone: opportunity.contact_phone,
        status: opportunity.stage,
        niche: opportunity.niche,
        site_url: opportunity.site_url,
        value: opportunity.total_value, // Kanban uses 'value'
        total_value: opportunity.total_value,
        updated_at: new Date().toISOString(),
    };

    // Data for the 'opportunities' table (richer data)
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
        // Try updating 'leads' first (most important for current UI)
        await supabase.from('leads').update(leadData).eq('id', opportunity.id);
        
        // Then try updating/upserting 'opportunities'
        const { data, error } = await supabase
            .from('opportunities')
            .upsert({ id: opportunity.id, ...opportunityData })
            .select()
            .single();
        
        if (error) {
            console.warn("Could not upsert into opportunities, but leads might have been updated:", error.message);
        }
        return data || { id: opportunity.id, ...opportunityData };
    } else {
        // Create new in 'leads' first
        const { data: newLead, error: leadError } = await supabase
            .from('leads')
            .insert([leadData])
            .select()
            .single();
        
        if (leadError) throw leadError;

        // Then create in 'opportunities' with the same ID
        await supabase.from('opportunities').insert([{ id: newLead.id, ...opportunityData }]);
        
        return newLead;
    }
};

export const getOpportunityById = async (id: string) => {
    // Try opportunities first (has products/tasks)
    const { data: opp, error: oppError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();
    
    if (!oppError && opp) {
        return {
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
        } as Opportunity;
    }

    // Fallback to leads
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();
    
    if (leadError) throw leadError;

    return {
        id: lead.id,
        lead_identification: lead.company_name,
        contact_phone: lead.phone,
        stage: lead.status,
        niche: lead.niche,
        site_url: lead.site_url,
        total_value: lead.total_value || lead.value || 0,
        products: [],
        tasks: [],
        created_at: lead.created_at,
        updated_at: lead.updated_at,
    } as Opportunity;
};

export const updateOpportunityStage = async (id: string, stage: string) => {
    // Update both tables to keep them in sync
    await supabase.from('opportunities').update({ stage }).eq('id', id);
    await supabase.from('leads').update({ status: stage }).eq('id', id);
};

export const archiveOpportunity = async (id: string) => {
    await supabase.from('opportunities').update({ stage: 'arquivado' }).eq('id', id);
    await supabase.from('leads').update({ status: 'arquivado' }).eq('id', id);
};

export const getTimelineEntries = async (opportunityId: string): Promise<TimelineEntry[]> => {
    const { data, error } = await supabase
        .from('opportunity_timeline')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });

    if (error) return [];

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
    // Pipeline usually uses 'leads' table for the Kanban board view
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(lead => ({
        id: lead.id,
        lead_identification: lead.company_name,
        contact_phone: lead.phone,
        stage: lead.status,
        niche: lead.niche,
        site_url: lead.site_url,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        total_value: lead.total_value || lead.value || 0, 
        products: [],
        tasks: []
    }));
};

export const initializeDemoData = async () => {
    return Promise.resolve();
};
