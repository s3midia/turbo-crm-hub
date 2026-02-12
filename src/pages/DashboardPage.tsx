import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, Target, Award, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { getOpportunities } from "@/hooks/useOpportunities";
import { getVendedores, User } from "@/data/mockUsers";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [totalOportunidades, setTotalOportunidades] = useState(0);
    const [valorTotal, setValorTotal] = useState(0);
    const [ticketMedio, setTicketMedio] = useState(0);
    const [vendedoresStats, setVendedoresStats] = useState<any[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const opportunities = await getOpportunities();
            const vendedores = getVendedores();

            // Métricas gerais
            setTotalOportunidades(opportunities.length);
            const total = opportunities.reduce((sum, opp) => sum + (opp.total_value || 0), 0);
            setValorTotal(total);
            setTicketMedio(opportunities.length > 0 ? total / opportunities.length : 0);

            // Stats por vendedor
            const stats = vendedores.map((vendedor: User) => {
                const oppsByVendedor = opportunities.filter(opp => opp.responsible_id === vendedor.id);
                const valorVendedor = oppsByVendedor.reduce((sum, opp) => sum + (opp.total_value || 0), 0);
                const oppsFechadas = oppsByVendedor.filter(opp => opp.stage === 'negotiation').length;
                const conversao = oppsByVendedor.length > 0 ? (oppsFechadas / oppsByVendedor.length) * 100 : 0;

                return {
                    vendedor,
                    total: oppsByVendedor.length,
                    valor: valorVendedor,
                    conversao: conversao.toFixed(0),
                };
            });

            // Ordenar por valor (maior primeiro)
            stats.sort((a, b) => b.valor - a.valor);
            setVendedoresStats(stats);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <p>Carregando dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard Geral</h1>
                <p className="text-muted-foreground">Visão consolidada de toda a equipe</p>
            </div>

            {/* Métricas Superiores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Oportunidades</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOportunidades}</div>
                        <p className="text-xs text-muted-foreground">Em todo o pipeline</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor Pipeline</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(valorTotal)}</div>
                        <p className="text-xs text-muted-foreground">Valor total potencial</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(ticketMedio)}</div>
                        <p className="text-xs text-muted-foreground">Por oportunidade</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vendedores Ativos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{vendedoresStats.length}</div>
                        <p className="text-xs text-muted-foreground">Equipe comercial</p>
                    </CardContent>
                </Card>
            </div>

            {/* Ranking de Vendedores */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Ranking de Vendedores
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {vendedoresStats.map((stat, index) => (
                            <div key={stat.vendedor.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors">
                                <div className="text-2xl font-bold text-muted-foreground w-8">
                                    #{index + 1}
                                </div>
                                <div className="text-3xl">{stat.vendedor.avatar}</div>
                                <div className="flex-1">
                                    <div className="font-semibold">{stat.vendedor.name}</div>
                                    <div className="text-sm text-muted-foreground">{stat.vendedor.email}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg">{stat.total} oportunidades</div>
                                    <div className="text-sm text-muted-foreground">{formatCurrency(stat.valor)}</div>
                                </div>
                                <Badge variant={index === 0 ? "default" : "secondary"}>
                                    {stat.conversao}% conversão
                                </Badge>
                                {index === 0 && <Award className="h-6 w-6 text-yellow-500" />}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Distribuição por Estágio */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Distribuição por Estágio do Funil
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 border rounded-lg">
                            <div className="text-sm text-muted-foreground mb-1">Novo contato</div>
                            <div className="text-2xl font-bold">{vendedoresStats.reduce((sum, s) => sum, 0)}</div>
                            <div className="text-xs text-muted-foreground mt-1">Primeiros contatos</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <div className="text-sm text-muted-foreground mb-1">Em contato</div>
                            <div className="text-2xl font-bold">{vendedoresStats.reduce((sum, s) => sum, 0)}</div>
                            <div className="text-xs text-muted-foreground mt-1">Em qualificação</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <div className="text-sm text-muted-foreground mb-1">Apresentação</div>
                            <div className="text-2xl font-bold">{vendedoresStats.reduce((sum, s) => sum, 0)}</div>
                            <div className="text-xs text-muted-foreground mt-1">Demos agendadas</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <div className="text-sm text-muted-foreground mb-1">Negociação</div>
                            <div className="text-2xl font-bold">{vendedoresStats.reduce((sum, s) => sum, 0)}</div>
                            <div className="text-xs text-muted-foreground mt-1">Fechamento iminente</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
