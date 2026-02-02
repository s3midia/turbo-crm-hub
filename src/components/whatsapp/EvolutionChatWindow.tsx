import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageCircle, Paperclip, Smile, Mic, ExternalLink, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EvolutionChat, EvolutionMessage } from '@/hooks/useEvolutionAPI';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AudioPlayer } from './AudioPlayer';
import { MediaMessage } from './MediaMessage';

interface EvolutionChatWindowProps {
  chat: EvolutionChat | null;
  onSendMessage: (number: string, text: string) => Promise<any>;
  fetchMessages: (remoteJid: string) => Promise<EvolutionMessage[]>;
}

export const EvolutionChatWindow = ({
  chat,
  onSendMessage,
  fetchMessages,
}: EvolutionChatWindowProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chat) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    // Text messages
    if (messageType === 'conversation' && message?.conversation) {
      return <p className="text-sm whitespace-pre-wrap break-words">{message.conversation}</p>;
    }

    if (messageType === 'extendedTextMessage' && message?.extendedTextMessage?.text) {
      return <p className="text-sm whitespace-pre-wrap break-words">{message.extendedTextMessage.text}</p>;
    }

    // Media messages
    const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage', 'contactMessage', 'locationMessage'];
    if (mediaTypes.includes(messageType)) {
      return <MediaMessage message={message} messageType={messageType} />;
    }

    // Fallback
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
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: any, msg) => {
    const date = formatDate(msg.messageTimestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(msg);
    return groups;
  }, {});

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-wa-bg-subtle">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-wa-surface flex items-center justify-center mx-auto">
            <MessageCircle className="h-12 w-12 text-wa-text-muted" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-wa-text-main">Selecione uma conversa</h3>
            <p className="text-sm text-wa-text-muted mt-1">Escolha uma conversa para visualizar as mensagens</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-wa-bg-subtle">
      {/* Chat Header */}
      <div className="px-4 py-2.5 border-b border-wa-border bg-wa-bg-main flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {chat.profilePicUrl && (
              <AvatarImage src={chat.profilePicUrl} alt={chat.name} />
            )}
            <AvatarFallback className="bg-wa-surface text-wa-text-main font-semibold">
              {chat.name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-wa-text-main text-sm">
                {chat.name || chat.remoteJid.split('@')[0]}
              </h2>
              <ExternalLink className="h-3.5 w-3.5 text-wa-text-muted" />
            </div>
            <p className="text-xs text-wa-text-muted">
              {chat.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 text-xs border-wa-border text-wa-text-main hover:bg-wa-surface"
          >
            Funil de vendas
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-wa-text-muted hover:text-wa-text-main hover:bg-wa-surface">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-wa-primary" />
          </div>
        ) : Object.keys(groupedMessages).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedMessages).map(([date, msgs]: [string, any]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 bg-wa-bg-main rounded-lg text-xs text-wa-text-muted shadow-sm">
                    {date}
                  </span>
                </div>
                {/* Messages for this date */}
                <div className="space-y-2">
                  {msgs.map((msg: any) => (
                    <div
                      key={msg.key?.id || msg.id}
                      className={cn(
                        'max-w-[70%] p-3 rounded-xl shadow-sm',
                        msg.key?.fromMe
                          ? 'ml-auto bg-wa-primary text-wa-primary-foreground rounded-br-sm'
                          : 'bg-wa-bg-main text-wa-text-main rounded-bl-sm'
                      )}
                    >
                      {/* Sender name for groups */}
                      {!msg.key?.fromMe && msg.pushName && chat.remoteJid.includes('@g.us') && (
                        <p className="text-xs font-semibold mb-1 text-wa-info">{msg.pushName}</p>
                      )}
                      {getMessageContent(msg)}
                      <span className={cn(
                        'text-[10px] mt-1 block text-right font-mono',
                        msg.key?.fromMe ? 'text-wa-primary-foreground/70' : 'text-wa-text-muted'
                      )}>
                        {formatTime(msg.messageTimestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-wa-text-muted">
            <p className="text-sm">Nenhuma mensagem encontrada</p>
          </div>
        )}
      </div>

      {/* Input Area - Always Visible */}
      <div className="p-3 border-t border-wa-border bg-wa-bg-main">
        <div className="flex items-center gap-2">
          {/* Attachment button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-wa-text-muted hover:text-wa-text-main hover:bg-wa-surface"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Emoji button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-wa-text-muted hover:text-wa-text-main hover:bg-wa-surface"
          >
            <Smile className="h-5 w-5" />
          </Button>

          {/* Message input */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              placeholder="Digite uma mensagem"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              rows={1}
              className="w-full px-4 py-2 bg-wa-surface border border-wa-border rounded-full text-sm text-wa-text-main placeholder:text-wa-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-wa-info"
              style={{ minHeight: '38px', maxHeight: '100px' }}
            />
          </div>

          {/* Send or Mic button */}
          {newMessage.trim() ? (
            <Button 
              onClick={handleSend}
              disabled={sending}
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full bg-wa-info hover:bg-wa-info/90"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-wa-danger hover:text-wa-danger hover:bg-wa-danger/10"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
