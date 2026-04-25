import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface UserGroup {
    id: string;
    name: string;
    description?: string;
    permissions: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface GroupMember {
    id: string;
    user_id: string;
    group_id: string;
    created_at: string;
}

export interface GroupWithMembers extends UserGroup {
    member_count?: number;
    members?: Array<{
        id: string;
        user_id: string;
        full_name: string;
    }>;
}

const GROUPS_KEY = 'bolten_user_groups';
const MEMBERS_KEY = 'bolten_group_members';

// Dados iniciais
const INITIAL_GROUPS: UserGroup[] = [
    {
        id: '1',
        name: 'Vendedores',
        description: 'Equipe de vendas',
        permissions: {
            pipeline: { read: true, write: true, delete: false },
            contacts: { read: true, write: true, delete: false },
            products: { read: true, write: false, delete: false },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

const INITIAL_MEMBERS: GroupMember[] = [
    {
        id: '1',
        user_id: '3',
        group_id: '1',
        created_at: new Date().toISOString(),
    },
];

// Helpers
const getGroups = (): UserGroup[] => {
    const stored = localStorage.getItem(GROUPS_KEY);
    if (!stored) {
        localStorage.setItem(GROUPS_KEY, JSON.stringify(INITIAL_GROUPS));
        return INITIAL_GROUPS;
    }
    return JSON.parse(stored);
};

const saveGroups = (groups: UserGroup[]) => {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
};

const getMembers = (): GroupMember[] => {
    const stored = localStorage.getItem(MEMBERS_KEY);
    if (!stored) {
        localStorage.setItem(MEMBERS_KEY, JSON.stringify(INITIAL_MEMBERS));
        return INITIAL_MEMBERS;
    }
    return JSON.parse(stored);
};

const saveMembers = (members: GroupMember[]) => {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
};

// Hooks
export const useUserGroups = () => {
    const [groups, setGroups] = useState<UserGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const data = getGroups();
        setGroups(data);
        setIsLoading(false);
    }, []);

    return { data: groups, isLoading };
};

export const useUserGroupsWithCount = () => {
    const [groups, setGroups] = useState<GroupWithMembers[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const groupsData = getGroups();
        const membersData = getMembers();

        const withCount = groupsData.map(group => ({
            ...group,
            member_count: membersData.filter(m => m.group_id === group.id).length,
        }));

        setGroups(withCount);
        setIsLoading(false);
    }, []);

    return { data: groups, isLoading };
};

export const useUserGroup = (groupId: string | undefined) => {
    const [group, setGroup] = useState<UserGroup | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!groupId) {
            setGroup(null);
            setIsLoading(false);
            return;
        }

        const groups = getGroups();
        const found = groups.find(g => g.id === groupId);
        setGroup(found || null);
        setIsLoading(false);
    }, [groupId]);

    return { data: group, isLoading };
};

export const useGroupMembers = (groupId: string | undefined) => {
    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!groupId) {
            setMembers([]);
            setIsLoading(false);
            return;
        }

        const membersData = getMembers();
        const profilesData = JSON.parse(localStorage.getItem('bolten_profiles') || '[]');

        const groupMembers = membersData
            .filter(m => m.group_id === groupId)
            .map(m => {
                const profile = profilesData.find((p: any) => p.id === m.user_id);
                return {
                    id: m.id,
                    user_id: m.user_id,
                    full_name: profile?.full_name || 'Unknown',
                };
            });

        setMembers(groupMembers);
        setIsLoading(false);
    }, [groupId]);

    return { data: members, isLoading };
};

export const useUserMemberships = (userId: string | undefined) => {
    const [memberships, setMemberships] = useState<UserGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setMemberships([]);
            setIsLoading(false);
            return;
        }

        const membersData = getMembers();
        const groupsData = getGroups();

        const userGroups = membersData
            .filter(m => m.user_id === userId)
            .map(m => groupsData.find(g => g.id === m.group_id))
            .filter(Boolean) as UserGroup[];

        setMemberships(userGroups);
        setIsLoading(false);
    }, [userId]);

    return { data: memberships, isLoading };
};

