import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialTransaction {
  id?: string;
  user_id?: string;
  descricao: string;
  tipo: 'entrada' | 'saida';
  valor: number | string;
  data_lancamento: string;
  vencimento: string;
  recebimento?: string;
  lead_nome?: string;
  lead_id?: string;
  status: 'pago' | 'pendente' | 'agendado';
  categoria: string;
  recorrencia: 'unica' | 'mensal' | 'trimestral' | 'anual';
  classificacao?: 'recorrente' | 'nao_recorrente';
  created_at?: string;
}

export const useFinance = (leadId?: string) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let query = supabase.from('financial_transactions').select('*').order('vencimento', { ascending: false });
      if (leadId) query = query.eq('lead_id', leadId);
      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncOpportunityTotal = async (leadId: string, transactions: FinancialTransaction[]) => {
    try {
      const total = transactions.reduce((acc, t) => {
        const v = typeof t.valor === 'string' ? parseFloat(t.valor) : Number(t.valor);
        const val = isNaN(v) ? 0 : v;
        return t.tipo === 'saida' ? acc - val : acc + v;
      }, 0);

      // 1. Update 'opportunities' table (has total_value)
      await supabase
        .from('opportunities')
        .update({ total_value: total })
        .eq('id', leadId);

      // 2. Update 'leads' table (Kanban) - separate calls to be safe
      // Try 'value' column first
      await supabase
        .from('leads')
        .update({ value: total })
        .eq('id', leadId);
        
      // Try 'total_value' column optionally (this might fail if column doesn't exist, which is fine)
      await supabase
        .from('leads')
        .update({ total_value: total } as any)
        .eq('id', leadId);

    } catch (err) {
      console.warn('Erro ao sincronizar valores financeiros:', err);
    }
  }

  useEffect(() => {
    fetchTransactions();
    const channel = supabase.channel('finance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_transactions' }, () => {
        fetchTransactions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [leadId]);

  const saveTransaction = async (transaction: Partial<FinancialTransaction>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const data = { ...transaction, user_id: user.id };
    if (data.id) {
      const { error } = await supabase.from('financial_transactions').update(data).eq('id', data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('financial_transactions').insert([data]);
      if (error) throw error;
    }
    
    // Auto-sync total if leadId is present
    if (leadId) {
      const { data: allTransactions } = await supabase.from('financial_transactions').select('*').eq('lead_id', leadId);
      if (allTransactions) await syncOpportunityTotal(leadId, allTransactions);
    }
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
    if (error) throw error;
    
    if (leadId) {
      const { data: allTransactions } = await supabase.from('financial_transactions').select('*').eq('lead_id', leadId);
      if (allTransactions) await syncOpportunityTotal(leadId, allTransactions);
    }
  };

  return { transactions, loading, saveTransaction, deleteTransaction, refresh: fetchTransactions };
};
