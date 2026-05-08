import { FinancialTransaction } from "@/hooks/useFinance";
import { formatBRL, parseBRL } from "@/lib/formatters";
import { AlertCircle, Users } from "lucide-react";

export interface DashboardKPIs {
  receita_realizada: number;
  despesa_realizada: number;
  saldo_atual: number;
  a_receber: number;
  a_pagar: number;
  margem_liquida: number;
  valuation_est: number;
  barData: any[];
  expenseCategories: any[];
  cashflow: any[];
  topClients: any[];
  ebitda: number;
  score: number;
  urgentActions: any[];
}

export function calculateDashboardData(
  txs: FinancialTransaction[],
  extraData: { employees: any[], valConfig: any }
): DashboardKPIs {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const receitaPaga = txs.filter(t => t.tipo === 'entrada' && t.status === 'pago').reduce((acc, t) => acc + parseBRL(t.valor), 0);
  const despesaPaga = txs.filter(t => t.tipo === 'saida' && t.status === 'pago').reduce((acc, t) => acc + parseBRL(t.valor), 0);
  const saldoAtual = receitaPaga - despesaPaga;
  
  const aReceber = txs.filter(t => t.tipo === 'entrada' && t.status !== 'pago').reduce((acc, t) => acc + parseBRL(t.valor), 0);
  const aPagar = txs.filter(t => t.tipo === 'saida' && t.status !== 'pago').reduce((acc, t) => acc + parseBRL(t.valor), 0);
  
  const margem = receitaPaga > 0 ? Math.max(-999, Math.min(100, ((receitaPaga - despesaPaga) / receitaPaga) * 100)) : 0;
  
  // Valuation Estimate
  let valuation = receitaPaga * 3;
  if (extraData.valConfig) {
    const annualRevenue = receitaPaga * (12 / Math.max(1, now.getMonth() + 1));
    valuation = annualRevenue * (extraData.valConfig.multiplier || 3);
  }

  // Last 6 Months
  const last6Months = [];
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push({
      month: monthNames[d.getMonth()],
      monthIdx: d.getMonth(),
      year: d.getFullYear(),
      receita: 0,
      despesa: 0,
      profit: 0
    });
  }

  txs.forEach(t => {
    const date = new Date(t.vencimento || t.data_lancamento);
    const mIdx = date.getMonth();
    const y = date.getFullYear();
    const monthObj = last6Months.find(m => m.monthIdx === mIdx && m.year === y);
    if (monthObj) {
      if (t.tipo === 'entrada' && t.status === 'pago') monthObj.receita += parseBRL(t.valor);
      if (t.tipo === 'saida' && t.status === 'pago') monthObj.despesa += parseBRL(t.valor);
    }
  });
  last6Months.forEach(m => m.profit = m.receita - m.despesa);

  // Expense Categories - Only PAID to match "Realized Performance"
  const catMap: Record<string, number> = {};
  txs.filter(t => t.tipo === 'saida' && t.status === 'pago').forEach(t => {
    const cat = t.categoria || "Outros";
    catMap[cat] = (catMap[cat] || 0) + parseBRL(t.valor);
  });
  const expenseCats = Object.entries(catMap).map(([label, value]) => ({ label, value }));
  const totalExp = expenseCats.reduce((acc, c) => acc + c.value, 0);
  const expenseCategories = expenseCats.map(c => ({ ...c, pct: totalExp > 0 ? (c.value / totalExp) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);

  // Cashflow
  const getDelta = (days: number) => {
    const target = new Date();
    target.setHours(23, 59, 59, 999);
    target.setDate(now.getDate() + days);
    
    return txs.filter(t => {
      if (t.status === 'pago') return false;
      const v = new Date(t.vencimento || t.data_lancamento);
      return v <= target;
    }).reduce((acc, t) => acc + (t.tipo === 'entrada' ? parseBRL(t.valor) : -parseBRL(t.valor)), 0);
  };

  const cashflow = [
    { label: "Hoje", value: saldoAtual + getDelta(0), delta: getDelta(0) },
    { label: "+7d", value: saldoAtual + getDelta(7), delta: getDelta(7) },
    { label: "+15d", value: saldoAtual + getDelta(15), delta: getDelta(15) },
    { label: "+30d", value: saldoAtual + getDelta(30), delta: getDelta(30) },
  ];

  // Top Clients
  const clientMap: Record<string, number> = {};
  txs.filter(t => t.tipo === 'entrada' && t.status === 'pago').forEach(t => {
    if (t.lead_nome && t.lead_nome !== "N/A") {
      clientMap[t.lead_nome] = (clientMap[t.lead_nome] || 0) + parseBRL(t.valor);
    }
  });
  const topClients = Object.entries(clientMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Urgent Actions
  const urgent: any[] = [];
  const overDue = txs.filter(t => t.status === 'pendente' && t.vencimento && t.vencimento < todayStr);
  if (overDue.length > 0) {
    urgent.push({
      type: "danger",
      icon: AlertCircle,
      title: "Contas em Atraso",
      desc: `${overDue.length} transações vencidas totalizando ${formatBRL(overDue.reduce((acc, t) => acc + parseBRL(t.valor), 0))}`,
      tab: "lancamentos"
    });
  }
  const pendingPayroll = extraData.employees.filter(e => e.status === 'pendente');
  if (pendingPayroll.length > 0) {
    urgent.push({
      type: "warning",
      icon: Users,
      title: "Folha de Pagamento",
      desc: `${pendingPayroll.length} colaboradores aguardando pagamento.`,
      tab: "equipe"
    });
  }

  const score = Math.min(100, Math.max(0, 
    (margem > 30 ? 40 : (margem > 0 ? margem * 1.3 : 0)) + 
    (aReceber > aPagar ? 30 : 15) + 
    (overDue.length === 0 ? 30 : 0)
  ));

  return {
    receita_realizada: receitaPaga,
    despesa_realizada: despesaPaga,
    saldo_atual: saldoAtual,
    a_receber: aReceber,
    a_pagar: aPagar,
    margem_liquida: margem,
    valuation_est: valuation,
    barData: last6Months,
    expenseCategories,
    cashflow,
    topClients,
    ebitda: saldoAtual,
    score: Math.round(score),
    urgentActions: urgent
  };
}
