import { supabase } from "@/integrations/supabase/client";

console.log("[GEMINI] === NOVA BASE CARREGADA (HUGGING FACE / GROQ FALLBACK) ===");

const V1_URL = "https://generativelanguage.googleapis.com/v1/models";
const VBETA_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/** 
 * Modelos disponíveis para generateContent.
 * gemini-flash-latest é o alias mais flexível para v1beta.
 */
const MODELS_CONFIG = [
  { id: "gemini-2.0-flash",      baseUrl: V1_URL },    // Rápido e estável em v1 (Primário)
  { id: "gemini-1.5-flash",      baseUrl: V1_URL },    // Estável clássico (Fallback 1)
  { id: "gemini-2.0-flash-lite", baseUrl: V1_URL },    // Excelente para economia de cota (Fallback 2)
  { id: "gemini-2.5-flash",      baseUrl: VBETA_URL }, // Experimental (Fallback 3)
];

const KEY_HEALTH_STORAGE = 'gemini_key_health';

export type GeminiKeyHealth = 'ok' | 'quota' | 'error' | 'untested';

export interface GeminiKeyStatus {
  keyFragment: string;
  status: GeminiKeyHealth;
  lastError?: string;
  lastModel?: string;
  lastChecked?: string;
}

export function getKeyHealthMap(): Record<string, GeminiKeyStatus> {
  try {
    const stored = localStorage.getItem(KEY_HEALTH_STORAGE);
    if (stored) return JSON.parse(stored);
  } catch { /* noop */ }
  return {};
}

function updateKeyHealth(key: string, update: Partial<GeminiKeyStatus>) {
  const map = getKeyHealthMap();
  const fragment = key.slice(0, 15); // Aumentado para identificar melhor gen-lang-client
  map[fragment] = {
    keyFragment: fragment,
    status: 'untested',
    ...map[fragment],
    ...update,
    lastChecked: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY_HEALTH_STORAGE, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('gemini-health-update', { detail: map }));
  } catch { /* noop */ }
}

/** 
 * Coleta todas as chaves configuradas. 
 * Prioridade: Supabase (api_manager category='ia') > .env
 */
async function getApiKeys(): Promise<string[]> {
  const keys: string[] = [];

  // 1. Tenta carregar do Gerenciador de APIs Global (Supabase)
  try {
    const { data: dbApis } = await (supabase as any)
      .from("api_manager")
      .select("api_key")
      .eq("category", "ia")
      .not("api_key", "is", null);

    if (dbApis) {
      dbApis.forEach((item: any) => {
        const k = item.api_key?.trim();
        if (k && !keys.includes(k)) keys.push(k);
      });
    }
  } catch (e) {
    console.error("[Gemini] Erro ao carregar chaves do Supabase:", e);
  }

  // 2. Chaves legadas do localStorage (Migração silenciosa)
  try {
    const stored = localStorage.getItem('bolten_api_integrations');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.gemini_keys && Array.isArray(parsed.gemini_keys)) {
        parsed.gemini_keys.forEach((k: any) => {
          const val = k.key?.trim();
          if (val && !keys.includes(val)) {
            keys.push(val);
          }
        });
      }
    }
  } catch (e) { /* noop */ }

  for (let i = 1; i <= 5; i++) {
    const k = (import.meta as any).env[`VITE_GEMINI_API_KEY_${i}`];
    if (k && k.trim() && !keys.includes(k.trim())) keys.push(k.trim());
  }

  const legacy = (import.meta as any).env.VITE_GEMINI_API_KEY as string | undefined;
  if (legacy && legacy.trim() && !keys.includes(legacy.trim())) keys.push(legacy.trim());

  return keys;
}

function isQuotaError(status: number, body: any): boolean {
  if (status === 429) return true;
  const msg = body?.error?.message ?? "";
  return msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate limit");
}

function isValidKeyFormat(key: string): boolean {
  const k = key.trim();
  // gen-lang-client- são IDs OAuth de projeto, NÃO funcionam como chave de API REST.
  // Apenas chaves que iniciam com "AIza" são válidas para a API REST do Gemini.
  return k.startsWith("AIza");
}

/**
 * Trata as respostas num formato compativel com OpenAI (HuggingFace / Groq)
 */
