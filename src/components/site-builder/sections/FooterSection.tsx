import React from 'react';

interface Props {
  data: Record<string, any>;
  colors: { primary: string; secondary: string };
  theme: 'light' | 'dark';
  fonts: { heading: string; body: string };
  editMode?: boolean;
  onSlotChange?: (key: string, value: any) => void;
}

export function FooterSection({ data, colors, theme }: Props) {
  const isDark = theme === 'dark';
  return (
    <footer className={`py-8 px-6 border-t ${isDark ? 'bg-gray-950 text-gray-400 border-gray-800' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {data.logo_url && <img src={data.logo_url} alt="" className="h-8 object-contain opacity-60" />}
          <span className="text-sm font-medium">{data.company_name || 'Empresa'}</span>
        </div>
        <p className="text-xs">&copy; {new Date().getFullYear()} {data.company_name}. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
