import React, { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StageConfig {
    key: string;
    label: string;
    enabled: boolean;
    message: string;
    fileUrl: string;
}

const INITIAL_STAGES: StageConfig[] = [
    {
        key: "novo",
        label: "Novo Lead",
        enabled: true,
        message: "Seja muito bem vindo a TSG Sites.",
        fileUrl: "asdf",
    },
    {
        key: "atendimento",
        label: "Em Atendimento",
        enabled: false,
        message: "Olá {nome}, vimos que você avançou para...",
        fileUrl: "",
    },
    {
        key: "agendado",
        label: "Agendado",
        enabled: false,
        message: "Olá {nome}, vimos que você avançou para...",
        fileUrl: "",
    },
    {
        key: "vendido",
        label: "Vendido",
        enabled: true,
        message: "Olá {nome}! Se puder, gostaria muito de pedir um pequeno favor. Se ficou satisfeito(a) com o nosso serviço e atendimento, ficaria muito grata se pudesse deixar uma avaliação no Google.",
        fileUrl: "",
    },
    {
        key: "perdido",
        label: "Perdido",
        enabled: false,
        message: "Olá {nome}, vimos que você avançou para...",
        fileUrl: "",
    },
];

export default function AutomacaoFunilPage() {
    const [stages, setStages] = useState<StageConfig[]>(INITIAL_STAGES);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const { data, error } = await supabase.from('automation_configs').select('*');
                if (error) throw error;
                if (data && data.length > 0) {
                    setStages(prev => prev.map(stage => {
                        const dbConfig = data.find(d => d.stage_key === stage.key);
                        if (dbConfig) {
                            return {
                                ...stage,
                                enabled: dbConfig.enabled,
                                message: dbConfig.message || '',
                                fileUrl: dbConfig.file_url || '',
                            };
                        }
                        return stage;
                    }));
                }
            } catch (error) {
                console.error("Erro ao buscar configurações de automação:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfigs();
    }, []);

    const updateStage = (key: string, field: keyof StageConfig, value: any) => {
        setStages((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const upserts = stages.map(stage => ({
                stage_key: stage.key,
                label: stage.label,
                enabled: stage.enabled,
                message: stage.message,
                file_url: stage.fileUrl,
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase.from('automation_configs').upsert(upserts, { onConflict: 'stage_key' });
            
            if (error) throw error;

            setSaved(true);
            toast.success("Automações salvas com sucesso!");
            setTimeout(() => setSaved(false), 2500);
        } catch (error: any) {
            console.error("Erro ao salvar automações:", error);
            toast.error("Erro ao salvar automações: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex items-center justify-between px-6 py-3 border-b border-border">
                <span className="text-base font-semibold text-foreground">Painel</span>
            </div>

            <div className="flex-1 p-6 space-y-6 pb-24">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        🤖 Automações do Funil
                    </h1>
                    <p className="text-[13px] text-muted-foreground mt-1">
                        Configure mensagens e <strong className="text-[hsl(220,10%,65%)]">arquivos para upload</strong> automáticos para serem enviados via WhatsApp sempre que um lead for movido para um novo estágio no funil Kanban.
                    </p>
                </div>

                {/* Stage Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {stages.map((stage) => (
                        <div
                            key={stage.key}
                            className="bg-card border border-border rounded-xl p-5 space-y-4"
                        >
                            {/* Card Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-[14px] font-bold text-foreground">{stage.label}</h3>
                                {/* Toggle */}
                                <button
                                    onClick={() => updateStage(stage.key, "enabled", !stage.enabled)}
                                    className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${stage.enabled ? "bg-[hsl(265,85%,60%)]" : "bg-[hsl(224,18%,25%)]"
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${stage.enabled ? "translate-x-5" : "translate-x-0"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Message */}
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-[hsl(220,10%,65%)]">
                                    Mensagem de Texto
                                </label>
                                <textarea
                                    value={stage.message}
                                    onChange={(e) => updateStage(stage.key, "message", e.target.value)}
                                    rows={4}
                                    disabled={!stage.enabled}
                                    className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-[12px] resize-none focus:outline-none focus:border-[hsl(265,85%,60%)] disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Use <span className="text-[hsl(265,85%,65%)]">{"{nome}"}</span> e{" "}
                                    <span className="text-[hsl(265,85%,65%)]">{"{telefone}"}</span> para personalizar.
                                </p>
                            </div>

                            {/* Attachment */}
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-[hsl(220,10%,65%)]">
                                    Anexar Arquivo (Opcional)
                                </label>
                                {stage.key === "novo" ? (
                                    <div className="bg-background border border-border rounded-md p-3">
                                        <p className="text-[11px] text-muted-foreground">
                                            No estágio "Novo Lead", use apenas URL externa para máxima estabilidade.
                                        </p>
                                        <input
                                            value={stage.fileUrl}
                                            onChange={(e) => updateStage(stage.key, "fileUrl", e.target.value)}
                                            placeholder="https://dominio.com/arquivo.pdf"
                                            className="mt-2 w-full px-2.5 py-1.5 rounded bg-muted border border-border text-foreground text-[12px] focus:outline-none focus:border-[hsl(265,85%,60%)]"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-[11px] text-muted-foreground">Fazer Upload</p>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <span className="px-3 py-1.5 rounded-md bg-muted border border-[hsl(224,18%,25%)] text-[12px] text-[hsl(220,15%,75%)] hover:bg-[hsl(224,18%,22%)]">
                                                Escolher arquivo
                                            </span>
                                            <span className="text-[12px] text-muted-foreground">Nenhum arquivo escolhido</span>
                                            <input type="file" className="hidden" accept=".pdf,.jpg,.png,.ogg,.mp3" />
                                        </label>
                                        <p className="text-[11px] text-[hsl(220,10%,35%)]">
                                            Formatos permitidos: PDF, JPG, PNG, OGG, MP3.
                                        </p>
                                        <p className="text-[11px] text-muted-foreground font-medium mt-1">Ou Cole a URL Externa</p>
                                        <input
                                            value={stage.fileUrl}
                                            onChange={(e) => updateStage(stage.key, "fileUrl", e.target.value)}
                                            placeholder="https://dominio.com/arquivo.pdf"
                                            className="w-full px-2.5 py-1.5 rounded bg-background border border-border text-foreground text-[12px] focus:outline-none focus:border-[hsl(265,85%,60%)]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fixed Save Button */}
            <div className="fixed bottom-0 right-0 left-[168px] p-4 bg-background border-t border-border flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-[13px] transition-all ${saved
                            ? "bg-[hsl(142,70%,45%)] text-foreground"
                            : "bg-[hsl(265,85%,60%)] hover:bg-[hsl(265,85%,52%)] text-white"
                        }`}
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Todas as Automações"}
                </button>
            </div>
        </div>
    );
}
