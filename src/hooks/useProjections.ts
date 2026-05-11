import { useMemo, useEffect, useState } from 'react';
import { FinancialTransaction, useFinance } from './useFinance';
import { supabase } from '@/integrations/supabase/client';
import { parseBRL } from '@/lib/formatters';

export interface ProjectedTransaction extends Partial<FinancialTransaction> {
  isProjection: boolean;
  originalId?: string;
}

export const useProjections = (leadId?: string, monthsCount: number = 12) => {
  const { transactions, loading: financeLoading, saveTransaction, deleteTransaction } = useFinance(leadId);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      try {
        setLeadsLoading(true);
        let query = supabase
          .from('leads')
          .select('*')
          .or('status.eq.ganhou,is_client.eq.true');
        
        if (leadId) query = query.eq('id', leadId);
        
        const { data, error } = await query;
        setLeads(data || []);
      } catch (err) {
        console.error('Error fetching leads for projections:', err);
      } finally {
        setLeadsLoading(false);
      }
    }
    fetchLeads();
  }, []);

  const allTransactions = useMemo(() => {
    if (financeLoading || leadsLoading) return [];

    const projections: ProjectedTransaction[] = [];
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Revenue Projections (Active Contracts)
    leads.forEach(lead => {
      if (!lead.contract_end_date || !lead.value) return;
      
      const endDate = new Date(lead.contract_end_date);
      // Only project from current month onwards
      const startProj = currentMonth;
      
      for (let i = 0; i < monthsCount; i++) {
        const projDate = new Date(startProj.getFullYear(), startProj.getMonth() + i, 1);
        if (projDate > endDate) break;

        // Check if there is already a transaction for this lead in this month/year
        const hasActual = transactions.some(t => {
          const tDate = new Date(t.vencimento);
          return t.lead_id === lead.id && 
                 tDate.getMonth() === projDate.getMonth() && 
                 tDate.getFullYear() === projDate.getFullYear();
        });

        if (!hasActual) {
          projections.push({
            descricao: `Mensalidade: ${lead.company_name}`,
            tipo: 'entrada',
            valor: lead.value,
            vencimento: projDate.toISOString().split('T')[0],
            lead_id: lead.id,
            lead_nome: lead.company_name,
            categoria: 'Software',
            status: 'pendente',
            recorrencia: 'mensal',
            classificacao: 'recorrente',
            isProjection: true
          });
        }
      }
    });

    // 2. Recurring Expense Projections
    // Get unique recurring expenses by description + category
    const recurringBase = transactions.filter(t => t.tipo === 'saida' && t.recorrencia === 'mensal');
    const expenseGroups = new Map<string, FinancialTransaction>();
    
    recurringBase.forEach(t => {
      const key = `${t.descricao}-${t.categoria}`;
      if (!expenseGroups.has(key) || new Date(t.vencimento) > new Date(expenseGroups.get(key)!.vencimento)) {
        expenseGroups.set(key, t);
      }
    });

    expenseGroups.forEach(baseTx => {
      const baseDate = new Date(baseTx.vencimento);
      // Project from next month after the base transaction
      const startProjMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
      
      for (let i = 0; i < monthsCount; i++) {
        const projDate = new Date(startProjMonth.getFullYear(), startProjMonth.getMonth() + i, Math.min(baseDate.getDate(), 28));
        
        // Don't project too far if not needed, but here we go up to monthsCount
        const hasActual = transactions.some(t => {
          const tDate = new Date(t.vencimento);
          return t.descricao === baseTx.descricao && 
                 tDate.getMonth() === projDate.getMonth() && 
                 tDate.getFullYear() === projDate.getFullYear();
        });

        if (!hasActual) {
          projections.push({
            ...baseTx,
            id: undefined,
            vencimento: projDate.toISOString().split('T')[0],
            status: 'pendente',
            isProjection: true,
            originalId: baseTx.id
          });
        }
      }
    });

    // Merge and sort
    const merged = [
      ...transactions.map(t => ({ ...t, isProjection: false } as ProjectedTransaction)),
      ...projections
    ];

    return merged.sort((a, b) => new Date(b.vencimento!).getTime() - new Date(a.vencimento!).getTime());
  }, [transactions, leads, financeLoading, leadsLoading, monthsCount]);

  return { 
    transactions: allTransactions, 
    loading: financeLoading || leadsLoading,
    saveTransaction,
    deleteTransaction,
    refreshLeads: () => {} // Placeholder
  };
};
