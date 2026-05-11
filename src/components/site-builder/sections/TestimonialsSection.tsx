import React from 'react';
import { Quote } from 'lucide-react';
import { EditableText } from '../InlineEditor';

interface Props {
  data: Record<string, any>;
  colors: { primary: string; secondary: string };
  theme: 'light' | 'dark';
  fonts: { heading: string; body: string };
  editMode?: boolean;
  onSlotChange?: (key: string, value: any) => void;
}

export function TestimonialsSection({ data, colors, theme, fonts, editMode = false, onSlotChange }: Props) {
  const depoimentos = Array.isArray(data.depoimentos) ? data.depoimentos : [];
  if (depoimentos.length === 0) return null;
  const isDark = theme === 'dark';

  const updateDep = (i: number, field: string, value: string) => {
    const updated = depoimentos.map((d: any, idx: number) => idx === i ? { ...d, [field]: value } : d);
    onSlotChange?.('depoimentos', updated);
  };

  return (
    <section className={`py-20 px-6 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <EditableText
          as="h2"
          value={data.titulo || 'Depoimentos'}
          editMode={editMode}
          onSave={v => onSlotChange?.('titulo', v)}
          className="text-3xl font-bold text-center mb-12"
          style={{ fontFamily: fonts.heading }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {depoimentos.map((dep: any, i: number) => (
            <div key={i} className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
              <Quote className="h-8 w-8 mb-4 opacity-30" style={{ color: colors.primary }} />
              <EditableText
                as="p"
                value={dep.texto}
                multiline
                editMode={editMode}
                onSave={v => updateDep(i, 'texto', v)}
                className={`text-sm mb-4 italic ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: colors.primary }}>
                  {dep.nome?.charAt(0) || 'C'}
                </div>
                <div>
                  <EditableText
                    as="div"
                    value={dep.nome}
                    editMode={editMode}
                    onSave={v => updateDep(i, 'nome', v)}
                    className="font-semibold text-sm"
                  />
                  <EditableText
                    as="div"
                    value={dep.cargo}
                    editMode={editMode}
                    onSave={v => updateDep(i, 'cargo', v)}
                    className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