export const useCreateGroup = () => {
    const { toast } = useToast();

    return {
        mutate: (group: Omit<UserGroup, 'id' | 'created_at' | 'updated_at'>) => {
            const groups = getGroups();
            const newGroup: UserGroup = {
                ...group,
                id: Date.now().toString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            groups.push(newGroup);
            saveGroups(groups);
            toast({
                title: 'Sucesso',
                description: 'Grupo criado com sucesso',
            });
            window.dispatchEvent(new Event('storage'));
        },
        mutateAsync: async (group: Omit<UserGroup, 'id' | 'created_at' | 'updated_at'>) => {
            const groups = getGroups();
            const newGroup: UserGroup = {
                ...group,
                id: Date.now().toString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            groups.push(newGroup);
            saveGroups(groups);
            toast({
                title: 'Sucesso',
                description: 'Grupo criado com sucesso',
            });
            window.dispatchEvent(new Event('storage'));
            return newGroup;
        },
        isPending: false,
    };
};

export const useUpdateGroup = () => {
    const { toast } = useToast();

    return {
        mutate: ({ id, updates }: { id: string; updates: Partial<UserGroup> }) => {
            const groups = getGroups();
            const index = groups.findIndex(g => g.id === id);
            if (index !== -1) {
                groups[index] = { ...groups[index], ...updates, updated_at: new Date().toISOString() };
                saveGroups(groups);
                toast({
                    title: 'Sucesso',
                    description: 'Grupo atualizado com sucesso',
                });
                window.dispatchEvent(new Event('storage'));
            }
        },
        mutateAsync: async ({ id, updates }: { id: string; updates: Partial<UserGroup> }) => {
            const groups = getGroups();
            const index = groups.findIndex(g => g.id === id);
            if (index !== -1) {
                groups[index] = { ...groups[index], ...updates, updated_at: new Date().toISOString() };
                saveGroups(groups);
                toast({
                    title: 'Sucesso',
                    description: 'Grupo atualizado com sucesso',
                });
                window.dispatchEvent(new Event('storage'));
                return groups[index];
            }
            throw new Error('Grupo não encontrado');
        },
        isPending: false,
    };
};

export const useDeleteGroup = () => {
    const { toast } = useToast();

    return {
        mutate: (id: string) => {
            const groups = getGroups();
            const filtered = groups.filter(g => g.id !== id);
            saveGroups(filtered);

            // Também remove os membros desse grupo
            const members = getMembers();
            const filteredMembers = members.filter(m => m.group_id !== id);
            saveMembers(filteredMembers);

            toast({
                title: 'Sucesso',
                description: 'Grupo removido com sucesso',
            });
            window.dispatchEvent(new Event('storage'));
        },
        isPending: false,
    };
};

export const useAddGroupMember = () => {
    const { toast } = useToast();

    return {
        mutate: ({ user_id, group_id }: { user_id: string; group_id: string }) => {
            const members = getMembers();
            const newMember: GroupMember = {
                id: Date.now().toString(),
                user_id,
                group_id,
                created_at: new Date().toISOString(),
            };
            members.push(newMember);
            saveMembers(members);
            toast({
                title: 'Sucesso',
                description: 'Membro adicionado ao grupo',
            });
            window.dispatchEvent(new Event('storage'));
        },
        mutateAsync: async ({ user_id, group_id }: { user_id: string; group_id: string }) => {
            const members = getMembers();
            const newMember: GroupMember = {
                id: Date.now().toString(),
                user_id,
                group_id,
                created_at: new Date().toISOString(),
            };
            members.push(newMember);
            saveMembers(members);
            toast({
                title: 'Sucesso',
                description: 'Membro adicionado ao grupo',
            });
            window.dispatchEvent(new Event('storage'));
            return newMember;
        },
        isPending: false,
    };
};

export const useRemoveGroupMember = () => {
    const { toast } = useToast();

    return {
        mutate: ({ user_id, group_id }: { user_id: string; group_id: string }) => {
            const members = getMembers();
            const filtered = members.filter(m => !(m.user_id === user_id && m.group_id === group_id));
            saveMembers(filtered);
            toast({
                title: 'Sucesso',
                description: 'Membro removido do grupo',
            });
            window.dispatchEvent(new Event('storage'));
        },
        mutateAsync: async ({ user_id, group_id }: { user_id: string; group_id: string }) => {
            const members = getMembers();
            const filtered = members.filter(m => !(m.user_id === user_id && m.group_id === group_id));
            saveMembers(filtered);
            toast({
                title: 'Sucesso',
                description: 'Membro removido do grupo',
            });
            window.dispatchEvent(new Event('storage'));
        },
        isPending: false,
    };
};
