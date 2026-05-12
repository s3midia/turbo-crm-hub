import React, { useEffect, useMemo, useState } from 'react';
import { X, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const NEUTRALS = ['#000000', '#1f2937', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6', '#ffffff'];

const norm = (c: string) => (c || '').trim().toLowerCase();

function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return rgb;
  return (
    '#' +
    [m[1], m[2], m[3]]
      .map(n => parseInt(n, 10).toString(16).padStart(2, '0'))
      .join('')
  );
}

function toHex(c: string): string {
  if (!c) return '#000000';
  c = c.trim();
  if (c.startsWith('rgb')) return rgbToHex(c);
  return c.startsWith('#') ? c.toLowerCase() : c;
}

/**
 * Detecta todas as variações de cor de texto presentes no HTML.
 * Inclui a cor "raiz" (sem span) e cada cor única encontrada em spans.
 */
export function detectTextColors(html: string, rootColor: string): string[] {
  const colors = new Set<string>();
  // root color (texto fora de spans com cor)
  colors.add(toHex(rootColor));
  const re = /style\s*=\s*"[^"]*color\s*:\s*([^;"']+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    colors.add(toHex(m[1]));
  }
  return Array.from(colors);
}

/**
 * Substitui uma cor por outra em todos os spans do HTML.
 * Se a cor original for a rootColor, retorna a nova rootColor também.
 */
export function replaceColorInHtml(
  html: string,
  from: string,
  to: string
): string {
  const target = norm(from);
  return html.replace(
    /style\s*=\s*"([^"]*)"/gi,
    (full, body: string) => {
      const replaced = body.replace(
        /color\s*:\s*([^;"]+)/gi,
        (mm, val) => (norm(toHex(val)) === target ? `color: ${to}` : mm)
      );
      return `style="${replaced}"`;
    }
  );
}

interface Props {
  open: boolean;
  html: string;
  rootColor: string;
  rootBgColor?: string;
  brandColors: { primary: string; secondary: string };
  elementLabel?: string;
  elementTag?: string;
  onClose: () => void;
  onApply: (newHtml: string, newRootColor: string, newRootBg: string) => void;
}

export function ColorEditorModal({
  open,
  html,
  rootColor,
  rootBgColor = 'transparent',
  brandColors,
  elementLabel,
  elementTag = 'p',
  onClose,
  onApply,
}: Props) {
  const [tab, setTab] = useState<'text' | 'bg'>('text');
  const [textColors, setTextColors] = useState<{ original: string; current: string }[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [bgColor, setBgColor] = useState(rootBgColor === 'transparent' ? '#ffffff' : toHex(rootBgColor));

  useEffect(() => {
    if (!open) return;
    const found = detectTextColors(html, rootColor);
    setTextColors(found.map(c => ({ original: c, current: c })));
    setSelectedIdx(0);
    setBgColor(rootBgColor === 'transparent' ? '#ffffff' : toHex(rootBgColor));
    setTab('text');
  }, [open, html, rootColor, rootBgColor]);

  const current = textColors[selectedIdx];
  const setCurrent = (hex: string) => {
    setTextColors(arr =>
      arr.map((c, i) => (i === selectedIdx ? { ...c, current: hex } : c))
    );
  };

  const previewHtml = useMemo(() => {
    let out = html;
    textColors.forEach(c => {
      if (norm(c.original) !== norm(c.current)) {
        out = replaceColorInHtml(out, c.original, c.current);
      }
    });
    return out;
  }, [html, textColors]);

  const previewRootColor = textColors[0]?.current || rootColor;

  if (!open) return null;

  const activeValue = tab === 'text' ? current?.current || '#000000' : bgColor;
  const setActive = (hex: string) => (tab === 'text' ? setCurrent(hex) : setBgColor(hex));

  const handleApply = () => {
    let out = html;
    textColors.forEach(c => {
      if (norm(c.original) !== norm(c.current)) {
        out = replaceColorInHtml(out, c.original, c.current);
      }
    });
    onApply(out, textColors[0]?.current || rootColor, bgColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-5">
          {/* HEADER */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Palette className="h-5 w-5" /> Editor de Cores <span className="text-gray-400 font-normal">({elementTag})</span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">Ajuste a cor do texto e do fundo do elemento selecionado.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          {elementLabel && (
            <div className="text-sm text-gray-600">
              <span className="text-gray-500">Elemento:</span>{' '}
              <span className="italic">"{elementLabel.slice(0, 80)}{elementLabel.length > 80 ? '...' : ''}"</span>
            </div>
          )}

          {/* TABS */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-gray-100">
            <button
              onClick={() => setTab('text')}
              className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'text' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
            >
              Cor do texto
            </button>
            <button
              onClick={() => setTab('bg')}
              className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'bg' ? 'bg-white shadow border-2 border-blue-500 text-gray-900' : 'text-gray-600'}`}
            >
              Cor de fundo
            </button>
          </div>

          {/* VARIAÇÕES de cor (apenas tab texto, e somente se houver 2+) */}
          {tab === 'text' && textColors.length > 1 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-700">Variações de cor neste texto</div>
              <div className="flex gap-2 flex-wrap">
                {textColors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedIdx(i)}
                    className={`group relative h-10 w-10 rounded-lg border-2 transition-all ${selectedIdx === i ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-200'}`}
                    style={{ backgroundColor: c.current }}
                    title={`Cor ${i + 1}: ${c.current}`}
                  >
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-[10px] text-white font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-gray-500">
                Editando cor #{selectedIdx + 1} ({current?.original} → {current?.current})
              </div>
            </div>
          )}

          {/* PALETA DA MARCA */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700">Paleta da marca</div>
            <div className="flex gap-2">
              {[brandColors.primary, brandColors.secondary].map(c => (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`h-12 w-12 rounded-lg border-2 transition-all ${norm(activeValue) === norm(c) ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-200'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* NEUTROS */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700">Neutros</div>
            <div className="flex gap-2 flex-wrap">
              {NEUTRALS.map(c => (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`h-10 w-10 rounded-lg border-2 transition-all ${norm(activeValue) === norm(c) ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-200'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* COR PERSONALIZADA */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700">Cor personalizada</div>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={activeValue}
                onChange={e => setActive(e.target.value)}
                className="h-11 w-12 rounded-lg border border-gray-200 cursor-pointer"
              />
              <Input
                value={activeValue}
                onChange={e => setActive(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          {/* PREVIEW */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700">Pré-visualização</div>
            <div
              className="p-4 rounded-xl border border-gray-200 text-sm"
              style={{ color: previewRootColor, backgroundColor: bgColor }}
              dangerouslySetInnerHTML={{ __html: previewHtml.slice(0, 200) + (previewHtml.length > 200 ? '...' : '') }}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleApply} className="flex-1">Aplicar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
