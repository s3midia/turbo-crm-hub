import { useState } from 'react';
import { useEvolutionAPI, EvolutionChat } from '@/hooks/useEvolutionAPI';
import { QRCodeConnection } from '@/components/whatsapp/QRCodeConnection';
import { EvolutionChatList } from '@/components/whatsapp/EvolutionChatList';
import { EvolutionChatWindow } from '@/components/whatsapp/EvolutionChatWindow';
import { InstanceSelector } from '@/components/whatsapp/InstanceSelector';
import { Loader2, Settings, Smartphone } from 'lucide-react';
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
    markChatAsOpen,
    markChatAsClosed,
  } = useEvolutionAPI();

  const [selectedChat, setSelectedChat] = useState<EvolutionChat | null>(null);

  const handleChatSelect = (chat: EvolutionChat) => {
    // Fechar chat anterior
    if (selectedChat && selectedChat.remoteJid !== chat.remoteJid) {
      markChatAsClosed(selectedChat.remoteJid);
    }
    // Abrir novo chat (zera unread_count)
    markChatAsOpen(chat.remoteJid);
    setSelectedChat(chat);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-wa-bg-main">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-wa-primary mx-auto" />
          <p className="text-wa-text-muted">Carregando instâncias...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full p-6 bg-wa-bg-main">
        <div className="w-full max-w-lg space-y-6">
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

  return (
    <div className="flex h-full w-full bg-wa-bg-main overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 flex flex-col border-r border-wa-border bg-wa-bg-main">
        {/* Sidebar Header */}
        <div className="shrink-0 px-4 py-3 bg-wa-bg-main border-none flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-wa-border bg-wa-surface px-4 py-2 text-xs font-bold text-wa-text-main truncate max-w-[200px] transition-all hover:bg-wa-border/50 shadow-sm"
          >
            <Smartphone className="h-4 w-4 shrink-0 text-accent" />
            <span className="truncate uppercase tracking-wider">{currentInstance?.profileName || currentInstance?.name}</span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-wa-text-muted hover:text-accent rounded-full"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          <EvolutionChatList
            chats={chats}
            selectedId={selectedChat?.id || null}
            onSelect={handleChatSelect}
          />
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-wa-bg-subtle">
        <EvolutionChatWindow
          chat={selectedChat}
          onSendMessage={sendMessage}
          fetchMessages={fetchMessages}
          instanceName={currentInstance?.name ?? null}
        />
      </main>
    </div>
  );
}
