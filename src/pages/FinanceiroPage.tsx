import React, { useState } from "react";
import {
  DollarSign, LayoutDashboard, List, GitMerge, FileBarChart2,
  Users, TrendingUp, Building2, FileText, Settings2, Download, Plus,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import FinanceiroDashboard from "@/components/financeiro/FinanceiroDashboard";
import DashboardFinanceiro from "@/components/financeiro/DashboardFinanceiro";
import LancamentosTab from "@/components/financeiro/LancamentosTab";
import ConciliacaoTab from "@/components/financeiro/ConciliacaoTab";
import RelatoriosTab from "@/components/financeiro/RelatoriosTab";
import EquipeFinanceiroTab from "@/components/financeiro/EquipeFinanceiroTab";
import InvestimentosTab from "@/components/financeiro/InvestimentosTab";
import ValuationTab from "@/components/financeiro/ValuationTab";
import CobrancasFiscalTab from "@/components/financeiro/CobrancasFiscalTab";
import ConfiguracoesFinanceiroTab from "@/components/financeiro/ConfiguracoesFinanceiroTab";

type TabId =
  | "painel"
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
  { id: "painel", label: "Dashboard", icon: LayoutDashboard, badge: "NEW" },
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
  const [activeTab, setActiveTab] = useState<TabId>("painel");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  function handleTabChange(tab: string) {
    if (TABS.some(t => t.id === tab)) {
      setActiveTab(tab as TabId);
    }
  }

  function handleExport() {
    // Navigate to relatorios tab where exports live
    setActiveTab("relatorios");
  }

  function handleNovaTransacao() {
    setActiveTab("lancamentos");
  }

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            Hub Financeiro
          </h1>
          <p className="text-[11px] text-muted-foreground pl-9">
            Gestão completa · Relatórios · Valuation · Backup automático
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all text-[11px] font-bold text-primary"
            onClick={() => {
              toast.info("Sincronizando todos os módulos financeiros...");
              // This is a global trigger that tabs can listen to via a shared state or just a refresh
              window.location.reload(); 
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sincronizar Global
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-card hover:bg-accent transition-all text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
          <button
            onClick={handleNovaTransacao}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all text-[11px] font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border/30 bg-background/80 px-4 sticky top-[57px] z-10 backdrop-blur-sm">
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-[11px] font-medium whitespace-nowrap transition-all duration-200 relative border-b-2",
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/50"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.badge && (
                <span className="ml-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary uppercase tracking-wider">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {activeTab === "painel" && <FinanceiroDashboard onTabChange={handleTabChange} />}
        {activeTab === "dashboard" && <DashboardFinanceiro />}
        {activeTab === "lancamentos" && (
          <LancamentosTab 
            onOpenProfile={handleOpenProfile} 
          />
        )}
        {activeTab === "conciliacao" && <ConciliacaoTab />}
        {activeTab === "relatorios" && <RelatoriosTab />}
        {activeTab === "equipe" && <EquipeFinanceiroTab />}
        {activeTab === "investimentos" && <InvestimentosTab />}
        {activeTab === "valuation" && <ValuationTab />}
        {activeTab === "cobrancas" && (
          <CobrancasFiscalTab 
            externalSelectedClient={selectedClient}
            externalShowProfile={showProfile}
            onProfileChange={(show, client) => {
              setShowProfile(show);
              if (client) setSelectedClient(client);
            }}
          />
        )}
        {activeTab === "configuracoes" && <ConfiguracoesFinanceiroTab />}
      </div>
    </div>
  );
}
