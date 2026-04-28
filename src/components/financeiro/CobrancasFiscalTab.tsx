import React, { useState } from "react";
import { FileText, Receipt, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Zap, Edit2, Save, X, Plus, Trash2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiManager } from "@/hooks/useApiManager";

function formatBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

interface Contrato {
  id: number;
  cliente: string;
  plano: string;
  valor: number;
  diaVencimento: number;
  recorrencia: "mensal" | "trimestral" | "anual";
  ativo: boolean;
  proximoVencimento: string;
  ultimoEnvio: string;
}

const INITIAL_CONTRATOS: Contrato[] = [
  { id: 1, cliente: "Clínica Academias 6", plano: "Plano Manutenção CRM", valor: 1200, diaVencimento: 5, recorrencia: "mensal", ativo: true, proximoVencimento: "05/05/2026", ultimoEnvio: "05/04/2026" },
  { id: 2, cliente: "ANDREA OLIVEIRA", plano: "Licença Anual Sistema", valor: 4800, diaVencimento: 15, recorrencia: "anual", ativo: true, proximoVencimento: "15/12/2026", ultimoEnvio: "15/12/2025" },
  { id: 3, cliente: "Giovanna Martins", plano: "Hospedagem + Suporte", valor: 350, diaVencimento: 20, recorrencia: "mensal", ativo: false, proximoVencimento: "Pausado", ultimoEnvio: "20/03/2026" },
];

// Categories that are relevant for financial integrations (fiscal/payment)
const FISCAL_KEYWORDS = ["asaas", "gerencianet", "pjbank", "nfe", "nota fiscal", "boleto", "nfce", "nfc-e", "plug", "focus", "fiscal", "pagamento", "cobrança", "enotas", "nuvem"];

function isFiscalApi(name: string, desc: string | null): boolean {
  const searchStr = (name + " " + (desc ?? "")).toLowerCase();
  return FISCAL_KEYWORDS.some(kw => searchStr.includes(kw));
}

interface ContratoModalProps {
  contrato?: Contrato;
  onClose: () => void;
  onSave: (c: Contrato) => void;
}

