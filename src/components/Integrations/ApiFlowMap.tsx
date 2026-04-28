import React, { useEffect, useState } from 'react';
import { Zap, Shield, ArrowRight, AlertCircle, CheckCircle2, Loader2, Cpu } from 'lucide-react';
import { getApiRotationFlow, getKeyHealthMap, type GeminiKeyStatus } from '@/lib/gemini';

interface FlowNode {
  id: string;
  name: string;
  type: 'gemini' | 'fallback';
  status?: 'ok' | 'quota' | 'error' | 'untested';
}

export function ApiFlowMap() {
  const [flow, setFlow] = useState<{ gemini: any[], fallbacks: any[] } | null>(null);
  const [health, setHealth] = useState<Record<string, GeminiKeyStatus>>({});
  const [loading, setLoading] = useState(true);

  const refreshFlow = async () => {
    const data = await getApiRotationFlow();
    setFlow(data);
    setHealth(getKeyHealthMap());
    setLoading(false);
  };

  useEffect(() => {
    refreshFlow();
    const handler = () => {
      setHealth(getKeyHealthMap());
    };
    window.addEventListener('gemini-health-update', handler);
    window.addEventListener('gemini-error', refreshFlow);
    return () => {
      window.removeEventListener('gemini-health-update', handler);
      window.removeEventListener('gemini-error', refreshFlow);
    };
  }, []);

  if (loading || !flow) {
    return (
      <div className="flex items-center justify-center p-8 bg-card border border-border rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allNodes: FlowNode[] = [
    ...flow.gemini.map((k, i) => ({
      id: k.id,
      name: `Gemini ${i + 1}`,
      type: 'gemini' as const,
      status: (health[k.id]?.status || 'untested') as 'ok' | 'quota' | 'error' | 'untested'
    })),
    ...flow.fallbacks.map(f => ({
      id: f.id,
      name: f.name,
      type: 'fallback' as const,
      status: 'untested' as 'ok' | 'quota' | 'error' | 'untested'
    }))
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-foreground">Mapeamento de Redundância (Rotatividade)</h3>
        </div>
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Online</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Quota</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Erro</span>
        </div>
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-center gap-4">
          {allNodes.map((node, index) => (
            <React.Fragment key={node.id}>
              {/* Node Card */}
              <div className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-300 min-w-[120px] ${
                node.status === 'ok' ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
                node.status === 'quota' ? 'bg-amber-500/10 border-amber-500 grayscale-[0.5]' :
                node.status === 'error' ? 'bg-red-500/10 border-red-500' :
                'bg-muted/50 border-border opacity-60'
              }`}>
                {node.type === 'gemini' ? (
                  <Shield className={`w-5 h-5 mb-1 ${node.status === 'ok' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                ) : (
                  <Cpu className={`w-5 h-5 mb-1 ${node.status === 'ok' ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                )}
                <span className="text-xs font-bold text-foreground">{node.name}</span>
                <span className="text-[9px] uppercase font-mono opacity-50 mt-1">
                  {node.status === 'ok' ? 'Ativo' : node.status === 'quota' ? 'Esgotado' : node.status === 'error' ? 'Falha' : 'Standby'}
                </span>
                
                {/* Visual indicator for "Current Active Path" */}
                {node.status === 'ok' && (
                  <div className="absolute -top-1 -right-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 bg-background rounded-full" />
                  </div>
                )}
              </div>

              {/* Connector Arrow */}
              {index < allNodes.length - 1 && (
                <div className="flex items-center justify-center">
                  <ArrowRight className={`w-4 h-4 ${
                    node.status !== 'ok' && node.status !== 'untested' ? 'text-amber-500' : 'text-muted-foreground/30'
                  }`} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Info Box */}
        <div className="mt-8 p-4 bg-muted/30 border border-border rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-foreground">Como funciona a Inteligência S3 Mídia?</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
              O sistema busca sempre a primeira chave Gemini disponível. Se ela estiver sem cota (limite atingido), 
              o portal pula automaticamente para a próxima chave. Se todas as chaves Gemini falharem, 
              usamos o Hugging Face (Mistral) e depois o Groq (Llama 3) como redundância final. 
              Isso garante que a <strong>Rafa</strong> e a <strong>Dani</strong> nunca parem de trabalhar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
