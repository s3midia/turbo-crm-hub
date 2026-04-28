import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageCircle, Paperclip, Smile, Mic, ExternalLink, MoreVertical, Check, Repeat, CheckCircle2, User, Users, Bot, Image as ImageIcon, Chrome, Smartphone, Facebook, Instagram, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EvolutionChat, EvolutionMessage } from '@/hooks/useEvolutionAPI';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MediaMessage } from './MediaMessage';
import { useToast } from '@/hooks/use-toast';
import { OpportunityModal } from './OpportunityModal';

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
  const [opportunityModalOpen, setOpportunityModalOpen] = useState(false);
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
    if (chat?.id) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chat?.id]);

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
    <div className="flex flex-col h-full w-full bg-wa-bg-subtle relative overflow-hidden">
      {/* Background Wallpaper Pattern (Subtle Overlay) */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cartographer.png")' }}
      />

      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between z-10 transition-all flex-wrap gap-2 w-full">
        <div className="flex items-center gap-3 min-w-0 max-w-[50%]">
          <div className="relative">
             <Avatar className="h-12 w-12 border-2 border-background shadow-md">
               {chat.profilePicUrl && <AvatarImage src={chat.profilePicUrl} alt={chat.name} className="object-cover" />}
               <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                 {chat.name?.[0]?.toUpperCase() || '?'}
               </AvatarFallback>
             </Avatar>
             <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-foreground">
                {chat.name || chat.remoteJid.split('@')[0]}
              </span>
              <Badge variant="outline" className="text-[9px] bg-muted/50 font-bold border-none uppercase tracking-tighter flex items-center gap-1">
                 <Smartphone className="h-2 w-2" /> Apple
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
              <span className="font-medium">+{chat.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')}</span>
              <span className="opacity-30">•</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> SprintHub CRM</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
             <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-none font-bold text-[10px] px-2 h-6 flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Lead
             </Badge>
             <span className="text-muted-foreground text-[11px] opacity-40">→</span>
             <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 text-xs">
                <User className="h-3 w-3" /> Jonas Mendes
             </span>
          </div>
          
          <Button
            variant="default"
            size="sm"
            className="h-9 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex items-center gap-2 px-4 group transition-all"
          >
            <Repeat className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            Transferir
          </Button>
          
          <Button
            variant="default"
            size="sm"
            className="h-9 rounded-lg text-xs font-bold bg-green-500 hover:bg-green-600 text-white shadow-sm flex items-center gap-2 px-4 transition-all"
          >
            <CheckCircle2 className="h-4 w-4" />
            Resolver
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted">
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
                <div className="space-y-4">
                  {msgs.map((msg: any, index: number) => {
                    const isFromMe = msg.key?.fromMe;
                    return (
                      <div
                        key={`${msg.key?.id ?? msg.id ?? 'msg'}-${msg.messageTimestamp ?? 't'}-${index}`}
                        className={cn(
                          'flex w-full mb-1 items-end gap-2',
                          isFromMe ? 'flex-row-reverse' : 'flex-row'
                        )}
                        style={{ maxWidth: '100%' }}
                      >
                         {!isFromMe && (
                            <Avatar className="h-8 w-8 shrink-0 mb-1 border border-border shadow-sm">
                               {chat.profilePicUrl && <AvatarImage src={chat.profilePicUrl} />}
                               <AvatarFallback className="text-[10px]">{chat.name?.[0]}</AvatarFallback>
                            </Avatar>
                         )}
                        
                        <div
                          className={cn(
                            'max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm relative animate-in fade-in slide-in-from-bottom-1 duration-300',
                            isFromMe
                              ? 'bg-primary text-primary-foreground rounded-tr-none'
                              : 'bg-card border border-border/50 text-foreground rounded-tl-none'
                          )}
                        >
                          {!isFromMe && msg.pushName && chat.remoteJid.includes('@g.us') && (
                            <p className="text-[10px] font-bold mb-1 text-primary">{msg.pushName}</p>
                          )}
                          <div className="text-[13px] leading-relaxed">
                            {getMessageContent(msg)}
                          </div>
                          <div className={cn(
                            'flex items-center justify-end gap-1 mt-1.5 opacity-60',
                            isFromMe ? 'text-primary-foreground' : 'text-muted-foreground'
                          )}>
                            <span className="text-[9px] font-medium">
                              {formatTime(msg.messageTimestamp)}
                            </span>
                            {isFromMe && <Check className="h-2.5 w-2.5" />}
                          </div>
                        </div>

                        {isFromMe && (
                           <div className="mb-1 h-6 w-6 rounded-full overflow-hidden border border-border shadow-sm">
                              <img src="https://ui-avatars.com/api/?name=Admin&background=random" className="w-full h-full object-cover" />
                           </div>
                        )}
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
      <div className="shrink-0 px-6 py-6 border-t border-border bg-card/80 backdrop-blur-md z-10">
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1">
                    <textarea
                        ref={inputRef as any}
                        placeholder="Digite uma mensagem para enviar..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown as any}
                        disabled={sending}
                        className="w-full min-h-[50px] max-h-[150px] bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 resize-none pb-12 shadow-inner"
                    />
                    
                    <div className="absolute left-3 bottom-3 flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-full">
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-full">
                            <Bot className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-full">
                            <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-full">
                            <Smile className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-full">
                            <Chrome className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="absolute right-3 bottom-3 flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-full"
                        >
                            <Mic className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={sending || !newMessage.trim()}
                            size="icon"
                            className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all shadow-primary/20"
                        >
                            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold bg-primary text-white border-none hover:bg-primary/90 gap-2 px-4 shadow-sm">
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar observação
                </Button>
                
                <div className="flex items-center gap-2 opacity-50">
                    <Facebook className="h-3.5 w-3.5" />
                    <Instagram className="h-3.5 w-3.5" />
                    <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                </div>
            </div>
        </div>
      </div>

      {/* Opportunity Modal */}
      <OpportunityModal
        open={opportunityModalOpen}
        onClose={() => setOpportunityModalOpen(false)}
        contactName={chat.name}
        contactPhone={chat.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')}
        onSaved={() => {
          // Reload opportunities if needed
          console.log('Opportunity saved from WhatsApp');
        }}
      />
    </div>
  );
};
