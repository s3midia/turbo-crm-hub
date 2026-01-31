import { RefreshCw, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EvolutionInstance } from '@/hooks/useEvolutionAPI';
import { cn } from '@/lib/utils';

interface InstanceSelectorProps {
  instances: EvolutionInstance[];
  currentInstance: EvolutionInstance | null;
  onSelect: (instance: EvolutionInstance) => void;
  onRefresh: () => void;
}

export const InstanceSelector = ({
  instances,
  currentInstance,
  onSelect,
  onRefresh,
}: InstanceSelectorProps) => {
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Instâncias Disponíveis</CardTitle>
          <Button variant="ghost" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {instances.map((instance) => (
          <button
            key={instance.id}
            onClick={() => onSelect(instance)}
            className={cn(
              'w-full p-3 rounded-lg border text-left transition-all',
              'hover:border-primary/50 hover:bg-muted/50',
              currentInstance?.id === instance.id && 'border-primary bg-primary/5'
            )}
          >
            <div className="flex items-center gap-3">
              {instance.profilePicUrl ? (
                <img 
                  src={instance.profilePicUrl} 
                  alt={instance.profileName || instance.name}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-lg font-medium">
                    {(instance.profileName || instance.name)?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {instance.profileName || instance.name}
                  </span>
                  {currentInstance?.id === instance.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="secondary" 
                    className={cn('text-xs text-white', getStatusColor(instance.connectionStatus))}
                  >
                    {instance.connectionStatus === 'connecting' && (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    )}
                    {getStatusLabel(instance.connectionStatus)}
                  </Badge>
                  {instance._count && (
                    <span className="text-xs text-muted-foreground">
                      {instance._count.Chat} chats
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
        
        {instances.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma instância encontrada
          </p>
        )}
      </CardContent>
    </Card>
  );
};
