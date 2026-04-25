import { useEffect, useState } from 'react';
import { useProfile, useUpdateProfile, useCreateProfile } from '@/hooks/useProfiles';
import { useUserGroups, useUserMemberships, useAddGroupMember, useRemoveGroupMember } from '@/hooks/useUserGroups';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId?: string;
}

export default function UserFormModal({ open, onOpenChange, userId }: UserFormModalProps) {
    const { toast } = useToast();
    const { data: profile, isLoading: loadingProfile } = useProfile(userId);
    const { data: allGroups, isLoading: loadingGroups } = useUserGroups();
    const { data: userGroups } = useUserMemberships(userId);
    const updateProfile = useUpdateProfile();
    const createProfile = useCreateProfile();
    const addGroupMember = useAddGroupMember();
    const removeGroupMember = useRemoveGroupMember();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'manager' | 'user'>('user');
    const [isActive, setIsActive] = useState(true);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load profile data when editing
    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name);
            setRole(profile.role);
            setIsActive(profile.is_active);
        } else {
            setFullName('');
            setEmail('');
            setRole('user');
            setIsActive(true);
        }
    }, [profile]);

    // Load user's groups
    useEffect(() => {
        if (userGroups) {
            setSelectedGroups(userGroups.map((g: any) => g.id));
        } else {
            setSelectedGroups([]);
        }
    }, [userGroups]);

    const handleGroupToggle = (groupId: string) => {
        setSelectedGroups(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        );
    };

    const handleSubmit = async () => {
        if (!fullName.trim()) {
            toast({
                title: 'Erro',
                description: 'O nome é obrigatório',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            if (userId) {
                // Update existing profile
                await updateProfile.mutateAsync({
                    id: userId,
                    updates: { full_name: fullName, role, is_active: isActive },
                });

                // Update group memberships
                const currentGroups = userGroups?.map((g: any) => g.id) || [];
                const toAdd = selectedGroups.filter(g => !currentGroups.includes(g));
                const toRemove = currentGroups.filter((g: string) => !selectedGroups.includes(g));

                for (const groupId of toAdd) {
                    await addGroupMember.mutateAsync({ user_id: userId, group_id: groupId });
                }

                for (const groupId of toRemove) {
                    await removeGroupMember.mutateAsync({ user_id: userId, group_id: groupId });
                }
            } else {
                // Create new user locally
                if (!email.trim()) {
                    toast({
                        title: 'Erro',
                        description: 'O email é obrigatório para novos usuários',
                        variant: 'destructive',
                    });
                    setIsSubmitting(false);
                    return;
                }

                const newUser = {
                    id: Date.now().toString(),
                    full_name: fullName,
                    email,
                    role,
                    is_active: isActive,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                await createProfile.mutateAsync(newUser as any);

                // Add to selected groups
                for (const groupId of selectedGroups) {
                    await addGroupMember.mutateAsync({ user_id: newUser.id, group_id: groupId });
                }

                toast({
                    title: 'Sucesso',
                    description: 'Usuário criado com sucesso',
                });
            }

            onOpenChange(false);
            // Force reload
            window.location.reload();
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao salvar usuário',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = loadingProfile || loadingGroups;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {userId ? 'Editar Usuário' : 'Adicionar Usuário'}
                    </DialogTitle>
                    <DialogDescription>
                        {userId
                            ? 'Atualize as informações do usuário'
                            : 'Crie um novo usuário no sistema'}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="full-name">Nome Completo *</Label>
                            <Input
                                id="full-name"
                                placeholder="Digite o nome completo"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        {!userId && (
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="usuario@exemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="role">Função</Label>
                            <Select value={role} onValueChange={(value: any) => setRole(value)}>
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Selecione a função" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">Usuário</SelectItem>
                                    <SelectItem value="manager">Gerente</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Grupos</Label>
                            <div className="border rounded-lg p-3 space-y-2 max-h-[200px] overflow-y-auto">
                                {allGroups && allGroups.length > 0 ? (
                                    allGroups.map(group => (
                                        <div key={group.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`group-${group.id}`}
                                                checked={selectedGroups.includes(group.id)}
                                                onCheckedChange={() => handleGroupToggle(group.id)}
                                            />
                                            <label
                                                htmlFor={`group-${group.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {group.name}
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Nenhum grupo disponível
                                    </p>
                                )}
                            </div>
                        </div>

                        {userId && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is-active"
                                    checked={isActive}
                                    onCheckedChange={(checked) => setIsActive(checked as boolean)}
                                />
                                <label
                                    htmlFor="is-active"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    Usuário ativo
                                </label>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {userId ? 'Atualizar' : 'Criar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
