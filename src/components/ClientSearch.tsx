
import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/formatters";
import { Calendar } from "lucide-react";

interface Client {
  id: string;
  company_name: string;
  created_at: string;
}

interface ClientSearchProps {
  value: string;
  onChange: (value: string, leadId?: string) => void;
  placeholder?: string;
}

export function ClientSearch({ value, onChange, placeholder = "Selecionar cliente..." }: ClientSearchProps) {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('id, company_name, created_at')
        .order('company_name');
      
      if (!error && data) {
        // Remover duplicatas baseadas no nome da empresa
        const uniqueClients = data.reduce((acc: Client[], current) => {
          const x = acc.find(item => item.company_name === current.company_name);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);
        setClients(uniqueClients);
      }
      setLoading(false);
    };

    fetchClients();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background border-border text-foreground hover:bg-muted/50"
        >
          {value ? value : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-card border-border shadow-2xl">
        <Command className="bg-card">
          <CommandInput placeholder="Procurar cliente..." className="border-none focus:ring-0" />
          <CommandList>
            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.company_name}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue, client.id);
                    setOpen(false);
                  }}
                  className="hover:bg-muted/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === client.company_name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="font-medium">{client.company_name}</span>
                    </div>
                    <span className="text-[9px] font-medium text-muted-foreground/60 flex items-center gap-1">
                      <Calendar size={10} /> {formatDate(client.created_at)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
