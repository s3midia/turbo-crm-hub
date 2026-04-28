import React from "react";
import { TrendingUp, Users, Globe, MessageSquare, ArrowRight, Scan, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const metrics = {
    leadsRadar: 87,
    leadsKanban: 34,
    atendimento: 12,
    agendado: 8,
    vendido: 6,
    mrr: 19736,
};

function KPICard({ label, value, icon: Icon, change }: { label: string; value: string | number; icon: React.ElementType; change?: string }) {
    return (
        <div className="bg-card border border-border rounded-[var(--radius)] p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change && (
                <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 font-semibold">{change}</span> em relação ao mês anterior
                </p>
            )}
        </div>
    );
}

function FunnelRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const pct = total === 0 ? 0 : Math.round((value / total) * 100);
    return (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-[var(--radius)]">
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <div>
                    <p className="font-medium text-foreground text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{value} oportunidades</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-semibold text-foreground text-sm">{pct}%</p>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const convRate = metrics.vendido > 0 ? ((metrics.vendido / metrics.leadsKanban) * 100).toFixed(1) : "0.0";

    return (
        <div className="space-y-6">
            {/* Title */}
            <div>
                <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
                <p className="text-muted-foreground">Visão geral da sua gestão comercial</p>
            </div>

            {/* KPIs Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard label="Receita Total" value={`R$ ${metrics.mrr.toLocaleString("pt-BR")}`} icon={DollarSign} change="+20.1%" />
                <KPICard label="Novos Leads" value={metrics.leadsRadar} icon={Scan} change="+180.1%" />
                <KPICard label="Taxa de Conversão" value={`${convRate}%`} icon={TrendingUp} change="+19%" />
                <KPICard label="Negócios Ativos" value={metrics.leadsKanban} icon={Users} change={`+${metrics.atendimento}`} />
            </div>

            {/* Two col layout */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Pipeline */}
                <div className="col-span-4 bg-card border border-border rounded-[var(--radius)] p-6">
                    <h3 className="font-semibold text-foreground mb-1">Pipeline de Vendas</h3>
                    <p className="text-sm text-muted-foreground mb-4">Status atual do funil de vendas</p>
                    <div className="space-y-3">
                        <FunnelRow label="Leads Radar" value={metrics.leadsRadar} total={metrics.leadsRadar} color="hsl(265,85%,60%)" />
                        <FunnelRow label="No Kanban" value={metrics.leadsKanban} total={metrics.leadsRadar} color="hsl(210,80%,55%)" />
                        <FunnelRow label="Em Atendimento" value={metrics.atendimento} total={metrics.leadsRadar} color="hsl(38,92%,55%)" />
                        <FunnelRow label="Agendado" value={metrics.agendado} total={metrics.leadsRadar} color="hsl(142,70%,50%)" />
                        <FunnelRow label="Vendido" value={metrics.vendido} total={metrics.leadsRadar} color="hsl(142,76%,45%)" />
                    </div>
                </div>

                {/* Ações Rápidas */}
                <div className="col-span-3 bg-card border border-border rounded-[var(--radius)] p-6">
                    <h3 className="font-semibold text-foreground mb-1">Ações Rápidas</h3>
                    <p className="text-sm text-muted-foreground mb-4">Acesse as ferramentas principais</p>
                    <div className="space-y-2">
                        {[
                            { to: "/radar-leads", icon: Scan, label: "Escanear Novos Leads", desc: "Buscar empresas por nicho" },
                            { to: "/funil-kanban", icon: Users, label: "Gerenciar Funil", desc: "Ver e mover leads no Kanban" },
                            { to: "/financeiro", icon: TrendingUp, label: "Fluxo de Caixa", desc: "Registrar entradas e saídas" },
                            { to: "/automacao-funil", icon: MessageSquare, label: "Configurar Automações", desc: "Mensagens automáticas de WhatsApp" },
                            { to: "/generator", icon: Globe, label: "Gerar Landing Page", desc: "Criar site protótipo para lead" },
                        ].map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link
                                    key={action.to}
                                    to={action.to}
                                    className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-muted/30 hover:bg-muted/60 border border-border/50 transition-colors group"
                                >
                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground">{action.label}</p>
                                        <p className="text-xs text-muted-foreground">{action.desc}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
