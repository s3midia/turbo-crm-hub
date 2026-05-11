import { generateAgentResponse } from '@/lib/gemini';

const systemPromptCache = new Map<string, string>();
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export interface SkillConfig {
  id: string;
  systemPrompt: string;
  outputSchema: string;
  maxTokens?: number;
}

function getCacheKey(skillId: string, input: string): string {
  let hash = 0;
  const str = skillId + input;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return `${skillId}_${hash}`;
}

export async function executeSkill<T>(
  skill: SkillConfig,
  input: string
): Promise<{ data: T; cached: boolean; tokensEstimated: number }> {
  const cacheKey = getCacheKey(skill.id, input);
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { data: cached.data as T, cached: true, tokensEstimated: 0 };
  }

  if (!systemPromptCache.has(skill.id)) {
    systemPromptCache.set(skill.id, skill.systemPrompt);
  }

  const fullPrompt = `${skill.systemPrompt}\n\nRESPONDA SOMENTE JSON VÁLIDO, SEM MARKDOWN:\n${skill.outputSchema}\n\nINPUT:\n${input}`;

  const raw = await generateAgentResponse(fullPrompt);

  const jsonMatch = raw.match(/\{[\s\S]*\}/) || raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`Skill ${skill.id}: resposta não contém JSON válido`);
  }

  const data = JSON.parse(jsonMatch[0]) as T;

  responseCache.set(cacheKey, { data, timestamp: Date.now() });

  const tokensEstimated = Math.ceil((fullPrompt.length + raw.length) / 4);

  return { data, cached: false, tokensEstimated };
}

export function clearSkillCache(skillId?: string) {
  if (skillId) {
    for (const key of responseCache.keys()) {
      if (key.startsWith(skillId)) responseCache.delete(key);
    }
  } else {
    responseCache.clear();
  }
}

export function getSkillCacheStats() {
  return {
    entries: responseCache.size,
    systemPromptsCached: systemPromptCache.size,
  };
}
