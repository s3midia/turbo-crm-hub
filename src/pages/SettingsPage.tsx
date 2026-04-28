import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GeneralSettings from '@/components/settings/GeneralSettings';
import UsersPermissions from '@/components/settings/UsersPermissions';
import Integrations from '@/components/settings/Integrations';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
                <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">Configurações Gerais</TabsTrigger>
                    <TabsTrigger value="users">Usuários e Permissões</TabsTrigger>
                    <TabsTrigger value="integrations">Integrações</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-6">
                    <GeneralSettings />
                </TabsContent>

                <TabsContent value="users" className="mt-6">
                    <UsersPermissions />
                </TabsContent>

                <TabsContent value="integrations" className="mt-6">
                    <Integrations />
                </TabsContent>
            </Tabs>
        </div>
    );
}
