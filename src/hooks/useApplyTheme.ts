import { useEffect } from 'react';
import { useSystemSettings, ThemePalette } from './useSystemSettings';

/**
 * Converts a hex color string to HSL values string for CSS variables.
 * Example: "#FF6600" → "24 100% 50%"
 */
function hexToHsl(hex: string): string {
    // Remove the hash
    hex = hex.replace(/^#/, '');

    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Given a hex color, return a lighter version for hover states
 */
function lightenHex(hex: string, amount: number): string {
    hex = hex.replace(/^#/, '');
    const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + amount);
    const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Given a hex color, return a darker version
 */
function darkenHex(hex: string, amount: number): string {
    hex = hex.replace(/^#/, '');
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - amount);
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - amount);
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Determines if a color is "light" — used to decide foreground text color
 */
function isLightColor(hex: string): boolean {
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}

/**
 * Applies a ThemePalette to the document's CSS custom properties
 */
export function applyPaletteToCSS(palette: ThemePalette) {
    const root = document.documentElement;

    // Primary color
    root.style.setProperty('--primary', hexToHsl(palette.primary));
    root.style.setProperty('--primary-foreground', isLightColor(palette.primary) ? '220 14% 15%' : '0 0% 100%');
    root.style.setProperty('--primary-hover', hexToHsl(darkenHex(palette.primary, 20)));

    // Foreground (text color)
    root.style.setProperty('--foreground', hexToHsl(palette.foreground));

    // Background
    root.style.setProperty('--background', hexToHsl(palette.background));

    // Card & Popover (use sidebar color = white typically)
    root.style.setProperty('--card', hexToHsl(palette.sidebar));
    root.style.setProperty('--card-foreground', hexToHsl(palette.foreground));
    root.style.setProperty('--popover', hexToHsl(palette.sidebar));
    root.style.setProperty('--popover-foreground', hexToHsl(palette.foreground));

    // Secondary - derive from background (slightly darker)
    root.style.setProperty('--secondary', hexToHsl(darkenHex(palette.background, 15)));
    root.style.setProperty('--secondary-foreground', hexToHsl(palette.primary));

    // Muted - derive from background
    root.style.setProperty('--muted', hexToHsl(darkenHex(palette.background, 8)));
    root.style.setProperty('--muted-foreground', hexToHsl(lightenHex(palette.foreground, 80)));

    // Accent color
    root.style.setProperty('--accent', hexToHsl(palette.accent));
    root.style.setProperty('--accent-foreground', isLightColor(palette.accent) ? '220 14% 15%' : '0 0% 100%');

    // Ring / Focus
    root.style.setProperty('--ring', hexToHsl(palette.accent));

    // Borders & Inputs - derive from background
    root.style.setProperty('--border', hexToHsl(darkenHex(palette.background, 20)));
    root.style.setProperty('--input', hexToHsl(darkenHex(palette.background, 20)));

    // Sidebar
    root.style.setProperty('--sidebar-background', hexToHsl(palette.sidebar));
    root.style.setProperty('--sidebar-foreground', hexToHsl(lightenHex(palette.foreground, 80)));
    root.style.setProperty('--sidebar-primary', hexToHsl(palette.accent));
    root.style.setProperty('--sidebar-primary-foreground', isLightColor(palette.accent) ? '220 14% 15%' : '0 0% 100%');
    root.style.setProperty('--sidebar-accent', hexToHsl(darkenHex(palette.background, 8)));
    root.style.setProperty('--sidebar-accent-foreground', hexToHsl(palette.primary));
    root.style.setProperty('--sidebar-border', hexToHsl(palette.background));

    // WhatsApp tokens
    root.style.setProperty('--wa-primary', hexToHsl(palette.accent));
    root.style.setProperty('--wa-primary-foreground', isLightColor(palette.accent) ? '220 14% 15%' : '0 0% 100%');
}

/**
 * Hook that reads the stored theme palette and applies it to CSS variables
 * whenever the settings change.
 */
export function useApplyTheme() {
    const { data: settings } = useSystemSettings();

    // Serialize the palette to a string so useEffect can detect object changes
    const paletteKey = settings?.theme_palette
        ? JSON.stringify(settings.theme_palette)
        : null;

    useEffect(() => {
        if (settings?.theme_palette) {
            applyPaletteToCSS(settings.theme_palette);
        }
    }, [paletteKey]);
}
