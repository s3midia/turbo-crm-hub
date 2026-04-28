import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Check, Palette, X, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemePalette } from '@/hooks/useSystemSettings';
import { applyPaletteToCSS } from '@/hooks/useApplyTheme';

interface ColorPaletteProps {
    selectedColor: string;
    onColorChange: (color: string) => void;
    currentPalette?: ThemePalette;
    onPaletteChange?: (palette: ThemePalette) => void;
}

interface PaletteOption {
    name: string;
    description: string;
    palette: ThemePalette;
    colors: string[]; // Display colors in the strip
}

// Role labels for each slot in the palette
const COLOR_ROLES = ['Escuro', 'Primária', 'Destaque', 'Clara', 'Fundo'];

// Current CRM palette (from index.css)
const CRM_CURRENT_PALETTE: ThemePalette = {
    primary: '#222838',
    accent: '#F07A28',
    background: '#F0F1F3',
    foreground: '#1C2536',
    sidebar: '#FFFFFF',
};

// Palettes inspired by the S3 Mídia logo (orange, dark navy, neutrals)
const COLOR_PALETTES: PaletteOption[] = [
    {
        name: 'CRM Atual',
        description: 'Paleta atual do sistema',
        palette: CRM_CURRENT_PALETTE,
        colors: ['#222838', '#3B4463', '#F07A28', '#F5A623', '#F0F1F3'],
    },
    {
        name: 'S3 Mídia Original',
        description: 'A paleta oficial da marca',
        palette: {
            primary: '#222838',
            accent: '#F07A28',
            background: '#F0F1F3',
            foreground: '#1C2536',
            sidebar: '#FFFFFF',
        },
        colors: ['#222838', '#3B4463', '#F07A28', '#F5A623', '#F0F1F3'],
    },
    {
        name: 'S3 Mídia Profissional',
        description: 'Tom executivo e refinado',
        palette: {
            primary: '#1E293B',
            accent: '#3B82F6',
            background: '#F8FAFC',
            foreground: '#0F172A',
            sidebar: '#FFFFFF',
        },
        colors: ['#0F172A', '#1E293B', '#3B82F6', '#93C5FD', '#F8FAFC'],
    },
    {
        name: 'S3 Mídia Energia',
        description: 'Vibrante e dinâmico',
        palette: {
            primary: '#1C1917',
            accent: '#EA580C',
            background: '#FFF7ED',
            foreground: '#1C1917',
            sidebar: '#FFFFFF',
        },
        colors: ['#1C1917', '#EA580C', '#FB923C', '#FED7AA', '#FFF7ED'],
    },
    {
        name: 'S3 Mídia Oceano',
        description: 'Confiança e estabilidade',
        palette: {
            primary: '#0C1D36',
            accent: '#0066CC',
            background: '#EFF6FF',
            foreground: '#0C1D36',
            sidebar: '#FFFFFF',
        },
        colors: ['#0C1D36', '#0066CC', '#3B82F6', '#93C5FD', '#EFF6FF'],
    },
    {
        name: 'S3 Mídia Floresta',
        description: 'Crescimento e sucesso',
        palette: {
            primary: '#022C22',
            accent: '#059669',
            background: '#ECFDF5',
            foreground: '#022C22',
            sidebar: '#FFFFFF',
        },
        colors: ['#022C22', '#059669', '#34D399', '#A7F3D0', '#ECFDF5'],
    },
    {
        name: 'S3 Mídia Clássico',
        description: 'Elegante e atemporal',
        palette: {
            primary: '#1E1039',
            accent: '#7C3AED',
            background: '#F5F3FF',
            foreground: '#1E1039',
            sidebar: '#FFFFFF',
        },
        colors: ['#1E1039', '#7C3AED', '#A78BFA', '#DDD6FE', '#F5F3FF'],
    },
    {
        name: 'S3 Mídia Rose',
        description: 'Moderno e sofisticado',
        palette: {
            primary: '#1A0512',
            accent: '#E11D48',
            background: '#FFF1F2',
            foreground: '#1A0512',
            sidebar: '#FFFFFF',
        },
        colors: ['#1A0512', '#E11D48', '#FB7185', '#FECDD3', '#FFF1F2'],
    },
    {
        name: 'S3 Mídia Sunset',
        description: 'Caloroso e acolhedor',
        palette: {
            primary: '#1C1306',
            accent: '#D97706',
            background: '#FFFBEB',
            foreground: '#1C1306',
            sidebar: '#FFFFFF',
        },
        colors: ['#1C1306', '#D97706', '#FBBF24', '#FDE68A', '#FFFBEB'],
    },
];

