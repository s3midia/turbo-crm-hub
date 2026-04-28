import { Search, Filter, Facebook, Instagram, MessageCircle, User, Users, Briefcase, Layout } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export const AttendanceFilters = () => {
  const [activePlatform, setActivePlatform] = useState('all');
  const [isOpen, setIsOpen] = useState(true);

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: Facebook },
    { id: 'instagram', name: 'Instagram', icon: Instagram },
    { id: 'whatsapp_web', name: 'WhatsApp WEB', icon: MessageCircle },
    { id: 'whatsapp_api', name: 'WhatsApp API', icon: MessageCircle, active: true },
  ];

  const departments = [
    { id: 'vendas', name: 'Vendas' },
    { id: 'suporte', name: 'Suporte' },
    { id: 'financeiro', name: 'Financeiro' },
    { id: 'suporte2', name: 'Suporte2' },
  ];

  const responsables = [
    { id: 'afonso', name: 'Afonso Henrique' },
    { id: 'aline', name: 'Aline' },
    { id: 'ana', name: 'Ana Carolina' },
    { id: 'anderson', name: 'Anderson Santos' },
  ];

  const sections = [
    { title: 'Plataformas', items: platforms, type: 'platform' },
    { title: 'Por departamento', items: departments, type: 'department' },
    { title: 'Por responsável', items: responsables, type: 'responsable' },
  ];

  return (
    <div className={cn(
      "flex flex-col border-r border-border bg-card/50 backdrop-blur-sm h-full overflow-hidden transition-all duration-300",
      isOpen ? "w-64" : "w-[60px]"
    )}>
      <div className={cn("border-b border-border/50", isOpen ? "p-4" : "p-3 flex items-center justify-center")}>
        {isOpen ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setIsOpen(false)} className="text-sm font-bold flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Filter className="h-4 w-4 text-primary" />
                Filtros
              </button>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] text-orange-500 hover:text-orange-600 hover:bg-orange-500/10">
                Resetar
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Encontrar serviço" 
                className="pl-9 h-9 bg-background/50 border-border/50 text-xs"
              />
            </div>
          </>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="h-9 w-9 shrink-0 flex items-center justify-center" title="Abrir Filtros">
            <Filter className="h-5 w-5 text-primary" />
          </Button>
        )}
      </div>

      {isOpen && (
        <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item: any) => (
                  <button
                    key={item.id}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all",
                      item.active 
                        ? "bg-primary/10 text-primary font-bold" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
                <Button variant="link" className="px-3 h-auto text-[11px] text-primary p-0 h-6">
                  Ver tudo...
                </Button>
              </div>
            </div>
          ))}
          
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
              Por etapa
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar" 
                className="pl-9 h-8 bg-background/50 border-border/50 text-xs"
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    )}
  </div>
  );
};
