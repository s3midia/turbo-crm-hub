import React from 'react';
import type { FilledSlots, SiteTemplate } from '@/lib/templates/types';
import { HeroSection } from './sections/HeroSection';
import { ServicesSection } from './sections/ServicesSection';
import { AboutSection } from './sections/AboutSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { CtaSection } from './sections/CtaSection';
import { ContactSection } from './sections/ContactSection';
import { FooterSection } from './sections/FooterSection';
import { GallerySection } from './sections/GallerySection';

interface Props {
  template: SiteTemplate;
  filledSlots: FilledSlots;
  colors: { primary: string; secondary: string };
  editMode?: boolean;
  onSlotChange?: (sectionId: string, slotKey: string, value: any) => void;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType<any>> = {
  hero: HeroSection,
  services: ServicesSection,
  about: AboutSection,
  testimonials: TestimonialsSection,
  cta: CtaSection,
  contact: ContactSection,
  footer: FooterSection,
  gallery: GallerySection,
};

export function SectionRenderer({ template, filledSlots, colors, editMode, onSlotChange }: Props) {
  return (
    <div
      className="w-full"
      style={{ '--color-primary': colors.primary, '--color-secondary': colors.secondary, fontFamily: template.fonts.body } as React.CSSProperties}
    >
      {template.sections.map(section => {
        const Component = SECTION_COMPONENTS[section.type];
        if (!Component) return null;

        const sectionData = filledSlots[section.id] || {};

        return (
          <Component
            key={section.id}
            data={sectionData}
            colors={colors}
            theme={template.theme}
            fonts={template.fonts}
            editMode={editMode}
            onSlotChange={onSlotChange
              ? (key: string, value: any) => onSlotChange(section.id, key, value)
              : undefined
            }
          />
        );
      })}
    </div>
  );
}
