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

// Create or update opportunity
export const saveOpportunity = async (opportunity: Opportunity) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    const opportunityData = {
        ...opportunity,
        user_id: user.id,
    };

    if (opportunity.id) {
        // Update existing
        const { data, error } = await supabase
            .from('opportunities')
            .update(opportunityData)
            .eq('id', opportunity.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } else {
        // Create new
        const { data, error } = await supabase
            .from('opportunities')
            .insert(opportunityData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// Get all opportunities for current user
export const getOpportunities = async () => {
    const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Opportunity[];
};

// Get opportunity by ID
export const getOpportunityById = async (id: string) => {
    const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Opportunity;
};

// Delete opportunity
export const deleteOpportunity = async (id: string) => {
    const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// Add timeline entry
export const addTimelineEntry = async (entry: TimelineEntry) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('opportunity_timeline')
        .insert({
            ...entry,
            user_id: user.id,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Get timeline for opportunity
export const getTimelineEntries = async (opportunityId: string) => {
    const { data, error } = await supabase
        .from('opportunity_timeline')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TimelineEntry[];
};
