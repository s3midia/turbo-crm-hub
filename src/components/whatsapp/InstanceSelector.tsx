import { RefreshCw, Plus, Trash2, CheckCircle2, XCircle, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EvolutionInstance } from '@/hooks/useEvolutionAPI';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface InstanceSelectorProps {
  instances: EvolutionInstance[];
  selectedInstance: string | null;
  onSelect: (instance: EvolutionInstance) => void;
  onRefresh: () => void;
  onDelete?: (name: string) => void;
  onCreate?: (name: string) => void;
  loading?: boolean;
}

export const InstanceSelector = ({
  instances,
  selectedInstance,
  onSelect,
  onRefresh,
  onDelete,
  onCreate,
  loading,
}: InstanceSelectorProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    if (newName.trim() && onCreate) {
      onCreate(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      default:
        return 'Desconectado';
    }
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            Instâncias Disponíveis
            {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isAdding ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAdding(true)}
                className="gap-2 h-8 border-primary/20 hover:border-primary/50"
              >
                <Plus className="h-4 w-4" />
                Nova
              </Button>
            ) : (
              <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                <Input 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome do usuário/instância..."
                  className="h-8 w-44 text-xs bg-black/20"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <Button size="sm" className="h-8 px-2" onClick={handleCreate}>Criar</Button>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setIsAdding(false)}>X</Button>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={onRefresh} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instances.map((instance) => {
          const isSelected = selectedInstance === instance.name;
          const isOpen = instance.connectionStatus === 'open';

          return (
            <div
              key={instance.id || instance.name}
              onClick={() => onSelect(instance)}
              className={cn(
                'group relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer',
                isSelected 
                  ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' 
                  : 'border-white/5 bg-black/20 hover:border-primary/30 hover:bg-black/40'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center border-2",
                    isOpen ? "border-green-500/50 bg-green-500/10" : "border-gray-500/30 bg-gray-500/10"
                  )}>
                    {instance.profilePicUrl ? (
                      <img 
                        src={instance.profilePicUrl} 
                        alt={instance.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className={cn("h-5 w-5", isOpen ? "text-green-500" : "text-gray-400")} />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm truncate">
                      {instance.profileName || instance.name}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        'text-[9px] px-1.5 py-0 h-4 uppercase font-bold text-white w-fit mt-1', 
                        getStatusColor(instance.connectionStatus)
                      )}
                    >
                      {getStatusLabel(instance.connectionStatus)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 items-end">
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remover instância ${instance.name}?`)) {
                          onDelete(instance.name);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {isSelected && (
                    <div className="bg-primary text-white rounded-full p-0.5 mt-auto">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-auto">
                <span className="truncate">
                  {instance.ownerJid ? instance.ownerJid.split('@')[0] : 'Sem telefone'}
                </span>
                {instance._count && (
                  <span>{instance._count.Chat} chats</span>
                )}
              </div>
            </div>
          );
        })}
        
        {instances.length === 0 && !loading && (
          <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-white/5 rounded-xl">
            <Plus className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">Nenhuma instância configurada</p>
            <Button 
              variant="link" 
              onClick={() => setIsAdding(true)}
              className="text-primary text-xs"
            >
              Criar primeira agora
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
