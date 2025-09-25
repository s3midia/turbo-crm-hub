import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, User, DollarSign, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Deal {
  id: string;
  title: string;
  client: string;
  value: number;
  priority: "low" | "medium" | "high";
  date: string;
  stage: string;
}

export default function Pipeline() {
  const [deals] = useState<Deal[]>([
    {
      id: "1",
      title: "Sistema de Gestão Empresarial",
      client: "João Silva",
      value: 15000,
      priority: "high",
      date: "2024-01-15",
      stage: "qualificacao",
    },
    {
      id: "2",
      title: "Website E-commerce",
      client: "Maria Santos",
      value: 8500,
      priority: "medium",
      date: "2024-01-10",
      stage: "qualificacao",
    },
    {
      id: "3",
      title: "App Mobile",
      client: "Pedro Costa",
      value: 25000,
      priority: "high",
      date: "2024-01-08",
      stage: "proposta",
    },
    {
      id: "4",
      title: "Consultoria Digital",
      client: "Ana Oliveira",
      value: 5500,
      priority: "low",
      date: "2024-01-05",
      stage: "negociacao",
    },
  ]);

  const stages = [
    { id: "qualificacao", title: "Qualificação", color: "bg-yellow-100 text-yellow-800" },
    { id: "proposta", title: "Proposta", color: "bg-blue-100 text-blue-800" },
    { id: "negociacao", title: "Negociação", color: "bg-orange-100 text-orange-800" },
    { id: "fechamento", title: "Fechamento", color: "bg-green-100 text-green-800" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Média";
      case "low":
        return "Baixa";
      default:
        return "Indefinida";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Pipeline de Vendas</h2>
          <p className="text-muted-foreground">
            Gerencie suas oportunidades em cada etapa do funil
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Nova Oportunidade
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stages.map((stage) => {
          const stageDeals = deals.filter((deal) => deal.stage === stage.id);
          const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

          return (
            <div key={stage.id} className="space-y-4">
              {/* Stage Header */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{stage.title}</CardTitle>
                    <Badge className={stage.color}>
                      {stageDeals.length}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    R$ {stageValue.toLocaleString()}
                  </p>
                </CardHeader>
              </Card>

              {/* Deal Cards */}
              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <Card key={deal.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm leading-tight">
                            {deal.title}
                          </h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Editar</DropdownMenuItem>
                              <DropdownMenuItem>Mover estágio</DropdownMenuItem>
                              <DropdownMenuItem>Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="mr-1 h-3 w-3" />
                            {deal.client}
                          </div>
                          <div className="flex items-center text-xs font-medium">
                            <DollarSign className="mr-1 h-3 w-3" />
                            R$ {deal.value.toLocaleString()}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(deal.date).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge className={getPriorityColor(deal.priority)} variant="secondary">
                            {getPriorityText(deal.priority)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add Deal Button */}
              <Button
                variant="outline"
                className="w-full border-dashed border-2 h-12"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar oportunidade
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}