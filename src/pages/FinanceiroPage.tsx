import React, { useState } from "react";
import {
  DollarSign, LayoutDashboard, List, GitMerge, FileBarChart2,
  Users, TrendingUp, Building2, FileText, Settings2, Download, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import FinanceiroDashboard from "@/components/financeiro/FinanceiroDashboard";
import LancamentosTab from "@/components/financeiro/LancamentosTab";
import ConciliacaoTab from "@/components/financeiro/ConciliacaoTab";
import RelatoriosTab from "@/components/financeiro/RelatoriosTab";
import EquipeFinanceiroTab from "@/components/financeiro/EquipeFinanceiroTab";
import InvestimentosTab from "@/components/financeiro/InvestimentosTab";
import ValuationTab from "@/components/financeiro/ValuationTab";
import CobrancasFiscalTab from "@/components/financeiro/CobrancasFiscalTab";
import ConfiguracoesFinanceiroTab from "@/components/financeiro/ConfiguracoesFinanceiroTab";

type TabId =
  | "dashboard"
  | "lancamentos"
  | "conciliacao"
  | "relatorios"
  | "equipe"
  | "investimentos"
  | "valuation"
  | "cobrancas"
  | "configuracoes";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const TABS: Tab[] = [
  { id: "dashboard", label: "Saúde Financeira", icon: LayoutDashboard },
  { id: "lancamentos", label: "Receitas & Despesas", icon: List },
  { id: "conciliacao", label: "Conciliação", icon: GitMerge },
  { id: "relatorios", label: "Relatórios", icon: FileBarChart2 },
  { id: "equipe", label: "Equipe & Pagamentos", icon: Users },
  { id: "investimentos", label: "Investimentos", icon: TrendingUp },
  { id: "valuation", label: "Valuation", icon: Building2, badge: "NOVO" },
  { id: "cobrancas", label: "Cobranças & Fiscal", icon: FileText },
  { id: "configuracoes", label: "Backup & Config.", icon: Settings2 },
];

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 backdrop-blur-md sticky top-0 z-20 bg-background/90">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Hub Financeiro
          </h1>
          <p className="text-xs text-muted-foreground">
            Gestão completa · Relatórios · Valuation · Backup automático
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-accent transition-all text-xs font-semibold">
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all text-xs font-bold">
            <Plus className="w-3.5 h-3.5" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Tab Navigation — Horizontal scroll */}
      <div className="border-b border-border/40 bg-background/50 px-6 sticky top-[73px] z-10 backdrop-blur-sm">
        <div className="flex gap-0.5 overflow-x-auto scrollbar-none py-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all duration-200 relative",
                activeTab === tab.id
                  ? "bg-card text-foreground border-t border-l border-r border-border/50 -mb-px shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.badge && (
                <span className="ml-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground uppercase tracking-wider">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {activeTab === "dashboard" && <FinanceiroDashboard />}
        {activeTab === "lancamentos" && <LancamentosTab />}
        {activeTab === "conciliacao" && <ConciliacaoTab />}
        {activeTab === "relatorios" && <RelatoriosTab />}
        {activeTab === "equipe" && <EquipeFinanceiroTab />}
        {activeTab === "investimentos" && <InvestimentosTab />}
        {activeTab === "valuation" && <ValuationTab />}
        {activeTab === "cobrancas" && <CobrancasFiscalTab />}
        {activeTab === "configuracoes" && <ConfiguracoesFinanceiroTab />}
      </div>
    </div>
  );
}
