import React, { useRef, useState } from 'react';
import { Upload, X, Palette, RefreshCw } from 'lucide-react';

export interface LogoColors {
  primary: string;
  secondary: string;
}

interface Props {
  logoUrl: string;
  colors: LogoColors;
  onChange: (logoUrl: string, colors: LogoColors) => void;
}

function extractColorsFromImage(img: HTMLImageElement): LogoColors {
  const canvas = document.createElement('canvas');
  const size = 80;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  const colorMap: Record<string, number> = {};
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;
    // Ignora branco, preto e cinza puro
    const brightness = (r + g + b) / 3;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);
    if (brightness > 240 || brightness < 15 || saturation < 30) continue;
    const key = `${Math.round(r / 20) * 20},${Math.round(g / 20) * 20},${Math.round(b / 20) * 20}`;
    colorMap[key] = (colorMap[key] || 0) + 1;
  }

  const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
  const toHex = (rgb: string) => {
    const [r, g, b] = rgb.split(',').map(Number);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const primary = sorted[0] ? toHex(sorted[0][0]) : '#ea580c';
  const secondary = sorted[1] ? toHex(sorted[1][0]) : '#ff6020';
  return { primary, secondary };
}

export function LogoUploader({ logoUrl, colors, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const handleFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      extractColorsFromDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const extractColorsFromDataUrl = (dataUrl: string) => {
    setExtracting(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const extracted = extractColorsFromImage(img);
        onChange(dataUrl, extracted);
      } catch {
        onChange(dataUrl, colors);
      } finally {
        setLoading(false);
        setExtracting(false);
      }
    };
    img.onerror = () => {
      onChange(dataUrl, colors);
      setLoading(false);
      setExtracting(false);
    };
    img.src = dataUrl;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  };

  const handleReextract = () => {
    if (!logoUrl) return;
    extractColorsFromDataUrl(logoUrl);
  };

  return (
    <div className="space-y-3">
      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="relative cursor-pointer group"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {logoUrl ? (
          <div className="relative w-full h-28 rounded-xl border-2 border-dashed border-wa-border bg-wa-bg-subtle flex items-center justify-center group-hover:border-primary/50 transition-colors overflow-hidden">
            <img
              src={logoUrl}
              alt="Logo"
              className="max-h-24 max-w-full object-contain"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/60 px-3 py-1.5 rounded-lg transition-opacity">
                Trocar logo
              </span>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onChange('', colors); }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="w-full h-28 rounded-xl border-2 border-dashed border-wa-border bg-wa-bg-subtle flex flex-col items-center justify-center gap-2 group-hover:border-primary/50 group-hover:bg-primary/5 transition-colors">
            {loading ? (
              <RefreshCw className="h-6 w-6 text-primary animate-spin" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-wa-text-muted" />
                <span className="text-sm text-wa-text-muted">Arraste ou clique para enviar</span>
                <span className="text-xs text-wa-text-muted opacity-60">PNG ou JPG, preferencialmente fundo transparente</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Cores extraídas */}
      {logoUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-wa-text-muted flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" /> Cores extraídas automaticamente
            </span>
            <button
              onClick={handleReextract}
              disabled={extracting}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${extracting ? 'animate-spin' : ''}`} />
              Re-extrair
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Primária', key: 'primary' as const },
              { label: 'Secundária', key: 'secondary' as const },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-wa-bg-subtle border border-wa-border">
                <label className="relative cursor-pointer">
                  <div
                    className="w-8 h-8 rounded-lg shadow-sm border border-white/20 ring-2 ring-wa-border"
                    style={{ backgroundColor: colors[key] }}
                  />
                  <input
                    type="color"
                    value={colors[key]}
                    onChange={e => onChange(logoUrl, { ...colors, [key]: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
                <div>
                  <p className="text-[10px] text-wa-text-muted">{label}</p>
                  <p className="text-xs font-mono font-medium text-wa-text-main">{colors[key]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
