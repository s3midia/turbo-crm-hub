import React from 'react';
import { Phone, MapPin, Mail, Clock } from 'lucide-react';
import { EditableText } from '../InlineEditor';

interface Props {
  data: Record<string, any>;
  colors: { primary: string; secondary: string };
  theme: 'light' | 'dark';
  fonts: { heading: string; body: string };
  editMode?: boolean;
  onSlotChange?: (key: string, value: any) => void;
}

export function ContactSection({ data, colors, theme, fonts, editMode = false, onSlotChange }: Props) {
  const isDark = theme === 'dark';

  const items = [
    { icon: Phone,   label: 'Telefone', key: 'phone' },
    { icon: Mail,    label: 'Email',    key: 'email' },
    { icon: MapPin,  label: 'Endereço', key: 'address' },
    { icon: Clock,   label: 'Horário',  key: 'horario' },
  ].filter(item => data[item.key]);

  if (items.length === 0) return null;

  return (
    <section className={`py-20 px-6 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: fonts.heading }}>
          Contato
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.key} className={`flex items-start gap-4 p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <item.icon className="h-6 w-6 flex-shrink-0 mt-0.5" style={{ color: colors.primary }} />
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {item.label}
                </div>
                <EditableText
                  as="div"
                  value={data[item.key]}
                  editMode={editMode}
                  onSave={v => onSlotChange?.(item.key, v)}
                  className="text-sm font-medium"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
