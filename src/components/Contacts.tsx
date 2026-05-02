import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/formatters";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Building,
  Star,
  User,
  History,
} from "lucide-react";


interface Contact {
  id: string;
  clientId: string; // Unique Portal ID
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "lead" | "client" | "prospect";
  lastInteraction: string;
  value: number;
}

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts] = useState<Contact[]>([
    {
      id: "1",
      clientId: "CL-001",
      name: "João Silva",
      email: "joao@empresa.com",
      phone: "(11) 99999-9999",
      company: "Tech Solutions Ltd",
      status: "client",
      lastInteraction: "2024-01-15",
      value: 15000,
    },
    {
      id: "2",
      clientId: "CL-002",
      name: "Maria Santos",
      email: "maria@startup.com",
      phone: "(11) 88888-8888",
      company: "Startup Inovadora",
      status: "lead",
      lastInteraction: "2024-01-14",
      value: 8500,
    },
    {
      id: "3",
      clientId: "CL-003",
      name: "Pedro Costa",
      email: "pedro@consultoria.com",
      phone: "(11) 77777-7777",
      company: "Costa Consultoria",
      status: "prospect",
      lastInteraction: "2024-01-13",
      value: 25000,
    },
    {
      id: "4",
      clientId: "CL-004",
      name: "Ana Oliveira",
      email: "ana@digital.com",
      phone: "(11) 66666-6666",
      company: "Digital Marketing Pro",
      status: "client",
      lastInteraction: "2024-01-12",
      value: 5500,
    },
    {
      id: "5",
      clientId: "CL-005",
      name: "Carlos Ferreira",
      email: "carlos@ecommerce.com",
      phone: "(11) 55555-5555",
      company: "E-commerce Plus",
      status: "lead",
      lastInteraction: "2024-01-11",
      value: 12000,
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "client":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "lead":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "prospect":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "client":
        return "Cliente Ativo";
      case "lead":
        return "Lead Qualificado";
      case "prospect":
        return "Prospect";
      default:
        return "Indefinido";
    }
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.clientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalContacts = contacts.length;
  const totalClients = contacts.filter((c) => c.status === "client").length;
  const totalLeads = contacts.filter((c) => c.status === "lead").length;
  const totalValue = contacts.reduce((sum, contact) => sum + contact.value, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Base de Clientes</h2>
          <p className="text-muted-foreground text-sm font-medium">
            Gestão unificada de IDs e histórico de interações
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold px-6 shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" />
          Novo Registro
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total de Contatos", val: totalContacts, icon: User, color: "text-primary", bg: "bg-primary/10" },
          { label: "Clientes Ativos", val: totalClients, icon: Star, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Novos Leads", val: totalLeads, icon: User, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Valor em Pipeline", val: formatBRL(totalValue), icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((s, i) => (
          <Card key={i} className="border-border/40 shadow-sm rounded-3xl overflow-hidden hover:border-primary/30 transition-all group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">{s.label}</CardTitle>
              <div className={cn("p-2 rounded-xl transition-colors", s.bg)}>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground group-hover:translate-x-1 transition-transform">{s.val}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="border-border/40 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-border/20 bg-muted/5">
          <CardTitle className="text-lg font-black">Registros Unificados</CardTitle>
          <CardDescription className="text-xs">
            Acompanhe o ciclo de vida completo do cliente através de seu ID único
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, empresa ou ID (ex: CL-001)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-2xl border-border/40 bg-muted/20 focus:bg-background transition-all h-10 text-sm"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/20 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/20">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-6">ID / Nome</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Empresa</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Contato</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Valor</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Última Atividade</TableHead>
                  <TableHead className="w-[100px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className="border-border/20 hover:bg-muted/10 transition-all group">
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary mb-0.5">{contact.clientId}</span>
                        <span className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors">{contact.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-[12px] font-medium text-muted-foreground">
                        <Building className="mr-2 h-3.5 w-3.5 opacity-50" />
                        {contact.company}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center text-[11px] text-muted-foreground">
                          <Mail className="mr-2 h-3 w-3 opacity-50" />
                          {contact.email}
                        </div>
                        <div className="flex items-center text-[11px] text-muted-foreground">
                          <Phone className="mr-2 h-3 w-3 opacity-50" />
                          {contact.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("rounded-lg border px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter", getStatusColor(contact.status))} variant="secondary">
                        {getStatusText(contact.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-[13px] text-foreground">
                      {formatBRL(contact.value)}
                    </TableCell>
                    <TableCell className="text-[11px] font-medium text-muted-foreground">
                      {new Date(contact.lastInteraction).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 hover:text-primary">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-border/40 shadow-xl p-1">
                          <DropdownMenuItem className="rounded-xl text-xs font-bold gap-2">
                            <User className="h-3.5 w-3.5" /> Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl text-xs font-bold gap-2 text-primary bg-primary/5">
                            <History className="h-3.5 w-3.5" /> Ver Linha do Tempo
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl text-xs font-bold gap-2">
                            <Mail className="h-3.5 w-3.5" /> Enviar Mensagem
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl text-xs font-bold gap-2 text-destructive focus:text-destructive">
                            Excluir Registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}