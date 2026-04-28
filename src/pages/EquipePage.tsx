import React, { useState } from "react";
import { 
    Users, 
    UserPlus, 
    Search, 
    MoreVertical, 
    Mail, 
    Smartphone, 
    Shield, 
    ToggleLeft, 
    ToggleRight,
    Edit2,
    Trash2
} from "lucide-react";
import { 
    useProfiles, 
    useCreateProfile, 
    useUpdateProfile, 
    useDeleteProfile, 
    useToggleUserStatus,
    Profile
} from "@/hooks/useProfiles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EquipePage() {
    const { data: profiles, isLoading } = useProfiles();
    const createProfile = useCreateProfile();
    const updateProfile = useUpdateProfile();
    const deleteProfile = useDeleteProfile();
    const toggleStatus = useToggleUserStatus();
    
    const [search, setSearch] = useState("");

    const filteredProfiles = profiles?.filter(p => 
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase())
    );

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'manager': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[hsl(265,85%,60%,0.15)] flex items-center justify-center">
                        <Users className="w-6 h-6 text-[hsl(265,85%,65%)]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground leading-tight">Gestão da Equipe</h1>
                        <p className="text-[12px] text-muted-foreground">Gerencie membros, permissões e status da equipe</p>
                    </div>
                </div>
                <Button className="bg-[hsl(265,85%,60%)] hover:bg-[hsl(265,85%,55%)] gap-2">
                    <UserPlus className="w-4 h-4" />
                    Novo Membro
                </Button>
            </div>

            <div className="flex-1 p-6 space-y-6">
                {/* Search & Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nome ou e-mail..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-[hsl(265,85%,60%)]"
                        />
                    </div>
                </div>

                {/* Users List */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border bg-[hsl(224,18%,14%,0.5)]">
                                <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Membro</th>
                                <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Cargo</th>
                                <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">WhatsApp</th>
                                <th className="px-6 py-4 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Status</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[hsl(224,18%,18%)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        Carregando membros...
                                    </td>
                                </tr>
                            ) : filteredProfiles?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        Nenhum membro encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredProfiles?.map((user) => (
                                    <tr key={user.id} className="hover:bg-[hsl(224,18%,15%,0.3)] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[hsl(224,18%,20%)] overflow-hidden shrink-0 border border-[hsl(224,18%,25%)]">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[hsl(220,10%,60%)] font-bold text-xs">
                                                            {user.full_name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-foreground truncate">{user.full_name}</p>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                        <Mail className="w-3 h-3" />
                                                        <span className="truncate">{user.email || 'Sem e-mail'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={`font-semibold capitalize text-[10px] ${getRoleColor(user.role)}`}>
                                                <Shield className="w-3 h-3 mr-1" />
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-[13px] text-[hsl(220,10%,70%)] font-medium">
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="w-3.5 h-3.5 text-[hsl(142,70%,55%)]" />
                                                {user.whatsapp || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => toggleStatus.mutate({ id: user.id, is_active: !user.is_active })}
                                                className={`flex items-center gap-2 text-[12px] font-semibold transition-colors ${
                                                    user.is_active ? 'text-[hsl(142,70%,55%)]' : 'text-[hsl(0,70%,60%)]'
                                                }`}
                                            >
                                                {user.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5 opacity-50" />}
                                                {user.is_active ? 'Ativo' : 'Inativo'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 bg-muted border-border text-foreground">
                                                    <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-[hsl(224,18%,22%)] focus:text-foreground">
                                                        <Edit2 className="w-4 h-4 text-[hsl(265,85%,75%)]" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => deleteProfile.mutate(user.id)}
                                                        className="gap-2 cursor-pointer text-red-400 focus:bg-[hsl(0,70%,60%,0.1)] focus:text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
