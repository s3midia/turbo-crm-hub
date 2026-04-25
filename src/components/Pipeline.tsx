import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Pipeline.css';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, User, DollarSign, Calendar, Phone, Mail, FileText, Loader2, Filter, Search, Settings, BarChart3, MoreVertical, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OpportunityModal } from "./whatsapp/OpportunityModal";
import { getOpportunities, initializeDemoData, updateOpportunityStage, type Opportunity as DbOpportunity } from "@/hooks/useOpportunities";
import { VendedorSelector } from "./pipeline/VendedorSelector";
import { useProfiles } from "@/hooks/useProfiles";
import { useUser } from "@/contexts/UserContext";

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
  responsible_id?: string;
}

export default function Pipeline() {
  const navigate = useNavigate();
  const { currentUser, isAdmin: isAdminFromContext } = useUser();
  const { data: profiles } = useProfiles();

  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do vendedor
  const [selectedVendedorId, setSelectedVendedorId] = useState<string>("todos");

  // Modal states
  const [opportunityModalOpen, setOpportunityModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>('new_contact');
  const [editingOpportunityId, setEditingOpportunityId] = useState<string | undefined>(undefined);

  // Determinar se o usuário é admin - fallback para UserContext se não encontrar perfil
  const currentUserProfile = profiles?.find(p => p.email === currentUser?.email);
  const isAdmin = currentUserProfile?.role === 'admin' || isAdminFromContext;

  // Load opportunities from localStorage
  useEffect(() => {
    initializeDemoData(); // Initialize with demo data
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
        responsible_id: opp.responsible_id,
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
    setEditingOpportunityId(opportunity.id);
    setSelectedStage(opportunity.stage as 'new_contact' | 'in_contact' | 'presentation' | 'negotiation');
    setOpportunityModalOpen(true);
  };

  const handleNewOpportunity = (stage?: string) => {
    setSelectedOpportunity(null);
    setSelectedStage(stage || 'new_contact');
    setEditingOpportunityId(undefined);
    setOpportunityModalOpen(true);
  };

  const handleModalSaved = () => {
    loadOpportunities(); // Reload after saving
  };

  // Drag & Drop handler
  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination, source } = result;

    // Dropped outside a valid column or same position
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const newStage = destination.droppableId as Opportunity['stage'];

    // Optimistic update — instantly move card in state
    setOpportunities(prev =>
      prev.map(opp =>
        opp.id === draggableId ? { ...opp, stage: newStage } : opp
      )
    );

    // Persist to localStorage
    updateOpportunityStage(draggableId, newStage);
  };

  // Filtrar oportunidades baseado no vendedor selecionado e role do usuário
  const filteredOpportunities = opportunities.filter(opp => {
    // Se não é admin, mostra apenas as próprias oportunidades
    if (!isAdmin && currentUserProfile) {
      return opp.responsible_id === currentUserProfile.id;
    }

    // Admin selecionou "todos"
    if (selectedVendedorId === "todos") {
      return true;
    }

    // Admin selecionou um vendedor específico
    return opp.responsible_id === selectedVendedorId;
  });

  // Buscar perfil do vendedor selecionado
  const selectedVendedor = profiles?.find(p => p.id === selectedVendedorId);

  return (
    <div className="space-y-4">
      {/* Filter Bar - matches reference design */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b">
        {/* Left side - Filtro and Buscar */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" style={{ color: 'hsl(var(--accent))' }} />
            <span>Filtro</span>
          </Button>

          {/* Vendedor Selector - only for admin */}
          {isAdmin && (
            <div className="border-l border-border pl-3">
              <VendedorSelector
                value={selectedVendedorId}
                onChange={setSelectedVendedorId}
              />
            </div>
          )}

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar"
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Center - Sort controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span>Data de criação</span>
          </Button>
          <Button variant="outline" size="sm">
            Desc
          </Button>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/pipeline/relatorio')}>
            <BarChart3 className="h-4 w-4" />
            <span>Relatório</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            <span>Configurar</span>
          </Button>
          <Button
            onClick={() => handleNewOpportunity()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar</span>
          </Button>
          <Button variant="ghost" size="sm" className="px-2">
            <MoreVertical className="h-4 w-4" />
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
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 px-2">
              {stages.map((stage) => {
                const stageOpportunities = filteredOpportunities.filter((opp) => opp.stage === stage.id);
                const stageValue = stageOpportunities.reduce((sum, opp) => sum + opp.value, 0);

                return (
                  <div key={stage.id} className="bolten-pipeline-column">
                    {/* Stage Header */}
                    <div className="bolten-stage-header">
                      <div className="bolten-stage-header-top">
                        <div className="bolten-stage-title-area">
                          <h3 className="bolten-stage-title">{stage.title}</h3>
                          <span className="bolten-stage-count">{stageOpportunities.length}</span>
                        </div>
                        <button
                          className="bolten-stage-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNewOpportunity(stage.id);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="bolten-stage-value">
                        R${stageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* Cards */}
                    <Droppable droppableId={stage.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`bolten-cards-list ${snapshot.isDraggingOver ? 'bolten-drop-active' : ''}`}
                        >
                          {stageOpportunities.map((opportunity, index) => (
                            <Draggable key={opportunity.id} draggableId={opportunity.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bolten-card ${snapshot.isDragging ? 'bolten-card-dragging' : ''}`}
                                  onClick={() => handleCardClick(opportunity)}
                                >
                                  <div className="bolten-card-body">
                                    {/* Header: Valor + Menu */}
                                    <div className="bolten-card-header">
                                      <div className="bolten-card-header-value">
                                        R${opportunity.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                          <button className="bolten-card-menu-btn">
                                            <MoreHorizontal className="h-4 w-4" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem>Editar</DropdownMenuItem>
                                          <DropdownMenuItem>Mover estágio</DropdownMenuItem>
                                          <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>

                                    {/* Grid de Campos */}
                                    <div className="bolten-fields-grid">
                                      <div>
                                        <div className="bolten-field-label">Identificação do Lead</div>
                                        <div className="bolten-field-value">{opportunity.title || '-'}</div>
                                      </div>
                                      <div>
                                        <div className="bolten-field-label">Prioridade</div>
                                        <div className="bolten-field-value">{getPriorityText(opportunity.priority)}</div>
                                      </div>
                                      <div>
                                        <div className="bolten-field-label">Contato</div>
                                        <div className="bolten-field-value">{opportunity.client_name || '-'}</div>
                                      </div>
                                      <div>
                                        <div className="bolten-field-label">Responsável</div>
                                        <div className="bolten-field-value">{profiles?.find(p => p.id === opportunity.responsible_id)?.full_name || '-'}</div>
                                      </div>
                                      <div>
                                        <div className="bolten-field-label">Observação</div>
                                        <div className="bolten-field-value">{opportunity.observation || '-'}</div>
                                      </div>
                                    </div>

                                    {/* Valor Monetário Verde */}
                                    <div className="bolten-monetary">
                                      R${opportunity.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    {/* Botão Adicionar */}
                    <button
                      className="bolten-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNewOpportunity(stage.id);
                      }}
                    >
                      <span className="bolten-add-icon">+</span>
                      ADICIONAR
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* Opportunity Modal */}
      <OpportunityModal
        open={opportunityModalOpen}
        onClose={() => setOpportunityModalOpen(false)}
        stage={selectedStage}
        contactName={selectedOpportunity?.client_name || ''}
        contactPhone={selectedOpportunity?.phone || ''}
        onSaved={handleModalSaved}
        opportunityId={editingOpportunityId}
      />
    </div>
  );
}