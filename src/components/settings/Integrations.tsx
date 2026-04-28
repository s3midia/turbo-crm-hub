import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Database, Mail, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const INTEGRATIONS = [
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        description: 'Conecte suas conversas do WhatsApp',
        icon: MessageSquare,
        status: 'configured',
    },
    {
        id: 'supabase',
        name: 'Supabase',
        description: 'Banco de dados e autenticação',
        icon: Database,
        status: 'configured',
    },
    {
        id: 'email',
        name: 'Email',
        description: 'Configurações de envio de email',
        icon: Mail,
        status: 'not_configured',
    },
];

export default function Integrations() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Integrações</h2>
                <p className="text-muted-foreground">
                    Configure as integrações do sistema
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {INTEGRATIONS.map((integration) => {
                    const Icon = integration.icon;
                    return (
                        <Card key={integration.id}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-accent/10">
                                        <Icon className="h-5 w-5 text-accent" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{integration.name}</CardTitle>
                                        {integration.status === 'configured' ? (
                                            <span className="text-xs text-green-600">✓ Configurado</span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Não configurado</span>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="mb-4">
                                    {integration.description}
                                </CardDescription>
                                <Button variant="outline" size="sm" className="w-full">
                                    {integration.status === 'configured' ? 'Gerenciar' : 'Configurar'}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}

                <Card className="border-dashed">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                                <Plus className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <CardTitle className="text-base">Nova Integração</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="mb-4">
                            Adicione uma nova integração ao sistema
                        </CardDescription>
                        <Button variant="outline" size="sm" className="w-full" disabled>
                            Em breve
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
