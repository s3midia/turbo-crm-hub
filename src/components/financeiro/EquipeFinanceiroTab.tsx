import React, { useState, useEffect } from "react";
import { Users, Check, AlertCircle, Plus, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

import { formatBRL } from "@/lib/formatters";

interface Funcionario {
  id: number;
  nome: string;
  cargo: string;
  salario: number;
  inss: number;
  fgts: number;
  status: "pago" | "pendente";
  vencimento: string;
  email?: string;
  telefone?: string;
  dataAdmissao?: string;
  cpf?: string;
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

const FUNCIONARIOS: Funcionario[] = [];

const DESPESAS: Despesa[] = [];

const totalFolha = FUNCIONARIOS.reduce((s, f) => s + f.salario + f.inss + f.fgts, 0);
const despesasFixas = DESPESAS.filter(d => d.tipo === "fixa").reduce((s, d) => s + d.valor, 0);
const despesasVariaveis = DESPESAS.filter(d => d.tipo === "variavel").reduce((s, d) => s + d.valor, 0);
const receitaRef = 0;
const comprometimento = ((totalFolha + despesasFixas) / receitaRef) * 100;

export default function EquipeFinanceiroTab() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(() => {
    const saved = localStorage.getItem("crm_equipe_funcionarios");
    return saved ? JSON.parse(saved) : FUNCIONARIOS;
  });
  const [despesas, setDespesas] = useState<Despesa[]>(() => {
    const saved = localStorage.getItem("crm_equipe_despesas");
    return saved ? JSON.parse(saved) : DESPESAS;
  });

  useEffect(() => {
    localStorage.setItem("crm_equipe_funcionarios", JSON.stringify(funcionarios));
  }, [funcionarios]);

  useEffect(() => {
    localStorage.setItem("crm_equipe_despesas", JSON.stringify(despesas));
  }, [despesas]);
  const [editingFuncId, setEditingFuncId] = useState<number | null>(null);
  const [editingDespId, setEditingDespId] = useState<number | null>(null);
  const [showFolhaModal, setShowFolhaModal] = useState(false);
  const [showDespesasModal, setShowDespesasModal] = useState(false);

  function markFuncPaid(id: number) {
    setFuncionarios(prev => prev.map(f => f.id === id ? { ...f, status: "pago" } : f));
  }

  function markDespPaid(id: number) {
    setDespesas(prev => prev.map(d => d.id === id ? { ...d, status: "pago" } : d));
  }

  function handleSaveFunc(id: number, data: Partial<Funcionario>) {
    setFuncionarios(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
    setEditingFuncId(null);
  }

  function handleSaveDesp(id: number, data: Partial<Despesa>) {
    setDespesas(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    setEditingDespId(null);
  }

  function handleAddFunc() {
    const newId = Date.now();
    const newFunc: Funcionario = {
      id: newId,
      nome: "Novo Colaborador",
      cargo: "Cargo",
      salario: 0,
      inss: 0,
      fgts: 0,
      status: "pendente",
      vencimento: "05/05/2026",
    };
    setFuncionarios(prev => [...prev, newFunc]);
    setEditingFuncId(newId);
  }

  function handleAddDesp() {
    const newId = Date.now();
    const newDesp: Despesa = {
      id: newId,
      descricao: "Nova Despesa",
      tipo: "variavel",
      valor: 0,
      vencimento: "10/05/2026",
      status: "pendente",
      categoria: "Geral",
    };
    setDespesas(prev => [...prev, newDesp]);
    setEditingDespId(newId);
  }

  function handleDeleteFunc(id: number) {
    setFuncionarios(prev => prev.filter(f => f.id !== id));
  }

  function handleDeleteDesp(id: number) {
    setDespesas(prev => prev.filter(d => d.id !== id));
  }

  const totalFolhaState = funcionarios.reduce((s, f) => s + f.salario + f.inss + f.fgts, 0);
  const despesasFixasState = despesas.filter(d => d.tipo === "fixa").reduce((s, d) => s + d.valor, 0);
  const despesasVariaveisState = despesas.filter(d => d.tipo === "variavel").reduce((s, d) => s + d.valor, 0);
  const comprometimentoState = ((totalFolhaState + despesasFixasState) / receitaRef) * 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total da Folha", value: formatBRL(totalFolhaState), color: "text-foreground", bg: "bg-muted/30" },
          { label: "Despesas Fixas", value: formatBRL(despesasFixasState), color: "text-rose-500", bg: "bg-rose-500/10" },
          { label: "Despesas Variáveis", value: formatBRL(despesasVariaveisState), color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Comprometimento", value: `${comprometimentoState.toFixed(1)}%`, color: comprometimentoState > 60 ? "text-rose-500" : "text-emerald-500", bg: comprometimentoState > 60 ? "bg-rose-500/10" : "bg-emerald-500/10" },
        ].map((k, i) => (
          <div key={i} className={cn("p-4 rounded-2xl border border-border/30", k.bg)}>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">{k.label}</p>
            <p className={cn("text-xl font-black", k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Comprometimento Bar */}
      <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">Comprometimento da Receita com Custos Fixos</span>
          <span className={cn("text-sm font-black", comprometimentoState > 60 ? "text-rose-500" : "text-emerald-500")}>
            {comprometimentoState.toFixed(1)}% da receita mensal
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", comprometimentoState > 60 ? "bg-rose-500" : comprometimentoState > 40 ? "bg-amber-500" : "bg-emerald-500")}
            style={{ width: `${Math.min(comprometimentoState, 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">Folha + Fixas = {formatBRL(totalFolhaState + despesasFixasState)} de {formatBRL(receitaRef)} de receita</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Folha de Pagamento */}
        <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black flex items-center gap-2">
              <Users size={16} className="text-primary" />
              Folha de Pagamento — Maio 2026
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleAddFunc}
                className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 flex items-center gap-1.5"
              >
                <Plus size={12} /> Novo
              </button>
              <button 
                onClick={() => setShowFolhaModal(true)}
                className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20"
              >
                Ver mais
              </button>
            </div>
          </div>
          <div className="space-y-3 flex-1">
            {funcionarios.map(f => (
              <div key={f.id} className="p-4 rounded-2xl border border-border/30 bg-muted/10 hover:bg-muted/20 transition-all group relative">
                {editingFuncId === f.id ? (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        className="col-span-2 px-3 py-2 text-[12px] font-bold bg-background border border-border rounded-lg"
                        defaultValue={f.nome}
                        onChange={e => f.nome = e.target.value}
                      />
                      <input 
                        className="px-3 py-2 text-[12px] bg-background border border-border rounded-lg"
                        defaultValue={f.cargo}
                        onChange={e => f.cargo = e.target.value}
                      />
                      <input 
                        type="number"
                        className="px-3 py-2 text-[12px] bg-background border border-border rounded-lg"
                        defaultValue={f.salario}
                        onChange={e => f.salario = Number(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => handleDeleteFunc(f.id)}
                        className="mr-auto px-3 py-1.5 text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        Excluir
                      </button>
                      <button 
                        onClick={() => setEditingFuncId(null)}
                        className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => handleSaveFunc(f.id, f)}
                        className="px-3 py-1.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-lg"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-[13px] font-bold text-foreground">{f.nome}</p>
                        <p className="text-[10px] text-muted-foreground">{f.cargo}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border",
                          f.status === "pago" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}>
                          {f.status === "pago" ? "✓ Pago" : "Pendente"}
                        </span>
                        <button 
                          onClick={() => setEditingFuncId(f.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-primary hover:underline"
                        >
                          Editar dados
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {[
                        { label: "Salário", value: f.salario },
                        { label: "INSS", value: f.inss },
                        { label: "FGTS", value: f.fgts },
                      ].map((item, ii) => (
                        <div key={ii} className="text-center p-2 rounded-xl bg-background/60 border border-border/10">
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
                        <button onClick={() => markFuncPaid(f.id)} className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                          <Check size={12} /> Marcar pago
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between shadow-inner">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Líquido da Folha</span>
            <span className="text-lg font-black text-primary">{formatBRL(totalFolhaState)}</span>
          </div>
        </div>

        {/* Despesas Operacionais */}
        <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" />
              Despesas Operacionais
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleAddDesp}
                className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-all border border-rose-500/20 flex items-center gap-1.5"
              >
                <Plus size={12} /> Nova
              </button>
              <button 
                onClick={() => setShowDespesasModal(true)}
                className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-all border border-amber-500/20"
              >
                Ver mais
              </button>
            </div>
          </div>
          <div className="space-y-3 flex-1">
            {despesas.map(d => (
              <div key={d.id} className="p-4 rounded-2xl border border-border/30 bg-muted/10 hover:bg-muted/20 transition-all group relative">
                {editingDespId === d.id ? (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <input 
                      className="w-full px-3 py-2 text-[12px] font-bold bg-background border border-border rounded-lg"
                      defaultValue={d.descricao}
                      onChange={e => d.descricao = e.target.value}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="number"
                        className="px-3 py-2 text-[12px] bg-background border border-border rounded-lg"
                        defaultValue={d.valor}
                        onChange={e => d.valor = Number(e.target.value)}
                      />
                      <input 
                        className="px-3 py-2 text-[12px] bg-background border border-border rounded-lg"
                        defaultValue={d.categoria}
                        onChange={e => d.categoria = e.target.value}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => handleDeleteDesp(d.id)}
                        className="mr-auto px-3 py-1.5 text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        Excluir
                      </button>
                      <button 
                        onClick={() => setEditingDespId(null)}
                        className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => handleSaveDesp(d.id, d)}
                        className="px-3 py-1.5 text-[10px] font-bold bg-amber-500 text-white rounded-lg"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
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
                      <button 
                        onClick={() => setEditingDespId(d.id)}
                        className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-primary hover:underline"
                      >
                        Editar despesa
                      </button>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <span className="font-black text-rose-500 text-sm">{formatBRL(d.valor)}</span>
                      {d.status === "pendente" ? (
                        <button onClick={() => markDespPaid(d.id)} className="text-[10px] font-bold text-amber-600 border border-amber-500/30 bg-amber-500/10 px-2 py-1 rounded-lg hover:bg-amber-500/20 transition-all group-hover:opacity-100">
                          Pagar
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-emerald-600">✓ Pago</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between shadow-inner">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total de Despesas</span>
            <span className="text-lg font-black text-rose-500">{formatBRL(despesasFixasState + despesasVariaveisState)}</span>
          </div>
        </div>
      </div>

      {/* Folha Detailed Modal */}
      {showFolhaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border border-border/50 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-border/30 flex items-center justify-between bg-primary/5">
              <div>
                <h2 className="text-2xl font-black text-foreground">Gestão de Folha de Pagamento</h2>
                <p className="text-sm text-muted-foreground">Ciclo: Maio 2026 · 3 Colaboradores Ativos</p>
              </div>
              <button onClick={() => setShowFolhaModal(false)} className="w-10 h-10 rounded-full bg-background border border-border/50 flex items-center justify-center hover:bg-muted transition-all">
                <Trash2 size={18} className="text-muted-foreground rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="space-y-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left border-b border-border/50">
                      <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Colaborador</th>
                      <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Salário Base</th>
                      <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">INSS (11%)</th>
                      <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">FGTS (8%)</th>
                      <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Total Custo</th>
                      <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funcionarios.map(f => (
                      <tr key={f.id} className="border-b border-border/20 group hover:bg-muted/30 transition-colors">
                        <td className="py-5">
                          <p className="text-sm font-bold">{f.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{f.cargo} · {f.email}</p>
                        </td>
                        <td className="py-5 text-right font-bold text-sm">{formatBRL(f.salario)}</td>
                        <td className="py-5 text-right text-sm text-rose-500">-{formatBRL(f.inss)}</td>
                        <td className="py-5 text-right text-sm text-blue-500">+{formatBRL(f.fgts)}</td>
                        <td className="py-5 text-right font-black text-sm">{formatBRL(f.salario + f.inss + f.fgts)}</td>
                        <td className="py-5 text-center">
                          <span className={cn("text-[9px] font-black px-2 py-1 rounded-full border",
                            f.status === "pago" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          )}>
                            {f.status === "pago" ? "LIQUIDADO" : "PENDENTE"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="grid grid-cols-3 gap-6 pt-6">
                  <div className="p-6 rounded-3xl bg-muted/20 border border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Total Salários</p>
                    <p className="text-2xl font-black">{formatBRL(funcionarios.reduce((s,f) => s + f.salario, 0))}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-muted/20 border border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Total Encargos</p>
                    <p className="text-2xl font-black text-rose-500">{formatBRL(funcionarios.reduce((s,f) => s + f.inss + f.fgts, 0))}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20">
                    <p className="text-[10px] font-black text-primary uppercase mb-2">Custo Total Folha</p>
                    <p className="text-2xl font-black text-primary">{formatBRL(totalFolhaState)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 border-t border-border/30 flex justify-end gap-4 bg-muted/20">
              <button className="px-6 py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-background transition-all">Exportar PDF</button>
              <button onClick={() => setShowFolhaModal(false)} className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 transition-all">Fechar Detalhes</button>
            </div>
          </div>
        </div>
      )}

      {/* Despesas Detailed Modal */}
      {showDespesasModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border border-border/50 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-border/30 flex items-center justify-between bg-amber-500/5">
              <div>
                <h2 className="text-2xl font-black text-foreground">Relatório de Despesas Operacionais</h2>
                <p className="text-sm text-muted-foreground">Competência: Maio 2026 · Gestão de Custos</p>
              </div>
              <button onClick={() => setShowDespesasModal(false)} className="w-10 h-10 rounded-full bg-background border border-border/50 flex items-center justify-center hover:bg-muted transition-all">
                <Trash2 size={18} className="text-muted-foreground rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5">
                    <h4 className="text-xs font-black text-blue-600 uppercase mb-4">Custos Fixos</h4>
                    <div className="space-y-3">
                      {despesas.filter(d => d.tipo === "fixa").map(d => (
                        <div key={d.id} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-muted-foreground">{d.descricao}</span>
                          <span className="font-bold">{formatBRL(d.valor)}</span>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-blue-500/20 flex justify-between font-black text-blue-600">
                        <span>Subtotal Fixo</span>
                        <span>{formatBRL(despesasFixasState)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl border border-orange-500/20 bg-orange-500/5">
                    <h4 className="text-xs font-black text-orange-600 uppercase mb-4">Custos Variáveis</h4>
                    <div className="space-y-3">
                      {despesas.filter(d => d.tipo === "variavel").map(d => (
                        <div key={d.id} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-muted-foreground">{d.descricao}</span>
                          <span className="font-bold">{formatBRL(d.valor)}</span>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-orange-500/20 flex justify-between font-black text-orange-600">
                        <span>Subtotal Variável</span>
                        <span>{formatBRL(despesasVariaveisState)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Histórico Completo</h4>
                <div className="rounded-2xl border border-border/50 overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-muted/50">
                      <tr className="text-left">
                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase">Data</th>
                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase">Descrição</th>
                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase">Categoria</th>
                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase">Tipo</th>
                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {despesas.map(d => (
                        <tr key={d.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                          <td className="p-4 text-xs font-medium">{d.vencimento}</td>
                          <td className="p-4 text-xs font-bold">{d.descricao}</td>
                          <td className="p-4 text-xs">{d.categoria}</td>
                          <td className="p-4">
                            <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full",
                              d.tipo === "fixa" ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500"
                            )}>{d.tipo.toUpperCase()}</span>
                          </td>
                          <td className="p-4 text-xs font-black text-right text-rose-500">{formatBRL(d.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 border-t border-border/30 flex justify-end gap-4 bg-muted/20">
              <button className="px-6 py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-background transition-all">Gerar DRE</button>
              <button onClick={() => setShowDespesasModal(false)} className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all">Fechar Detalhes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
