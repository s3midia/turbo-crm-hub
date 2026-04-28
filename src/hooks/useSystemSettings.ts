import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ThemePalette {
    primary: string;
    accent: string;
    background: string;
    foreground: string;
    sidebar: string;
}

export interface SystemSettings {
    id: string;
    company_name?: string;
    // Three separate logos
    logo_favicon?: string;
    logo_collapsed?: string;
    logo_expanded?: string;
    // Logo sizes (in pixels)
    logo_favicon_size?: number;
    logo_collapsed_size?: number;
    logo_expanded_size?: number;
    // Theme
    theme_color?: string;
    theme_palette?: ThemePalette;
    created_at: string;
    updated_at: string;
}

const SETTINGS_KEY = 'bolten_system_settings';

const INITIAL_SETTINGS: SystemSettings = {
    id: '1',
    company_name: 'S3 Mídia',
    theme_color: '#f97316',
    logo_favicon: '/logo_s3.png',
    logo_collapsed: '/logo_s3.png',
    logo_expanded: '/logo_s3.png',
    logo_favicon_size: 32,
    logo_collapsed_size: 40,
    logo_expanded_size: 40,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

const getSettings = (): SystemSettings => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
        return INITIAL_SETTINGS;
    }
    const parsed = JSON.parse(stored);
    
    // Migration: If it's still Bolten CRM, update to S3 Mídia
    if (parsed.company_name === 'Bolten CRM') {
        parsed.company_name = INITIAL_SETTINGS.company_name;
        parsed.theme_color = INITIAL_SETTINGS.theme_color;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
    }
    
    // Force update logo if not set
    if (!parsed.logo_favicon || !parsed.logo_collapsed || !parsed.logo_expanded || parsed.logo_favicon === '/logo.png?v=2') {
        parsed.logo_favicon = INITIAL_SETTINGS.logo_favicon;
        parsed.logo_collapsed = INITIAL_SETTINGS.logo_collapsed;
        parsed.logo_expanded = INITIAL_SETTINGS.logo_expanded;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
    }
    
    return parsed;
};

const saveSettings = (settings: SystemSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const useSystemSettings = () => {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load initial settings
        const data = getSettings();
        setSettings(data);
        setIsLoading(false);

        // Listen for storage changes (from same window)
        const handleStorageChange = () => {
            const updatedData = getSettings();
            setSettings(updatedData);
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    return { data: settings, isLoading };
};

export const useUpdateSystemSettings = () => {
    const { toast } = useToast();

    return {
        mutate: (updates: Partial<SystemSettings>) => {
            const current = getSettings();
            const updated = {
                ...current,
                ...updates,
                updated_at: new Date().toISOString(),
            };
            saveSettings(updated);
            toast({
                title: 'Sucesso',
                description: 'Configurações atualizadas com sucesso',
            });
            window.dispatchEvent(new Event('storage'));
        },
        isPending: false,
    };
};
