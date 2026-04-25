import React, { useState } from "react";
import { 
    Plus, 
    TrendingUp, 
    TrendingDown, 
    Scale, 
    Clock, 
    Trash2, 
    Check, 
    Search, 
    Filter, 
    Download, 
    Bot, 
    Zap, 
    BarChart3, 
    PieChart, 
    ArrowUpRight, 
    ArrowDownRight,
    FileSpreadsheet,
    FileType,
    Users,
    Calendar,
    DollarSign,
    Sparkles,
    List
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
    id: number;
    descricao: string;
    tipo: "entrada" | "saida";
    valor: number;
    vencimento: string;
    lead: string;
    status: "pago" | "pendente";
    categoria: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 1, descricao: "Sistema personalizado para academia", tipo: "entrada", valor: 9979, vencimento: "30/12/2025", lead: "Clínica Academias 6", status: "pago", categoria: "Software" },
    { id: 2, descricao: "Criação de site", tipo: "entrada", valor: 3520, vencimento: "24/12/2025", lead: "N/A", status: "pendente", categoria: "Web Design" },
    { id: 3, descricao: "Criação de sistema", tipo: "entrada", valor: 7400, vencimento: "23/12/2025", lead: "ANDREA OLIVEIRA LIMA", status: "pago", categoria: "Software" },
    { id: 4, descricao: "Criação de Site", tipo: "entrada", valor: 2577, vencimento: "20/12/2025", lead: "Giovanna", status: "pago", categoria: "Web Design" },
    { id: 5, descricao: "API OpenAI - Usage", tipo: "saida", valor: 220, vencimento: "19/12/2025", lead: "N/A", status: "pago", categoria: "Infraestrutura" },
    { id: 6, descricao: "Hospedagem AWS", tipo: "saida", valor: 1450, vencimento: "15/12/2025", lead: "N/A", status: "pago", categoria: "Infraestrutura" },
    { id: 7, descricao: "Consultoria Marketing", tipo: "saida", valor: 3000, vencimento: "10/12/2025", lead: "N/A", status: "pago", categoria: "Marketing" },
];

