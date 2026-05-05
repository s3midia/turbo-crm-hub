import React, { useState, useEffect } from "react";
import { ClientePerfilDrawer, ClientePerfilData } from "@/components/financeiro/ClientePerfilDrawer";
import { deleteOpportunity, updateOpportunityStage } from "@/hooks/useOpportunities";
import { UserPlus, Search, Filter, MoreHorizontal, User, ShieldCheck, AlertCircle, Building2, Users, Pencil, Trash2, UserMinus, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OpportunityModal } from "@/components/whatsapp/OpportunityModal";
import { formatBRL } from "@/lib/formatters";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClientePerfilData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"todos" | "ativos" | "inativos">("todos");
  
  const [selectedCliente, setSelectedCliente] = useState<ClientePerfilData | null>(null);
  const [selectedIdForEdit, setSelectedIdForEdit] = useState<string | undefined>(undefined);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      // Aqui buscamos todos os leads que estão com status que representem "clientes".
      // Ou podemos buscar todos e filtrar os que são clientes (ex: "ganhou").
      // Para demonstração, buscaremos os leads com status "ganhou" ou que tenham a flag is_client.
      // Como não sabemos a estrutura exata, buscamos todos os leads para filtrar, 
      // mas na vida real seria uma query mais direcionada (ex: eq('status', 'ganhou')).
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrando localmente apenas aqueles que consideramos "clientes" (ex: status ganhou)
      // Se você criar uma flag no banco `is_client`, use-a na query supabase.
      const clientesFiltrados = data
        .filter(lead => lead.status === 'ganhou' || lead.is_client === true)
        .map(lead => ({
          id: lead.id,
          cliente: lead.company_name,
          email: lead.email,
          telefone: lead.phone,
          empresa: lead.company_name,
          status: lead.status === 'ganhou' ? 'ativo' : lead.status, // Simplificação de status
          valor: lead.value || lead.total_value || 0,
          dataInicio: new Date(lead.created_at).toLocaleDateString("pt-BR"),
        }));

      setClientes(clientesFiltrados);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCliente = (cliente: ClientePerfilData) => {
    setSelectedCliente(cliente);
    setIsDrawerOpen(true);
  };

  const handleEditCliente = (id: string) => {
    setSelectedIdForEdit(id);
    setIsNewModalOpen(true);
  };

  const handleDeleteCliente = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      await deleteOpportunity(id);
      toast.success("Cliente excluído com sucesso.");
      fetchClientes();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir cliente. Verifique se ele possui dados vinculados.");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const isAtivo = currentStatus === "ativo";
    const newStage = isAtivo ? "inativo" : "ganhou";
    const label = isAtivo ? "inativar" : "ativar";

    if (!window.confirm(`Tem certeza que deseja ${label} este cliente?`)) {
      return;
    }

    try {
      await updateOpportunityStage(id, newStage);
      toast.success(`Cliente ${isAtivo ? "inativado" : "ativado"} com sucesso.`);
      fetchClientes();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar status do cliente.");
    }
  };

  const filteredClientes = clientes.filter(c => {
    const matchesSearch = (c.cliente || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filter === "todos" ? true : 
                          filter === "ativos" ? c.status === "ativo" : 
                          c.status !== "ativo";
    return matchesSearch && matchesStatus;
  });

  const totalAtivos = clientes.filter(c => c.status === "ativo").length;
  const totalInativos = clientes.filter(c => c.status !== "ativo").length;
  const mrr = clientes.reduce((acc, c) => c.status === "ativo" ? acc + (Number(c.valor) || 0) : acc, 0);

  return (
    <div className="flex flex-col h-full bg-background relative animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-border/40 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Users size={24} className="text-primary" />
            Meus Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Gestão da carteira de clientes ativos e inativos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchClientes} className="text-xs font-semibold">
            Atualizar
          </Button>
          <Button onClick={() => setIsNewModalOpen(true)} className="text-xs font-bold gap-1.5 shadow-md">
            <UserPlus size={14} />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 shrink-0">
        <div className="bg-card border border-border/40 p-4 rounded-2xl shadow-sm">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            Clientes Ativos
          </p>
          <p className="text-2xl font-bold text-foreground">{totalAtivos}</p>
        </div>
        <div className="bg-card border border-border/40 p-4 rounded-2xl shadow-sm">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
            <Building2 size={14} className="text-primary" />
            Receita Recorrente (MRR)
          </p>
          <p className="text-2xl font-bold text-primary">{formatBRL(mrr)}</p>
        </div>
        <div className="bg-card border border-border/40 p-4 rounded-2xl shadow-sm">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-rose-500" />
            Clientes Inativos / Risco
          </p>
          <p className="text-2xl font-bold text-foreground">{totalInativos}</p>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="px-6 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex bg-muted/50 p-1 rounded-xl w-full md:w-auto">
          {(["todos", "ativos", "inativos"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-[300px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs bg-muted/30 border-border/50 rounded-xl"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
            <p className="text-xs font-medium">Carregando clientes...</p>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <User size={40} className="mb-3 opacity-20" />
            <p className="text-sm font-semibold">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <div className="border border-border/40 rounded-2xl overflow-hidden bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 hidden md:table-cell">Contato</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden sm:table-cell">MRR</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Cliente Desde</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredClientes.map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => handleOpenCliente(c)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground group-hover:text-primary transition-colors">{c.cliente || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground hidden sm:block">{c.empresa}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs">{c.email || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">{c.telefone || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.status === "ativo" ? "default" : "destructive"} className="text-[10px] uppercase font-bold tracking-widest shadow-none">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary hidden sm:table-cell">
                      {formatBRL(Number(c.valor) || 0)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {c.dataInicio}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                            <MoreHorizontal size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenCliente(c); }} className="text-xs cursor-pointer gap-2">
                            <User size={14} className="text-muted-foreground" />
                            Ver Perfil Completo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditCliente(c.id); }} className="text-xs cursor-pointer gap-2">
                            <Pencil size={14} className="text-muted-foreground" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStatus(c.id, c.status); }} className="text-xs cursor-pointer gap-2">
                            {c.status === "ativo" ? (
                              <>
                                <UserMinus size={14} className="text-muted-foreground" />
                                Marcar como Inativo
                              </>
                            ) : (
                              <>
                                <UserCheck size={14} className="text-muted-foreground" />
                                Marcar como Ativo
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); handleDeleteCliente(c.id); }} 
                            className="text-xs cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 size={14} />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ClientePerfilDrawer 
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        cliente={selectedCliente}
      />

      <OpportunityModal 
        open={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setSelectedIdForEdit(undefined);
          fetchClientes();
        }}
        opportunityId={selectedIdForEdit}
        stage="ganhou" 
      />
    </div>
  );
}
