import { useState } from 'react';
import { useEvolutionAPI, EvolutionChat } from '@/hooks/useEvolutionAPI';
import { QRCodeConnection } from '@/components/whatsapp/QRCodeConnection';
import { EvolutionChatList } from '@/components/whatsapp/EvolutionChatList';
import { EvolutionChatWindow } from '@/components/whatsapp/EvolutionChatWindow';
import { InstanceSelector } from '@/components/whatsapp/InstanceSelector';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WhatsAppPage() {
  const {
    isConnected,
    isConnecting,
    instances,
    currentInstance,
    qrCode,
    chats,
    loading,
    connect,
    disconnect,
    fetchChats,
    fetchMessages,
    sendMessage,
    selectInstance,
    fetchInstances,
  } = useEvolutionAPI();

  const [selectedChat, setSelectedChat] = useState<EvolutionChat | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando instâncias...</p>
        </div>
      </div>
    );
  }

  // Se não está conectado, mostra a tela de conexão
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="w-full max-w-lg space-y-6">
          {/* Instance selector if there are instances */}
          {instances.length > 0 && (
            <InstanceSelector
              instances={instances}
              currentInstance={currentInstance}
              onSelect={selectInstance}
              onRefresh={fetchInstances}
            />
          )}
          
          <QRCodeConnection
            isConnected={isConnected}
            isConnecting={isConnecting}
            qrCode={qrCode}
            onConnect={() => connect()}
            onDisconnect={disconnect}
          />
        </div>
      </div>
    );
  }

  // Conectado - mostra a interface de chat
  return (
    <div className="h-full flex flex-col overflow-hidden rounded-lg border bg-card">
      {/* Header with instance info */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          {currentInstance?.profilePicUrl && (
            <img 
              src={currentInstance.profilePicUrl} 
              alt="Profile" 
              className="h-8 w-8 rounded-full"
            />
          )}
          <div>
            <p className="font-medium text-sm">
              {currentInstance?.profileName || currentInstance?.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentInstance?._count?.Chat || 0} conversas • {currentInstance?._count?.Message || 0} mensagens
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchChats}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={disconnect}>
            Desconectar
          </Button>
        </div>
      </div>
      
      {/* Chat interface */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r flex-shrink-0">
          <EvolutionChatList
            chats={chats}
            selectedId={selectedChat?.id || null}
            onSelect={setSelectedChat}
          />
        </div>
        <div className="flex-1">
          <EvolutionChatWindow
            chat={selectedChat}
            onSendMessage={sendMessage}
            fetchMessages={fetchMessages}
          />
        </div>
      </div>
    </div>
  );
}
