import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, User, DollarSign, Calendar, Phone, Mail, FileText, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DealDetailsModal } from "./pipeline/DealDetailsModal";
import { getOpportunities, type Opportunity as DbOpportunity } from "@/hooks/useOpportunities";

interface Opportunity {
  id: string;
  title: string;
  client_name: string;
  phone?: string;
  email?: string;
  value: number;
  priority: "low" | "medium" | "high";
  created_at: string;
  stage: string;
  observation?: string;
}

export default function Pipeline() {
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // Load opportunities from Supabase
  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const data = await getOpportunities();

      // Transform DB format to component format
      const transformed = data.map(opp => ({
        id: opp.id!,
        title: opp.lead_identification,
        client_name: opp.contact_name || opp.contact_phone || '',
        phone: opp.contact_phone,
        email: opp.contact_email,
        value: Number(opp.total_value),
        priority: opp.priority || 'medium',
        created_at: opp.created_at!,
        stage: opp.stage,
        observation: opp.observation,
      }));

      setOpportunities(transformed);
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const stages = [
    { id: "new_contact", title: "Novo contato", color: "bg-gray-100 text-gray-800" },
    { id: "in_contact", title: "Em contato", color: "bg-blue-100 text-blue-800" },
    { id: "presentation", title: "Apresentação", color: "bg-yellow-100 text-yellow-800" },
    { id: "negotiation", title: "Negociação", color: "bg-green-100 text-green-800" },
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

  const handleCardClick = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsModalOpen(true);
  };

  const handleUpdateOpportunity = (updatedOpportunity: Opportunity) => {
    // TODO: Update opportunity in state/database via Supabase
    console.log("Oportunidade atualizada:", updatedOpportunity);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Funil de Vendas</h2>
          <p className="text-muted-foreground">
            Gerencie suas oportunidades em cada etapa do funil
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Relatório
          </Button>
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Nova Oportunidade
          </Button>
        </div>
      </div>

      {/* Kanban Board with Horizontal Scroll - 4 columns */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando oportunidades...</span>
        </div>
      ) : (
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 px-2">{" "}
            {stages.map((stage) => {
              const stageOpportunities = opportunities.filter((opp) => opp.stage === stage.id);
              const stageValue = stageOpportunities.reduce((sum, opp) => sum + opp.value, 0);

              return (
                <div key={stage.id} className="flex-shrink-0 w-80 space-y-4">
                  {/* Stage Header */}
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">{stage.title}</CardTitle>
                        <Badge className={stage.color}>
                          {stageOpportunities.length}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        R$ {stageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </CardHeader>
                  </Card>

                  {/* Opportunity Cards */}
                  <div className="space-y-3 min-h-[200px]">
                    {stageOpportunities.map((opportunity) => (
                      <Card
                        key={opportunity.id}
                        className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                        onClick={() => handleCardClick(opportunity)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-sm leading-tight flex-1">
                                {opportunity.title}
                              </h4>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Editar</DropdownMenuItem>
                                  <DropdownMenuItem>Mover estágio</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <User className="mr-1.5 h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{opportunity.client_name}</span>
                              </div>

                              {opportunity.phone && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Phone className="mr-1.5 h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{opportunity.phone}</span>
                                </div>
                              )}

                              {opportunity.email && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Mail className="mr-1.5 h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{opportunity.email}</span>
                                </div>
                              )}

                              <div className="flex items-center text-xs font-semibold text-foreground">
                                <DollarSign className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
                                <span>R$ {opportunity.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>

                              <div className="flex items-center text-xs text-muted-foreground">
                                <Calendar className="mr-1.5 h-3 w-3 flex-shrink-0" />
                                {new Date(opportunity.created_at).toLocaleDateString('pt-BR')}
                              </div>
                            </div>

                            {opportunity.observation && (
                              <div className="pt-2 border-t border-border">
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {opportunity.observation}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1">
                              <Badge className={getPriorityColor(opportunity.priority)} variant="secondary">
                                {getPriorityText(opportunity.priority)}
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
                    className="w-full border-dashed border-2 h-10 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Adicionar oportunidade em", stage.title);
                    }}
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Adicionar
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Opportunity Details Modal */}
      <DealDetailsModal
        opportunity={selectedOpportunity}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdateOpportunity}
      />
    </div>
  );
}