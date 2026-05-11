import React from 'react';
import * as Icons from 'lucide-react';
import { EditableText } from '../InlineEditor';

interface ServiceCard { titulo: string; descricao: string; icone: string; }

interface Props {
  data: Record<string, any>;
  colors: { primary: string; secondary: string };
  theme: 'light' | 'dark';
  fonts: { heading: string; body: string };
  editMode?: boolean;
  onSlotChange?: (key: string, value: any) => void;
}

function getIcon(name: string) {
  const map: Record<string, any> = {
    building: Icons.Building2, hammer: Icons.Hammer, clipboard: Icons.ClipboardList,
    shield: Icons.Shield, scale: Icons.Scale, heart: Icons.Heart,
    wrench: Icons.Wrench, calculator: Icons.Calculator, hardhat: Icons.HardHat,
    briefcase: Icons.Briefcase, home: Icons.Home, truck: Icons.Truck,
  };
  return map[name] || Icons.Briefcase;
}

export function ServicesSection({ data, colors, theme, fonts, editMode = false, onSlotChange }: Props) {
  const cards: ServiceCard[] = Array.isArray(data.cards) ? data.cards : [];
  const isDark = theme === 'dark';

  const updateCard = (i: number, field: keyof ServiceCard, value: string) => {
    const updated = cards.map((c, idx) => idx === i ? { ...c, [field]: value } : c);
    onSlotChange?.('cards', updated);
  };

  return (
    <section className={`py-20 px-6 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <EditableText
          as="h2"
          value={data.titulo || 'Nossos Serviços'}
          editMode={editMode}
          onSave={v => onSlotChange?.('titulo', v)}
          className="text-3xl font-bold text-center mb-12"
          style={{ fontFamily: fonts.heading }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, i) => {
            const IconComp = getIcon(card.icone);
            return (
              <div
                key={i}
                className={`p-8 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-1 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${colors.primary}18` }}>
                  <IconComp className="h-7 w-7" style={{ color: colors.primary }} />
                </div>
                <EditableText
                  as="h3"
                  value={card.titulo}
                  editMode={editMode}
                  onSave={v => updateCard(i, 'titulo', v)}
                  className="text-xl font-bold mb-2"
                  style={{ fontFamily: fonts.heading }}
                />
                <EditableText
                  as="p"
                  value={card.descricao}
                  multiline
                  editMode={editMode}
                  onSave={v => updateCard(i, 'descricao', v)}
                  className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
