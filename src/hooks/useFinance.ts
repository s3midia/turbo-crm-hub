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

// Recalcula o total_value na tabela opportunities após cada mudança de transação
const syncOpportunityTotal = async (leadId: string) => {
  try {
    const { data: txData } = await supabase
      .from('financial_transactions')
      .select('valor, tipo')
      .eq('lead_id', leadId);

    const total = (txData || []).reduce((acc, t) => {
      const v = parseFloat(String(t.valor)) || 0;
      return t.tipo === 'saida' ? acc - v : acc + v;
    }, 0);

    await supabase
      .from('opportunities')
      .update({ total_value: total })
      .eq('id', leadId);
  } catch (err) {
    console.warn('Erro ao sincronizar total_value:', err);
  }
};

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
        // Sincroniza total_value no card do pipeline sempre que carregar
        if (leadId && data && data.length > 0) {
          await syncOpportunityTotal(leadId);
        }
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

      const cleanData = Object.fromEntries(
        Object.entries(transaction).filter(([_, v]) => v !== undefined)
      );

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

      await fetchTransactions();

      // Atualiza total_value no card do pipeline
      const tid = (transaction.lead_id || leadId);
      if (tid) await syncOpportunityTotal(tid);

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

      // Atualiza total_value no card do pipeline
      if (leadId) await syncOpportunityTotal(leadId);

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
