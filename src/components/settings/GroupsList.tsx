import { useState } from 'react';
import { useUserGroupsWithCount, useDeleteGroup } from '@/hooks/useUserGroups';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import GroupFormModal from './GroupFormModal';

export default function GroupsList() {
    const { data: groups, isLoading } = useUserGroupsWithCount();
    const deleteGroup = useDeleteGroup();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<string | undefined>();

    const handleEdit = (groupId: string) => {
        setSelectedGroupId(groupId);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedGroupId(undefined);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (groupId: string) => {
        setGroupToDelete(groupId);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (groupToDelete) {
            deleteGroup.mutate(groupToDelete);
            setDeleteDialogOpen(false);
            setGroupToDelete(undefined);
        }
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
                            <CardTitle>Grupos de Usuários</CardTitle>
                            <CardDescription>
                                Gerencie os grupos de usuários.
                            </CardDescription>
                        </div>
                        <Button onClick={handleAdd}>
                            <Plus className="h-4 w-4 mr-2" />
                            Grupo
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome do Grupo</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Membros</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groups?.map((group) => (
                                <TableRow key={group.id}>
                                    <TableCell className="font-medium">{group.name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {group.description || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {group.member_count || 0} {group.member_count === 1 ? 'membro' : 'membros'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(group.id)}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteClick(group.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!groups || groups.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        Nenhum grupo encontrado. Clique em "+ Grupo" para adicionar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <GroupFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                groupId={selectedGroupId}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
