import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
} from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Receita Total",
      value: "R$ 45.231",
      change: "+20.1%",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Novos Leads",
      value: "2.350",
      change: "+180.1%",
      icon: Users,
      trend: "up",
    },
    {
      title: "Taxa de Conversão",
      value: "12.5%",
      change: "+19%",
      icon: Target,
      trend: "up",
    },
    {
      title: "Negócios Ativos",
      value: "573",
      change: "+201",
      icon: TrendingUp,
      trend: "up",
    },
  ];

  const recentActivities = [
    {
      type: "call",
      description: "Ligação realizada para João Silva",
      time: "2 min atrás",
      icon: Phone,
    },
    {
      type: "email",
      description: "E-mail enviado para Maria Santos",
      time: "15 min atrás",
      icon: Mail,
    },
    {
      type: "meeting",
      description: "Reunião agendada com Pedro Costa",
      time: "1h atrás",
      icon: Calendar,
    },
    {
      type: "deal",
      description: "Negócio fechado - R$ 5.500",
      time: "2h atrás",
      icon: CheckCircle,
    },
  ];

  const pipelineData = [
    { stage: "Qualificação", count: 23, value: "R$ 45.200" },
    { stage: "Proposta", count: 15, value: "R$ 78.900" },
    { stage: "Negociação", count: 8, value: "R$ 124.300" },
    { stage: "Fechamento", count: 5, value: "R$ 89.700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral da sua gestão comercial
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-success bg-success/10">
                    {stat.change}
                  </Badge>{" "}
                  em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Pipeline Overview */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Pipeline de Vendas</CardTitle>
            <CardDescription>
              Status atual do funil de vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineData.map((stage, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <div>
                      <p className="font-medium">{stage.stage}</p>
                      <p className="text-sm text-muted-foreground">{stage.count} oportunidades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{stage.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas ações realizadas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}