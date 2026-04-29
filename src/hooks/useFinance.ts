import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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
      const { data: { user } } = await supabase.auth.getUser();
      
      // Clean undefined values to avoid Supabase errors
      const cleanData = Object.fromEntries(
        Object.entries(transaction).filter(([_, v]) => v !== undefined)
      );

      // Add user_id if available and not already set
      if (user && !cleanData.user_id) {
        (cleanData as any).user_id = user.id;
      }

      if (transaction.id) {
        const { error } = await supabase
          .from('financial_transactions')
          .update(cleanData)
          .eq('id', transaction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('financial_transactions')
          .insert([cleanData]);
        if (error) throw error;
      }
      
      console.log('Transaction saved successfully, re-fetching...');
      await fetchTransactions();
    } catch (err: any) {
      console.error('Error saving transaction:', err.message || err);
      toast.error(`Erro ao salvar transação: ${err.message || 'Erro desconhecido'}`);
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
