import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: 'admin' | 'manager' | 'user';
    is_active: boolean;
    created_at: string;
    updated_at: string;
    email?: string;
    whatsapp?: string;
}

const STORAGE_KEY = 's3_midia_profiles';

// Dados iniciais mockados
const INITIAL_PROFILES: Profile[] = [
    {
        id: '1',
        full_name: 'S3 Mídia',
        email: 's3midia@exemplo.com',
        role: 'admin',
        is_active: true,
        whatsapp: '+55 73 9 9999-0001',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=S3%20Midia&backgroundColor=3b82f6',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '2',
        full_name: 'Jefferson',
        email: 'jefersonitabuna@gmail.com',
        role: 'admin',
        is_active: true,
        whatsapp: '+55 73 9 9999-0002',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Jefferson&backgroundColor=10b981',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '3',
        full_name: 'Douglas Souza',
        email: 'douglas@exemplo.com',
        role: 'user',
        is_active: true,
        whatsapp: '+55 73 9 9999-0003',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Douglas%20Souza&backgroundColor=f59e0b',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

// Helper functions
const getProfiles = (): Profile[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROFILES));
        return INITIAL_PROFILES;
    }
    return JSON.parse(stored);
};

const saveProfiles = (profiles: Profile[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
};

// Hooks
export const useProfiles = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const data = getProfiles();
        setProfiles(data);
        setIsLoading(false);
    }, []);

    return { data: profiles, isLoading };
};

export const useProfilesWithEmail = () => {
    return useProfiles(); // Mesma coisa para localStorage
};

export const useProfile = (userId: string | undefined) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setProfile(null);
            setIsLoading(false);
            return;
        }

        const profiles = getProfiles();
        const found = profiles.find(p => p.id === userId);
        setProfile(found || null);
        setIsLoading(false);
    }, [userId]);

    return { data: profile, isLoading };
};

export const useCreateProfile = () => {
    const { toast } = useToast();

    return {
        mutate: (profile: Profile) => {
            const profiles = getProfiles();
            profiles.push(profile);
            saveProfiles(profiles);
            toast({
                title: 'Sucesso',
                description: 'Perfil criado com sucesso',
            });
            window.dispatchEvent(new Event('storage'));
        },
        mutateAsync: async (profile: Profile) => {
            const profiles = getProfiles();
            profiles.push(profile);
            saveProfiles(profiles);
            toast({
                title: 'Sucesso',
                description: 'Perfil criado com sucesso',
            });
            window.dispatchEvent(new Event('storage'));
            return profile;
        },
        isPending: false,
    };
};

export const useUpdateProfile = () => {
    const { toast } = useToast();

    return {
        mutate: ({ id, updates }: { id: string; updates: Partial<Profile> }) => {
            const profiles = getProfiles();
            const index = profiles.findIndex(p => p.id === id);
            if (index !== -1) {
                profiles[index] = { ...profiles[index], ...updates, updated_at: new Date().toISOString() };
                saveProfiles(profiles);
                toast({
                    title: 'Sucesso',
                    description: 'Perfil atualizado com sucesso',
                });
                window.dispatchEvent(new Event('storage'));
            }
        },
        mutateAsync: async ({ id, updates }: { id: string; updates: Partial<Profile> }) => {
            const profiles = getProfiles();
            const index = profiles.findIndex(p => p.id === id);
            if (index !== -1) {
                profiles[index] = { ...profiles[index], ...updates, updated_at: new Date().toISOString() };
                saveProfiles(profiles);
                toast({
                    title: 'Sucesso',
                    description: 'Perfil atualizado com sucesso',
                });
                window.dispatchEvent(new Event('storage'));
                return profiles[index];
            }
            throw new Error('Perfil não encontrado');
        },
        isPending: false,
    };
};

export const useToggleUserStatus = () => {
    const { toast } = useToast();

    return {
        mutate: ({ id, is_active }: { id: string; is_active: boolean }) => {
            const profiles = getProfiles();
            const index = profiles.findIndex(p => p.id === id);
            if (index !== -1) {
                profiles[index].is_active = is_active;
                profiles[index].updated_at = new Date().toISOString();
                saveProfiles(profiles);
                toast({
                    title: 'Sucesso',
                    description: `Usuário ${is_active ? 'ativado' : 'desativado'} com sucesso`,
                });
                window.dispatchEvent(new Event('storage'));
            }
        },
        isPending: false,
    };
};

export const useDeleteProfile = () => {
    const { toast } = useToast();

    return {
        mutate: (id: string) => {
            const profiles = getProfiles();
            const filtered = profiles.filter(p => p.id !== id);
            saveProfiles(filtered);
            toast({
                title: 'Sucesso',
                description: 'Usuário removido com sucesso',
            });
            window.dispatchEvent(new Event('storage'));
        },
        isPending: false,
    };
};
