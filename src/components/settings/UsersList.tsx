import { useState } from 'react';
import { useProfilesWithEmail, useToggleUserStatus } from '@/hooks/useProfiles';
import { useUserMemberships } from '@/hooks/useUserGroups';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Power } from 'lucide-react';
import UserFormModal from './UserFormModal';

export default function UsersList() {
    const { data: profiles, isLoading } = useProfilesWithEmail();
    const toggleStatus = useToggleUserStatus();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

    const handleEdit = (userId: string) => {
        setSelectedUserId(userId);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedUserId(undefined);
        setIsModalOpen(true);
    };

    const handleToggleStatus = (userId: string, currentStatus: boolean) => {
        toggleStatus.mutate({ id: userId, is_active: !currentStatus });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Usuários</CardTitle>
                            <CardDescription>
                                Gerencie os acessos ao seu projeto.
                            </CardDescription>
                        </div>
                        <Button onClick={handleAdd}>
                            <Plus className="h-4 w-4 mr-2" />
                            Usuário
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Grupos</TableHead>
                                <TableHead>Licença</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profiles?.map((profile) => (
                                <UserRow
                                    key={profile.id}
                                    profile={profile}
                                    onEdit={handleEdit}
                                    onToggleStatus={handleToggleStatus}
                                />
                            ))}
                            {(!profiles || profiles.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                        Nenhum usuário encontrado. Clique em "+ Usuário" para adicionar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <UserFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                userId={selectedUserId}
            />
        </>
    );
}

function UserRow({
    profile,
    onEdit,
    onToggleStatus,
}: {
    profile: any;
    onEdit: (userId: string) => void;
    onToggleStatus: (userId: string, currentStatus: boolean) => void;
}) {
    const { data: groups } = useUserMemberships(profile.id);

    return (
        <TableRow>
            <TableCell className="font-medium">{profile.full_name}</TableCell>
            <TableCell>{profile.email || '-'}</TableCell>
            <TableCell>
                <div className="flex gap-1 flex-wrap">
                    {groups && groups.length > 0 ? (
                        groups.map((group: any) => (
                            <Badge key={group.id} variant="secondary" className="text-xs">
                                {group.name}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                    )}
                </div>
            </TableCell>
            <TableCell>
                {profile.is_active ? (
                    <Badge variant="default" className="bg-green-600">
                        <Power className="h-3 w-3 mr-1" />
                        Ativo
                    </Badge>
                ) : (
                    <Badge variant="secondary">
                        <Power className="h-3 w-3 mr-1" />
                        Inativo
                    </Badge>
                )}
            </TableCell>
            <TableCell className="text-right space-x-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(profile.id)}
                >
                    Editar
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleStatus(profile.id, profile.is_active)}
                >
                    {profile.is_active ? 'Desativar' : 'Ativar'}
                </Button>
            </TableCell>
        </TableRow>
    );
}
