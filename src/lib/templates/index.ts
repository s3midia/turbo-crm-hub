import type { SiteTemplate } from './types';
import { engenhariaPremiumTemplate } from './engenharia-premium';
import { advocaciaClassicTemplate } from './advocacia-classic';

export type { SiteTemplate, ClientData, FilledSlots, GeneratedSite, SkillResult } from './types';

const TEMPLATE_REGISTRY: Record<string, SiteTemplate> = {
  [engenhariaPremiumTemplate.id]: engenhariaPremiumTemplate,
  [advocaciaClassicTemplate.id]: advocaciaClassicTemplate,
};

export function getTemplate(id: string): SiteTemplate | undefined {
  return TEMPLATE_REGISTRY[id];
}

export function getAllTemplates(): SiteTemplate[] {
  return Object.values(TEMPLATE_REGISTRY);
}

export function getTemplatesByCategory(category: string): SiteTemplate[] {
  return Object.values(TEMPLATE_REGISTRY).filter(t => t.category === category);
}

export function getAiSlots(template: SiteTemplate): { sectionId: string; slotKey: string; slot: any }[] {
  const aiSlots: { sectionId: string; slotKey: string; slot: any }[] = [];
  for (const section of template.sections) {
    for (const [key, slot] of Object.entries(section.slots)) {
      if (slot.source === 'ai') {
        aiSlots.push({ sectionId: section.id, slotKey: key, slot });
      }
    }
  }
  return aiSlots;
}
