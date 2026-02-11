import { useState } from 'react';
import { Smartphone, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DeviceManagerProps {
    onContinue: () => void;
}

export const DeviceManager = ({ onContinue }: DeviceManagerProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleOpenWhatsAppWeb = () => {
        window.open('https://web.whatsapp.com', '_blank');
    };

    return (
        <Card className="border-orange-500/50 bg-orange-500/5">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-lg text-orange-600">Limite de Dispositivos Atingido</CardTitle>
                </div>
                <CardDescription>
                    O WhatsApp permite no máximo 4 dispositivos conectados além do celular principal.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Como resolver?</AlertTitle>
                    <AlertDescription className="space-y-2 mt-2">
                        <p className="text-sm">
                            Para conectar este dispositivo, você precisa desconectar um dos dispositivos antigos:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                            <li>Abra o WhatsApp Web em outra aba</li>
                            <li>Clique nos 3 pontinhos (⋮) no canto superior</li>
                            <li>Vá em <strong>"Dispositivos conectados"</strong></li>
                            <li>Desconecte um dispositivo que você não usa mais</li>
                            <li>Volte aqui e tente conectar novamente</li>
                        </ol>
                    </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-2">
                    <Button
                        onClick={handleOpenWhatsAppWeb}
                        className="w-full"
                        variant="default"
                    >
                        <Smartphone className="h-4 w-4 mr-2" />
                        Abrir WhatsApp Web para Gerenciar Dispositivos
                    </Button>

                    <Button
                        onClick={onContinue}
                        variant="outline"
                        className="w-full"
                    >
                        Já Desconectei um Dispositivo - Tentar Novamente
                    </Button>
                </div>

                <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                        💡 <strong>Dica:</strong> Desconecte dispositivos que você não usa mais, como computadores antigos ou navegadores que você não acessa há tempo.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
