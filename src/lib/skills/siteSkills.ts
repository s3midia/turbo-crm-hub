import { executeSkill, type SkillConfig } from './skillEngine';
import type { ClientData } from '@/lib/templates/types';

// ── Skill 1: Hero Copywriter ───────────────────────────────────────
const heroSkill: SkillConfig = {
  id: 'hero_copy',
  systemPrompt: `Você é um copywriter de landing pages. Gere headline e subheadline para o nicho informado.
Regras: headline ≤ 8 palavras, promessa direta. Subheadline ≤ 20 palavras, benefício claro.
Use linguagem regional quando a região for informada.`,
  outputSchema: '{"headline":"string","subheadline":"string"}',
};

export interface HeroResult {
  headline: string;
  subheadline: string;
}

export async function generateHero(client: ClientData) {
  const input = `Empresa: ${client.company_name}. Nicho: ${client.niche}. Região: ${client.region || 'Brasil'}. ${client.description || ''}`;
  return executeSkill<HeroResult>(heroSkill, input);
}

// ── Skill 2: Serviços ──────────────────────────────────────────────
const servicesSkill: SkillConfig = {
  id: 'services_gen',
  systemPrompt: `Gere exatamente 3 serviços para a empresa do nicho informado.
Cada serviço: título curto (3-4 palavras), descrição (1 frase, máx 15 palavras), ícone (nome lucide-react).
Ícones válidos: building, hammer, clipboard, shield, scale, heart, wrench, calculator, hardhat, briefcase, home, truck.`,
  outputSchema: '[{"titulo":"string","descricao":"string","icone":"string"}]',
};

export interface ServiceCard {
  titulo: string;
  descricao: string;
  icone: string;
}

export async function generateServices(client: ClientData) {
  const input = `Empresa: ${client.company_name}. Nicho: ${client.niche}. ${client.description || ''}`;
  return executeSkill<ServiceCard[]>(servicesSkill, input);
}

// ── Skill 3: Sobre a Empresa ───────────────────────────────────────
const aboutSkill: SkillConfig = {
  id: 'about_gen',
  systemPrompt: `Escreva um texto "Sobre Nós" para a empresa. Máximo 3 frases (60 palavras).
Tom: profissional, confiável, regional. Também gere 3 estatísticas impressionantes.
Stats devem ser realistas para o nicho (ex: "+500 projetos", "15 anos", "100% satisfação").`,
  outputSchema: '{"texto":"string","stats":[{"numero":"string","label":"string"}]}',
};

export interface AboutResult {
  texto: string;
  stats: { numero: string; label: string }[];
}

export async function generateAbout(client: ClientData) {
  const input = `Empresa: ${client.company_name}. Nicho: ${client.niche}. Região: ${client.region || 'Brasil'}. ${client.description || ''}`;
  return executeSkill<AboutResult>(aboutSkill, input);
}

// ── Skill 4: Depoimentos ───────────────────────────────────────────
const testimonialsSkill: SkillConfig = {
  id: 'testimonials_gen',
  systemPrompt: `Gere 3 depoimentos realistas de clientes satisfeitos. Nomes brasileiros comuns.
Cada depoimento: máx 20 palavras, tom natural (não publicitário). Inclua cargo ou contexto.`,
  outputSchema: '[{"nome":"string","cargo":"string","texto":"string"}]',
};

export interface Testimonial {
  nome: string;
  cargo: string;
  texto: string;
}

export async function generateTestimonials(client: ClientData) {
  const input = `Empresa: ${client.company_name}. Nicho: ${client.niche}. Região: ${client.region || 'Brasil'}.`;
  return executeSkill<Testimonial[]>(testimonialsSkill, input);
}

// ── Skill 5: CTA ───────────────────────────────────────────────────
const ctaSkill: SkillConfig = {
  id: 'cta_gen',
  systemPrompt: `Gere título e subtítulo para seção CTA (call-to-action) final.
Título: máx 8 palavras, urgência leve. Subtítulo: máx 15 palavras, benefício.`,
  outputSchema: '{"titulo":"string","subtitulo":"string"}',
};

export interface CtaResult {
  titulo: string;
  subtitulo: string;
}

export async function generateCta(client: ClientData) {
  const input = `Empresa: ${client.company_name}. Nicho: ${client.niche}.`;
  return executeSkill<CtaResult>(ctaSkill, input);
}

// ── Skill 6: SEO Meta ──────────────────────────────────────────────
const seoSkill: SkillConfig = {
  id: 'seo_gen',
  systemPrompt: `Gere título SEO (máx 60 chars) e meta description (máx 160 chars) para a empresa.
Inclua o nome da empresa, nicho e região. Otimize para busca local no Google.`,
  outputSchema: '{"title":"string","description":"string","email":"string"}',
};

export interface SeoResult {
  title: string;
  description: string;
  email: string;
}

export async function generateSeo(client: ClientData) {
  const input = `Empresa: ${client.company_name}. Nicho: ${client.niche}. Região: ${client.region || 'Brasil'}.`;
  return executeSkill<SeoResult>(seoSkill, input);
}

// ── Skill 7: Edição inline (pós-geração) ──────────────────────────
const editSkill: SkillConfig = {
  id: 'inline_edit',
  systemPrompt: `Você é um editor de sites. Recebe um bloco JSON e uma instrução do usuário.
Retorne SOMENTE o bloco JSON modificado conforme a instrução. Não altere campos não mencionados.`,
  outputSchema: '(o mesmo formato do bloco recebido)',
};

export async function editSection(currentData: any, instruction: string) {
  const input = `BLOCO ATUAL:\n${JSON.stringify(currentData)}\n\nINSTRUÇÃO DO USUÁRIO:\n${instruction}`;
  return executeSkill<any>(editSkill, input);
}
