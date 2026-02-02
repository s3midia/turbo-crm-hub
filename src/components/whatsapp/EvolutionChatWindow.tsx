import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageCircle, Paperclip, Smile, Mic, ExternalLink, MoreVertical, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EvolutionChat, EvolutionMessage } from '@/hooks/useEvolutionAPI';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MediaMessage } from './MediaMessage';

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
    } catch (error) {
      console.error('Error sending message:', error);
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 py-2 border-b border-wa-border bg-wa-bg-main flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {chat.profilePicUrl && <AvatarImage src={chat.profilePicUrl} alt={chat.name} />}
            <AvatarFallback className="bg-wa-surface text-wa-text-main font-semibold text-sm">
              {chat.name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-wa-text-main">
                {chat.name || chat.remoteJid.split('@')[0]}
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-wa-text-muted" />
            </div>
            <p className="text-xs text-wa-text-muted">
              {chat.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs border-wa-border text-wa-text-main hover:bg-wa-surface">
            Funil de vendas
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-wa-text-muted hover:text-wa-text-main">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-wa-bg-subtle">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-wa-primary" />
          </div>
        ) : Object.keys(groupedMessages).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(groupedMessages).map(([date, msgs]: [string, any]) => (
              <div key={date}>
                <div className="flex justify-center my-3">
                  <span className="px-3 py-1 bg-wa-bg-main rounded-md text-xs text-wa-text-muted shadow-sm">
                    {date}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {msgs.map((msg: any, index: number) => (
                    <div
                      key={`${msg.key?.id ?? msg.id ?? 'msg'}-${msg.messageTimestamp ?? 't'}-${index}`}
                      className={cn(
                        'max-w-[65%] px-3 py-2 rounded-lg shadow-sm',
                        msg.key?.fromMe
                          ? 'ml-auto bg-wa-primary text-wa-primary-foreground rounded-br-none'
                          : 'bg-wa-bg-main text-wa-text-main rounded-bl-none'
                      )}
                    >
                      {!msg.key?.fromMe && msg.pushName && chat.remoteJid.includes('@g.us') && (
                        <p className="text-xs font-semibold mb-1 text-wa-info">{msg.pushName}</p>
                      )}
                      {getMessageContent(msg)}
                      <span className={cn(
                        'text-[10px] mt-1 block text-right',
                        msg.key?.fromMe ? 'text-wa-primary-foreground/70' : 'text-wa-text-muted'
                      )}>
                        {formatTime(msg.messageTimestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-wa-text-muted">
            <p className="text-sm">Nenhuma mensagem encontrada</p>
          </div>
        )}
      </div>

      {/* Input Area - Always visible at bottom */}
      <div className="shrink-0 px-4 py-3 border-t border-wa-border bg-wa-bg-main flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-wa-text-muted hover:text-wa-text-main">
          <Paperclip className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-wa-text-muted hover:text-wa-text-main">
          <Smile className="h-5 w-5" />
        </Button>

        <input
          ref={inputRef}
          type="text"
          placeholder="Digite uma mensagem"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          className="flex-1 h-10 px-4 bg-wa-surface border border-wa-border rounded-full text-sm text-wa-text-main placeholder:text-wa-text-muted focus:outline-none focus:ring-1 focus:ring-wa-info"
        />

        {newMessage.trim() ? (
          <Button
            onClick={handleSend}
            disabled={sending}
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full bg-wa-info hover:bg-wa-info/90"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-wa-danger hover:text-wa-danger hover:bg-wa-danger/10">
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
