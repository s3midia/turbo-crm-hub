import React, { useState, useEffect } from "react";
import { FileText, Receipt, Zap, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const integracoesMetadata = [
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

export default function BillingIntegrations() {
  const [intStates, setIntStates] = useState<IntState[]>(integracoesMetadata.map(defaultIntState));

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
            const saved = data.find((d: any) => d.name === integracoesMetadata[i].nome);
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

  const handleSave = async (i: number) => {
    const s = intStates[i];
    if (!s.provider) {
      updateInt(i, { error: "Selecione o provedor." });
      return;
    }
    
    updateInt(i, { saving: true, error: "" });

    const { error } = await (supabase as any)
      .from("api_manager")
      .upsert(
        {
          name: integracoesMetadata[i].nome,
          category: "cobranca",
          url: s.provider,
          api_key: s.apiKey.trim(),
          status: "stable",
          description: integracoesMetadata[i].desc,
        },
        { onConflict: "name" }
      );

    if (error) {
      updateInt(i, { saving: false, error: "Erro ao salvar." });
      toast.error("Erro ao salvar integração.");
      return;
    }

    updateInt(i, {
      connected: true,
      connectedProvider: s.provider,
      open: false,
      saving: false,
    });
    toast.success(`${integracoesMetadata[i].nome} configurado!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Faturamento e Cobrança</h2>
          <p className="text-sm text-muted-foreground">
            Configure gateways de pagamento e emissão de notas fiscais.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {integracoesMetadata.map((int, i) => {
          const s = intStates[i];
          return (
            <div key={i} className={cn(
              "p-5 rounded-2xl border transition-all shadow-sm",
              s.open ? "border-primary bg-primary/5" : "border-border/50 bg-card hover:border-primary/30"
            )}>
              <div className="flex items-start justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", int.bg)}>
                  <int.icon size={20} className={int.color} />
                </div>
                {s.connected ? (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] uppercase">
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] uppercase opacity-50">
                    Pendente
                  </Badge>
                )}
              </div>
              <h4 className="text-sm font-black text-foreground">{int.nome}</h4>
              <p className="text-[11px] text-muted-foreground mt-1 mb-4 leading-relaxed">{int.desc}</p>

              {s.open ? (
                <div className="space-y-3">
                  <select
                    value={s.provider}
                    onChange={e => updateInt(i, { provider: e.target.value, error: "" })}
                    className="w-full px-3 py-2 rounded-xl border border-border/50 bg-background text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="">Selecione o provedor...</option>
                    {int.providers.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input
                    type="password"
                    placeholder="API Key / Token"
                    value={s.apiKey}
                    onChange={e => updateInt(i, { apiKey: e.target.value, error: "" })}
                    className="w-full px-3 py-2 rounded-xl border border-border/50 bg-background text-xs focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {s.error && <p className="text-[10px] text-red-500 font-bold">{s.error}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 rounded-xl text-[11px] font-bold" onClick={() => handleSave(i)} disabled={s.saving}>
                      {s.saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Conectar"}
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1 rounded-xl text-[11px]" onClick={() => updateInt(i, { open: false })}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="w-full rounded-xl text-[11px] font-bold h-9" onClick={() => updateInt(i, { open: true })}>
                  {s.connected ? "Reconfigurar" : "Configurar Integração"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
