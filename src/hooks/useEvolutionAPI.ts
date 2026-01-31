import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EvolutionChat {
  id: string;
  remoteJid: string;
  name?: string;
  profilePicUrl?: string;
  lastMessage?: string;
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

  const callEvolutionAPI = useCallback(async (action: string, instance?: string, data?: any) => {
    try {
      console.log(`Calling Evolution API: ${action}, instance: ${instance || instanceName}`);
      const { data: response, error } = await supabase.functions.invoke('evolution-api', {
        body: { action, instanceName: instance || instanceName, data },
      });

      if (error) throw error;
      console.log(`Evolution API Response (${action}):`, response);
      return response;
    } catch (error: any) {
      console.error(`Evolution API Error (${action}):`, error);
      throw error;
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

  // Fetch chats
  const fetchChats = useCallback(async () => {
    if (!isConnected || !currentInstance) {
      console.log('fetchChats: Not connected or no instance', { isConnected, currentInstance: currentInstance?.name });
      return [];
    }
    
    try {
      console.log('Fetching chats for instance:', currentInstance.name);
      const response = await callEvolutionAPI('getChats', currentInstance.name);
      
      console.log('getChats raw response:', response);
      
      if (response?.error) {
        console.error('Error fetching chats:', response.message);
        return [];
      }
      
      let chatList: any[] = [];
      
      // Handle different response formats from Evolution API
      if (Array.isArray(response)) {
        chatList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        chatList = response.data;
      } else if (typeof response === 'object') {
        // Response is an object with numeric keys (0, 1, 2, etc.)
        for (const key in response) {
          if (key !== 'success' && response[key]) {
            const item = response[key];
            // Check if it has lastMessage (chat format from Evolution API)
            if (item.lastMessage?.key?.remoteJid) {
              chatList.push({
                remoteJid: item.lastMessage.key.remoteJid,
                name: item.lastMessage.pushName || item.lastMessage.key.remoteJid?.split('@')[0],
                lastMessage: item.lastMessage,
                unreadCount: item.unreadCount || 0,
              });
            } else if (item.remoteJid) {
              chatList.push(item);
            }
          }
        }
      }
      
      console.log('Parsed chat list:', chatList.length, 'chats');
      
      const formattedChats: EvolutionChat[] = chatList.map((chat: any) => {
        const remoteJid = chat.remoteJid || chat.lastMessage?.key?.remoteJid || chat.id;
        const pushName = chat.name || chat.pushName || chat.lastMessage?.pushName;
        const lastMsgContent = chat.lastMessage?.message?.conversation || 
                               chat.lastMessage?.message?.extendedTextMessage?.text ||
                               chat.lastMessage?.message?.imageMessage?.caption ||
                               (chat.lastMessage?.message?.audioMessage ? '[Áudio]' : null) ||
                               chat.lastMsgContent;
        
        return {
          id: chat.id || remoteJid,
          remoteJid: remoteJid,
          name: pushName || remoteJid?.split('@')[0]?.replace(/[^0-9]/g, ''),
          profilePicUrl: chat.profilePicUrl,
          lastMessage: lastMsgContent || '[Mídia]',
          unreadCount: chat.unreadCount || 0,
        };
      }).filter(chat => chat.remoteJid); // Filter out any without remoteJid
      
      // Sort by most recent (based on order from API, which is already sorted)
      console.log('Formatted chats:', formattedChats.length);
      
      setChats(formattedChats);
      return formattedChats;
    } catch (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
  }, [isConnected, currentInstance, callEvolutionAPI]);

  // Fetch messages
  const fetchMessages = useCallback(async (remoteJid: string) => {
    if (!isConnected || !currentInstance) return [];
    
    try {
      const response = await callEvolutionAPI('getMessages', currentInstance.name, { remoteJid });
      
      if (response?.error) {
        console.error('Error fetching messages:', response.message);
        return [];
      }
      
      let messages = [];
      if (Array.isArray(response)) {
        messages = response;
      } else if (response?.messages) {
        messages = response.messages;
      } else if (response?.data) {
        messages = response.data;
      }
      
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
    const init = async () => {
      setLoading(true);
      await fetchInstances();
      setLoading(false);
    };
    
    init();
  }, []);

  // Poll for connection status when showing QR code
  useEffect(() => {
    if (!isConnecting || !qrCode) return;
    
    const interval = setInterval(async () => {
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
    
    return () => clearInterval(interval);
  }, [isConnecting, qrCode, fetchInstances, toast]);

  // Fetch chats when connected
  useEffect(() => {
    if (isConnected && currentInstance) {
      console.log('Auto-fetching chats - connected to:', currentInstance.name);
      fetchChats();
    }
  }, [isConnected, currentInstance, fetchChats]);

  return {
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
  };
};
