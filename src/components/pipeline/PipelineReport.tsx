import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './PipelineReport.css';
import {
    ArrowLeft,
    Target,
    DollarSign,
    TrendingUp,
    Percent,
    Filter as FilterIcon,
    Award,
    AlertTriangle,
    Trophy,
} from "lucide-react";
import { getOpportunities, initializeDemoData, type Opportunity } from "@/hooks/useOpportunities";
import { getVendedores, type User } from "@/data/mockUsers";

interface StageInfo {
    id: string;
    title: string;
}

const stages: StageInfo[] = [
    { id: "new_contact", title: "Novo contato" },
    { id: "in_contact", title: "Em contato" },
    { id: "presentation", title: "Apresentação" },
    { id: "negotiation", title: "Negociação" },
];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

export default function PipelineReport() {
    const navigate = useNavigate();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeDemoData();
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getOpportunities();
            setOpportunities(data);
        } catch (err) {
            console.error("Error loading report data:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Carregando relatório...</p>
            </div>
        );
    }

    // ---------- KPIs ----------
    const totalOpps = opportunities.length;
    const totalValue = opportunities.reduce((s, o) => s + (o.total_value || 0), 0);
    const avgTicket = totalOpps > 0 ? totalValue / totalOpps : 0;
    const oppsNegotiation = opportunities.filter((o) => o.stage === "negotiation").length;
    const conversionRate = totalOpps > 0 ? (oppsNegotiation / totalOpps) * 100 : 0;

    // ---------- Funnel ----------
    const stageData = stages.map((s) => {
        const stageOpps = opportunities.filter((o) => o.stage === s.id);
        return {
            ...s,
            count: stageOpps.length,
            value: stageOpps.reduce((sum, o) => sum + (o.total_value || 0), 0),
        };
    });
    const maxStageCount = Math.max(...stageData.map((s) => s.count), 1);

    // ---------- Priority ----------
    const priorities: Array<{ key: string; label: string; cssClass: string }> = [
        { key: "high", label: "Alta", cssClass: "priority-high" },
        { key: "medium", label: "Média", cssClass: "priority-medium" },
        { key: "low", label: "Baixa", cssClass: "priority-low" },
    ];

    const priorityData = priorities.map((p) => {
        const filtered = opportunities.filter((o) => o.priority === p.key);
        return {
            ...p,
            count: filtered.length,
            value: filtered.reduce((sum, o) => sum + (o.total_value || 0), 0),
        };
    });

    // ---------- Ranking vendedores ----------
    const vendedores = getVendedores();
    const vendedorStats = vendedores
        .map((v: User) => {
            const opps = opportunities.filter((o) => o.responsible_id === v.id);
            const val = opps.reduce((sum, o) => sum + (o.total_value || 0), 0);
            const negoc = opps.filter((o) => o.stage === "negotiation").length;
            const conv = opps.length > 0 ? (negoc / opps.length) * 100 : 0;
            return { vendedor: v, total: opps.length, valor: val, conversao: conv };
        })
        .sort((a, b) => b.valor - a.valor);

    // ---------- Top oportunidades ----------
    const topOpps = [...opportunities]
        .sort((a, b) => (b.total_value || 0) - (a.total_value || 0))
        .slice(0, 5);

    const getStageName = (id: string) => stages.find((s) => s.id === id)?.title ?? id;
    const getPriorityLabel = (p?: string) => {
        if (p === "high") return "Alta";
        if (p === "medium") return "Média";
        if (p === "low") return "Baixa";
        return "—";
    };

    return (
        <div className="report-container">
            {/* Header */}
            <div className="report-header">
                <div className="report-header-left">
                    <h1>Relatório Executivo</h1>
                    <p>Pipeline de vendas · {formatDate(new Date())}</p>
                </div>
                <button className="report-back-btn" onClick={() => navigate("/pipeline")}>
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Pipeline
                </button>
            </div>

            {/* KPI Cards */}
            <div className="report-kpi-grid">
                <div className="report-kpi-card kpi-opportunities">
                    <div className="report-kpi-icon"><Target className="h-5 w-5" /></div>
                    <div className="report-kpi-label">Total de Oportunidades</div>
                    <div className="report-kpi-value">{totalOpps}</div>
                </div>
                <div className="report-kpi-card kpi-value">
                    <div className="report-kpi-icon"><DollarSign className="h-5 w-5" /></div>
                    <div className="report-kpi-label">Valor do Pipeline</div>
                    <div className="report-kpi-value">{formatCurrency(totalValue)}</div>
                </div>
                <div className="report-kpi-card kpi-ticket">
                    <div className="report-kpi-icon"><TrendingUp className="h-5 w-5" /></div>
                    <div className="report-kpi-label">Ticket Médio</div>
                    <div className="report-kpi-value">{formatCurrency(avgTicket)}</div>
                </div>
                <div className="report-kpi-card kpi-conversion">
                    <div className="report-kpi-icon"><Percent className="h-5 w-5" /></div>
                    <div className="report-kpi-label">Taxa de Conversão</div>
                    <div className="report-kpi-value">{conversionRate.toFixed(0)}%</div>
                </div>
            </div>

            {/* Funil de Vendas */}
            <div className="report-section">
                <h2 className="report-section-title">
                    <FilterIcon className="h-5 w-5" /> Funil de Vendas
                </h2>
                <div className="report-funnel-stages">
                    {stageData.map((s) => (
                        <div key={s.id} className={`report-funnel-row funnel-${s.id}`}>
                            <span className="report-funnel-label">{s.title}</span>
                            <div className="report-funnel-bar-track">
                                <div
                                    className="report-funnel-bar-fill"
                                    style={{ width: `${Math.max((s.count / maxStageCount) * 100, 8)}%` }}
                                >
                                    {s.count} oportunidade{s.count !== 1 ? "s" : ""}
                                </div>
                            </div>
                            <div className="report-funnel-stats">
                                <span className="report-funnel-count">{s.count}</span>
                                <span className="report-funnel-value">{formatCurrency(s.value)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Distribuição por Prioridade */}
            <div className="report-section">
                <h2 className="report-section-title">
                    <AlertTriangle className="h-5 w-5" /> Distribuição por Prioridade
                </h2>
                <div className="report-priority-grid">
                    {priorityData.map((p) => (
                        <div key={p.key} className={`report-priority-card ${p.cssClass}`}>
                            <div className="report-priority-label">{p.label}</div>
                            <div className="report-priority-count">{p.count}</div>
                            <div className="report-priority-value">{formatCurrency(p.value)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ranking de Vendedores */}
            <div className="report-section">
                <h2 className="report-section-title">
                    <Award className="h-5 w-5" /> Ranking de Vendedores
                </h2>
                {vendedorStats.length > 0 ? (
                    <table className="report-ranking-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Vendedor</th>
                                <th>Oportunidades</th>
                                <th>Valor</th>
                                <th>Conversão</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendedorStats.map((stat, i) => (
                                <tr key={stat.vendedor.id}>
                                    <td>
                                        <span className={`report-rank-badge ${i < 3 ? `report-rank-${i + 1}` : "report-rank-default"}`}>
                                            {i + 1}
                                        </span>
                                    </td>
                                    <td className="report-vendedor-name">{stat.vendedor.name}</td>
                                    <td>{stat.total}</td>
                                    <td>{formatCurrency(stat.valor)}</td>
                                    <td>
                                        <span className="report-conversion-badge">{stat.conversao.toFixed(0)}%</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-muted-foreground text-sm">Nenhum vendedor encontrado.</p>
                )}
            </div>

            {/* Top Oportunidades */}
            <div className="report-section">
                <h2 className="report-section-title">
                    <Trophy className="h-5 w-5" /> Top 5 Oportunidades
                </h2>
                <div className="report-top-list">
                    {topOpps.map((opp, i) => (
                        <div key={opp.id} className="report-top-item">
                            <span className="report-top-rank">#{i + 1}</span>
                            <div className="report-top-info">
                                <div className="report-top-lead">{opp.lead_identification}</div>
                                <div className="report-top-stage">{getStageName(opp.stage)}</div>
                            </div>
                            <span className="report-top-value">{formatCurrency(opp.total_value)}</span>
                            <span className={`report-top-priority pri-${opp.priority || "medium"}`}>
                                {getPriorityLabel(opp.priority)}
                            </span>
                        </div>
                    ))}
                    {topOpps.length === 0 && (
                        <p className="text-muted-foreground text-sm">Nenhuma oportunidade encontrada.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
