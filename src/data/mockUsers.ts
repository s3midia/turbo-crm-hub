export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'vendedor';
    avatar?: string;
}

export const mockUsers: User[] = [
    {
        id: '1',
        name: 'João Silva',
        email: 'joao@crm.com',
        role: 'vendedor',
        avatar: '👨‍💼',
    },
    {
        id: '2',
        name: 'Maria Santos',
        email: 'maria@crm.com',
        role: 'vendedor',
        avatar: '👩‍💼',
    },
    {
        id: '3',
        name: 'Pedro Costa',
        email: 'pedro@crm.com',
        role: 'vendedor',
        avatar: '👨‍💻',
    },
    {
        id: '4',
        name: 'Ana Oliveira',
        email: 'ana@crm.com',
        role: 'vendedor',
        avatar: '👩‍💻',
    },
    {
        id: 'admin',
        name: 'Gerente Admin',
        email: 'admin@crm.com',
        role: 'admin',
        avatar: '👔',
    },
];

export const getUserById = (id: string): User | undefined => {
    return mockUsers.find(user => user.id === id);
};

export const getVendedores = (): User[] => {
    return mockUsers.filter(user => user.role === 'vendedor');
};