// Mini color picker popover component
function ColorEditPopover({
    color,
    label,
    onColorChange,
    onClose,
    position,
}: {
    color: string;
    label: string;
    onColorChange: (color: string) => void;
    onClose: () => void;
    position: { top: number; left: number };
}) {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [localColor, setLocalColor] = useState(color);
    const [hexInput, setHexInput] = useState(color);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleColorChange = (newColor: string) => {
        setLocalColor(newColor);
        setHexInput(newColor);
        onColorChange(newColor);
    };

    const handleHexSubmit = (value: string) => {
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            handleColorChange(value);
        }
        setHexInput(value);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(localColor);
    };

    return (
        <div
            ref={popoverRef}
            className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            <div className="bg-white rounded-xl shadow-2xl border border-border/80 p-3 w-[220px]">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">{label}</span>
                    <button
                        onClick={onClose}
                        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                    >
                        <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                </div>

                {/* Color Picker */}
                <div className="relative mb-2">
                    <input
                        type="color"
                        value={localColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="w-full h-28 rounded-lg cursor-pointer border-0 p-0"
                        style={{ padding: 0 }}
                    />
                </div>

                {/* Hex Input + Copy */}
                <div className="flex gap-1.5 items-center">
                    <div
                        className="w-7 h-7 rounded-md ring-1 ring-black/10 flex-shrink-0"
                        style={{ backgroundColor: localColor }}
                    />
                    <Input
                        type="text"
                        value={hexInput}
                        onChange={(e) => handleHexSubmit(e.target.value)}
                        className="h-7 text-xs font-mono flex-1"
                        placeholder="#000000"
                    />
                    <button
                        onClick={copyToClipboard}
                        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
                        title="Copiar cor"
                    >
                        <Copy className="h-3 w-3 text-muted-foreground" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ColorPalette({
    selectedColor,
    onColorChange,
    currentPalette,
    onPaletteChange,
}: ColorPaletteProps) {
    const [editingColor, setEditingColor] = useState<{
        paletteIndex: number;
        colorIndex: number;
        position: { top: number; left: number };
    } | null>(null);

    // Local copy of palette colors so we can edit individual colors
    const [localPalettes, setLocalPalettes] = useState(
        COLOR_PALETTES.map((p) => ({ ...p, colors: [...p.colors] }))
    );

    const selectedPaletteIndex = localPalettes.findIndex(
        (p) => p.palette.accent === (currentPalette?.accent || selectedColor)
    );


    const handleSelectPalette = (palette: PaletteOption) => {
        onColorChange(palette.palette.accent);
        if (onPaletteChange) {
            onPaletteChange(palette.palette);
        }
        // Apply immediately for a live preview
        applyPaletteToCSS(palette.palette);
    };

    const handleColorBarClick = (
        e: React.MouseEvent,
        paletteIndex: number,
        colorIndex: number
    ) => {
        e.stopPropagation();
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setEditingColor({
            paletteIndex,
            colorIndex,
            position: {
                top: rect.bottom + 8,
                left: Math.max(10, rect.left - 80),
            },
        });
    };

    const handleColorEdit = (paletteIndex: number, colorIndex: number, newColor: string) => {
        setLocalPalettes((prev) => {
            const updated = prev.map((p, i) =>
                i === paletteIndex
                    ? { ...p, colors: p.colors.map((c, ci) => (ci === colorIndex ? newColor : c)) }
                    : p
            );

            // Update palette fields based on which color changed
            const palette = { ...updated[paletteIndex].palette };
            const colors = updated[paletteIndex].colors;
            palette.primary = colors[0] || palette.primary;
            palette.accent = colors[2] || palette.accent;
            palette.background = colors[4] || palette.background;
            palette.foreground = colors[1] || palette.foreground;
            updated[paletteIndex] = { ...updated[paletteIndex], palette };

            // If this is the currently selected palette, apply live
            if (paletteIndex === selectedPaletteIndex) {
                onColorChange(palette.accent);
                if (onPaletteChange) {
                    onPaletteChange(palette);
                }
                applyPaletteToCSS(palette);
            }

            return updated;
        });
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl"
                    style={{
                        background: `linear-gradient(135deg, ${selectedColor}22, ${selectedColor}44)`,
                    }}
                >
                    <Palette className="h-5 w-5" style={{ color: selectedColor }} />
                </div>
                <div>
                    <Label className="text-base font-semibold">Paleta de Cores</Label>
                    <p className="text-sm text-muted-foreground">
                        Paletas pensadas na identidade visual da marca — passe o mouse nas cores para editar
                    </p>
                </div>
            </div>

            {/* Palettes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {localPalettes.map((palette, paletteIdx) => {
                    const isSelected = paletteIdx === selectedPaletteIndex;

                    return (
                        <button
                            key={paletteIdx}
                            type="button"
                            onClick={() => handleSelectPalette(palette)}
                            className={cn(
                                'group relative flex flex-col rounded-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-left',
                                isSelected
                                    ? 'border-primary shadow-md ring-1 ring-primary/20'
                                    : 'border-border/60 hover:border-primary/40 bg-background'
                            )}
                        >
                            {/* Color Bars */}
                            <div className="flex h-24 w-full">
                                {palette.colors.map((color, colorIdx) => (
                                    <div
                                        key={colorIdx}
                                        className="flex-1 relative cursor-pointer transition-all duration-200 group/bar"
                                        style={{ backgroundColor: color }}
                                        onClick={(e) => handleColorBarClick(e, paletteIdx, colorIdx)}
                                        title={`${COLOR_ROLES[colorIdx]}: ${color} — Clique para editar`}
                                    >
                                        {/* Hover tooltip with hex */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                                            <div className="bg-black/70 backdrop-blur-sm text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md shadow-sm">
                                                {color}
                                            </div>
                                            <div className="bg-black/70 backdrop-blur-sm text-white/70 text-[8px] px-1.5 py-0.5 rounded-md mt-0.5">
                                                {COLOR_ROLES[colorIdx]}
                                            </div>
                                            <div className="mt-1 bg-white/90 text-black text-[8px] px-1.5 py-0.5 rounded-md font-medium">
                                                ✏️ Editar
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Selected indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg bg-white">
                                    <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />
                                </div>
                            )}

                            {/* Info Section */}
                            <div className="p-3 bg-background">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full ring-1 ring-black/10 flex-shrink-0"
                                        style={{ backgroundColor: palette.palette.accent }}
                                    />
                                    <span className="text-xs font-semibold text-foreground truncate">
                                        {palette.name}
                                    </span>
                                    {isSelected && (
                                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium ml-auto">
                                            Ativa
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1 ml-5">
                                    {palette.description}
                                </p>
                                {/* Color dots */}
                                <div className="flex gap-1 mt-2 ml-5">
                                    {palette.colors.map((color, i) => (
                                        <div
                                            key={i}
                                            className="w-4 h-4 rounded-full ring-1 ring-black/5 transition-transform hover:scale-125"
                                            style={{ backgroundColor: color }}
                                            title={`${COLOR_ROLES[i]}: ${color}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>



            {/* Editing popover */}
            {editingColor && (
                <ColorEditPopover
                    color={localPalettes[editingColor.paletteIndex].colors[editingColor.colorIndex]}
                    label={`${COLOR_ROLES[editingColor.colorIndex]} — ${localPalettes[editingColor.paletteIndex].name}`}
                    position={editingColor.position}
                    onColorChange={(newColor) =>
                        handleColorEdit(editingColor.paletteIndex, editingColor.colorIndex, newColor)
                    }
                    onClose={() => setEditingColor(null)}
                />
            )}
        </div>
    );
}
