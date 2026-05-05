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

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-20 bg-white dark:bg-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-white dark:text-zinc-900" />
          </div>
          <div>
            <h1 className="text-[15px] font-black text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase leading-none">Hub Financeiro</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">Gestão de Fluxo de Caixa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab("relatorios"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-[11px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
          <button
            onClick={() => { setActiveTab("lancamentos"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-zinc-900/10 dark:shadow-white/10"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────── */}
      <div className="px-6 py-4 sticky top-[65px] z-10 shrink-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
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
