import { useEffect, useState } from 'react';
import { useUserGroup, useCreateGroup, useUpdateGroup, useGroupMembers } from '@/hooks/useUserGroups';
import { useProfiles } from '@/hooks/useProfiles';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GroupFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId?: string;
}

const MODULES = [
    { id: 'dashboard', name: 'Dashboard', category: 'Geral' },
    { id: 'pipeline', name: 'Pipeline', category: 'Vendas' },
    { id: 'contacts', name: 'Contatos', category: 'Geral' },
    { id: 'products', name: 'Produtos', category: 'Catálogo' },
    { id: 'tasks', name: 'Tarefas', category: 'Produtividade' },
    { id: 'whatsapp', name: 'WhatsApp', category: 'Comunicação' },
    { id: 'reports', name: 'Relatórios', category: 'Análise' },
    { id: 'settings', name: 'Configurações', category: 'Sistema' },
];

export default function GroupFormModal({ open, onOpenChange, groupId }: GroupFormModalProps) {
    const { toast } = useToast();
    const { data: group, isLoading: loadingGroup } = useUserGroup(groupId);
    const { data: allProfiles, isLoading: loadingProfiles } = useProfiles();
    const { data: members } = useGroupMembers(groupId);
    const createGroup = useCreateGroup();
    const updateGroup = useUpdateGroup();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [permissions, setPermissions] = useState<Record<string, any>>({});
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load group data when editing
    useEffect(() => {
        if (group) {
            setName(group.name);
            setDescription(group.description || '');
            setPermissions(group.permissions || {});
        } else {
            setName('');
            setDescription('');
            setPermissions({});
        }
    }, [group]);

    // Load group members
    useEffect(() => {
        if (members) {
            setSelectedMembers(members.map(m => m.user_id));
        } else {
            setSelectedMembers([]);
        }
    }, [members]);

    const handleMemberToggle = (userId: string) => {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handlePermissionToggle = (moduleId: string, permission: 'read' | 'write' | 'delete') => {
        setPermissions(prev => ({
            ...prev,
            [moduleId]: {
                ...(prev[moduleId] || {}),
                [permission]: !prev[moduleId]?.[permission],
            },
        }));
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast({
                title: 'Erro',
                description: 'O nome do grupo é obrigatório',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            if (groupId) {
                // Update existing group
                await updateGroup.mutateAsync({
                    id: groupId,
                    updates: { name, description, permissions },
                });
            } else {
                // Create new group
                await createGroup.mutateAsync({
                    name,
                    description,
                    permissions,
                });
            }

            onOpenChange(false);
        } catch (error: any) {
            // Error is already handled by the mutation hooks
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = loadingGroup || loadingProfiles;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {groupId ? 'Editar Grupo' : 'Adicionar Grupo'}
                    </DialogTitle>
                    <DialogDescription>
                        {groupId
                            ? 'Atualize as informações do grupo'
                            : 'Crie um novo grupo de usuários'}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Grupo *</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Vendedores"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                placeholder="Descrição do grupo"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Permissões por Módulo</Label>
                            <div className="border rounded-lg">
                                <div className="grid grid-cols-4 gap-2 p-3 border-b bg-muted/50 font-medium text-sm">
                                    <div>Módulo</div>
                                    <div className="text-center">Ler</div>
                                    <div className="text-center">Editar</div>
                                    <div className="text-center">Deletar</div>
                                </div>
                                <div className="divide-y max-h-[300px] overflow-y-auto">
                                    {MODULES.map(module => (
                                        <div key={module.id} className="grid grid-cols-4 gap-2 p-3 items-center hover:bg-muted/30">
                                            <div className="text-sm">
                                                <div className="font-medium">{module.name}</div>
                                                <div className="text-xs text-muted-foreground">{module.category}</div>
                                            </div>
                                            <div className="flex justify-center">
                                                <Checkbox
                                                    checked={permissions[module.id]?.read || false}
                                                    onCheckedChange={() => handlePermissionToggle(module.id, 'read')}
                                                />
                                            </div>
                                            <div className="flex justify-center">
                                                <Checkbox
                                                    checked={permissions[module.id]?.write || false}
                                                    onCheckedChange={() => handlePermissionToggle(module.id, 'write')}
                                                />
                                            </div>
                                            <div className="flex justify-center">
                                                <Checkbox
                                                    checked={permissions[module.id]?.delete || false}
                                                    onCheckedChange={() => handlePermissionToggle(module.id, 'delete')}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {groupId ? 'Atualizar' : 'Criar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
