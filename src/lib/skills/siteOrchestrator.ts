import type { ClientData, FilledSlots, SiteTemplate } from '@/lib/templates/types';
import { getTemplate } from '@/lib/templates';
import {
  generateHero,
  generateServices,
  generateAbout,
  generateTestimonials,
  generateCta,
  generateSeo,
} from './siteSkills';

export interface OrchestrationResult {
  filledSlots: FilledSlots;
  meta: { title: string; description: string };
  colors: { primary: string; secondary: string };
  stats: {
    totalTokens: number;
    cachedCalls: number;
    totalCalls: number;
    timeMs: number;
  };
}

export type ProgressCallback = (step: string, progress: number) => void;

export interface OrchestrationExtras {
  logoColors?: { primary: string; secondary: string };
  instagramPosts?: Array<{ url: string; thumbnail: string; caption: string; selected: boolean; postUrl?: string }>;
  instagramHandle?: string;
}

export async function orchestrateSiteGeneration(
  templateId: string,
  clientData: ClientData,
  onProgress?: ProgressCallback,
  extras?: OrchestrationExtras
): Promise<OrchestrationResult> {
  const template = getTemplate(templateId);
  if (!template) throw new Error(`Template ${templateId} não encontrado`);

  const startTime = Date.now();
  let totalTokens = 0;
  let cachedCalls = 0;
  const totalCalls = 6;

  onProgress?.('Gerando textos com IA...', 10);

  // Executa TODAS as skills em paralelo — economia de tempo
  const [heroRes, servicesRes, aboutRes, testimonialsRes, ctaRes, seoRes] = await Promise.all([
    generateHero(clientData).catch(e => ({ data: { headline: clientData.company_name, subheadline: `Soluções em ${clientData.niche}` }, cached: false, tokensEstimated: 0 })),
    generateServices(clientData).catch(e => ({ data: [{ titulo: clientData.niche, descricao: 'Serviço especializado', icone: 'briefcase' }], cached: false, tokensEstimated: 0 })),
    generateAbout(clientData).catch(e => ({ data: { texto: `${clientData.company_name} atua no segmento de ${clientData.niche}.`, stats: [] }, cached: false, tokensEstimated: 0 })),
    generateTestimonials(clientData).catch(e => ({ data: [], cached: false, tokensEstimated: 0 })),
    generateCta(clientData).catch(e => ({ data: { titulo: 'Entre em Contato', subtitulo: 'Solicite seu orçamento sem compromisso' }, cached: false, tokensEstimated: 0 })),
    generateSeo(clientData).catch(e => ({ data: { title: clientData.company_name, description: `${clientData.company_name} - ${clientData.niche}`, email: '' }, cached: false, tokensEstimated: 0 })),
  ]);

  onProgress?.('Montando site...', 70);

  [heroRes, servicesRes, aboutRes, testimonialsRes, ctaRes, seoRes].forEach(r => {
    totalTokens += r.tokensEstimated;
    if (r.cached) cachedCalls++;
  });

  const whatsappLink = clientData.phone
    ? `https://wa.me/55${clientData.phone.replace(/\D/g, '')}`
    : '#';

  // Monta os slots preenchidos combinando: defaults do template + dados do cliente + IA
  const filledSlots: FilledSlots = {};

  for (const section of template.sections) {
    const sectionSlots: Record<string, any> = { ...section.defaults };

    // Preenche slots do cliente
    for (const [key, slot] of Object.entries(section.slots)) {
      if (slot.source === 'client') {
        switch (key) {
          case 'phone': sectionSlots[key] = clientData.phone || ''; break;
          case 'address': sectionSlots[key] = clientData.address || ''; break;
          case 'logo_url': sectionSlots[key] = clientData.logo_url || ''; break;
          case 'company_name': sectionSlots[key] = clientData.company_name; break;
          case 'cta_link':
          case 'btn_link': sectionSlots[key] = whatsappLink; break;
        }
      }
    }

    // Preenche slots da IA por seção
    switch (section.type) {
      case 'hero':
        sectionSlots.headline = heroRes.data.headline;
        sectionSlots.subheadline = heroRes.data.subheadline;
        break;
      case 'services':
        sectionSlots.cards = servicesRes.data;
        break;
      case 'about':
        sectionSlots.texto = aboutRes.data.texto;
        sectionSlots.stats = aboutRes.data.stats;
        break;
      case 'testimonials':
        sectionSlots.depoimentos = testimonialsRes.data;
        break;
      case 'cta':
        sectionSlots.titulo = ctaRes.data.titulo;
        sectionSlots.subtitulo = ctaRes.data.subtitulo;
        break;
      case 'contact':
        sectionSlots.email = seoRes.data.email || `contato@${clientData.company_name.toLowerCase().replace(/\s+/g, '')}.com.br`;
        break;
      case 'gallery': {
        const selectedPosts = (extras?.instagramPosts || []).filter(p => p.selected);
        sectionSlots.posts = selectedPosts;
        sectionSlots.handle = extras?.instagramHandle || '';
        break;
      }
    }

    filledSlots[section.id] = sectionSlots;
  }

  onProgress?.('Site pronto!', 100);

  const finalColors = extras?.logoColors ?? {
    primary: template.color,
    secondary: adjustColor(template.color, 30),
  };

  return {
    filledSlots,
    meta: {
      title: seoRes.data.title,
      description: seoRes.data.description,
    },
    colors: finalColors,
    stats: {
      totalTokens,
      cachedCalls,
      totalCalls,
      timeMs: Date.now() - startTime,
    },
  };
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
