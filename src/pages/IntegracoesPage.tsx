import React, { useState, useEffect, useCallback } from "react";
import { Plug, CheckCircle2, XCircle, Plus, Trash2, Key, Globe, ExternalLink, Shield, Zap, AlertTriangle, Loader2, RefreshCw, Play, Pause } from "lucide-react";
import { useApiIntegrations, useUpdateApiIntegrations } from "@/hooks/useApiIntegrations";
import { useApiManager, useApiUsageStats } from "@/hooks/useApiManager";
import { getKeyHealthMap, testGeminiKey, type GeminiKeyStatus } from "@/lib/gemini";
import { ApiFlowMap } from "@/components/Integrations/ApiFlowMap";
import { ApiConsumptionDashboard } from "@/components/Integrations/ApiConsumptionDashboard";
import { toast } from "sonner";

const CATEGORY_STYLES: Record<string, string> = {
    ia: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    comunicacao: 'bg-green-500/10 text-green-400 border-green-500/30',
    infra: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    prospeccao: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    cnpj: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    localizacao: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    design: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    local: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    externa: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const CATEGORY_LABELS: Record<string, string> = {
    ia: '🤖 IA',
    comunicacao: '💬 Comunicação',
    infra: '⚙️ Infraestrutura',
    prospeccao: '🔍 Prospecção',
    cnpj: '🏢 CNPJ/Receita',
    localizacao: '📍 Localização',
    design: '🎨 Design',
    local: '🖥️ Servidor Local',
    externa: '🌐 Externa',
};

function CategoryBadge({ category }: { category: string }) {
    const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.externa;
    const label = CATEGORY_LABELS[category] || category;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style} whitespace-nowrap`}>
            {label}
        </span>
    );
}

export default function IntegracoesPage() {
    const { data, isLoading: isLoadingIntegrations } = useApiIntegrations();
    const { mutate } = useUpdateApiIntegrations();
    const { apis, isLoading: isLoadingManager, addApi, deleteApi } = useApiManager();

    const [newGeminiKey, setNewGeminiKey] = useState("");
    const [values, setValues] = useState<Record<string, string>>({});
    const [testingKey, setTestingKey] = useState<string | null>(null);
    const [keyHealth, setKeyHealth] = useState<Record<string, GeminiKeyStatus>>({});
    
    // API Manager States
    const [newApi, setNewApi] = useState({ name: "", url: "", api_key: "" });
    const [showAddApi, setShowAddApi] = useState(false);

    // Load key health from localStorage and listen for real-time updates
    useEffect(() => {
        setKeyHealth(getKeyHealthMap());
        const handler = (e: Event) => setKeyHealth((e as CustomEvent).detail);
        window.addEventListener('gemini-health-update', handler);
        return () => window.removeEventListener('gemini-health-update', handler);
    }, []);

    if (isLoadingIntegrations || isLoadingManager) return <div className="p-6 text-foreground">Carregando integrações...</div>;

    const integrations = data || { gemini_keys: [] };
    // Gemini keys now come from the global API manager table
    const geminiKeys = [
        ...(apis?.filter(a => a.category === 'ia') || []),
        ...((import.meta as any).env.VITE_GEMINI_API_KEY ? [{ id: 'env-primary', name: 'Gemini (Local .env)', category: 'ia', api_key: (import.meta as any).env.VITE_GEMINI_API_KEY }] : [])
    ];

    const handleAddGeminiKey = () => {
        if (!newGeminiKey.trim()) return;
        
        addApi.mutate({
            name: `Gemini Key ${geminiKeys.length + 1}`,
            api_key: newGeminiKey.trim(),
            category: 'ia',
            status: 'stable',
            description: 'Chave do Google AI Studio para os agentes.'
        });
        
        setNewGeminiKey("");
    };

    const handleRemoveGeminiKey = (id: string) => {
        deleteApi.mutate(id);
    };

    const handleTestKey = async (keyStr: string) => {
        if (!keyStr) return;
        setTestingKey(keyStr.slice(0, 10));
        await testGeminiKey(keyStr);
        setKeyHealth(getKeyHealthMap());
        setTestingKey(null);
    };

    const handleTestAllKeys = async () => {
        for (const item of geminiKeys) {
            if (item.api_key) {
                setTestingKey(item.api_key.slice(0, 10));
                await testGeminiKey(item.api_key);
            }
        }
        setKeyHealth(getKeyHealthMap());
        setTestingKey(null);
    };

    const getKeyHealthStatus = (keyStr: string): GeminiKeyStatus | undefined => {
        return keyHealth[keyStr.slice(0, 10)];
    };

    const handleAddManagedApi = () => {
        if (!newApi.name.trim()) return;
        addApi.mutate({
            name: newApi.name,
            url: newApi.url,
            api_key: newApi.api_key,
            status: 'stable'
        });
        setNewApi({ name: "", url: "", api_key: "" });
        setShowAddApi(false);
    };

    const INTEGRATIONS = [
        { 
            name: "Evolution API", 
            desc: "WhatsApp Business API para envio de mensagens", 
            icon: "📱", 
            connected: !!integrations?.evolution_api_url, 
            key: "evolution_api_url" 
        },
        { 
            name: "Supabase", 
            desc: "Banco de dados e autenticação", 
            icon: "🔐", 
            connected: !!integrations?.supabase_url, 
            key: "supabase_url" 
        },
        { 
            name: "Apify", 
            desc: "Automação e extração de dados web", 
            icon: "🕸️", 
            connected: !!integrations?.apify_key, 
            key: "apify_key" 
        },
        { 
            name: "Hugging Face", 
            desc: "IA Auxiliar. Usa modelo mistralai (Fallback Automático)", 
            icon: "🤗", 
            connected: !!integrations?.huggingface_key, 
            key: "huggingface_key" 
        },
        { 
            name: "Groq", 
            desc: "IA Ultra-rápida. Usa modelo llama3 (Fallback Automático 2)", 
            icon: "⚡", 
            connected: !!integrations?.groq_key, 
            key: "groq_key" 
        },
    ];

    const handleSaveSimpleIntegration = (key: string) => {
        if (!values[key]) return;
        
        mutate({
            [key]: values[key]
        });
        setValues(v => ({...v, [key]: ""}));
    };

    const handleRemoveSimpleIntegration = (key: string) => {
        mutate({ [key]: "" });
    };

    const handleTogglePause = (provider: string) => {
        const currentPaused = integrations?.llm_paused || {};
        mutate({ llm_paused: { ...currentPaused, [provider]: !currentPaused[provider] } });
    };

    const handleSetPriority = (provider: 'gemini' | 'groq' | 'huggingface') => {
        mutate({ llm_priority: provider });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'stable': return 'bg-emerald-500';
            case 'unstable': return 'bg-amber-500';
            case 'offline': return 'bg-destructive';
            default: return 'bg-slate-300';
        }
    };

    return (

        <div className="flex flex-col h-full bg-background overflow-y-auto">
            <div className="px-6 py-3 border-b border-border">
                <span className="text-base font-semibold text-foreground">Painel</span>
            </div>
            <div className="flex-1 p-6 space-y-10">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Plug className="w-7 h-7 text-[hsl(265,85%,65%)]" /> Integrações e APIs
                </h1>
                
                {/* Consumption Dashboard */}
                <ApiConsumptionDashboard />

                {/* Redundancy Map */}
                <ApiFlowMap />

                {/* Agent Diagnostic Panel */}
                <div className="bg-[hsl(265,85%,15%,0.3)] border border-[hsl(265,85%,60%,0.3)] rounded-xl p-5 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-[hsl(30,100%,50%,0.1)] rounded-full text-orange-500">
                            <Zap className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Auto-Diagnóstico de Agentes</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Verifica se a Rafa e a Dani possuem chaves ativas para processar leads e gerar sites. 
                                O teste percorre toda a corrente de redundância.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleTestAllKeys}
                        disabled={!!testingKey}
                        className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                    >
                        {testingKey ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        Executar Check-up Completo
                    </button>
                </div>
                
                {/* Global API Manager Section */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[hsl(215,85%,60%,0.1)] rounded-lg text-[hsl(215,85%,60%)]">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Gerenciador de APIs Global</h2>
                                <p className="text-sm text-muted-foreground">
                                    Controle centralizado de todas as APIs conectadas ao portal S3 Mídia.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowAddApi(!showAddApi)}
                            className="px-4 py-2 rounded-md bg-[hsl(265,85%,60%)] hover:bg-[hsl(265,85%,52%)] text-white text-sm font-semibold flex items-center gap-2 transition-colors ml-auto"
                        >
                            <Plus className="w-4 h-4" /> {showAddApi ? "Cancelar" : "Nova API"}
                        </button>
                    </div>

                    {showAddApi && (
                        <div className="bg-background/50 border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground ml-1">Nome da API</label>
                                <input
                                    placeholder="Ex: Receita Federal"
                                    value={newApi.name}
                                    onChange={e => setNewApi({...newApi, name: e.target.value})}
                                    className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:border-[hsl(265,85%,60%)]"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground ml-1">URL (Opcional)</label>
                                <input
                                    placeholder="https://api.exemplo.com"
                                    value={newApi.url}
                                    onChange={e => setNewApi({...newApi, url: e.target.value})}
                                    className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:border-[hsl(265,85%,60%)]"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground ml-1">Chave/Token (Opcional)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        placeholder="Chave secreta"
                                        type="password"
                                        value={newApi.api_key}
                                        onChange={e => setNewApi({...newApi, api_key: e.target.value})}
                                        className="flex-1 px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:border-[hsl(265,85%,60%)]"
                                    />
                                    <button 
                                        onClick={handleAddManagedApi}
                                        className="p-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground w-24">Status</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground">API / Serviço</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Categoria</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Descrição</th>
                                    <th className="px-4 py-3 font-semibold text-muted-foreground text-right w-24">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {apis && apis.length > 0 ? (
                                    apis.map((api) => {
                                        const apiHealth = api.category === 'ia' && api.api_key ? getKeyHealthStatus(api.api_key) : null;
                                        const isTestingThis = api.api_key && testingKey === api.api_key.slice(0, 10);

                                        return (
                                            <tr key={api.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        {api.category === 'ia' ? (
                                                            isTestingThis ? (
                                                                <Loader2 className="w-2.5 h-2.5 text-blue-400 animate-spin" />
                                                            ) : (
                                                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                                                    apiHealth?.status === 'ok' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                                    apiHealth?.status === 'quota' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                                                    apiHealth?.status === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                                    'bg-slate-300'
                                                                }`} />
                                                            )
                                                        ) : (
                                                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusColor(api.status)}`} />
                                                        )}
                                                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 hidden sm:inline">
                                                            {api.category === 'ia' && apiHealth ? (
                                                                isTestingThis ? 'Testando' :
                                                                apiHealth.status === 'ok' ? 'Online' :
                                                                apiHealth.status === 'quota' ? 'Quota' :
                                                                apiHealth.status === 'error' ? 'Erro' : 'Estável'
                                                            ) : (
                                                                api.status === 'stable' ? 'Estável' : 
                                                                api.status === 'unstable' ? 'Instável' : 'Offline'
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="font-semibold text-foreground">{api.name}</div>
                                                    <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
                                                        {api.url || "Gerenciada via Edge Function"}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 hidden md:table-cell">
                                                    <CategoryBadge category={api.category || 'externa'} />
                                                </td>
                                                <td className="px-4 py-3.5 hidden lg:table-cell">
                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                        {apiHealth?.lastError ? (
                                                            <span className="text-red-400/80">{apiHealth.lastError}</span>
                                                        ) : (
                                                            api.description || "Nenhuma descrição."
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {api.category === 'ia' && api.api_key && (
                                                            <button 
                                                                onClick={() => handleTestKey(api.api_key || "")}
                                                                disabled={!!testingKey}
                                                                className="p-1.5 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-400 rounded-md transition-colors disabled:opacity-40"
                                                                title="Testar API"
                                                            >
                                                                {isTestingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => deleteApi.mutate(api.id)}
                                                            className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
                                                            title="Remover API"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground space-y-2">
                                            <div className="mx-auto w-10 h-10 bg-muted flex items-center justify-center rounded-full mb-2">
                                                <Globe className="w-5 h-5 opacity-20" />
                                            </div>
                                            <p>Nenhuma API cadastrada. Execute o script SQL e depois recarregue a página.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

                <hr className="border-border opacity-50" />

                {/* LLM Routing Preferences Section */}
                <div className="bg-card border border-[hsl(265,85%,60%)] rounded-xl p-6 space-y-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[hsl(265,85%,60%,0.1)] rounded-lg text-[hsl(265,85%,60%)]">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Orquestrador de IA & Prioridade</h2>
                            <p className="text-sm text-muted-foreground">
                                Escolha qual Inteligência Artificial o batalhão deve usar como principal. Se a principal falhar, o sistema assume as ativas como fallback.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { id: 'gemini', name: 'Google Gemini', desc: 'Rápido, estável e multimodal.', icon: '🧠', hasKey: geminiKeys.length > 0 },
                            { 
                                id: 'groq', 
                                name: 'Llama 3 (Groq)', 
                                desc: 'Ultra-rápido, ideal para fallback.', 
                                icon: '⚡', 
                                hasKey: !!integrations?.groq_key || apis?.some(a => a.name.toLowerCase().includes('groq')) || !!(import.meta as any).env.VITE_GROQ_KEY
                            },
                            { 
                                id: 'huggingface', 
                                name: 'Mistral (HuggingFace)', 
                                desc: 'Modelo aberto e leve.', 
                                icon: '🤗', 
                                hasKey: !!integrations?.huggingface_key || apis?.some(a => a.name.toLowerCase().includes('huggingface')) || !!(import.meta as any).env.VITE_HUGGINGFACE_KEY
                            }
                        ].map(llm => {
                            const isPriority = integrations?.llm_priority === llm.id || (!integrations?.llm_priority && llm.id === 'gemini');
                            const isPaused = (integrations?.llm_paused || {})[llm.id];
                            
                            return (
                                <div key={llm.id} className={`relative p-4 rounded-xl border transition-all ${isPriority ? 'border-[hsl(265,85%,60%)] bg-[hsl(265,85%,60%,0.05)] shadow-md' : 'border-border bg-card'}`}>
                                    {isPriority && (
                                        <div className="absolute -top-3 left-4 bg-[hsl(265,85%,60%)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Prioridade
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-3 mt-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{llm.icon}</span>
                                            <div>
                                                <h4 className="font-bold text-foreground text-sm">{llm.name}</h4>
                                                {!llm.hasKey ? (
                                                    <span className="text-[10px] text-red-500 font-semibold border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 rounded">Requer Chave</span>
                                                ) : isPaused ? (
                                                    <span className="text-[10px] text-amber-500 font-semibold border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 rounded">Pausado</span>
                                                ) : (
                                                    <span className="text-[10px] text-emerald-500 font-semibold border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 rounded">Ativo</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mb-4 min-h-[32px]">{llm.desc}</p>
                                    
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleTogglePause(llm.id)}
                                            className={`flex-1 flex justify-center items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${isPaused ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'}`}
                                        >
                                            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                                            {isPaused ? 'Retomar' : 'Pausar'}
                                        </button>
                                        <button 
                                            onClick={() => handleSetPriority(llm.id as any)}
                                            disabled={isPriority || isPaused || !llm.hasKey}
                                            className="flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-secondary hover:bg-secondary/80 text-foreground disabled:opacity-40 disabled:cursor-not-allowed border border-border"
                                            title={!llm.hasKey ? 'Configure a chave primeiro' : isPaused ? 'Retome o uso primeiro' : 'Definir como preferencial'}
                                        >
                                            Eleger
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <hr className="border-border opacity-50" />

                {/* Gemini Key Rotation Section */}
                <div className="bg-card border border-[hsl(265,85%,60%)] rounded-xl p-6 space-y-5 shadow-sm">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[hsl(265,85%,60%,0.1)] rounded-lg text-[hsl(265,85%,60%)]">
                                <Key className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Google Gemini API — Rodízio de Chaves</h2>
                                <p className="text-sm text-muted-foreground">
                                    Cadastre múltiplas chaves de contas Google diferentes. Quando uma falhar ou atingir o limite de requisições, o sistema tenta automaticamente a próxima.
                                </p>
                            </div>
                        </div>
                        {geminiKeys.length > 0 && (
                            <button
                                onClick={handleTestAllKeys}
                                disabled={!!testingKey}
                                className="px-3 py-1.5 rounded-md bg-muted hover:bg-muted/70 text-muted-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
                            >
                                {testingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                Testar Todas
                            </button>
                        )}
                    </div>

                    {/* How it works legend */}
                    <div className="flex flex-wrap gap-4 p-3 rounded-lg bg-background/50 border border-border text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"/><strong className="text-foreground">Online:</strong> Funcionando. Será usada prioritariamente.</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"/><strong className="text-foreground">Quota:</strong> Limite atingido. Sistema pula para a próxima.</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"/><strong className="text-foreground">Erro:</strong> Chave inválida ou rede falhou.</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"/><strong className="text-foreground">Não testada:</strong> Aguardando uso ou verificação.</span>
                    </div>

                    {/* Add Key Row */}
                    <div className="flex items-center gap-2">
                        <input
                            placeholder="Insira uma chave do Google AI Studio (AIza...)"
                            value={newGeminiKey}
                            onChange={e => setNewGeminiKey(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddGeminiKey()}
                            className="flex-1 px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:border-[hsl(265,85%,60%)]"
                        />
                        <button 
                            onClick={handleAddGeminiKey}
                            className="px-4 py-2 rounded-md bg-[hsl(265,85%,60%)] hover:bg-[hsl(265,85%,52%)] text-white text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Adicionar Chave
                        </button>
                    </div>

                    {/* Key List */}
                    {geminiKeys.length > 0 ? (
                        <div className="space-y-2">
                            {geminiKeys.map((item, index) => {
                                const keyStr = item.api_key || "";
                                const health = getKeyHealthStatus(keyStr);
                                const isBeingTested = testingKey === keyStr.slice(0, 10);

                                const statusDot = isBeingTested
                                    ? <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                                    : health?.status === 'ok'
                                        ? <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                        : health?.status === 'quota'
                                            ? <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                                            : health?.status === 'error'
                                                ? <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                                : <span className="w-3 h-3 rounded-full bg-slate-400" />;

                                const statusLabel = isBeingTested ? 'Testando...' : 
                                    health?.status === 'ok' ? `Online (${health.lastModel || 'gemini'})` :
                                    health?.status === 'quota' ? 'Quota esgotada' :
                                    health?.status === 'error' ? 'Erro' : 'Não testada';

                                return (
                                    <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                        health?.status === 'ok' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                        health?.status === 'quota' ? 'bg-amber-500/5 border-amber-500/20' :
                                        health?.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                                        'bg-card border-border'
                                    }`}>
                                        {/* Position */}
                                        <span className="w-6 h-6 rounded-full bg-[hsl(265,10%,15%)] text-[hsl(265,85%,70%)] flex items-center justify-center text-[11px] font-bold shrink-0">
                                            {index + 1}
                                        </span>

                                        {/* Status Dot */}
                                        <div className="flex items-center shrink-0">{statusDot}</div>

                                        {/* Key Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <code className="text-sm text-muted-foreground font-mono">
                                                    {keyStr.slice(0, 8)}•••••••••••••{keyStr.slice(-4)}
                                                </code>
                                                {index === 0 && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Primária</span>}
                                                {index > 0 && <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Fallback {index}</span>}
                                                <span className={`text-[10px] font-medium ${
                                                    health?.status === 'ok' ? 'text-emerald-400' :
                                                    health?.status === 'quota' ? 'text-amber-400' :
                                                    health?.status === 'error' ? 'text-red-400' : 'text-muted-foreground'
                                                }`}>{statusLabel}</span>
                                            </div>
                                            {health?.lastError && (
                                                <p className="text-[10px] text-red-400/80 mt-0.5 truncate">{health.lastError}</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handleTestKey(keyStr)}
                                                disabled={!!testingKey}
                                                className="p-1.5 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-400 rounded-md transition-colors disabled:opacity-40"
                                                title="Testar esta chave"
                                            >
                                                {isBeingTested ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                            </button>
                                            <button 
                                                onClick={() => handleRemoveGeminiKey(item.id)}
                                                className="p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive rounded-md transition-colors"
                                                title="Remover Chave"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-6 text-center border border-dashed border-border rounded-lg bg-card/50">
                            <Key className="w-8 h-8 mx-auto text-muted-foreground opacity-30 mb-3" />
                            <p className="text-sm text-muted-foreground">Nenhuma chave cadastrada via UI.</p>
                            <p className="text-[11px] text-muted-foreground mt-1">O sistema usará as chaves do arquivo <code className="bg-background px-1 rounded">.env</code> como fallback.</p>
                        </div>
                    )}
                </div>

                <hr className="border-border opacity-50" />

                {/* Other Integrations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {INTEGRATIONS.map(int => (
                        <div key={int.key} className="bg-card border border-border rounded-xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{int.icon}</span>
                                    <div>
                                        <h3 className="text-[14px] font-bold text-foreground">{int.name}</h3>
                                        <p className="text-[11px] text-muted-foreground">{int.desc}</p>
                                    </div>
                                </div>
                                {int.connected
                                    ? <CheckCircle2 className="w-5 h-5 text-[hsl(142,70%,55%)] shrink-0" />
                                    : <XCircle className="w-5 h-5 text-[hsl(220,10%,35%)] shrink-0" />}
                            </div>
                            
                            {!int.connected && (
                                <div className="space-y-2">
                                    <input
                                        placeholder={`Chave de API / URL`}
                                        value={values[int.key] || ""}
                                        onChange={e => setValues(v => ({ ...v, [int.key]: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-[12px] focus:outline-none focus:border-[hsl(265,85%,60%)]"
                                    />
                                    <button 
                                        onClick={() => handleSaveSimpleIntegration(int.key)}
                                        className="px-3 py-1.5 rounded-md bg-[hsl(265,85%,60%)] hover:bg-[hsl(265,85%,52%)] text-white text-[12px] font-semibold"
                                    >
                                        Conectar
                                    </button>
                                </div>
                            )}

                            {int.connected && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] text-[hsl(142,70%,55%)] font-medium">✓ Conectado</span>
                                    <button 
                                        onClick={() => handleRemoveSimpleIntegration(int.key)}
                                        className="text-[11px] text-muted-foreground hover:text-[hsl(0,70%,60%)] ml-auto"
                                    >
                                        Desconectar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

