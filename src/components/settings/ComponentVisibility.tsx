import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const COMPONENTS = [
    { id: 'dashboard', name: 'Dashboard', category: 'Geral' },
    { id: 'pipeline', name: 'Gestão de Oportunidades', category: 'Gestão de Oportunidades' },
    { id: 'contacts', name: 'Gestão de Contatos', category: 'Gestão de Contatos' },
    { id: 'products', name: 'Gestão de Produtos', category: 'Gestão de Produtos' },
    { id: 'tasks', name: 'Gestão de Tarefas', category: 'Gestão de Tarefas' },
    { id: 'whatsapp', name: 'WhatsApp', category: 'WhatsApp' },
    { id: 'reports', name: 'Relatórios', category: 'Relatórios' },
];

export default function ComponentVisibility() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Visibilidade do Parceiro</CardTitle>
                <CardDescription>
                    Controle quais componentes seu parceiro pode ver e gerenciar.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome do Componente</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-center">Acesso do Parceiro</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {COMPONENTS.map((component) => (
                            <TableRow key={component.id}>
                                <TableCell className="font-medium">{component.name}</TableCell>
                                <TableCell className="text-muted-foreground">{component.category}</TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Switch
                                            id={`component-${component.id}`}
                                            defaultChecked={component.id !== 'pipeline'}
                                        />
                                        <label htmlFor={`component-${component.id}`} className="text-sm">
                                            {component.id !== 'pipeline' ? 'Sim' : 'Não'}
                                        </label>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        <strong>Nota:</strong> As alterações de visibilidade são aplicadas imediatamente e afetam
                        todos os usuários do parceiro. Use com cuidado.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
