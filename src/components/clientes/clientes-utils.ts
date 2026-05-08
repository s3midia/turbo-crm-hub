import { ClientePerfilData } from "@/components/financeiro/ClientePerfilDrawer";

export interface ClientesKPIs {
  totalAtivos: number;
  totalInativos: number;
  mrr: number;
}

export function calculateClientesKPIs(clientes: ClientePerfilData[]): ClientesKPIs {
  const totalAtivos = clientes.filter(c => c.status === "ativo").length;
  const totalInativos = clientes.filter(c => c.status !== "ativo").length;
  const mrr = clientes.reduce((acc, c) => c.status === "ativo" ? acc + (Number(c.valor) || 0) : acc, 0);
  
  return { totalAtivos, totalInativos, mrr };
}

export function filterClientes(
  clientes: ClientePerfilData[],
  searchTerm: string,
  filter: "todos" | "ativos" | "inativos"
): ClientePerfilData[] {
  return clientes.filter(c => {
    const matchesSearch = (c.cliente || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filter === "todos" ? true : 
                          filter === "ativos" ? c.status === "ativo" : 
                          c.status !== "ativo";
    return matchesSearch && matchesStatus;
  });
}

export function mapLeadsToClientes(data: any[]): ClientePerfilData[] {
  return data
    .filter(lead => lead.status === 'ganhou' || lead.status === 'inativo' || lead.is_client === true)
    .map(lead => ({
      id: lead.id,
      cliente: lead.company_name,
      email: lead.email,
      telefone: lead.phone,
      empresa: lead.company_name,
      status: lead.status === 'ganhou' ? 'ativo' : lead.status, 
      valor: lead.value || lead.total_value || 0,
      dataInicio: new Date(lead.created_at).toLocaleDateString("pt-BR"),
      contract_start_date: lead.contract_start_date || lead.contractStartDate || "",
      contract_end_date: lead.contract_end_date || lead.contractEndDate || "",
      cpf_cnpj: lead.cpf_cnpj || ""
    }));
}
