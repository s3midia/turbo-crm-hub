import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export interface FinancialTransaction {
  id?: string;
  descricao: string;
  tipo: 'entrada' | 'saida';
  valor: number;
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
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('financial_transactions')
        .select('*')
        .order('vencimento', { ascending: false });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Finance table might not exist:', error.message);
        setTransactions([]);
      } else {
        setTransactions(data || []);
      }
    } catch (err) {
      console.error('Error fetching finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveTransaction = async (transaction: Partial<FinancialTransaction>) => {
    try {
      if (transaction.id) {
        const { error } = await supabase
          .from('financial_transactions')
          .update(transaction)
          .eq('id', transaction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('financial_transactions')
          .insert([transaction]);
        if (error) throw error;
      }
      await fetchTransactions();
    } catch (err) {
      console.error('Error saving transaction:', err);
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [leadId]);

  return {
    transactions,
    loading,
    fetchTransactions,
    saveTransaction,
    deleteTransaction,
  };
};
