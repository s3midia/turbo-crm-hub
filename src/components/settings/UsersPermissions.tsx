import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UsersList from './UsersList';
import GroupsList from './GroupsList';
import ComponentVisibility from './ComponentVisibility';

export default function UsersPermissions() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Gestão de Acesso</h2>
                <p className="text-muted-foreground">
                    Gerencie os acessos ao seu projeto.
                </p>
            </div>

            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="users">Usuários</TabsTrigger>
                    <TabsTrigger value="groups">Grupos de Usuários</TabsTrigger>
                    <TabsTrigger value="visibility">Visibilidade</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="mt-6">
                    <UsersList />
                </TabsContent>

                <TabsContent value="groups" className="mt-6">
                    <GroupsList />
                </TabsContent>

                <TabsContent value="visibility" className="mt-6">
                    <ComponentVisibility />
                </TabsContent>
            </Tabs>
        </div>
    );
}
