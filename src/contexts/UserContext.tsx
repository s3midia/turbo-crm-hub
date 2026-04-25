import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mockUsers, User } from '@/data/mockUsers';

interface UserContextType {
    currentUser: User;
    setCurrentUser: (user: User) => void;
    isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User>(mockUsers[4]); // Gerente Admin por padrão

    const isAdmin = currentUser.role === 'admin';

    return (
        <UserContext.Provider value={{ currentUser, setCurrentUser, isAdmin }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within UserProvider');
    }
    return context;
};