function ContratoModal({ contrato, onClose, onSave }: ContratoModalProps) {
  const [form, setForm] = useState({
    cliente: contrato?.cliente ?? "",
    plano: contrato?.plano ?? "",
    valor: contrato?.valor?.toString() ?? "",
    diaVencimento: contrato?.diaVencimento?.toString() ?? "1",
    recorrencia: contrato?.recorrencia ?? "mensal" as Contrato["recorrencia"],
    ativo: contrato?.ativo ?? true,
    ultimoEnvio: contrato?.ultimoEnvio ?? "—",
  });

  function handleSave() {
    if (!form.cliente || !form.valor) return;
    const dia = parseInt(form.diaVencimento) || 1;
    const prox = form.ativo ? `${String(dia).padStart(2, "0")}/05/2026` : "Pausado";
    onSave({
      id: contrato?.id ?? Date.now(),
      cliente: form.cliente,
      plano: form.plano,
      valor: parseFloat(form.valor),
      diaVencimento: dia,
      recorrencia: form.recorrencia,
      ativo: form.ativo,
      proximoVencimento: prox,
      ultimoEnvio: form.ultimoEnvio,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-7 mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black">{contrato ? "Editar Contrato" : "Novo Contrato"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-all"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Cliente *</label>
            <input value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))}
              className="w-full px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Nome do cliente" />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Plano / Serviço</label>
            <input value={form.plano} onChange={e => setForm(f => ({ ...f, plano: e.target.value }))}
              className="w-full px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Ex: Manutenção Mensal" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Valor (R$) *</label>
            <input type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
              className="w-full px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="0,00" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Dia do Mês</label>
            <input type="number" min="1" max="31" value={form.diaVencimento} onChange={e => setForm(f => ({ ...f, diaVencimento: e.target.value }))}
              className="w-full px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Recorrência</label>
            <select value={form.recorrencia} onChange={e => setForm(f => ({ ...f, recorrencia: e.target.value as any }))}
              className="w-full px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all">
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>
          <div className="space-y-1 flex flex-col justify-end">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Cobrança Ativa</label>
            <button onClick={() => setForm(f => ({ ...f, ativo: !f.ativo }))}
              className={cn("w-full py-2.5 rounded-xl text-sm font-bold border transition-all",
                form.ativo ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-muted/30 text-muted-foreground border-border/50"
              )}>
              {form.ativo ? "✓ Ativo" : "Pausado"}
            </button>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl border border-border bg-background hover:bg-muted text-sm font-bold transition-all">Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
            <Save size={14} className="inline mr-1.5" /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CobrancasFiscalTab() {
  const [contratos, setContratos] = useState(INITIAL_CONTRATOS);
  const [editingContrato, setEditingContrato] = useState<Contrato | undefined>();
  const [showContratoModal, setShowContratoModal] = useState(false);
  const [showNewApiHint, setShowNewApiHint] = useState(false);

  // Pull real APIs from the Global Manager
  const { apis, isLoading } = useApiManager();
  const fiscalApis = (apis ?? []).filter(api => isFiscalApi(api.name, api.description));
  const allApis = apis ?? [];

  function toggleContrato(id: number) {
    setContratos(prev => prev.map(c => c.id === id
      ? { ...c, ativo: !c.ativo, proximoVencimento: !c.ativo ? `${String(c.diaVencimento).padStart(2, "0")}/05/2026` : "Pausado" }
      : c));
  }

  function handleSaveContrato(c: Contrato) {
    setContratos(prev => {
      const exists = prev.find(x => x.id === c.id);
      return exists ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev];
    });
  }

  function handleDeleteContrato(id: number) {
    setContratos(prev => prev.filter(c => c.id !== id));
  }

  function openNew() {
    setEditingContrato(undefined);
    setShowContratoModal(true);
  }

  function openEdit(c: Contrato) {
    setEditingContrato(c);
    setShowContratoModal(true);
  }

  const statusColor: Record<string, string> = {
    stable: "bg-emerald-500",
    unstable: "bg-amber-500",
    offline: "bg-rose-500",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {showContratoModal && (
        <ContratoModal
          contrato={editingContrato}
          onClose={() => setShowContratoModal(false)}
          onSave={handleSaveContrato}
        />
      )}

      {/* Fiscal APIs from Global Manager */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <FileText size={16} className="text-muted-foreground" />
            Integrações Fiscais e de Cobrança
          </h3>
          <a href="/integracoes" className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
            <ExternalLink size={12} /> Gerenciar no Painel de Integrações
          </a>
        </div>

        {isLoading ? (
          <div className="p-8 rounded-2xl border border-border/50 bg-card flex items-center justify-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm text-muted-foreground">Carregando integrações...</span>
          </div>
        ) : fiscalApis.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {fiscalApis.map(api => (
              <div key={api.id} className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{api.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{api.description ?? "API conectada via Gerenciador Global"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", statusColor[api.status] ?? "bg-slate-400")} />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                      {api.status === "stable" ? "Ativo" : api.status === "unstable" ? "Instável" : "Offline"}
                    </span>
                  </div>
                </div>
                {api.url && (
                  <p className="text-[10px] font-mono text-muted-foreground mt-3 bg-muted/30 px-3 py-1.5 rounded-lg truncate">
                    {api.url}
                  </p>
                )}
                {api.api_key && (
                  <p className="text-[10px] font-mono text-muted-foreground mt-2 bg-muted/30 px-3 py-1.5 rounded-lg">
                    Key: {api.api_key.slice(0, 6)}••••••{api.api_key.slice(-4)}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl border border-dashed border-border/50 bg-muted/10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto">
              <Link2 size={22} className="text-muted-foreground/50" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Nenhuma integração fiscal cadastrada</p>
              <p className="text-xs text-muted-foreground mt-1">
                Acesse o <strong>Painel de Integrações</strong> e adicione uma API de boleto (Asaas, Gerencianet, PJBank) ou NF-e (Focus NFe, Plug Notas).
              </p>
            </div>
            <a href="/integracoes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
              <ExternalLink size={13} /> Ir para Integrações
            </a>
          </div>
        )}

        {/* Show all non-fiscal APIs as context */}
        {!isLoading && allApis.length > 0 && fiscalApis.length === 0 && (
          <div className="p-4 rounded-xl border border-border/30 bg-muted/10">
            <p className="text-[11px] text-muted-foreground flex items-center gap-2">
              <AlertCircle size={13} className="text-amber-500 shrink-0" />
              Você tem <strong className="text-foreground">{allApis.length} API(s)</strong> cadastradas no sistema — mas nenhuma identificada como fiscal/cobrança.
              Para vincular uma existente, edite sua descrição no Painel de Integrações incluindo palavras como "boleto", "nfe", "cobrança" ou "nota fiscal".
            </p>
          </div>
        )}
      </div>

      {/* Recorrentes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <RefreshCw size={16} className="text-muted-foreground" />
            Cobranças Recorrentes por Contrato
          </h3>
          <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            <Plus size={13} /> Novo Contrato
          </button>
        </div>

        <div className="rounded-3xl border border-border/40 bg-card/50 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/30 bg-muted/10">
                {["Cliente", "Plano", "Valor", "Vencimento", "Recorrência", "Próx. Envio", "Ativo", "Ações"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-black">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contratos.map((c, idx) => (
                <tr key={c.id} className={cn("border-b border-border/20 hover:bg-muted/10 transition-all group", idx === contratos.length - 1 && "border-0")}>
                  <td className="px-4 py-4 text-[13px] font-bold text-foreground">{c.cliente}</td>
                  <td className="px-4 py-4 text-[11px] text-muted-foreground">{c.plano}</td>
                  <td className="px-4 py-4 font-black text-foreground">{formatBRL(c.valor)}</td>
                  <td className="px-4 py-4 text-[12px] font-bold text-foreground">Dia {c.diaVencimento}</td>
                  <td className="px-4 py-4">
                    <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-lg",
                      c.recorrencia === "mensal" ? "bg-blue-500/10 text-blue-500" :
                        c.recorrencia === "trimestral" ? "bg-violet-500/10 text-violet-500" :
                          "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {c.recorrencia.charAt(0).toUpperCase() + c.recorrencia.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("text-[11px] font-semibold", c.ativo ? "text-foreground" : "text-muted-foreground line-through")}>
                      {c.proximoVencimento}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleContrato(c.id)}
                      className={cn("relative w-11 h-6 rounded-full transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-primary", c.ativo ? "bg-primary" : "bg-muted")}
                      title={c.ativo ? "Desativar cobrança" : "Ativar cobrança"}
                    >
                      <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300", c.ativo ? "left-6" : "left-1")} />
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Editar">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDeleteContrato(c.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-all" title="Excluir">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {contratos.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    Nenhum contrato cadastrado. Clique em "Novo Contrato" para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/20 border border-border/20">
          <AlertCircle size={14} className="text-amber-500 shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            <strong className="text-foreground">Atenção:</strong> A automação de cobranças só dispara se uma integração fiscal estiver configurada e ativa acima.
          </p>
        </div>
      </div>
    </div>
  );
}
