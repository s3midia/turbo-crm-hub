import React, { useState, useEffect } from "react";
import { FileText, Receipt, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const CONTRATOS: Contrato[] = [
  { id: 1, cliente: "Clínica Academias 6", plano: "Plano Manutenção CRM", valor: 1200, diaVencimento: 5, recorrencia: "mensal", ativo: true, proximoVencimento: "05/05/2026", ultimoEnvio: "05/04/2026" },
  { id: 2, cliente: "ANDREA OLIVEIRA", plano: "Licença Anual Sistema", valor: 4800, diaVencimento: 15, recorrencia: "anual", ativo: true, proximoVencimento: "15/12/2026", ultimoEnvio: "15/12/2025" },
  { id: 3, cliente: "Giovanna Martins", plano: "Hospedagem + Suporte", valor: 350, diaVencimento: 20, recorrencia: "mensal", ativo: false, proximoVencimento: "Pausado", ultimoEnvio: "20/03/2026" },
];

const integracoes = [
  {
    nome: "Boleto Bancário",
    desc: "Emissão de boletos via Asaas ou Gerencianet",
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    providers: ["Asaas", "Gerencianet", "PJBank", "Inter Empresas"],
  },
  {
    nome: "Nota Fiscal Eletrônica (NF-e)",
    desc: "Emissão de NF-e via Focus NFe ou Plug Notas",
    icon: Receipt,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    providers: ["Focus NFe", "Plug Notas", "eNotas", "Nuvem Fiscal"],
  },
  {
    nome: "NFC-e (Cupom Fiscal)",
    desc: "Emissão de nota fiscal de consumidor eletrônica",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    providers: ["Focus NFe", "Nuvem Fiscal"],
  },
];

interface IntState {
  open: boolean;
  provider: string;
  apiKey: string;
  connected: boolean;
  connectedProvider: string;
  error: string;
  saving: boolean;
}

const defaultIntState = (): IntState => ({
  open: false,
  provider: "",
  apiKey: "",
  connected: false,
  connectedProvider: "",
  error: "",
  saving: false,
});

export default function CobrancasFiscalTab() {
  const [contratos, setContratos] = useState(CONTRATOS);
  const [intStates, setIntStates] = useState<IntState[]>(integracoes.map(defaultIntState));

  // ── Load saved integrations from Supabase on mount ──────────────────────────
  useEffect(() => {
    async function loadIntegrations() {
      const { data, error } = await (supabase as any)
        .from("api_manager")
        .select("*")
        .eq("category", "cobranca");

      if (error) {
        console.error("Erro ao carregar integrações:", error);
        return;
      }

      if (data && data.length > 0) {
        setIntStates(prev =>
          prev.map((s, i) => {
            const saved = data.find((d: any) => d.name === integracoes[i].nome);
            if (saved) {
              return {
                ...s,
                connected: saved.status === "stable",
                connectedProvider: saved.url ?? "",
                apiKey: saved.api_key ?? "",
              };
            }
            return s;
          })
        );
      }
    }
    loadIntegrations();
  }, []);

  function updateInt(i: number, patch: Partial<IntState>) {
    setIntStates(prev => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function handleOpen(i: number) {
    updateInt(i, { open: true, error: "" });
  }

  function handleCancel(i: number) {
    setIntStates(prev =>
      prev.map((s, idx) =>
        idx === i
          ? { ...defaultIntState(), connected: s.connected, connectedProvider: s.connectedProvider }
          : s
      )
    );
  }

  async function handleConectar(i: number) {
    const s = intStates[i];
    if (!s.provider) {
      updateInt(i, { error: "Selecione o provedor antes de continuar." });
      return;
    }
    if (!s.apiKey.trim()) {
      updateInt(i, { error: "Cole sua API Key para prosseguir." });
      return;
    }

    updateInt(i, { saving: true, error: "" });

    const { error } = await (supabase as any)
      .from("api_manager")
      .upsert(
        {
          name: integracoes[i].nome,
          category: "cobranca",
          url: s.provider,          // reusing url to store the chosen provider name
          api_key: s.apiKey.trim(),
          status: "stable",
          description: integracoes[i].desc,
        },
        { onConflict: "name" }      // upsert by name so it overwrites on reconfigure
      );

    if (error) {
      console.error("Erro ao salvar integração:", error);
      updateInt(i, { saving: false, error: "Erro ao salvar. Tente novamente." });
      toast.error("Não foi possível salvar a integração.");
      return;
    }

    updateInt(i, {
      connected: true,
      connectedProvider: s.provider,
      open: false,
      error: "",
      saving: false,
    });
    toast.success(`${integracoes[i].nome} conectado com sucesso!`);
  }

  function toggleContrato(id: number) {
    setContratos(prev => prev.map(c => (c.id === id ? { ...c, ativo: !c.ativo } : c)));
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Integrações Fiscais */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <FileText size={16} className="text-muted-foreground" />
          Integrações Fiscais e de Cobrança
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {integracoes.map((int, i) => {
            const s = intStates[i];
            return (
              <div
                key={i}
                className={cn(
                  "p-5 rounded-2xl border transition-all",
                  s.open
                    ? "border-primary bg-primary/5"
                    : "border-border/50 bg-card hover:border-primary/30"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", int.bg)}>
                    <int.icon size={20} className={int.color} />
                  </div>
                  {s.connected ? (
                    <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase flex items-center gap-1">
                      <CheckCircle2 size={10} /> Conectado
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase">
                      Não configurado
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-black text-foreground">{int.nome}</h4>
                {s.connected && s.connectedProvider && (
                  <p className="text-[10px] text-emerald-500 font-semibold mt-0.5">
                    Provedor: {s.connectedProvider}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1 mb-4">{int.desc}</p>

                {s.open ? (
                  <div className="space-y-3">
                    <select
                      value={s.provider}
                      onChange={e => updateInt(i, { provider: e.target.value, error: "" })}
                      className="w-full px-3 py-2 rounded-xl border border-border/50 bg-background text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      <option value="">Selecione o provedor...</option>
                      {int.providers.map(p => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Cole sua API Key aqui..."
                      value={s.apiKey}
                      onChange={e => updateInt(i, { apiKey: e.target.value, error: "" })}
                      className="w-full px-3 py-2 rounded-xl border border-border/50 bg-background text-xs focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {s.error && (
                      <p className="text-[11px] text-red-500 flex items-center gap-1">
                        <AlertCircle size={11} />
                        {s.error}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConectar(i)}
                        disabled={s.saving}
                        className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {s.saving ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Conectar"
                        )}
                      </button>
                      <button
                        onClick={() => handleCancel(i)}
                        disabled={s.saving}
                        className="flex-1 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-all disabled:opacity-60"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpen(i)}
                    className="w-full py-2 rounded-xl border border-border/50 bg-background hover:bg-muted text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink size={12} />
                    {s.connected ? "Reconfigurar" : "Configurar Integração"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cobranças Recorrentes */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <RefreshCw size={16} className="text-muted-foreground" />
          Cobranças Recorrentes por Contrato
        </h3>
        <div className="rounded-3xl border border-border/40 bg-card/50 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/30 bg-muted/10">
                {["Cliente", "Plano", "Valor", "Dia de Vencimento", "Recorrência", "Próx. Envio", "Último Envio", "Ativo"].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-black">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contratos.map((c, idx) => (
                <tr
                  key={c.id}
                  className={cn(
                    "border-b border-border/20 hover:bg-muted/10 transition-all",
                    idx === contratos.length - 1 && "border-0"
                  )}
                >
                  <td className="px-5 py-4 text-[13px] font-bold text-foreground">{c.cliente}</td>
                  <td className="px-5 py-4 text-[11px] text-muted-foreground">{c.plano}</td>
                  <td className="px-5 py-4 font-black text-foreground">{formatBRL(c.valor)}</td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] font-bold text-foreground">Dia {c.diaVencimento}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "text-[10px] font-black px-2.5 py-1 rounded-lg",
                        c.recorrencia === "mensal"
                          ? "bg-blue-500/10 text-blue-500"
                          : c.recorrencia === "trimestral"
                          ? "bg-violet-500/10 text-violet-500"
                          : "bg-emerald-500/10 text-emerald-500"
                      )}
                    >
                      {c.recorrencia.charAt(0).toUpperCase() + c.recorrencia.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "text-[11px] font-semibold",
                        c.ativo ? "text-foreground" : "text-muted-foreground line-through"
                      )}
                    >
                      {c.proximoVencimento}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[11px] text-muted-foreground">{c.ultimoEnvio}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleContrato(c.id)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                        c.ativo ? "bg-primary" : "bg-muted"
                      )}
                      title={c.ativo ? "Desativar cobrança" : "Ativar cobrança"}
                    >
                      <div
                        className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300",
                          c.ativo ? "left-6" : "left-1"
                        )}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/20 border border-border/20">
          <AlertCircle size={14} className="text-amber-500 shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            <strong className="text-foreground">Atenção:</strong> A automação de cobranças só funciona após configurar uma integração de boleto/NF-e acima.
          </p>
        </div>
      </div>
    </div>
  );
}
