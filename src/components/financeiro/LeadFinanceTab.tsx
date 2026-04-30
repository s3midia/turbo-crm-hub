import React, { useState } from 'react';
import { useFinance, FinancialTransaction } from '@/hooks/useFinance';
import { 
  DollarSign, Clock, CheckCircle2, AlertCircle, Plus, 
  ArrowUpCircle, ArrowDownCircle, Search, Filter, Trash2,
  Package, Globe, Edit3
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

export const LeadFinanceTab = ({ leadId, leadName, products = [], siteUrl, onUpdateProducts }: LeadFinanceTabProps) => {
  const { transactions, loading, saveTransaction, deleteTransaction } = useFinance(leadId);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | undefined>();
  const [showProductForm, setShowProductForm] = useState(false);

  const productCatalog = [
    { id: "p1", name: "Software", price: 5000.00 },
    { id: "p2", name: "Web Design", price: 3500.00 },
    { id: "p3", name: "Consultoria", price: 1200.00 },
    { id: "p4", name: "Manutenção", price: 500.00 },
    { id: "p5", name: "Licença", price: 250.00 },
  ];

  const formatBRL = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const totals = {
    paid: transactions.filter(t => t.tipo === 'entrada' && t.status === 'pago').reduce((acc, t) => acc + t.valor, 0),
    pending: transactions.filter(t => t.tipo === 'entrada' && t.status === 'pendente').reduce((acc, t) => acc + t.valor, 0),
    mrr: transactions.filter(t => t.tipo === 'entrada' && t.classificacao === 'recorrente').reduce((acc, t) => acc + t.valor, 0),
  };

  const handleOpenNew = () => {
    const totalValue = products.reduce((acc, p) => acc + (p.quantity * p.price), 0);
    setEditingTransaction({
      valor: totalValue,
      descricao: `Composição de Preço - ${leadName}`,
      tipo: 'entrada',
      status: 'pendente',
      categoria: 'Software',
      recorrencia: 'unica',
      data_lancamento: new Date().toISOString().split('T')[0],
      vencimento: new Date().toISOString().split('T')[0],
      lead_nome: leadName,
      lead_id: leadId
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

  const handleAddProduct = () => {
    const newProduct = { id: `p-${Date.now()}`, name: "Novo Item", quantity: 1, price: 0 };
    if (onUpdateProducts) {
      onUpdateProducts([...products, newProduct]);
    }
  };

  const handleRemoveProduct = (id: string) => {
    if (onUpdateProducts) {
      onUpdateProducts(products.filter(p => p.id !== id));
    }
  };

  const handleUpdateProduct = (id: string, field: string, value: any) => {
    if (onUpdateProducts) {
      const updated = products.map(p => p.id === id ? { ...p, [field]: value } : p);
      if (field === 'name') {
        const catalogItem = productCatalog.find(c => c.name === value);
        if (catalogItem) {
          const idx = updated.findIndex(p => p.id === id);
          updated[idx].price = catalogItem.price;
        }
      }
      onUpdateProducts(updated);
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  const totalComposition = products.reduce((acc, p) => acc + (p.quantity * p.price), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {showModal && (
        <TransacaoModal 
          transaction={editingTransaction}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          preFilledLeadId={leadId}
          preFilledLeadName={leadName}
        />
      )}

      {/* Composição de Preço */}
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-3 pt-4 border-b bg-muted/20 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
            <Package className="h-4 w-4" /> Composição de Preço
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowProductForm(!showProductForm)}
              className="h-7 text-[10px] font-black uppercase"
            >
              {showProductForm ? 'Ver Lista' : 'Editar Itens'}
            </Button>
            <Badge variant="outline" className="text-[10px] font-black uppercase bg-primary/10 text-primary border-primary/20">
              {products.length} {products.length === 1 ? 'Item' : 'Itens'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 && !showProductForm ? (
            <div className="flex flex-col items-center justify-center py-8 opacity-40">
              <Package className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-[10px] font-black uppercase tracking-widest text-center">
                Nenhum item na composição
              </p>
            </div>
          ) : showProductForm ? (
            <div className="p-4 space-y-3 bg-muted/10">
              {products.map((p) => (
                <div key={p.id} className="flex gap-2 items-center bg-card p-2 rounded-xl border border-border/50">
                  <div className="flex-1 grid grid-cols-12 gap-2">
                    <div className="col-span-6">
                      <select 
                        value={p.name} 
                        onChange={(e) => handleUpdateProduct(p.id, 'name', e.target.value)}
                        className="w-full text-[11px] font-bold bg-transparent border-none focus:ring-0"
                      >
                        <option value="">Selecione...</option>
                        {productCatalog.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        {!productCatalog.find(c => c.name === p.name) && p.name && <option value={p.name}>{p.name}</option>}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="number" 
                        value={p.quantity} 
                        onChange={(e) => handleUpdateProduct(p.id, 'quantity', parseFloat(e.target.value))}
                        className="w-full text-[11px] font-bold bg-transparent border-none focus:ring-0 text-center"
                      />
                    </div>
                    <div className="col-span-4 text-right">
                      <input 
                        type="number" 
                        value={p.price} 
                        onChange={(e) => handleUpdateProduct(p.id, 'price', parseFloat(e.target.value))}
                        className="w-full text-[11px] font-bold bg-transparent border-none focus:ring-0 text-right"
                      />
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                    onClick={() => handleRemoveProduct(p.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
              <Button 
                variant="dashed" 
                size="sm" 
                onClick={handleAddProduct}
                className="w-full h-8 text-[10px] font-black uppercase border-dashed"
              >
                <Plus size={12} className="mr-1" /> Adicionar Item
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {products.map((p, idx) => (
                <div key={idx} className="px-5 py-3 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-foreground">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground font-bold">{p.quantity}x {formatBRL(p.price)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">{formatBRL(p.quantity * p.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-4 bg-muted/30 flex items-center justify-between border-t border-border">
            <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Valor Total da Composição</span>
            <p className="text-lg font-black text-primary">
              {formatBRL(totalComposition)}
            </p>
          </div>
        </CardContent>
      </Card>

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
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">MRR</span>
            </div>
            <p className="text-2xl font-black text-primary">{formatBRL(totals.mrr)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Transações */}
      <Card className="bg-white/50 backdrop-blur-sm border-muted shadow-sm overflow-hidden">
        <CardHeader className="pb-4 pt-4 border-b flex flex-row items-center justify-between bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
            <DollarSign className="h-4 w-4" /> Histórico Financeiro
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={handleOpenNew}
              className="h-8 text-[10px] font-black uppercase tracking-tight shadow-md"
            >
              <Plus className="h-3 w-3 mr-1" /> Nova Transação
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <DollarSign className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-xs font-black uppercase tracking-widest">Nenhuma transação</p>
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
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => handleOpenEdit(t)}
                          >
                            <Edit3 size={12} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => t.id && deleteTransaction(t.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
