import { useState } from 'react';
import { QrCode, Smartphone, RefreshCw, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeviceManager } from './DeviceManager';

interface QRCodeConnectionProps {
  isConnected: boolean;
  isConnecting: boolean;
  qrCode: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  deviceLimitError?: boolean;
}

export const QRCodeConnection = ({
  isConnected,
  isConnecting,
  qrCode,
  onConnect,
  onDisconnect,
  deviceLimitError = false,
}: QRCodeConnectionProps) => {
  // Se atingiu limite de dispositivos, mostrar gerenciador
  if (deviceLimitError) {
    return <DeviceManager onContinue={onConnect} />;
  }

  if (isConnected) {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-500" />
            <CardTitle className="text-lg text-green-600">WhatsApp Conectado</CardTitle>
          </div>
          <CardDescription>
            Seu WhatsApp está conectado e pronto para uso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={onDisconnect} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Desconectar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Conectar WhatsApp</CardTitle>
        </div>
        <CardDescription>
          Escaneie o QR Code com seu WhatsApp para conectar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrCode ? (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg shadow-inner">
              <img
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                className="w-48 h-48"
              />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Abra o WhatsApp no seu celular
              </p>
              <p className="text-sm text-muted-foreground">
                Vá em <strong>Dispositivos Conectados</strong> → <strong>Conectar Dispositivo</strong>
              </p>
              {isConnecting && (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Aguardando conexão...</span>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={onConnect} disabled={isConnecting}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Gerar Novo QR Code
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
              <QrCode className="h-16 w-16 text-muted-foreground/50" />
            </div>
            <Button onClick={onConnect} disabled={isConnecting} size="lg">
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando QR Code...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Gerar QR Code
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
