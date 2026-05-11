import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DollarSign, LayoutDashboard, List, GitMerge, FileBarChart2,
  Users, TrendingUp, Building2, FileText, Settings2, Download,
  Plus, RefreshCw, Receipt, PiggyBank, Zap
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
  { id: "dashboard",     label: "Painel",              icon: LayoutDashboard },
  { id: "lancamentos",   label: "Lançamentos",         icon: Receipt },
  { id: "conciliacao",   label: "Conciliação",         icon: RefreshCw },
  { id: "relatorios",    label: "Relatórios",          icon: FileText },
  { id: "equipe",        label: "Time de Vendas",      icon: Users },
  { id: "investimentos", label: "Aportes",             icon: PiggyBank },
  { id: "valuation",     label: "Avaliação (BI)",      icon: Building2, badge: "NOVO" },
  { id: "cobrancas",     label: "Cobrança & Fiscal",   icon: Zap },
  { id: "configuracoes", label: "Configurações",       icon: Settings2 },
];

export default function FinanceiroPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") as TabId;
  
  const [activeTab, setActiveTab] = useState<TabId>(
    (currentTab && TABS.some(t => t.id === currentTab)) ? currentTab : "dashboard"
  );

  // Sync tab with URL
  useEffect(() => {
    if (activeTab) {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set("tab", activeTab);
        return newParams;
      }, { replace: true });
    }
  }, [activeTab, setSearchParams]);

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

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState<"left" | "right" | null>(null);

  React.useEffect(() => {
    let animationId: number;
    const scroll = () => {
      if (scrollRef.current && isScrolling) {
        const speed = 5;
        scrollRef.current.scrollLeft += isScrolling === "right" ? speed : -speed;
        animationId = requestAnimationFrame(scroll);
      }
    };
    if (isScrolling) animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isScrolling]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    const { left, width } = scrollRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const edgeSize = 100; // pixels from the edge to trigger scroll

    if (x > width - edgeSize) {
      setIsScrolling("right");
    } else if (x < edgeSize) {
      setIsScrolling("left");
    } else {
      setIsScrolling(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">

      {/* ── Tab Navigation ─────────────────────────────────────── */}
      <div className="px-4 py-2 sticky top-0 z-10 shrink-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div 
          ref={scrollRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setIsScrolling(null)}
          className="flex items-center gap-1 p-1 bg-zinc-950 dark:bg-zinc-900 border border-white/10 dark:border-zinc-800 rounded-2xl w-fit max-w-full overflow-x-auto scrollbar-none shadow-2xl relative"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-300 relative rounded-xl whitespace-nowrap group",
                activeTab === tab.id
                  ? "bg-white text-zinc-950 shadow-lg shadow-white/10"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className={cn(
                "w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110",
                activeTab === tab.id ? "text-zinc-950" : "text-zinc-500"
              )} />
              {tab.label}
              
              {tab.badge && (
                <span className={cn(
                  "ml-1 text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter transition-colors",
                  activeTab === tab.id 
                    ? "bg-zinc-950/10 text-zinc-950" 
                    : "bg-white text-zinc-950"
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
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
