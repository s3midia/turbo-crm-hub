import React, { useState } from "react";
import {
  DollarSign, LayoutDashboard, List, GitMerge, FileBarChart2,
  Users, TrendingUp, Building2, FileText, Settings2, Download,
  Plus, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ClientePerfilDrawer, ClientePerfilData } from "@/components/financeiro/ClientePerfilDrawer";

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
  { id: "dashboard",     label: "Visão Geral",        icon: LayoutDashboard },
  { id: "lancamentos",   label: "Receitas & Despesas", icon: List },
  { id: "conciliacao",   label: "Conciliação",         icon: GitMerge },
  { id: "relatorios",    label: "Relatórios",          icon: FileBarChart2 },
  { id: "equipe",        label: "Equipe",              icon: Users },
  { id: "investimentos", label: "Investimentos",       icon: TrendingUp },
  { id: "valuation",     label: "Valuation",           icon: Building2, badge: "NOVO" },
  { id: "cobrancas",     label: "Cobranças & Fiscal",  icon: FileText },
  { id: "configuracoes", label: "Configurações",       icon: Settings2 },
];

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  // Estado unificado do drawer de perfil — compartilhado entre TODAS as abas
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCliente, setDrawerCliente] = useState<ClientePerfilData | null>(null);

  // Qualquer aba pode chamar isso para abrir o perfil de um cliente
  function openClienteDrawer(client: any) {
    if (!client) return;
    // Normaliza qualquer formato de objeto de cliente
    const normalized: ClientePerfilData = {
      id: client.id || client.lead_id,
      lead_id: client.lead_id || client.id,
      cliente: client.cliente || client.company_name || client.lead_nome,
      company_name: client.company_name || client.empresa || client.cliente,
      email: client.email,
      telefone: client.telefone || client.phone,
      phone: client.phone || client.telefone,
      empresa: client.empresa || client.company_name,
      plano: client.plano,
      valor: client.valor,
      kanbanStage: client.kanbanStage || client.status,
      dataInicio: client.dataInicio,
      totalPago: client.totalPago,
      clientId: client.clientId,
    };
    setDrawerCliente(normalized);
    setDrawerOpen(true);
  }

  function handleTabChange(tab: string) {
    if (TABS.some(t => t.id === tab)) setActiveTab(tab as TabId);
  }

  return (
    <div className="flex flex-col h-full bg-background">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 sticky top-0 z-20 bg-background/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-none">Hub Financeiro</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Gestão completa · Sincronizado em tempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab("relatorios"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-card hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
          <button
            onClick={() => { setActiveTab("lancamentos"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all text-[11px] font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────── */}
      <div className="border-b border-border/30 bg-background px-4 sticky top-[52px] z-10 shrink-0">
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-[11px] font-medium whitespace-nowrap transition-all duration-150 relative border-b-2 shrink-0",
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/40"
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

      {/* ── Tab Content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {activeTab === "dashboard" && (
          <FinanceiroDashboard onTabChange={handleTabChange} />
        )}
        {activeTab === "lancamentos" && (
          <LancamentosTab onOpenProfile={openClienteDrawer} />
        )}
        {activeTab === "conciliacao" && <ConciliacaoTab />}
        {activeTab === "relatorios" && <RelatoriosTab onTabChange={handleTabChange} />}
        {activeTab === "equipe" && (
          <EquipeFinanceiroTab onOpenProfile={openClienteDrawer} />
        )}
        {activeTab === "investimentos" && <InvestimentosTab onTabChange={handleTabChange} />}
        {activeTab === "valuation" && <ValuationTab onTabChange={handleTabChange} />}
        {activeTab === "cobrancas" && (
          <CobrancasFiscalTab
            externalSelectedClient={null}
            externalShowProfile={false}
            onProfileChange={(show, client) => {
              if (show && client) openClienteDrawer(client);
            }}
          />
        )}
        {activeTab === "configuracoes" && <ConfiguracoesFinanceiroTab />}
      </div>

      {/* ── Drawer de Perfil — compartilhado por todas as abas ── */}
      <ClientePerfilDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cliente={drawerCliente}
      />
    </div>
  );
}
