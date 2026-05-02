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

// Create or update opportunity (SUPABASE VERSION)
export const saveOpportunity = async (opportunity: Opportunity) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const leadData = {
        company_name: opportunity.lead_identification,
        phone: opportunity.contact_phone,
        status: opportunity.stage,
        // Map other fields to metadata or new columns if they exist
        // For now, we use existing columns in 'leads' table
    };

    if (opportunity.id) {
        const { data, error } = await supabase
            .from('leads')
            .update({
                company_name: opportunity.lead_identification,
                phone: opportunity.contact_phone,
                status: opportunity.stage,
                niche: opportunity.niche,
                site_url: opportunity.site_url,
                total_value: opportunity.total_value,
                updated_at: new Date().toISOString(),
            })
            .eq('id', opportunity.id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase
            .from('leads')
            .insert([{
                company_name: opportunity.lead_identification,
                phone: opportunity.contact_phone,
                status: opportunity.stage,
                niche: opportunity.niche,
                site_url: opportunity.site_url,
                total_value: opportunity.total_value,
            }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};

export const getOpportunityById = async (id: string) => {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) throw error;
    
    // Map database lead to Opportunity interface
    return {
        id: data.id,
        lead_identification: data.company_name,
        contact_phone: data.phone,
        stage: data.status,
        niche: data.niche,
        site_url: data.site_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
        total_value: data.total_value || 0, 
        products: [],
        tasks: []
    } as Opportunity;
};

export const archiveOpportunity = async (id: string) => {
    const { error } = await supabase
        .from('leads')
        .update({ status: 'arquivado' }) // Using status as archive flag for now
        .eq('id', id);
    if (error) throw error;
};

export const getTimelineEntries = async (opportunityId: string): Promise<TimelineEntry[]> => {
    // 1. Fetch manual comments (if we had a comments table, but we'll use agent_logs for now)
    // 2. Fetch agent logs for this lead
    const { data: logs, error: logsError } = await supabase
        .from('agent_logs')
        .select('*')
        .or(`message.ilike.%[Lead:${opportunityId}]%,message.ilike.%[AÇÃO][Lead:${opportunityId}]%`)
        .order('created_at', { ascending: false });

    if (logsError) throw logsError;

    const timeline: TimelineEntry[] = logs.map(log => ({
        id: log.id,
        type: log.message.includes('[AÇÃO]') ? 'agent' : 'comment',
        content: log.message.replace(/\[Lead:.*?\]\s*/, '').replace(/\[AÇÃO\]\s*/, ''),
        agent_id: log.agent_id,
        created_at: log.created_at
    }));

    return timeline;
};

export const addTimelineComment = async (opportunityId: string, comment: string) => {
    const { error } = await supabase.from('agent_logs').insert({
        agent_id: 'user',
        message: `[Lead:${opportunityId}] ${comment}`,
        type: 'info'
    });
    if (error) throw error;
};

export const updateOpportunityStage = async (id: string, stage: string) => {
    const { error } = await supabase
        .from('leads')
        .update({ status: stage, updated_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw error;
};

export const getOpportunities = async (): Promise<Opportunity[]> => {
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
        total_value: lead.total_value || 0, 
        products: [],
        tasks: []
    }));
};

export const initializeDemoData = async () => {
    // Função placeholder: no Supabase não inserimos dados fake via frontend por padrão.
    // Se for necessário mockar, adicione a lógica aqui futuramente.
    return Promise.resolve();
};
