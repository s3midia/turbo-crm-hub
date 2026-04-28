import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mapWithConcurrency, sleep } from '@/lib/async';

export interface EvolutionChat {
  id: string;
  remoteJid: string;
  name?: string;
  profilePicUrl?: string;
  lastMessage?: string;
  lastMessageTimestamp?: number;
  isFromMe?: boolean;
  unreadCount?: number;
}

export interface EvolutionMessage {
  id: string;
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text?: string;
    };
  };
  messageTimestamp?: number;
}

export interface EvolutionInstance {
  id: string;
  name: string;
  connectionStatus: 'open' | 'close' | 'connecting';
  ownerJid?: string;
  profileName?: string;
  profilePicUrl?: string;
  _count?: {
    Chat: number;
    Contact: number;
    Message: number;
  };
}

const INSTANCE_STORAGE_KEY = 'whatsapp_selected_instance';

export const useEvolutionAPI = (defaultInstanceName = 'crm-turbo') => {
  const [instanceName, setInstanceName] = useState(() => {
    return localStorage.getItem(INSTANCE_STORAGE_KEY) || defaultInstanceName;
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [currentInstance, setCurrentInstance] = useState<EvolutionInstance | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [chats, setChats] = useState<EvolutionChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceLimitError, setDeviceLimitError] = useState(false);
  const { toast } = useToast();

  // Avoid flooding the backend function with a burst of requests (which can cause intermittent BOOT_ERROR/503).
  const profilePicCacheRef = useRef<Map<string, string | null>>(new Map());
  const inflightProfilePicsRef = useRef<Set<string>>(new Set());

  const isRetryableInvokeError = (err: unknown) => {
    const anyErr = err as any;
    const message = String(anyErr?.message ?? '');
    const name = String(anyErr?.name ?? '');

    // Supabase JS often throws FunctionsHttpError with a generic message when it receives 503/BOOT_ERROR.
    return (
      name.includes('FunctionsHttpError') ||
      message.includes('BOOT_ERROR') ||
      message.includes('Function failed to start') ||
      message.includes('non-2xx') ||
      message.includes('503')
    );
  };

  const callEvolutionAPI = useCallback(async (action: string, instance?: string, data?: any) => {
    const targetInstance = instance || instanceName;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Calling Evolution API: ${action}, instance: ${targetInstance}`);
        const { data: response, error } = await supabase.functions.invoke('evolution-api', {
          body: { action, instanceName: targetInstance, data },
        });

        if (error) throw error;
        console.log(`Evolution API Response (${action}):`, response);
        return response;
      } catch (err: any) {
        const retryable = attempt < maxAttempts && isRetryableInvokeError(err);
        console.error(`Evolution API Error (${action}) [attempt ${attempt}/${maxAttempts}]:`, err);

        if (!retryable) throw err;
        await sleep(250 * attempt);
      }
    }
  }, [instanceName]);

  // Fetch all instances
  const fetchInstances = useCallback(async () => {
    try {
      const response = await callEvolutionAPI('fetchInstances');

      if (response?.error) {
        console.error('Error fetching instances:', response.message);
        return [];
      }

      // Convert object to array
      const instanceList: EvolutionInstance[] = [];
      for (const key in response) {
        if (key !== 'success' && response[key]?.name) {
          instanceList.push(response[key]);
        }
      }

      setInstances(instanceList);

      // Persistence: Trust localStorage first, then connected, then none
      const stored = localStorage.getItem(INSTANCE_STORAGE_KEY);
      const target = instanceList.find(i => i.name === stored) || 
                     instanceList.find(i => i.connectionStatus === 'open');

      if (target) {
        setCurrentInstance(target);
        setInstanceName(target.name);
        setIsConnected(target.connectionStatus === 'open');
        console.log('Selected focus instance:', target.name);
      } else {
        setIsConnected(false);
      }

      return instanceList;
    } catch (error) {
      console.error('Error fetching instances:', error);
      return [];
    }
  }, [callEvolutionAPI]);

  // Logout/Disconnect logic
  const disconnect = useCallback(async () => {
    try {
      await callEvolutionAPI('logout', currentInstance?.name);
      setIsConnected(false);
      setCurrentInstance(null);
      setQrCode(null);
      setChats([]);
      toast({
        title: 'Desconectado',
        description: 'WhatsApp desconectado com sucesso',
      });
      await fetchInstances();
    } catch (error: any) {
      toast({
        title: 'Erro ao desconectar',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [callEvolutionAPI, currentInstance, fetchInstances, toast]);

  // Delete instance (permanent)
  const deleteInstance = useCallback(async (name: string) => {
    try {
      console.log('Deleting instance:', name);
      // Evolution API logic for deletion often uses 'logout' or a specific delete endpoint
      // We should use 'deleteInstance' to completely remove it from Evolution API
      await callEvolutionAPI('deleteInstance', name);
      
      toast({
        title: 'Instância removida',
        description: `Conexão ${name} foi encerrada e removida.`,
      });
      
      if (instanceName === name) {
        localStorage.removeItem(INSTANCE_STORAGE_KEY);
      }
      
      await fetchInstances();
    } catch (error: any) {
      console.error('Delete instance error:', error);
    }
  }, [callEvolutionAPI, fetchInstances, instanceName, toast]);

  // Create manual instance
  const createInstance = useCallback(async (name: string) => {
    try {
      console.log('Creating instance:', name);
      const response = await callEvolutionAPI('createInstance', name);
      
      if (response?.error) {
        throw new Error(response.message || 'Erro ao criar instância');
      }

      toast({
        title: 'Sucesso',
        description: `Instância ${name} iniciada!`,
      });
      
      setInstanceName(name);
      localStorage.setItem(INSTANCE_STORAGE_KEY, name);
      await fetchInstances();
      
      // se a criação retornar um QR Code imediatamente, salva no state:
      if (response?.qrcode?.base64) {
        setQrCode(response.qrcode.base64);
        setIsConnecting(true); // inicia o polling para conferir conexão
      } else if (response?.hash?.qrcode) {
        setQrCode(response.hash.qrcode);
        setIsConnecting(true);
      }
      
      return response;
    } catch (error: any) {
      toast({
        title: 'Erro ao criar',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [callEvolutionAPI, fetchInstances, toast]);

  // Get QR code for instance
  const getQrCode = useCallback(async (instance?: string) => {
    try {
      setIsConnecting(true);
      setError(null);

      const targetInstance = instance || instanceName;
      console.log('Getting QR code for:', targetInstance);

      const response = await callEvolutionAPI('getQrCode', targetInstance);

      if (response?.error === 'INSTANCE_NOT_FOUND') {
        // Create instance first
        const createResponse = await callEvolutionAPI('createInstance', targetInstance);
        if (createResponse?.qrcode?.base64) {
          setQrCode(createResponse.qrcode.base64);
          return createResponse;
        }
      }

      const qr = response?.base64 || response?.qrcode?.base64 || response?.code;
      if (qr) {
        setQrCode(qr);
        toast({
          title: 'QR Code gerado',
          description: 'Escaneie com seu WhatsApp',
        });
      } else {
        // If no QR code was returned, we must reset the connecting state
        // This might happen if the instance is already connecting or stuck
        setIsConnecting(false);
        if (response?.instance?.state !== 'open') {
          toast({
            title: 'Erro ao gerar QR Code',
            description: 'A instância pode estar travada. Tente apagá-la e recriar.',
            variant: 'destructive',
          });
        }
      }

      return response;
    } catch (error: any) {
      console.error('Get QR code error:', error);
      setError(error.message);
      setIsConnecting(false);
      throw error;
    }
  }, [callEvolutionAPI, instanceName, toast]);

  // Connect
  const connect = useCallback(async (instance?: string) => {
    try {
      setError(null);
      setDeviceLimitError(false); // Reset device limit error on new attempt
      await getQrCode(instance);
    } catch (error: any) {
      setIsConnecting(false);
      console.error('Connect error:', error);
    }
  }, [getQrCode]);

  // Fetch profile picture for a contact
  const fetchProfilePic = useCallback(async (remoteJid: string): Promise<string | null> => {
    if (!currentInstance) return null;

    // Cached (including null) => don't re-fetch.
    if (profilePicCacheRef.current.has(remoteJid)) {
      return profilePicCacheRef.current.get(remoteJid) ?? null;
    }

    // Prevent duplicate concurrent fetches.
    if (inflightProfilePicsRef.current.has(remoteJid)) return null;
    inflightProfilePicsRef.current.add(remoteJid);

    try {
      const response = await callEvolutionAPI('getProfilePic', currentInstance.name, { number: remoteJid });
      const url = response?.profilePictureUrl || response?.profilePicUrl || null;
      profilePicCacheRef.current.set(remoteJid, url);
      return url;
    } catch {
      profilePicCacheRef.current.set(remoteJid, null);
      return null;
    } finally {
      inflightProfilePicsRef.current.delete(remoteJid);
    }
  }, [currentInstance, callEvolutionAPI]);

  // Fetch chats
  const fetchChats = useCallback(async () => {
    if (!isConnected || !currentInstance) {
      console.log('fetchChats: Not connected or no instance', { isConnected, currentInstance: currentInstance?.name });
      return [];
    }

    try {
      console.log('Fetching chats for instance:', currentInstance.name);
      const response = await callEvolutionAPI('getChats', currentInstance.name);

      if (response?.error) {
        console.error('Error fetching chats:', response.message);
        return [];
      }

      let chatList: any[] = [];

      if (Array.isArray(response)) {
        chatList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        chatList = response.data;
      } else if (typeof response === 'object') {
        for (const key in response) {
          if (key !== 'success' && response[key]) {
            chatList.push(response[key]);
          }
        }
      }

      const formattedChats: EvolutionChat[] = chatList
        .filter((chat: any) => {
          const jid = chat.remoteJid || chat.lastMessage?.key?.remoteJid;
          return !!jid;
        })
        .map((chat: any) => {
          const lastMsg = chat.lastMessage;
          const remoteJid = chat.remoteJid || lastMsg?.key?.remoteJid;

          let name = chat.name || chat.pushName || lastMsg?.pushName;
          if (!name && remoteJid) {
            const isGroup = remoteJid.includes('@g.us');
            name = isGroup ? 'Grupo' : remoteJid.split('@')[0];
          }

          const msgContent = lastMsg?.message;
          let lastMsgText = '';
          if (msgContent?.conversation) {
            lastMsgText = msgContent.conversation;
          } else if (msgContent?.extendedTextMessage?.text) {
            lastMsgText = msgContent.extendedTextMessage.text;
          } else {
            lastMsgText = '[Mídia]';
          }

          return {
            id: remoteJid,
            remoteJid: remoteJid,
            name: name,
            profilePicUrl: chat.profilePicUrl || null,
            lastMessage: lastMsgText.substring(0, 100),
            lastMessageTimestamp: lastMsg?.messageTimestamp || 0,
            isFromMe: lastMsg?.key?.fromMe === true,
            unreadCount: chat.unreadCount ?? chat.unread ?? chat.count ?? 0,
          };
        });

      // Simple sync with local counters
      const savedUnreadCounts = localStorage.getItem('whatsapp_unread_counts');
      const unreadMap = savedUnreadCounts ? JSON.parse(savedUnreadCounts) : {};

      const mergedChats = formattedChats.map(chat => ({
        ...chat,
        unreadCount: unreadMap[chat.remoteJid] ?? chat.unreadCount ?? 0,
      }));

      const sortedChats = mergedChats.sort((a, b) => {
        if ((a.unreadCount || 0) > 0 && (b.unreadCount || 0) === 0) return -1;
        if ((a.unreadCount || 0) === 0 && (b.unreadCount || 0) > 0) return 1;
        return (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0);
      });

      setChats(sortedChats);

      // Fetch profile pictures in background
      const candidates = sortedChats.filter((c) => !c.profilePicUrl && !!c.remoteJid).slice(0, 40);
      void mapWithConcurrency(candidates, 4, async (chat) => {
        if (!chat.remoteJid) return;
        const picUrl = await fetchProfilePic(chat.remoteJid);
        if (!picUrl) return;
        setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, profilePicUrl: picUrl } : c)));
      });

      return sortedChats;
    } catch (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
  }, [isConnected, currentInstance, callEvolutionAPI, fetchProfilePic]);

  // Fetch messages
  const fetchMessages = useCallback(async (remoteJid: string) => {
    if (!isConnected || !currentInstance) return [];
    try {
      const response = await callEvolutionAPI('getMessages', currentInstance.name, { remoteJid });
      let messages: any[] = [];
      if (response?.messages?.records && Array.isArray(response.messages.records)) {
        messages = response.messages.records;
      } else if (Array.isArray(response)) {
        messages = response;
      }
      messages.sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0));
      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }, [isConnected, currentInstance, callEvolutionAPI]);

  // Send message
  const sendMessage = useCallback(async (number: string, text: string) => {
    if (!currentInstance) throw new Error('Nenhuma instância conectada');
    try {
      const response = await callEvolutionAPI('sendMessage', currentInstance.name, { number, text });
      toast({ title: 'Mensagem enviada', description: 'Mensagem enviada com sucesso' });
      return response;
    } catch (error: any) {
      toast({ title: 'Erro ao enviar', description: error.message, variant: 'destructive' });
      throw error;
    }
  }, [currentInstance, callEvolutionAPI, toast]);

  // Select instance
  const selectInstance = useCallback((instance: EvolutionInstance) => {
    setCurrentInstance(instance);
    setInstanceName(instance.name);
    localStorage.setItem(INSTANCE_STORAGE_KEY, instance.name);
    setIsConnected(instance.connectionStatus === 'open');
    if (instance.connectionStatus === 'open') {
      setQrCode(null);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) return;
      setLoading(true);
      await fetchInstances();
      if (mounted) {
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Poll for connection status when showing QR code
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let pollCount = 0;
    const MAX_POLLS = 40; // 2 minutos (40 * 3 segundos)

    if (isConnecting && qrCode) {
      interval = setInterval(async () => {
        pollCount++;
        const instanceList = await fetchInstances();
        const connected = instanceList.find(i => i.connectionStatus === 'open' && i.name === instanceName);

        if (connected) {
          setIsConnecting(false);
          setDeviceLimitError(false);
          toast({
            title: 'Conectado!',
            description: `WhatsApp conectado: ${connected.profileName || connected.name}`,
          });
        } else if (pollCount >= MAX_POLLS) {
          // Após 2 minutos sem conectar, assumir que pode ser limite de dispositivos
          setIsConnecting(false);
          setDeviceLimitError(true);
          toast({
            title: 'Tempo esgotado',
            description: 'Não foi possível conectar. Você pode ter atingido o limite de dispositivos.',
            variant: 'destructive',
          });
        }
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnecting, qrCode, fetchInstances, toast, instanceName]);

  // Fetch chats when connected with simple polling
  useEffect(() => {
    let mounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      if (!mounted || !isConnected || !currentInstance) return;
      try {
        await fetchChats();
      } catch (err) {
        console.error('Polling fetchChats error:', err);
      }
    };

    if (isConnected && currentInstance) {
      console.log('Starting chat polling - connected to:', currentInstance.name);
      load(); // Initial load

      // Refresh every 15 seconds
      pollInterval = setInterval(load, 15000);
    }

    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isConnected, currentInstance, fetchChats]);

  // Marcar conversa como aberta
  const markChatAsOpen = useCallback(async (remoteJid: string) => {
    try {
      await supabase.functions.invoke('chat-state', {
        body: { remoteJid, isOpen: true }
      });
      setChats(prev => prev.map(c => c.remoteJid === remoteJid ? { ...c, unreadCount: 0 } : c));
      const savedUnreadCounts = localStorage.getItem('whatsapp_unread_counts');
      const unreadMap = savedUnreadCounts ? JSON.parse(savedUnreadCounts) : {};
      unreadMap[remoteJid] = 0;
      localStorage.setItem('whatsapp_unread_counts', JSON.stringify(unreadMap));
    } catch (error) {
      console.error('Error marking chat as open:', error);
    }
  }, []);

  const markChatAsClosed = useCallback(async (remoteJid: string) => {
    try {
      await supabase.functions.invoke('chat-state', {
        body: { remoteJid, isOpen: false }
      });
    } catch (error) {
      console.error('Error marking chat as closed:', error);
    }
  }, []);

  return {
    instanceName,
    isConnected,
    isConnecting,
    instances,
    currentInstance,
    qrCode,
    chats,
    loading,
    error,
    deviceLimitError,
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
  };
};