async function generateOpenAICompatibleResponse(url: string, apiKey: string, model: string, prompt: string): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.7
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data?.error?.message || `HTTP ${response.status}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Resposta vazia da API alternativa");
  return text;
}

/**
 * Gera resposta com fallback automático.
 */
export async function generateAgentResponse(prompt: string): Promise<string> {
  console.log("[GEMINI] Iniciando generateAgentResponse com prompt:", prompt.slice(0, 50) + "...");
  const attempts: string[] = [];

  // Busca configurações de roteamento
  let hfKey = "";
  let groqKey = "";
  let llmPriority = "gemini";
  let llmPaused: Record<string, boolean> = {};

  try {
    const stored = localStorage.getItem('bolten_api_integrations');
    if (stored) {
      const parsed = JSON.parse(stored);
      hfKey = parsed.huggingface_key?.trim() || (import.meta as any).env.VITE_HUGGINGFACE_KEY || "";
      groqKey = parsed.groq_key?.trim() || (import.meta as any).env.VITE_GROQ_KEY || "";
      llmPriority = parsed.llm_priority || "gemini";
      llmPaused = parsed.llm_paused || {};
    }
  } catch (e) { /* noop */ }

  if (!hfKey) hfKey = (import.meta as any).env.VITE_HUGGINGFACE_KEY || "";
  if (!groqKey) groqKey = (import.meta as any).env.VITE_GROQ_KEY || "";

  // Fallback: Busca chaves no banco de dados (api_manager) se não estiverem no localStorage
  if (!hfKey || !groqKey) {
    try {
      const { data: dbApis } = await (supabase as any)
        .from("api_manager")
        .select("name, api_key")
        .or("name.ilike.%groq%,name.ilike.%huggingface%");
      
      if (dbApis) {
        dbApis.forEach((api: any) => {
          const name = api.name.toLowerCase();
          if (name.includes("huggingface") && !hfKey) hfKey = api.api_key || "";
          if (name.includes("groq") && !groqKey) groqKey = api.api_key || "";
        });
      }
    } catch (dbErr) {
      console.error("[GEMINI] Erro ao buscar chaves no banco:", dbErr);
    }
  }

  const keys = await getApiKeys();

  // Constroi a lista de provedores ativos e com as devidas chaves
  const availableProviders: string[] = [];
  if (hfKey && !llmPaused['huggingface']) availableProviders.push('huggingface');
  if (groqKey && !llmPaused['groq']) availableProviders.push('groq');
  if (keys.length > 0 && !llmPaused['gemini']) availableProviders.push('gemini');

  // Ordena garantindo que a prioridade fique em primeiro
  const sortedProviders = availableProviders.sort((a, b) => {
    if (a === llmPriority) return -1;
    if (b === llmPriority) return 1;
    return 0;
  });

  console.log(`[GEMINI] Roteamento estruturado. Prioridade: ${llmPriority}. Ordem final de tentativa: ${sortedProviders.join(' > ') || 'NENHUMA'}`);

  if (sortedProviders.length === 0) {
    if (keys.length === 0 && !hfKey && !groqKey) {
        throw new Error("Nenhuma chave de IA configurada no sistema (Gemini, Groq ou HuggingFace).");
    }
    throw new Error("Todas as IAs configuradas estão pausadas no painel de Integrações.");
  }

  // Tenta processar em ordem dinâmica
  for (const provider of sortedProviders) {
    if (provider === 'huggingface') {
      console.log("[GEMINI] Tentando gerador ativo: Hugging Face");
      try {
        return await generateOpenAICompatibleResponse(
          "https://router.huggingface.co/v1/chat/completions",
          hfKey,
          "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
          prompt
        );
      } catch (e) {
        attempts.push(`Hugging Face erro: ${(e as Error).message}`);
      }
    } 
    
    else if (provider === 'groq') {
      console.log("[GEMINI] Tentando gerador ativo: Groq");
      try {
        return await generateOpenAICompatibleResponse(
          "https://api.groq.com/openai/v1/chat/completions",
          groqKey,
          "llama3-70b-8192",
          prompt
        );
      } catch (e) {
        attempts.push(`Groq erro: ${(e as Error).message}`);
      }
    } 
    
    else if (provider === 'gemini') {
      console.log(`[GEMINI] Tentando gerador ativo: Gemini (${keys.length} chaves, ${MODELS_CONFIG.map(m => m.id).join(', ')} modelos)`);
      for (const key of keys) {
        const keyFrag = key.slice(0, 15);
        if (!isValidKeyFormat(key)) {
            const msg = `Formato inválido (${keyFrag})`;
            updateKeyHealth(key, { status: 'error', lastError: msg });
            attempts.push(msg);
            continue;
        }

        let geminiSuccessText: string | null = null;

        for (const config of MODELS_CONFIG) {
          const url = `${config.baseUrl}/${config.id}:generateContent?key=${key}`;
          try {
            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });

            const data = await response.json();

            if (isQuotaError(response.status, data)) {
              const quotaMsg = `Quota excedida (${config.id}) em ${keyFrag}`;
              updateKeyHealth(key, { status: 'quota', lastError: quotaMsg, lastModel: config.id });
              window.dispatchEvent(new CustomEvent('gemini-error', { detail: { type: 'quota', key: keyFrag, model: config.id } }));
              attempts.push(quotaMsg);
              break; // Pula para a próxima chave
            }

            if (!response.ok || data.error) {
              const errMsg = data?.error?.message ?? `HTTP ${response.status}`;
              const fullErr = `Erro ${config.id} [${keyFrag}]: ${errMsg}`;
              updateKeyHealth(key, { status: 'error', lastError: errMsg, lastModel: config.id });
              window.dispatchEvent(new CustomEvent('gemini-error', { detail: { type: 'error', message: errMsg, key: keyFrag } }));
              attempts.push(fullErr);
              
              if (errMsg.toLowerCase().includes("api key not valid") || response.status === 400 || response.status === 403) {
                break; // Pula para a próxima chave
              }
              continue; // Tenta o próximo modelo
            }

            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("Resposta vazia do Gemini");

            updateKeyHealth(key, { status: 'ok', lastModel: config.id, lastError: undefined });
            geminiSuccessText = text;
            break; // Já conseguiu a resposta, quebra o loop dos modelos
          } catch (err) {
            const netErr = `${config.id} [${keyFrag}]: ${(err as Error).message}`;
            updateKeyHealth(key, { status: 'error', lastError: (err as Error).message, lastModel: config.id });
            window.dispatchEvent(new CustomEvent('gemini-error', { detail: { type: 'network', message: (err as Error).message } }));
            attempts.push(`Rede ${netErr}`);
            continue; // Tenta o próximo modelo
          }
        } // fim modelos gemini

        if (geminiSuccessText) return geminiSuccessText;
      } // fim chaves gemini
    }
  }

  throw new Error(`Todas as tentativas de I.A falharam:\n${attempts.join("\n")}`);
}

export async function testGeminiKey(key: string): Promise<GeminiKeyHealth> {
  if (!isValidKeyFormat(key)) {
      updateKeyHealth(key, { status: 'error', lastError: "Formato de chave inválido (deve ser AIza... ou gen-lang-client-...)" });
      return 'error';
  }

  // Testa com o modelo mais leve disponível em v1
  const url = `${V1_URL}/gemini-2.0-flash-lite:generateContent?key=${key}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] }),
    });
    const data = await res.json();
    
    if (isQuotaError(res.status, data)) {
      updateKeyHealth(key, { status: 'quota', lastError: 'Quota excedida no teste', lastModel: 'gemini-2.0-flash-lite' });
      return 'quota';
    }
    
    if (!res.ok || data.error) {
      const errMsg = data?.error?.message ?? `HTTP ${res.status}`;
      updateKeyHealth(key, { status: 'error', lastError: errMsg, lastModel: 'gemini-2.0-flash-lite' });
      return 'error';
    }
    
    updateKeyHealth(key, { status: 'ok', lastError: undefined, lastModel: 'gemini-2.0-flash-lite' });
    return 'ok';
  } catch (err) {
    updateKeyHealth(key, { status: 'error', lastError: (err as Error).message });
    return 'error';
  }
}

/**
 * Retorna o fluxo de rotação atual simplificado para UI
 */
export async function getApiRotationFlow() {
  const keys = await getApiKeys();
  let hf = false;
  let groq = false;
  
  try {
    const stored = localStorage.getItem('bolten_api_integrations');
    if (stored) {
      const parsed = JSON.parse(stored);
      hf = !!parsed.huggingface_key;
      groq = !!parsed.groq_key;
    }
  } catch (e) { /* noop */ }

  return {
    gemini: keys.map(k => ({ id: k.slice(0, 15), key: k })),
    fallbacks: [
      ...(hf ? [{ id: 'hf', name: 'Hugging Face (Mistral)' }] : []),
      ...(groq ? [{ id: 'groq', name: 'Groq (Llama 3)' }] : [])
    ]
  };
}
