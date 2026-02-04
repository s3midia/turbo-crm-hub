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

export const useEvolutionAPI = (defaultInstanceName = 'crm-turbo') => {
  const [instanceName, setInstanceName] = useState(defaultInstanceName);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [currentInstance, setCurrentInstance] = useState<EvolutionInstance | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [chats, setChats] = useState<EvolutionChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

      // Find the connected instance
      const connectedInstance = instanceList.find(i => i.connectionStatus === 'open');
      if (connectedInstance) {
        setCurrentInstance(connectedInstance);
        setInstanceName(connectedInstance.name);
        setIsConnected(true);
        setQrCode(null);
        console.log('Found connected instance:', connectedInstance.name);
      } else {
        setIsConnected(false);
      }

      return instanceList;
    } catch (error) {
      console.error('Error fetching instances:', error);
      return [];
    }
  }, [callEvolutionAPI]);

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
      await getQrCode(instance);
    } catch (error: any) {
      setIsConnecting(false);
      console.error('Connect error:', error);
    }
  }, [getQrCode]);

  // Disconnect
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

      console.log('getChats raw response type:', typeof response, Array.isArray(response));
      console.log('getChats first item:', response?.[0] || response?.['0']);
      console.log('getChats FULL first 2 items:', JSON.stringify(response?.slice?.(0, 2) || [response?.[0], response?.[1]], null, 2));

      if (response?.error) {
        console.error('Error fetching chats:', response.message);
        return [];
      }

      let chatList: any[] = [];

      // Evolution API returns an array directly: [{id: null, lastMessage: {...}, unreadCount: 0}, ...]
      if (Array.isArray(response)) {
        chatList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        chatList = response.data;
      } else if (typeof response === 'object') {
        // Convert object with numeric keys to array
        for (const key in response) {
          if (key !== 'success' && response[key]) {
            chatList.push(response[key]);
          }
        }
      }

      console.log('Parsed chat list:', chatList.length, 'chats');

      let formattedChatsCount = 0;
      const formattedChats: EvolutionChat[] = chatList
        .filter((chat: any) => {
          // Must have lastMessage with remoteJid
          const jid = chat.remoteJid || chat.lastMessage?.key?.remoteJid;
          return !!jid;
        })
        .map((chat: any, index: number) => {
          const lastMsg = chat.lastMessage;
          const remoteJid = chat.remoteJid || lastMsg?.key?.remoteJid;

          // Get name from pushName, participant name, or extract from JID
          let name = chat.name || chat.pushName || lastMsg?.pushName;
          if (!name && remoteJid) {
            // Extract phone number or group name from JID
            const isGroup = remoteJid.includes('@g.us');
            if (isGroup) {
              name = 'Grupo';
            } else {
              name = remoteJid.split('@')[0];
            }
          }

          // Extract last message content
          const msgContent = lastMsg?.message;
          let lastMsgText = '';
          if (msgContent?.conversation) {
            lastMsgText = msgContent.conversation;
          } else if (msgContent?.extendedTextMessage?.text) {
            lastMsgText = msgContent.extendedTextMessage.text;
          } else if (msgContent?.imageMessage) {
            lastMsgText = msgContent.imageMessage.caption || '📷 Imagem';
          } else if (msgContent?.videoMessage) {
            lastMsgText = msgContent.videoMessage.caption || '🎥 Vídeo';
          } else if (msgContent?.audioMessage) {
            lastMsgText = '🎵 Áudio';
          } else if (msgContent?.documentMessage) {
            lastMsgText = '📎 Documento';
          } else if (msgContent?.stickerMessage) {
            lastMsgText = '🎨 Sticker';
          } else if (msgContent?.contactMessage) {
            lastMsgText = '👤 Contato';
          } else if (msgContent?.locationMessage) {
            lastMsgText = '📍 Localização';
          } else {
            lastMsgText = '[Mídia]';
          }

          const unreadCount = chat.unreadCount ?? chat.unread ?? chat.count ?? 0;

          // Debug logging for first few chats
          if (index < 3) {
            console.log(`Chat ${index}:`, {
              name,
              remoteJid,
              'chat.unreadCount': chat.unreadCount,
              'chat.unread': chat.unread,
              'chat.count': chat.count,
              'final unreadCount': unreadCount,
              'fullChat': chat
            });
          }

          return {
            id: remoteJid,
            remoteJid: remoteJid,
            name: name,
            profilePicUrl: chat.profilePicUrl || null,
            lastMessage: lastMsgText.substring(0, 100), // Truncate long messages
            unreadCount: unreadCount,
          };
        });

      console.log('Formatted chats:', formattedChats.length, formattedChats.slice(0, 3));

      // 🔥 Sistema LOCAL de unread count (usando localStorage)
      try {
        // Buscar unread counts salvos localmente
        const savedUnreadCounts = localStorage.getItem('whatsapp_unread_counts');
        let unreadMap = savedUnreadCounts ? JSON.parse(savedUnreadCounts) : {};

        // 🔥 DETECTAR NOVAS MENSAGENS RECEBIDAS
        const lastSeenMessages = localStorage.getItem('whatsapp_last_seen_messages');
        const lastSeenMap = lastSeenMessages ? JSON.parse(lastSeenMessages) : {};

        formattedChats.forEach(chat => {
          const lastMessageTimestamp = chat.lastMessageTimestamp || 0;
          const lastSeenTimestamp = lastSeenMap[chat.remoteJid] || 0;

          // Se há uma mensagem nova
          if (lastMessageTimestamp > lastSeenTimestamp) {
            // Buscar a última mensagem para ver se é do usuário ou não
            const lastMsg = chatList.find((c: any) => {
              const jid = c.remoteJid || c.lastMessage?.key?.remoteJid;
              return jid === chat.remoteJid;
            });

            const isFromMe = lastMsg?.lastMessage?.key?.fromMe === true;

            if (!isFromMe) {
              // Incrementar contador apenas se não for mensagem do usuário
              const currentCount = unreadMap[chat.remoteJid] || 0;
              unreadMap[chat.remoteJid] = currentCount + 1;
              console.log(`📩 Nova mensagem detectada em ${chat.name}: ${unreadMap[chat.remoteJid]} não lidas`);
            }

            // Atualizar timestamp para NÃO incrementar de novo na próxima verificação
            lastSeenMap[chat.remoteJid] = lastMessageTimestamp;
          }
        });

        // Salvar timestamps e contadores
        localStorage.setItem('whatsapp_last_seen_messages', JSON.stringify(lastSeenMap));
        localStorage.setItem('whatsapp_unread_counts', JSON.stringify(unreadMap));

        console.log('Unread counts from localStorage:', unreadMap);

        // Aplicar unread counts aos chats
        const mergedChats = formattedChats.map(chat => {
          const unreadCount = unreadMap[chat.remoteJid] || 0;
          return {
            ...chat,
            unreadCount: unreadCount,
          };
        });

        console.log('Chats with unread counts:', mergedChats.filter(c => (c.unreadCount ?? 0) > 0).map(c => ({ name: c.name, unread: c.unreadCount })));

        setChats(mergedChats);

        // Fetch profile pictures in background
        const candidates = mergedChats
          .filter((c) => !c.profilePicUrl && !!c.remoteJid)
          .slice(0, 80);

        void mapWithConcurrency(candidates, 4, async (chat) => {
          if (!chat.remoteJid) return;
          const picUrl = await fetchProfilePic(chat.remoteJid);
          if (!picUrl) return;
          setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, profilePicUrl: picUrl } : c)));
        });

        return mergedChats;
      } catch (error) {
        console.error('Error with localStorage unread counts:', error);
      }

      setChats(formattedChats);

      // Fetch profile pictures in background (throttled to avoid request bursts)
      const candidates = formattedChats
        .filter((c) => !c.profilePicUrl && !!c.remoteJid)
        .slice(0, 80); // keep UI responsive; load the rest later on demand (future improvement)

      void mapWithConcurrency(candidates, 4, async (chat) => {
        if (!chat.remoteJid) return;
        const picUrl = await fetchProfilePic(chat.remoteJid);
        if (!picUrl) return;
        setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, profilePicUrl: picUrl } : c)));
      });

      return formattedChats;
    } catch (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
  }, [isConnected, currentInstance, callEvolutionAPI, fetchProfilePic]);

  // Fetch messages
  const fetchMessages = useCallback(async (remoteJid: string) => {
    if (!isConnected || !currentInstance) return [];

    try {
      console.log('Fetching messages for:', remoteJid);
      const response = await callEvolutionAPI('getMessages', currentInstance.name, { remoteJid });

      console.log('getMessages response:', response);

      if (response?.error) {
        console.error('Error fetching messages:', response.message);
        return [];
      }

      let messages: any[] = [];

      // Evolution API returns: { messages: { records: [...], total, pages, currentPage } }
      if (response?.messages?.records && Array.isArray(response.messages.records)) {
        messages = response.messages.records;
      } else if (response?.messages && Array.isArray(response.messages)) {
        messages = response.messages;
      } else if (Array.isArray(response)) {
        messages = response;
      } else if (response?.data) {
        messages = response.data;
      }

      console.log('Parsed messages:', messages.length);

      // Sort by timestamp (oldest first for display)
      messages.sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0));

      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }, [isConnected, currentInstance, callEvolutionAPI]);

  // Send message
  const sendMessage = useCallback(async (number: string, text: string) => {
    if (!currentInstance) {
      throw new Error('Nenhuma instância conectada');
    }

    try {
      const response = await callEvolutionAPI('sendMessage', currentInstance.name, { number, text });

      if (response?.error) {
        throw new Error(response.message);
      }

      toast({
        title: 'Mensagem enviada',
        description: 'Mensagem enviada com sucesso',
      });
      return response;
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [currentInstance, callEvolutionAPI, toast]);



  // Select instance
  const selectInstance = useCallback((instance: EvolutionInstance) => {
    setCurrentInstance(instance);
    setInstanceName(instance.name);
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

    if (isConnecting && qrCode) {
      interval = setInterval(async () => {
        const instanceList = await fetchInstances();
        const connected = instanceList.find(i => i.connectionStatus === 'open');
        if (connected) {
          setIsConnecting(false);
          toast({
            title: 'Conectado!',
            description: `WhatsApp conectado: ${connected.profileName || connected.name}`,
          });
        }
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnecting, qrCode, fetchInstances, toast]);

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

  // 🔥 Marcar conversa como aberta (zera unread_count) - usando localStorage
  const markChatAsOpen = useCallback(async (remoteJid: string) => {
    try {
      // Buscar mapa atual
      const savedUnreadCounts = localStorage.getItem('whatsapp_unread_counts');
      const unreadMap = savedUnreadCounts ? JSON.parse(savedUnreadCounts) : {};

      // Zerar contador
      unreadMap[remoteJid] = 0;

      // Salvar
      localStorage.setItem('whatsapp_unread_counts', JSON.stringify(unreadMap));

      console.log('Chat marked as open (localStorage):', remoteJid);

      // Atualizar estado local
      setChats(prev => prev.map(c =>
        c.remoteJid === remoteJid ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      console.error('Error marking chat as open:', error);
    }
  }, []);

  // 🔥 Marcar conversa como fechada - localStorage (não faz nada, apenas log)
  const markChatAsClosed = useCallback(async (remoteJid: string) => {
    console.log('Chat marked as closed (localStorage):', remoteJid);
    // Não precisa fazer nada, o contador só incrementa quando recebe mensagem
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
    connect,
    disconnect,
    fetchChats,
    fetchMessages,
    sendMessage,
    selectInstance,
    fetchInstances,
    markChatAsOpen,
    markChatAsClosed,
  };
};
