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
  document_url?: string;
  created_at?: string;
}

// Helper to clean currency strings and return a valid number
const parseCurrency = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  
  // Remove R$, spaces, dots (thousands), and replace comma with dot
  const cleaned = String(val)
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
    
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const useFinance = (leadId?: string) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Se leadId for uma string vazia, retornamos vazio (caso de novo lead não salvo)
      if (leadId === "") {
        setTransactions([]);
        setLoading(false);
        return;
      }

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
        const val = parseCurrency(t.valor);
        return t.tipo === 'saida' ? acc - val : acc + val;
      }, 0);

      // 1. Update 'opportunities' table
      await supabase
        .from('opportunities')
        .update({ total_value: total })
        .eq('id', leadId);

      // 2. Update 'leads' table (value column)
      await supabase
        .from('leads')
        .update({ value: total })
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

  const saveTransaction = async (transaction: Partial<FinancialTransaction> & { isProjection?: boolean }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Strip frontend-only fields that don't exist in the DB schema
    const { isProjection, ...cleanTransaction } = transaction as any;
    const data = { ...cleanTransaction, user_id: user.id };

    if (data.id) {
      const { error } = await supabase.from('financial_transactions').update(data).eq('id', data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('financial_transactions').insert([data]);
      if (error) throw error;
    }
    
    if (leadId) {
      const { data: allTransactions } = await supabase.from('financial_transactions').select('*').eq('lead_id', leadId);
      if (allTransactions) await syncOpportunityTotal(leadId, allTransactions);
    }
    
    await fetchTransactions();
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
    if (error) throw error;
    
    if (leadId) {
      const { data: allTransactions } = await supabase.from('financial_transactions').select('*').eq('lead_id', leadId);
      if (allTransactions) await syncOpportunityTotal(leadId, allTransactions);
    }
    
    await fetchTransactions();
  };

  return { transactions, loading, saveTransaction, deleteTransaction, refresh: fetchTransactions };
};
