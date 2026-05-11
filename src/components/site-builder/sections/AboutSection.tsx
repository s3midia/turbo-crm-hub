import React from 'react';
import { EditableText } from '../InlineEditor';

interface Props {
  data: Record<string, any>;
  colors: { primary: string; secondary: string };
  theme: 'light' | 'dark';
  fonts: { heading: string; body: string };
  editMode?: boolean;
  onSlotChange?: (key: string, value: any) => void;
}

export function AboutSection({ data, colors, theme, fonts, editMode = false, onSlotChange }: Props) {
  const stats = Array.isArray(data.stats) ? data.stats : [];
  const isDark = theme === 'dark';

  const updateStat = (i: number, field: 'numero' | 'label', value: string) => {
    const updated = stats.map((s: any, idx: number) => idx === i ? { ...s, [field]: value } : s);
    onSlotChange?.('stats', updated);
  };

  return (
    <section className={`py-20 px-6 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <EditableText
              as="h2"
              value={data.titulo || 'Nossa História'}
              editMode={editMode}
              onSave={v => onSlotChange?.('titulo', v)}
              className="text-3xl font-bold"
              style={{ fontFamily: fonts.heading }}
            />

            <EditableText
              as="p"
              value={data.texto || 'Texto sobre a empresa'}
              multiline
              editMode={editMode}
              onSave={v => onSlotChange?.('texto', v)}
              className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
            />

            {stats.length > 0 && (
              <div className="grid grid-cols-3 gap-6 pt-4">
                {stats.map((stat: any, i: number) => (
                  <div key={i} className="text-center">
                    <EditableText
                      as="div"
                      value={stat.numero}
                      editMode={editMode}
                      onSave={v => updateStat(i, 'numero', v)}
                      className="text-2xl font-bold"
                      style={{ color: colors.primary }}
                    />
                    <EditableText
                      as="div"
                      value={stat.label}
                      editMode={editMode}
                      onSave={v => updateStat(i, 'label', v)}
                      className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            {data.imagem ? (
              <img src={data.imagem} alt="" className="w-full h-80 object-cover rounded-2xl shadow-lg" />
            ) : (
              <div className="w-full h-80 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${colors.primary}10` }}>
                <span className="text-sm text-gray-400">Imagem da empresa</span>
              </div>
            )}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-xl opacity-20" style={{ backgroundColor: colors.primary }} />
          </div>
        </div>
      </div>
    </section>
  );
}
