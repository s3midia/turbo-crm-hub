import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageCircle, Paperclip, Smile, Mic, ExternalLink, MoreVertical, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EvolutionChat, EvolutionMessage } from '@/hooks/useEvolutionAPI';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MediaMessage } from './MediaMessage';
import { useToast } from '@/hooks/use-toast';

interface EvolutionChatWindowProps {
  chat: EvolutionChat | null;
  onSendMessage: (number: string, text: string) => Promise<any>;
  fetchMessages: (remoteJid: string) => Promise<EvolutionMessage[]>;
  instanceName?: string | null;
}

export const EvolutionChatWindow = ({
  chat,
  onSendMessage,
  fetchMessages,
  instanceName,
}: EvolutionChatWindowProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

  useEffect(() => {
    if (chat) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chat]);

  const loadMessages = async () => {
    if (!chat) return;
    setLoading(true);
    try {
      const msgs = await fetchMessages(chat.remoteJid);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !chat) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      const number = chat.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
      await onSendMessage(number, text);
      await loadMessages();

      // Visual confirmation
      toast({
        title: '✓ Mensagem enviada',
        description: 'Sua mensagem foi entregue com sucesso!',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: '✗ Erro ao enviar',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMessageContent = (msg: any) => {
    const messageType = msg.messageType;
    const message = msg.message;

    if (messageType === 'conversation' && message?.conversation) {
      return <p className="text-sm whitespace-pre-wrap break-words">{message.conversation}</p>;
    }
    if (messageType === 'extendedTextMessage' && message?.extendedTextMessage?.text) {
      return <p className="text-sm whitespace-pre-wrap break-words">{message.extendedTextMessage.text}</p>;
    }
    const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage', 'contactMessage', 'locationMessage'];
    if (mediaTypes.includes(messageType)) {
      return (
        <MediaMessage
          envelope={msg}
          message={message}
          messageType={messageType}
          fromMe={!!msg.key?.fromMe}
          instanceName={instanceName ?? null}
        />
      );
    }
    if (message?.conversation) {
      return <p className="text-sm whitespace-pre-wrap break-words">{message.conversation}</p>;
    }
    if (message?.extendedTextMessage?.text) {
      return <p className="text-sm whitespace-pre-wrap break-words">{message.extendedTextMessage.text}</p>;
    }
    return (
      <div className="flex items-center gap-2 text-wa-text-muted">
        <span className="text-sm">[{messageType || 'Mensagem'}]</span>
      </div>
    );
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  };

  const groupedMessages = messages.reduce((groups: any, msg) => {
    const date = formatDate(msg.messageTimestamp);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-wa-bg-subtle">
        <div className="w-20 h-20 rounded-full bg-wa-surface flex items-center justify-center mb-4">
          <MessageCircle className="h-10 w-10 text-wa-text-muted" />
        </div>
        <h3 className="text-lg font-semibold text-wa-text-main">Selecione uma conversa</h3>
        <p className="text-sm text-wa-text-muted mt-1">Escolha uma conversa para visualizar as mensagens</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-wa-bg-subtle relative">
      {/* Background Wallpaper Pattern (Subtle Overlay) */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cartographer.png")' }}
      />

      {/* Header */}
      <div className="shrink-0 px-6 py-3 border-b border-wa-border bg-wa-bg-main/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border-2 border-background">
            {chat.profilePicUrl && <AvatarImage src={chat.profilePicUrl} alt={chat.name} />}
            <AvatarFallback className="bg-wa-surface text-wa-text-main font-bold text-sm">
              {chat.name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-wa-text-main">
                {chat.name || chat.remoteJid.split('@')[0]}
              </span>
            </div>
            <p className="text-xs text-wa-text-muted font-medium">
              {chat.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-8 rounded-full text-xs font-bold border-wa-border text-wa-text-main hover:bg-wa-surface shadow-none">
            Funil de vendas
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-wa-text-muted hover:text-wa-text-main">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 z-10">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : Object.keys(groupedMessages).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([date, msgs]: [string, any]) => (
              <div key={date}>
                <div className="flex justify-center my-6">
                  <span className="px-4 py-1.5 bg-wa-bg-main/50 backdrop-blur-sm rounded-full text-[11px] font-bold text-wa-text-muted shadow-sm uppercase tracking-wider">
                    {date}
                  </span>
                </div>
                <div className="space-y-2">
                  {msgs.map((msg: any, index: number) => {
                    const isFromMe = msg.key?.fromMe;
                    return (
                      <div
                        key={`${msg.key?.id ?? msg.id ?? 'msg'}-${msg.messageTimestamp ?? 't'}-${index}`}
                        className={cn(
                          'max-w-[75%] px-4 py-3 rounded-[1.25rem] wa-message-shadow relative animate-in fade-in slide-in-from-bottom-2 duration-300',
                          isFromMe
                            ? 'ml-auto bg-accent text-white rounded-tr-none'
                            : 'bg-wa-bg-main text-wa-text-main rounded-tl-none'
                        )}
                      >
                        {!isFromMe && msg.pushName && chat.remoteJid.includes('@g.us') && (
                          <p className="text-xs font-bold mb-1 text-accent">{msg.pushName}</p>
                        )}
                        <div className="text-[14px] leading-relaxed">
                          {getMessageContent(msg)}
                        </div>
                        <div className={cn(
                          'flex items-center justify-end gap-1 mt-1.5',
                          isFromMe ? 'text-white/80' : 'text-wa-text-muted'
                        )}>
                          <span className="text-[10px] font-medium">
                            {formatTime(msg.messageTimestamp)}
                          </span>
                          {isFromMe && <Check className="h-2.5 w-2.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-wa-text-muted opacity-50">
            <MessageCircle className="h-12 w-12 mb-2" />
            <p className="text-sm font-medium">Nenhuma mensagem encontrada</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 px-6 py-4 bg-wa-bg-main/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3 bg-wa-surface rounded-[1.5rem] px-4 py-2 border border-wa-border/50 shadow-sm transition-all focus-within:ring-1 focus-within:ring-accent/20">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-wa-text-muted hover:text-accent rounded-full transition-colors">
            <Paperclip className="h-5 w-5" />
          </Button>

          <input
            ref={inputRef}
            type="text"
            placeholder="Digite uma mensagem"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1 h-10 bg-transparent text-[14px] text-wa-text-main placeholder:text-wa-text-muted focus:outline-none disabled:opacity-50"
          />

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-wa-text-muted hover:text-accent rounded-full transition-colors">
              <Smile className="h-5 w-5" />
            </Button>

            {newMessage.trim() ? (
              <Button
                onClick={handleSend}
                disabled={sending}
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full bg-accent hover:bg-accent/90 shadow-md text-white transition-all scale-100 hover:scale-105"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-accent hover:bg-accent/10 rounded-full transition-colors">
                <Mic className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
