import React, { useState } from "react";
import { Users, Check, AlertCircle, Plus, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

function formatBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

interface Funcionario {
  id: number;
  nome: string;
  cargo: string;
  salario: number;
  inss: number;
  fgts: number;
  status: "pago" | "pendente";
  vencimento: string;
  relatedClientId?: string;
  relatedClientName?: string;
}

interface Despesa {
  id: number;
  descricao: string;
  tipo: "fixa" | "variavel";
  valor: number;
  vencimento: string;
  status: "pago" | "pendente";
  categoria: string;
}

const FUNCIONARIOS: Funcionario[] = [
  { id: 1, nome: "Carlos Mendes", cargo: "Dev Full-Stack", salario: 6500, inss: 715, fgts: 520, status: "pago", vencimento: "05/05/2026", relatedClientId: "CL-001", relatedClientName: "Clínica Academias 6" },
  { id: 2, nome: "Ana Lima", cargo: "Designer UX/UI", salario: 4800, inss: 528, fgts: 384, status: "pago", vencimento: "05/05/2026", relatedClientId: "CL-002", relatedClientName: "Giovanna" },
  { id: 3, nome: "Pedro Souza", cargo: "Vendas", salario: 3200, inss: 352, fgts: 256, status: "pendente", vencimento: "05/05/2026", relatedClientId: "CL-003", relatedClientName: "ANDREA OLIVEIRA LIMA" },
];

const DESPESAS: Despesa[] = [
  { id: 1, descricao: "Hospedagem AWS", tipo: "fixa", valor: 1450, vencimento: "15/05/2026", status: "pendente", categoria: "Infraestrutura" },
  { id: 2, descricao: "API OpenAI", tipo: "variavel", valor: 220, vencimento: "19/05/2026", status: "pendente", categoria: "Tecnologia" },
  { id: 3, descricao: "Consultoria Marketing", tipo: "fixa", valor: 3000, vencimento: "10/05/2026", status: "pendente", categoria: "Marketing" },
  { id: 4, descricao: "Aluguel Escritório", tipo: "fixa", valor: 2200, vencimento: "01/05/2026", status: "pago", categoria: "Escritório" },
  { id: 5, descricao: "Licenças de Software", tipo: "fixa", valor: 480, vencimento: "20/05/2026", status: "pendente", categoria: "Tecnologia" },
];

const totalFolha = FUNCIONARIOS.reduce((s, f) => s + f.salario + f.inss + f.fgts, 0);
const despesasFixas = DESPESAS.filter(d => d.tipo === "fixa").reduce((s, d) => s + d.valor, 0);
const despesasVariaveis = DESPESAS.filter(d => d.tipo === "variavel").reduce((s, d) => s + d.valor, 0);
const receitaRef = 23476;
const comprometimento = ((totalFolha + despesasFixas) / receitaRef) * 100;

interface EquipeFinanceiroTabProps {
  onOpenProfile?: (client: any) => void;
}

export default function EquipeFinanceiroTab({ onOpenProfile }: EquipeFinanceiroTabProps) {
  const [funcionarios, setFuncionarios] = useState(FUNCIONARIOS);
  const [despesas, setDespesas] = useState(DESPESAS);

  function markFuncPaid(id: number) {
    setFuncionarios(prev => prev.map(f => f.id === id ? { ...f, status: "pago" } : f));
  }

  function markDespPaid(id: number) {
    setDespesas(prev => prev.map(d => d.id === id ? { ...d, status: "pago" } : d));
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total da Folha", value: formatBRL(totalFolha), color: "text-foreground", bg: "bg-muted/30" },
          { label: "Despesas Fixas", value: formatBRL(despesasFixas), color: "text-rose-500", bg: "bg-rose-500/10" },
          { label: "Despesas Variáveis", value: formatBRL(despesasVariaveis), color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Comprometimento", value: `${comprometimento.toFixed(1)}%`, color: comprometimento > 60 ? "text-rose-500" : "text-emerald-500", bg: comprometimento > 60 ? "bg-rose-500/10" : "bg-emerald-500/10" },
        ].map((k, i) => (
          <div key={i} className={cn("p-4 rounded-2xl border border-border/30", k.bg)}>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">{k.label}</p>
            <p className={cn("text-xl font-black", k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Comprometimento Bar */}
      <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">Comprometimento da Receita com Custos Fixos</span>
          <span className={cn("text-sm font-black", comprometimento > 60 ? "text-rose-500" : "text-emerald-500")}>
            {comprometimento.toFixed(1)}% da receita mensal
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", comprometimento > 60 ? "bg-rose-500" : comprometimento > 40 ? "bg-amber-500" : "bg-emerald-500")}
            style={{ width: `${Math.min(comprometimento, 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">Folha + Fixas = {formatBRL(totalFolha + despesasFixas)} de {formatBRL(receitaRef)} de receita</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Folha de Pagamento */}
        <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-sm">
          <h3 className="text-sm font-black mb-4 flex items-center gap-2">
            <Users size={16} className="text-primary" />
            Folha de Pagamento — Maio 2026
          </h3>
          <div className="space-y-3">
            {funcionarios.map(f => (
              <div key={f.id} className="p-4 rounded-2xl border border-border/30 bg-muted/10 hover:bg-muted/20 transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[13px] font-bold text-foreground">{f.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{f.cargo}</p>
                  </div>
                  <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border",
                    f.status === "pago" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}>
                    {f.status === "pago" ? "✓ Pago" : "Pendente"}
                  </span>
                </div>
                
                {f.relatedClientId && (
                  <button 
                    onClick={() => onOpenProfile?.({
                      cliente: f.relatedClientName,
                      clientId: f.relatedClientId,
                      empresa: f.relatedClientName,
                      email: "contato@empresa.com",
                      status: "pago",
                      plano: "Plano Custom",
                      valor: 0 // Mock value
                    })}
                    className="mb-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 text-[9px] font-black text-primary hover:bg-primary/10 transition-all border border-primary/10"
                  >
                    <Users size={10} /> CLIENTE: {f.relatedClientName} ({f.relatedClientId})
                  </button>
                )}

                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { label: "Salário", value: f.salario },
                    { label: "INSS", value: f.inss },
                    { label: "FGTS", value: f.fgts },
                  ].map((item, ii) => (
                    <div key={ii} className="text-center p-2 rounded-xl bg-background/60">
                      <p className="text-[9px] font-black text-muted-foreground uppercase">{item.label}</p>
                      <p className="text-[11px] font-black text-foreground mt-0.5">{formatBRL(item.value)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar size={10} /> Vence: {f.vencimento}
                  </p>
                  {f.status === "pendente" && (
                    <button onClick={() => markFuncPaid(f.id)} className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors opacity-0 group-hover:opacity-100">
                      <Check size={12} /> Marcar pago
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <span className="text-xs font-black text-muted-foreground uppercase">Total Líquido</span>
              <span className="font-black text-primary">{formatBRL(totalFolha)}</span>
            </div>
          </div>
        </div>

        {/* Despesas Fixas/Variáveis */}
        <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-sm">
          <h3 className="text-sm font-black mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-500" />
            Despesas Operacionais
          </h3>
          <div className="space-y-3">
            {despesas.map(d => (
              <div key={d.id} className="p-4 rounded-2xl border border-border/30 bg-muted/10 hover:bg-muted/20 transition-all group flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[13px] font-bold text-foreground">{d.descricao}</p>
                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full",
                      d.tipo === "fixa" ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500"
                    )}>
                      {d.tipo === "fixa" ? "FIXA" : "VARIÁVEL"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar size={10} /> {d.vencimento} · {d.categoria}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className="font-black text-rose-500">{formatBRL(d.valor)}</span>
                  {d.status === "pendente" ? (
                    <button onClick={() => markDespPaid(d.id)} className="text-[10px] font-bold text-amber-600 border border-amber-500/30 bg-amber-500/10 px-2 py-1 rounded-lg hover:bg-amber-500/20 transition-all opacity-0 group-hover:opacity-100">
                      Pagar
                    </button>
                  ) : (
                    <span className="text-[10px] font-black text-emerald-600">✓ Pago</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
