import { User, Phone, Mail, MapPin, Tag, Plus, Calendar, StickyNote, Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EvolutionChat } from '@/hooks/useEvolutionAPI';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContactDetailsSidebarProps {
  chat: EvolutionChat | null;
}

export const ContactDetailsSidebar = ({ chat }: ContactDetailsSidebarProps) => {
  if (!chat) return (
    <div className="w-80 border-l border-border bg-card/30 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
      <Info className="h-10 w-10 mb-2 opacity-20" />
      <p className="text-sm italic">Selecione um contato para ver os detalhes</p>
    </div>
  );

  return (
    <div className="w-[280px] lg:w-[320px] shrink-0 flex flex-col border-l border-border bg-card/30 h-full overflow-hidden animate-in slide-in-from-right-4 duration-300">
      <div className="p-6 text-center border-b border-border/50">
        <div className="relative inline-block mb-4">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            {chat.profilePicUrl && <AvatarImage src={chat.profilePicUrl} />}
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
              {chat.name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </div>
        <h2 className="text-lg font-bold truncate">{chat.name || 'Sem nome'}</h2>
        <div className="flex items-center justify-center gap-2 mt-1 text-muted-foreground">
          <Phone className="h-3 w-3" />
          <span className="text-xs">{chat.remoteJid.split('@')[0]}</span>
        </div>
        
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full"><Mail className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full"><Phone className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full"><MapPin className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full"><Calendar className="h-4 w-4" /></Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-none transition-all cursor-pointer">
              agendoureuniao ×
            </Badge>
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-none transition-all cursor-pointer">
              sorteio-enki ×
            </Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full"><Plus className="h-3 w-3" /></Button>
          </div>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full bg-muted/50 p-1">
              <TabsTrigger value="info" className="flex-1 text-xs">Informações</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1 text-xs">Anotações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground px-1">Nível</label>
                <Select defaultValue="lead">
                  <SelectTrigger className="h-9 text-xs bg-background/50 border-border/50">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="oportunidade">Oportunidade</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground px-1">Plano Contratado</label>
                <Select>
                  <SelectTrigger className="h-9 text-xs bg-background/50 border-border/50">
                    <SelectValue placeholder="Selecione uma opção..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground px-1">Empresa</label>
                <Input placeholder="Nome da empresa" className="h-9 text-xs bg-background/50 border-border/50" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground px-1">Cargo</label>
                <Input placeholder="Ex: Diretor" className="h-9 text-xs bg-background/50 border-border/50" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground px-1">Email</label>
                <Input placeholder="email@exemplo.com" className="h-9 text-xs bg-background/50 border-border/50" />
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <div className="space-y-4">
                <div className="relative">
                  <textarea 
                    placeholder="Adicionar nota..." 
                    className="w-full min-h-[100px] rounded-lg border border-border/50 bg-background/50 p-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  />
                  <Button size="sm" className="mt-2 w-full h-8 text-[11px] font-bold">Salvar Nota</Button>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-[11px]">
                    <div className="flex items-center justify-between mb-1 opacity-60">
                      <span className="font-bold">Sistema</span>
                      <span>1h atrás</span>
                    </div>
                    Lead converteu através do formulário principal.
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};
