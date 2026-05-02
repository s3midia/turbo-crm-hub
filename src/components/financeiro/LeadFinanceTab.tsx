import React, { useState } from 'react';
import { useFinance, FinancialTransaction } from '@/hooks/useFinance';
import {
  DollarSign, Plus,
  ArrowUpCircle, ArrowDownCircle, Edit3, Trash2,
  Banknote, Receipt, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { TransacaoModal } from './LancamentosTab';

interface LeadFinanceTabProps {
  leadId: string;
  leadName: string;
  products?: any[];
  siteUrl?: string;
  onUpdateProducts?: (products: any[]) => void;
}

export const LeadFinanceTab = ({
  leadId,
  leadName,
  products = [],
}: LeadFinanceTabProps) => {
  const { transactions, loading, saveTransaction, deleteTransaction } = useFinance(leadId);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | undefined>();

  const formatBRL = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const toNumber = (v: any) => {
    if (v === null || v === undefined) return 0;
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    return isNaN(n) ? 0 : n;
  };

  // Soma TODAS as transações (entradas - saídas)
  const contractTotal = transactions.reduce((acc, t) => {
    const v = toNumber(t.valor);
    return t.tipo === 'saida' ? acc - v : acc + v;
  }, 0);

  const totals = {
    paid: transactions
      .filter(t => t.tipo === 'entrada' && t.status === 'pago')
      .reduce((acc, t) => acc + toNumber(t.valor), 0),
    pending: transactions
      .filter(t => t.tipo === 'entrada' && t.status === 'pendente')
      .reduce((acc, t) => acc + toNumber(t.valor), 0),
    mrr: transactions
      .filter(t => t.tipo === 'entrada' && t.classificacao === 'recorrente')
      .reduce((acc, t) => acc + toNumber(t.valor), 0),
    overdue: transactions
      .filter(t => t.status === 'pendente' && new Date(t.vencimento) < new Date())
      .reduce((acc, t) => acc + toNumber(t.valor), 0),
  };

  const paidPercent = contractTotal > 0 ? Math.min((totals.paid / contractTotal) * 100, 100) : 0;

  const handleOpenNew = () => {
    setEditingTransaction({
      valor: contractTotal || 0,
      descricao: `Cobrança — ${leadName}`,
      tipo: 'entrada',
      status: 'pendente',
      categoria: 'Software',
      recorrencia: 'unica',
      data_lancamento: new Date().toISOString().split('T')[0],
      vencimento: new Date().toISOString().split('T')[0],
      lead_nome: leadName,
      lead_id: leadId,
    } as any);
    setShowModal(true);
  };

  const handleOpenEdit = (t: FinancialTransaction) => {
    setEditingTransaction(t);
    setShowModal(true);
  };

  const handleSave = async (t: Partial<FinancialTransaction>) => {
    await saveTransaction(t);
    setShowModal(false);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary opacity-30" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {showModal && (
        <TransacaoModal
          transaction={editingTransaction}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          preFilledLeadId={leadId}
          preFilledLeadName={leadName}
        />
      )}

      {/* ── Resumo do Contrato ── */}
      {contractTotal > 0 && (
        <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-background shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                  Progresso do Contrato
                </p>
                <p className="text-2xl font-black text-primary">
                  {formatBRL(totals.paid)}
                  <span className="text-sm font-bold text-muted-foreground ml-2">
                    de {formatBRL(contractTotal)}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-3xl font-black",
                  paidPercent >= 100 ? "text-emerald-600" :
                  paidPercent >= 50 ? "text-primary" : "text-amber-600"
                )}>
                  {paidPercent.toFixed(0)}%
                </span>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">recebido</p>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  paidPercent >= 100 ? "bg-emerald-500" :
                  paidPercent >= 50 ? "bg-primary" : "bg-amber-500"
                )}
                style={{ width: `${paidPercent}%` }}
              />
            </div>

            {totals.overdue > 0 && (
              <div className="flex items-center gap-1.5 mt-3 text-rose-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="text-[11px] font-black uppercase tracking-wide">
                  {formatBRL(totals.overdue)} em atraso
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Histórico de Transações ── */}
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-5 border-b bg-muted/20 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
            <Receipt className="h-4 w-4" /> Lançamentos
          </CardTitle>
          <Button
            size="sm"
            onClick={handleOpenNew}
            className="h-7 text-[10px] font-black uppercase tracking-tight gap-1 shadow-sm"
          >
            <Plus className="h-3 w-3" /> Novo Lançamento
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-40">
              <Banknote className="h-10 w-10 mb-3 text-muted-foreground" />
              <p className="text-xs font-black uppercase tracking-widest">Nenhum lançamento</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Clique em "Novo Lançamento" para registrar
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {transactions.map((t) => {
                const isOverdue =
                  t.status === 'pendente' && new Date(t.vencimento) < new Date();
                return (
                  <div
                    key={t.id}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-muted/10 transition-colors group"
                  >
                    {/* Ícone tipo */}
                    <div className={cn(
                      "p-2 rounded-xl shrink-0",
                      t.tipo === 'entrada'
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-rose-500/10 text-rose-600"
                    )}>
                      {t.tipo === 'entrada'
                        ? <ArrowUpCircle size={14} />
                        : <ArrowDownCircle size={14} />}
                    </div>

                    {/* Descrição + data */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-foreground truncate">{t.descricao}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-bold">
                          {new Date(t.vencimento).toLocaleDateString('pt-BR')}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-black px-1.5 py-0 border-muted-foreground/20 h-4"
                        >
                          {t.categoria}
                        </Badge>
                        {isOverdue && (
                          <span className="text-[9px] font-black text-rose-600 uppercase flex items-center gap-0.5">
                            <AlertTriangle size={9} /> Atrasado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Valor */}
                    <p className={cn(
                      "text-sm font-black shrink-0",
                      t.tipo === 'entrada' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {t.tipo === 'entrada' ? '+' : '-'} {formatBRL(t.valor)}
                    </p>

                    {/* Status badge */}
                    <Badge className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 border-none shrink-0",
                      t.status === 'pago'
                        ? "bg-emerald-500/10 text-emerald-600"
                        : isOverdue
                        ? "bg-rose-500/10 text-rose-600"
                        : "bg-amber-500/10 text-amber-600"
                    )}>
                      {t.status === 'pago' ? 'Pago' : isOverdue ? 'Atrasado' : 'Pendente'}
                    </Badge>

                    {/* Ações */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-primary"
                        onClick={() => handleOpenEdit(t)}
                      >
                        <Edit3 size={11} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => t.id && deleteTransaction(t.id)}
                      >
                        <Trash2 size={11} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Total da Oportunidade ── */}
      <div className="flex items-center justify-between bg-primary/5 border border-primary/15 rounded-xl px-6 py-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
            Total da Oportunidade
          </p>
          <p className="text-[10px] text-muted-foreground">
            Valor contratado conforme proposta comercial
          </p>
        </div>
        <p className="text-2xl font-black text-primary font-mono tracking-tight">
          {formatBRL(contractTotal)}
        </p>
      </div>
    </div>
  );
};
