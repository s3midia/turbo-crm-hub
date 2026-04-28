import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useEvolutionAPI, EvolutionChat } from '@/hooks/useEvolutionAPI';
import { EvolutionChatList } from '@/components/whatsapp/EvolutionChatList';
import { EvolutionChatWindow } from '@/components/whatsapp/EvolutionChatWindow';
import { AttendanceFilters } from '@/components/whatsapp/AttendanceFilters';
import { ContactDetailsSidebar } from '@/components/whatsapp/ContactDetailsSidebar';
import { InstanceSelector } from '@/components/whatsapp/InstanceSelector';
import { Loader2, WifiOff, RefreshCw, Smartphone } from 'lucide-react';
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
    deleteInstance,
    createInstance,
    fetchChats,
    fetchMessages,
    sendMessage,
    selectInstance,
    fetchInstances,
    markChatAsOpen,
    markChatAsClosed,
  } = useEvolutionAPI();

  const location = useLocation();
  const [selectedChat, setSelectedChat] = useState<EvolutionChat | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-select chat from location state
  useEffect(() => {
    if (location.state?.phone && chats.length > 0 && !hasAutoSelected) {
      const phone = location.state.phone;
      const targetChat = chats.find(c => c.remoteJid.includes(phone));
      if (targetChat) {
        handleChatSelect(targetChat);
        setHasAutoSelected(true);
      }
    }
  }, [location.state, chats, hasAutoSelected]);

  const handleChatSelect = (chat: EvolutionChat) => {
    if (selectedChat && selectedChat.remoteJid !== chat.remoteJid) {
      markChatAsClosed(selectedChat.remoteJid);
    }
    markChatAsOpen(chat.remoteJid);
    setSelectedChat(chat);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInstances();
    if (isConnected) await fetchChats();
    setRefreshing(false);
  };

  // Loading state
  if (loading && chats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Inicializando Central de Atendimentos...</p>
        </div>
      </div>
    );
  }

  // Not connected — show connect prompt
  if (!isConnected && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-background p-6 overflow-y-auto">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-5">
            <div className="relative inline-block">
              <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-muted mx-auto shadow-inner">
                <WifiOff className="h-10 w-10 text-muted-foreground" />
              </div>
              {instances.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {instances.length}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">WhatsApp não conectado</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {instances.length > 0
                  ? `Identificamos ${instances.length} instâncias configuradas, mas nenhuma está ativa no momento.`
                  : 'Nenhuma instância encontrada. Crie uma nova conexão para começar a atender.'}
              </p>
            </div>

            <div className="flex gap-3 justify-center items-center flex-wrap pt-2">
              <Button
                size="lg"
                onClick={() => connect()}
                disabled={isConnecting}
                className="gap-2 px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              >
                <Smartphone className="h-5 w-5" />
                {isConnecting ? 'Gerando QR Code...' : 'Conectar Novo WhatsApp'}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40"
              >
                {refreshing ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                Sincronizar Status
              </Button>
            </div>
          </div>

          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <InstanceSelector
              instances={instances}
              selectedInstance={currentInstance?.name || null}
              onSelect={selectInstance}
              onRefresh={fetchInstances}
              onDelete={deleteInstance}
              onCreate={createInstance}
              loading={refreshing}
            />

            {qrCode && (
              <div className="max-w-sm mx-auto p-8 bg-card rounded-3xl border border-primary/10 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="text-center space-y-6">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Escaneie com seu WhatsApp</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Aguardando conexão...</p>
                  </div>
                  
                  <div className="p-4 bg-white rounded-2xl shadow-inner inline-block relative group">
                    <img
                      src={qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`}
                      alt="QR Code WhatsApp"
                      className="rounded-xl w-64 h-64 object-contain"
                    />
                    <div className="absolute inset-0 border-4 border-primary/5 rounded-2xl pointer-events-none group-hover:border-primary/10 transition-colors" />
                  </div>
                  
                  <p className="text-[11px] text-muted-foreground leading-relaxed px-4">
                    Abra o WhatsApp &gt; Configurações &gt; Dispositivos Conectados &gt; Conectar um Dispositivo
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      {/* 1. Left Filters Column */}
      <AttendanceFilters />

      {/* 2. Chat List Column */}
      <div className="w-[280px] lg:w-[320px] shrink-0 border-r border-border h-full overflow-hidden">
        <EvolutionChatList
          chats={chats}
          selectedId={selectedChat?.id || null}
          onSelect={handleChatSelect}
        />
      </div>

      {/* 3. Main Chat Window Column */}
      <div className="flex-1 min-w-[320px] bg-muted/20 h-full overflow-hidden relative">
        <EvolutionChatWindow
          chat={selectedChat}
          onSendMessage={sendMessage}
          fetchMessages={fetchMessages}
          instanceName={currentInstance?.name ?? null}
        />
      </div>

      {/* 4. Contact Details Sidebar */}
      <div className="shrink-0 h-full">
        <ContactDetailsSidebar chat={selectedChat} />
      </div>
    </div>
  );
}
