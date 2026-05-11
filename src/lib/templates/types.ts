export interface TemplateSlot {
  key: string;
  type: 'text' | 'image' | 'array' | 'color' | 'link';
  source: 'ai' | 'client' | 'fixed';
  label: string;
  maxLength?: number;
}

export interface TemplateSection {
  id: string;
  type: 'hero' | 'services' | 'about' | 'gallery' | 'testimonials' | 'contact' | 'footer' | 'cta';
  slots: Record<string, TemplateSlot>;
  defaults: Record<string, any>;
}

export interface SiteTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  theme: 'light' | 'dark';
  sections: TemplateSection[];
  fonts: {
    heading: string;
    body: string;
  };
  meta: {
    title: TemplateSlot;
    description: TemplateSlot;
  };
}

export interface FilledSlots {
  [sectionId: string]: Record<string, any>;
}

export interface GeneratedSite {
  id: string;
  templateId: string;
  clientData: ClientData;
  filledSlots: FilledSlots;
  colors: { primary: string; secondary: string };
  createdAt: string;
  updatedAt: string;
}

export interface ClientData {
  company_name: string;
  owner_name?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  niche: string;
  region?: string;
  instagram?: string;
  description?: string;
}

export interface SkillResult<T = any> {
  data: T;
  tokensUsed: number;
  cached: boolean;
}
