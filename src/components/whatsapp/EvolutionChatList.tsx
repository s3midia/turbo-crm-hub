import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { EvolutionChat } from '@/hooks/useEvolutionAPI';

interface EvolutionChatListProps {
  chats: EvolutionChat[];
  selectedId: string | null;
  onSelect: (chat: EvolutionChat) => void;
}

export const EvolutionChatList = ({
  chats,
  selectedId,
  onSelect,
}: EvolutionChatListProps) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const filteredChats = chats.filter(
    (chat) =>
      chat.name?.toLowerCase().includes(search.toLowerCase()) ||
      chat.remoteJid.includes(search)
  );

  const formatPhone = (jid: string) => {
    return jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-wa-bg-main">
      {/* Search & Filters */}
      <div className="shrink-0 p-4 space-y-3 bg-wa-bg-main">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-wa-text-muted" />
          <Input
            placeholder="Pesquisar por nome ou número"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-wa-surface border-none rounded-full text-sm placeholder:text-wa-text-muted transition-all focus-visible:ring-1 focus-visible:ring-accent"
          />
        </div>
        <div className="flex gap-2 px-1">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
              filter === 'all'
                ? 'bg-accent text-white shadow-sm'
                : 'bg-wa-surface text-wa-text-muted hover:bg-wa-border/50'
            )}
          >
            Tudo
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
              filter === 'mine'
                ? 'bg-accent text-white shadow-sm'
                : 'bg-wa-surface text-wa-text-muted hover:bg-wa-border/50'
            )}
          >
            Minhas
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelect(chat)}
              className={cn(
                'w-full mb-1 px-4 py-3 flex items-center gap-3 rounded-[1.25rem] transition-all text-left',
                selectedId === chat.id
                  ? 'bg-wa-surface border-none'
                  : 'bg-transparent hover:bg-wa-surface/50'
              )}
            >
              <div className="relative">
                <Avatar className="h-12 w-12 shrink-0 border-2 border-background">
                  {chat.profilePicUrl && (
                    <AvatarImage src={chat.profilePicUrl} alt={chat.name} />
                  )}
                  <AvatarFallback className="bg-wa-surface text-wa-text-main font-bold text-sm">
                    {chat.name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                {(chat.unreadCount ?? 0) > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent border-2 border-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-sm truncate text-wa-text-main',
                    (chat.unreadCount ?? 0) > 0 ? 'font-bold' : 'font-semibold'
                  )}>
                    {chat.name || formatPhone(chat.remoteJid)}
                  </span>
                  <span className="text-[10px] text-wa-text-muted ml-2 shrink-0">
                    {formatTimestamp(chat.lastMessageTimestamp)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className={cn(
                    'text-xs truncate max-w-[180px]',
                    chat.unreadCount && chat.unreadCount > 0
                      ? 'text-wa-text-main font-medium'
                      : 'text-wa-text-muted'
                  )}>
                    {chat.lastMessage || '\u00A0'}
                  </p>
                  {(chat.unreadCount ?? 0) > 0 && (
                    <div
                      className="shrink-0 h-6 min-w-[24px] px-2 flex items-center justify-center rounded-full bg-blue-500 text-white text-[12px] font-bold shadow-sm"
                      onClick={() => console.log('Badge clicado:', chat.name, 'unreadCount:', chat.unreadCount)}
                    >
                      {chat.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="p-8 text-center text-wa-text-muted">
            <p className="text-sm italic">Nenhuma conversa encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};
