import React, { useState } from 'react';
import { useFinance, FinancialTransaction } from '@/hooks/useFinance';
import { 
  DollarSign, Clock, CheckCircle2, AlertCircle, Plus, 
  ArrowUpCircle, ArrowDownCircle, Search, Filter, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LeadFinanceTabProps {
  leadId: string;
  leadName: string;
}

export const LeadFinanceTab = ({ leadId, leadName }: LeadFinanceTabProps) => {
  const { transactions, loading, saveTransaction, deleteTransaction } = useFinance(leadId);

  const formatBRL = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const totals = {
    paid: transactions.filter(t => t.tipo === 'entrada' && t.status === 'pago').reduce((acc, t) => acc + t.valor, 0),
    pending: transactions.filter(t => t.tipo === 'entrada' && t.status === 'pendente').reduce((acc, t) => acc + t.valor, 0),
    mrr: transactions.filter(t => t.tipo === 'entrada' && t.classificacao === 'recorrente').reduce((acc, t) => acc + t.valor, 0),
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Resumo Financeiro do Lead */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-500/5 border-emerald-500/10 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Recebido</span>
            </div>
            <p className="text-2xl font-black text-emerald-700">{formatBRL(totals.paid)}</p>
            <p className="text-[10px] text-emerald-600/70 font-bold mt-1">Sincronizado com Financeiro</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/10 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-amber-500/10 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pendente</span>
            </div>
            <p className="text-2xl font-black text-amber-700">{formatBRL(totals.pending)}</p>
            <p className="text-[10px] text-amber-600/70 font-bold mt-1">Aguardando confirmação</p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">MRR (Recorrente)</span>
            </div>
            <p className="text-2xl font-black text-primary">{formatBRL(totals.mrr)}</p>
            <p className="text-[10px] text-primary/70 font-bold mt-1">Valor mensal recorrente</p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Transações */}
      <Card className="bg-white/50 backdrop-blur-sm border-muted shadow-sm overflow-hidden">
        <CardHeader className="pb-4 pt-4 border-b flex flex-row items-center justify-between bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
            <DollarSign className="h-4 w-4" /> Histórico Financeiro Unificado
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-tight">
              <Filter className="h-3 w-3 mr-1" /> Filtrar
            </Button>
            <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-tight shadow-md">
              <Plus className="h-3 w-3 mr-1" /> Nova Transação
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <DollarSign className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-xs font-black uppercase tracking-widest">Nenhuma transação registrada</p>
              <p className="text-[10px] mt-2">Associe este lead a lançamentos no módulo Financeiro</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b">
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-muted-foreground tracking-widest">Data / Descrição</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-muted-foreground tracking-widest">Categoria</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-muted-foreground tracking-widest text-right">Valor</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-muted-foreground tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-muted-foreground tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-muted/30 hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-xl mt-0.5",
                            t.tipo === 'entrada' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                          )}>
                            {t.tipo === 'entrada' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground">{t.descricao}</p>
                            <p className="text-[10px] text-muted-foreground font-bold">{new Date(t.vencimento).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-[9px] font-black uppercase px-2 py-0.5 border-muted-foreground/20">
                          {t.categoria}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={cn(
                          "text-sm font-black",
                          t.tipo === 'entrada' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {t.tipo === 'entrada' ? '+' : '-'} {formatBRL(t.valor)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 border-none",
                          t.status === 'pago' ? "bg-emerald-500/10 text-emerald-600" : 
                          t.status === 'pendente' ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600"
                        )}>
                          {t.status === 'pago' ? 'Pago' : t.status === 'pendente' ? 'Pendente' : 'Agendado'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => t.id && deleteTransaction(t.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Botão de Sincronização e Info */}
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10 border-dashed">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Sincronização Ativa</p>
            <p className="text-[9px] text-primary/70 font-bold leading-tight">
              Os dados acima são espelhados em tempo real do portal financeiro principal.
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase text-primary hover:bg-primary/10">
          RECARREGAR DADOS
        </Button>
      </div>
    </div>
  );
};
