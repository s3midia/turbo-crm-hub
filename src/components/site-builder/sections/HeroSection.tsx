import React from 'react';
import { Phone } from 'lucide-react';
import { EditableText } from '../InlineEditor';

interface Props {
  data: Record<string, any>;
  colors: { primary: string; secondary: string };
  theme: 'light' | 'dark';
  fonts: { heading: string; body: string };
  editMode?: boolean;
  onSlotChange?: (key: string, value: any) => void;
}

export function HeroSection({ data, colors, theme, fonts, editMode = false, onSlotChange }: Props) {
  const isDark = theme === 'dark';
  const hasBg = !!data.bg_image;
  const textColor = hasBg ? 'text-white' : (isDark ? 'text-white' : 'text-gray-900');

  return (
    <section className={`relative min-h-[520px] flex items-center ${isDark && !hasBg ? 'bg-gray-900' : 'bg-white'}`}>
      {hasBg && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-black/30 z-10" />
          <img src={data.bg_image} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="relative z-20 max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="max-w-2xl space-y-6">
          {data.logo_url && (
            <img src={data.logo_url} alt="Logo" className="h-16 object-contain mb-2" />
          )}

          <EditableText
            as="h1"
            value={data.headline || 'Título Principal'}
            editMode={editMode}
            onSave={v => onSlotChange?.('headline', v)}
            className={`text-4xl md:text-5xl font-bold leading-tight ${textColor}`}
            style={{ fontFamily: fonts.heading }}
          />

          <EditableText
            as="p"
            value={data.subheadline || 'Subtítulo da empresa'}
            multiline
            editMode={editMode}
            onSave={v => onSlotChange?.('subheadline', v)}
            className={`text-lg md:text-xl max-w-xl ${hasBg ? 'text-white/90' : (isDark ? 'text-gray-300' : 'text-gray-600')}`}
          />

          <a
            href={data.cta_link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            style={{ backgroundColor: colors.primary }}
          >
            <Phone className="h-5 w-5" />
            <EditableText
              value={data.cta_text || 'Solicitar Orçamento'}
              editMode={editMode}
              onSave={v => onSlotChange?.('cta_text', v)}
              className="text-white"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
