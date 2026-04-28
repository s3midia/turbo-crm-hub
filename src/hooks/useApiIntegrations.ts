import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ApiIntegrations {
    gemini_keys: { id: string; key: string }[];
    evolution_api_url?: string;
    supabase_url?: string;
    openai_key?: string;
    apify_key?: string;
    google_places_key?: string;
    huggingface_key?: string;
    groq_key?: string;
    llm_priority?: 'gemini' | 'groq' | 'huggingface';
    llm_paused?: Record<string, boolean>;
}

const SETTINGS_KEY = 'bolten_api_integrations';

const INITIAL_SETTINGS: ApiIntegrations = {
    gemini_keys: [],
    llm_priority: 'gemini',
    llm_paused: {},
};

const getSettings = (): ApiIntegrations => {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (!stored) {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
            return INITIAL_SETTINGS;
        }
        return JSON.parse(stored);
    } catch (e) {
        console.error("Failed to parse API integrations from localStorage", e);
        return INITIAL_SETTINGS;
    }
};

const saveSettings = (settings: ApiIntegrations) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const useApiIntegrations = () => {
    const [settings, setSettings] = useState<ApiIntegrations | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const data = getSettings();
        setSettings(data);
        setIsLoading(false);

        const handleStorageChange = () => {
            setSettings(getSettings());
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('api-integrations-updated', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('api-integrations-updated', handleStorageChange);
        };
    }, []);

    return { data: settings, isLoading };
};

export const useUpdateApiIntegrations = () => {
    const { toast } = useToast();

    return {
        mutate: (updates: Partial<ApiIntegrations>, showToast = true) => {
            const current = getSettings();
            const updated = {
                ...current,
                ...updates,
            };
            saveSettings(updated);
            
            if (showToast) {
                toast({
                    title: 'Sucesso',
                    description: 'Integrações atualizadas com sucesso',
                });
            }
            
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('api-integrations-updated'));
        },
        isPending: false,
    };
};
