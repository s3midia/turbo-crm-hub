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
    contract_start_date?: string;
    contract_end_date?: string;
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

const parseCurrency = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/R\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

export const saveOpportunity = async (opportunity: Opportunity) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    
    const leadData: any = {
        company_name: opportunity.lead_identification,
        phone: opportunity.contact_phone,
        status: opportunity.stage || null,
        niche: opportunity.niche,
        site_url: opportunity.site_url,
        contract_start_date: opportunity.contract_start_date,
        contract_end_date: opportunity.contract_end_date,
        updated_at: new Date().toISOString(),
    };

    const opportunityData: any = {
        user_id: user.id,
        lead_identification: opportunity.lead_identification,
        contact_phone: opportunity.contact_phone,
        contact_name: opportunity.contact_name,
        contact_email: opportunity.contact_email,
        stage: opportunity.stage || null,
        priority: opportunity.priority || null,
        observation: opportunity.observation,
        responsible_id: opportunity.responsible_id || null,
        products: opportunity.products || [],
        tasks: opportunity.tasks || [],
        contract_start_date: opportunity.contract_start_date,
        contract_end_date: opportunity.contract_end_date,
        updated_at: new Date().toISOString(),
    };

    // Só atualiza o valor se ele for explicitamente passado (ex: via finanças)
    // Se vier do modal geral onde removemos o vínculo, ele será undefined
    if (opportunity.total_value !== undefined) {
        const val = parseCurrency(opportunity.total_value);
        leadData.value = val;
        opportunityData.total_value = val;
    }

    if (opportunity.id) {
        const { error: updateError } = await supabase.from('leads').update(leadData).eq('id', opportunity.id);
        if (updateError) throw updateError;
        try {
            const { data, error } = await supabase
                .from('opportunities')
                .upsert({ id: opportunity.id, ...opportunityData })
                .select()
                .single();
            if (error && error.code !== 'PGRST205') console.error("Erro ao dar upsert em oportunidade:", error);
            return data || { id: opportunity.id, ...opportunityData };
        } catch (e) {
            return { id: opportunity.id, ...opportunityData };
        }
    } else {
        const { data: newLead, error: leadError } = await supabase
            .from('leads')
            .insert([leadData])
            .select()
            .single();
        if (leadError) throw leadError;
        
        try {
            const { error: oppError } = await supabase.from('opportunities').insert([{ id: newLead.id, ...opportunityData }]);
            if (oppError && oppError.code !== 'PGRST205') {
                console.error("Erro ao inserir oportunidade:", oppError);
            }
        } catch (e) {
            console.warn("Table opportunities likely does not exist.");
        }
        
        return newLead;
    }
};

export const getOpportunityById = async (id: string) => {
    try {
        const { data: opp, error: oppError } = await supabase.from('opportunities').select('*').eq('id', id).single();
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
                total_value: parseCurrency(opp.total_value),
                products: opp.products || [],
                tasks: opp.tasks || [],
                contract_start_date: opp.contract_start_date,
                contract_end_date: opp.contract_end_date,
                created_at: opp.created_at,
                updated_at: opp.updated_at,
            } as Opportunity;
        }
    } catch (e) {
        console.warn("Error fetching from opportunities:", e);
    }

    const { data: lead, error: leadError } = await supabase.from('leads').select('*').eq('id', id).single();
    if (leadError) throw leadError;
    return {
        id: lead.id,
        lead_identification: lead.company_name,
        contact_phone: lead.phone,
        stage: lead.status,
        niche: lead.niche,
        site_url: lead.site_url,
        total_value: parseCurrency(lead.value || lead.total_value),
        products: [],
        tasks: [],
        contract_start_date: lead.contract_start_date,
        contract_end_date: lead.contract_end_date,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
    } as Opportunity;
};

export const updateOpportunityStage = async (id: string, stage: string) => {
    try {
        await supabase.from('opportunities').update({ stage }).eq('id', id);
    } catch (e) {}
    await supabase.from('leads').update({ status: stage }).eq('id', id);
};

export const archiveOpportunity = async (id: string) => {
    try {
        await supabase.from('opportunities').update({ stage: 'arquivado' }).eq('id', id);
    } catch (e) {}
    await supabase.from('leads').update({ status: 'arquivado' }).eq('id', id);
};

export const deleteOpportunity = async (id: string) => {
    try {
        // Tenta deletar da tabela de oportunidades se existir
        await supabase.from('opportunities').delete().eq('id', id);
    } catch (e) {}
    
    // Deleta da tabela de leads (que é a principal)
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
};

export const getTimelineEntries = async (opportunityId: string): Promise<TimelineEntry[]> => {
    const { data, error } = await supabase.from('opportunity_timeline').select('*').eq('opportunity_id', opportunityId).order('created_at', { ascending: false });
    if (error) return [];
    return data.map(entry => ({ id: entry.id, type: 'comment', content: entry.comment, created_at: entry.created_at }));
};

export const addTimelineComment = async (opportunityId: string, comment: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    try {
        await supabase.from('opportunity_timeline').insert({ opportunity_id: opportunityId, user_id: user.id, comment: comment });
    } catch (e) {}
};

export const getOpportunities = async (): Promise<Opportunity[]> => {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
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
        total_value: parseCurrency(lead.value || lead.total_value), 
        products: [],
        tasks: [],
        contract_start_date: lead.contract_start_date,
        contract_end_date: lead.contract_end_date
    }));
};

export const initializeDemoData = async () => Promise.resolve();
