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

export function CtaSection({ data, colors, theme, fonts, editMode = false, onSlotChange }: Props) {
  return (
    <section className="py-20 px-6 text-white text-center" style={{ backgroundColor: colors.primary }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <EditableText
          as="h2"
          value={data.titulo || 'Entre em Contato'}
          editMode={editMode}
          onSave={v => onSlotChange?.('titulo', v)}
          className="text-3xl md:text-4xl font-bold"
          style={{ fontFamily: fonts.heading }}
        />
        <EditableText
          as="p"
          value={data.subtitulo || 'Solicite seu orçamento sem compromisso'}
          editMode={editMode}
          onSave={v => onSlotChange?.('subtitulo', v)}
          className="text-lg opacity-90"
        />
        <a
          href={data.btn_link || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-10 py-4 bg-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
          style={{ color: colors.primary }}
        >
          <Phone className="h-5 w-5" />
          <EditableText
            value={data.btn_text || 'Fale Conosco'}
            editMode={editMode}
            onSave={v => onSlotChange?.('btn_text', v)}
            style={{ color: colors.primary }}
          />
        </a>
      </div>
    </section>
  );
}