function formatBRL(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FinanceiroPage() {
    const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "automation">("overview");
    const [searchTerm, setSearchTerm] = useState("");
    const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

    const entradas = transactions.filter((t) => t.tipo === "entrada" && t.status === "pago").reduce((s, t) => s + t.valor, 0);
    const saidas = transactions.filter((t) => t.tipo === "saida").reduce((s, t) => s + t.valor, 0);
    const saldo = entradas - saidas;
    const aReceber = transactions.filter((t) => t.tipo === "entrada" && t.status === "pendente").reduce((s, t) => s + t.valor, 0);

    const filteredTransactions = transactions.filter(t => 
        t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.lead.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* Top Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 backdrop-blur-md sticky top-0 z-10 bg-background/80">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <DollarSign className="w-8 h-8 text-primary" />
                        Hub Financeiro
                    </h1>
                    <p className="text-sm text-muted-foreground">Gestão inteligente e automação de fluxo de caixa.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent transition-all text-sm font-medium">
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all text-sm font-bold">
                        <Plus className="w-4 h-4" />
                        Nova Transação
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-8 mt-6">
                <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl w-fit border border-border/40 backdrop-blur-sm">
                    {[
                        { id: "overview", label: "Visão Geral", icon: BarChart3 },
                        { id: "transactions", label: "Lançamentos", icon: List },
                        { id: "automation", label: "Automação", icon: Bot },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                                activeTab === tab.id 
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/20" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 p-8 space-y-8 overflow-y-auto">
                {activeTab === "overview" && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: "Receita Realizada", value: entradas, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "+12.5%" },
                                { label: "Despesas Totais", value: saidas, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10", trend: "-2.3%" },
                                { label: "Saldo Disponível", value: saldo, icon: Scale, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+4.1%" },
                                { label: "Previsão a Receber", value: aReceber, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", trend: "+$3.5k" },
                            ].map((kpi, i) => (
                                <div key={i} className="group p-6 rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden">
                                    <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-20 transition-opacity group-hover:opacity-40", kpi.bg)} />
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className={cn("p-3 rounded-2xl", kpi.bg)}>
                                            <kpi.icon className={cn("w-6 h-6", kpi.color)} />
                                        </div>
                                        <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", kpi.bg, kpi.color)}>
                                            {kpi.trend}
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-1 relative z-10">
                                        <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                                        <p className="text-2xl font-black tracking-tight text-foreground">{formatBRL(kpi.value)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Secondary Metrics & Widgets */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 p-8 rounded-3xl bg-card border border-border/50 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                                        Projeção Mensal
                                    </h3>
                                    <select className="bg-muted text-xs font-semibold px-3 py-1.5 rounded-lg border-none focus:ring-1 focus:ring-primary">
                                        <option>Últimos 6 meses</option>
                                        <option>Este ano</option>
                                    </select>
                                </div>
                                <div className="h-[240px] flex items-end justify-between gap-2 px-2">
                                    {[65, 45, 75, 55, 90, 85].map((h, i) => (
                                        <div key={i} className="flex-1 group relative">
                                            <div 
                                                className="w-full bg-primary/20 hover:bg-primary/40 transition-all rounded-t-xl cursor-help relative overflow-hidden" 
                                                style={{ height: `${h}%` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                                            </div>
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                +{h}% Crescimento
                                            </div>
                                            <p className="text-[10px] text-center mt-3 font-semibold text-muted-foreground uppercase tracking-widest">
                                                {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][i]}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 rounded-3xl bg-primary text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/20">
                                <Zap className="absolute top-4 right-4 w-24 h-24 opacity-10 -mr-8 -mt-4 rotate-12" />
                                <div className="relative z-10 space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black italic tracking-tight flex items-center gap-2">
                                            AI INSIGHT
                                            <Sparkles className="w-5 h-5 fill-current animate-pulse" />
                                        </h3>
                                        <p className="text-sm opacity-90 leading-relaxed font-medium">
                                            Identificamos que 22% do seu custo operacional está concentrado em serviços de infraestrutura Cloud.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                                        <p className="text-[11px] font-bold uppercase tracking-widest opacity-70 mb-1">Dica de Otimização</p>
                                        <p className="text-xs font-semibold">Migrar para instâncias anuais pode economizar até <span className="text-lg block mt-1 font-black">R$ 2.450,00</span> ao ano.</p>
                                    </div>
                                    <button className="w-full py-3 rounded-xl bg-white text-primary text-sm font-black hover:bg-white/90 transition-all flex items-center justify-center gap-2 group">
                                        Ver Relatório Completo
                                        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "transactions" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        {/* Table Filters */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por descrição ou lead..."
                                    className="w-full pl-11 pr-4 py-3 bg-card border border-border/50 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-card border border-border/50 hover:border-primary/50 text-sm font-semibold transition-all">
                                    <Filter className="w-4 h-4" />
                                    Filtros
                                </button>
                                <button className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-card border border-border/50 hover:border-primary/50 text-sm font-semibold transition-all">
                                    <FileSpreadsheet className="w-4 h-4" />
                                    Excel
                                </button>
                            </div>
                        </div>

                        {/* Enhanced Table */}
                        <div className="rounded-3xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-border/40">
                                        {["Transação", "Categoria", "Valor", "Vencimento", "Status", "Ações"].map((h) => (
                                            <th key={h} className="px-6 py-4 text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-black">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map((t, idx) => (
                                        <tr key={t.id} className={cn(
                                            "border-b border-border/40 hover:bg-muted/20 transition-all duration-200 group",
                                            idx === filteredTransactions.length - 1 && "border-0"
                                        )}>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors">{t.descricao}</span>
                                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                                                        <Users className="w-3 h-3 opacity-70" />
                                                        {t.lead}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-secondary/50 border border-border/40 text-muted-foreground">
                                                    {t.categoria}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "text-[14px] font-black tracking-tight",
                                                        t.tipo === "entrada" ? "text-emerald-500" : "text-rose-500"
                                                    )}>
                                                        {t.tipo === "entrada" ? "+" : "-"} {formatBRL(t.valor)}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 mt-1">
                                                        {t.tipo === "entrada" ? "Recebido" : "Pagamento"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground underline decoration-border/40 underline-offset-4">
                                                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                                                    {t.vencimento}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-2 w-fit border",
                                                    t.status === "pago" 
                                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", t.status === "pago" ? "bg-emerald-500" : "bg-amber-500")} />
                                                    {t.status === "pago" ? "Liquidado" : "Pendente"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {t.status === "pendente" && (
                                                        <button className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-600 transition-all tooltip" title="Marcar como Pago">
                                                            <Check className="w-4.5 h-4.5" />
                                                        </button>
                                                    )}
                                                    <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                                                        <Edit3 className="w-4.5 h-4.5" />
                                                    </button>
                                                    <button className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-all">
                                                        <Trash2 className="w-4.5 h-4.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredTransactions.length === 0 && (
                                <div className="p-12 text-center flex flex-col items-center gap-4">
                                    <Search className="w-12 h-12 text-muted-foreground/30" />
                                    <div className="space-y-1">
                                        <p className="text-lg font-bold text-foreground">Nenhum resultado encontrado</p>
                                        <p className="text-sm text-muted-foreground">Tente ajustar sua busca ou filtros.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "automation" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-500">
                        {/* Auto-Report Card */}
                        <div className="p-8 rounded-[2rem] bg-card border border-border/50 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-500" />
                            <div className="flex items-start justify-between mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black flex items-center gap-2">
                                        <FileType className="w-6 h-6 text-primary" />
                                        Relatórios Automáticos
                                    </h3>
                                    <p className="text-sm text-muted-foreground">Geração automática de DRE e Fluxo Mensal.</p>
                                </div>
                                <div className="p-3 bg-primary/5 rounded-2xl">
                                    <Zap className="w-6 h-6 text-primary fill-primary" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="p-5 rounded-2xl bg-muted/30 border border-border/20 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status Atual</span>
                                        <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-500 text-white rounded">ATIVO</span>
                                    </div>
                                    <p className="text-[13px] font-medium leading-relaxed">Próximo envio agendado para <span className="text-foreground font-bold">01/04/2026</span> via WhatsApp e E-mail.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button className="py-4 rounded-2xl border border-border bg-background hover:bg-accent text-xs font-black uppercase tracking-widest transition-all">Configurar</button>
                                    <button className="py-4 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all">Baixar Agora</button>
                                </div>
                            </div>
                        </div>

                        {/* Smart Alerts Card */}
                        <div className="p-8 rounded-[2rem] bg-card border border-border/50 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-rose-500" />
                            <div className="flex items-start justify-between mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black flex items-center gap-2">
                                        <Bot className="w-6 h-6 text-amber-500" />
                                        Alertas do Agente
                                    </h3>
                                    <p className="text-sm text-muted-foreground">Monitoramento inteligente de inadimplência.</p>
                                </div>
                                <div className="p-3 bg-amber-500/5 rounded-2xl">
                                    <Sparkles className="w-6 h-6 text-amber-500 fill-amber-500" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { msg: "Renovação pendente: Clínica Academias 6", time: "Há 2 horas", color: "amber" },
                                    { msg: "Previsão de impostos disponível", time: "Ontem às 18:00", color: "blue" },
                                ].map((alert, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-muted/20 border border-border/10 group-hover:scale-[1.02] transition-transform">
                                        <div className={cn("w-1 h-10 rounded-full shrink-0", alert.color === 'amber' ? 'bg-amber-500' : 'bg-blue-500')} />
                                        <div className="space-y-1">
                                            <p className="text-[13px] font-bold text-foreground">{alert.msg}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{alert.time}</p>
                                        </div>
                                    </div>
                                ))}
                                <button className="w-full mt-4 py-4 rounded-2xl bg-muted hover:bg-muted/80 text-[11px] font-black uppercase tracking-[0.2em] transition-all">Ver Histórico de Insights</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const Edit3 = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
);
