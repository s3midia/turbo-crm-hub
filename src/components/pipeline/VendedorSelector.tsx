import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfiles } from "@/hooks/useProfiles";

interface VendedorSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function VendedorSelector({ value, onChange }: VendedorSelectorProps) {
    const { data: profiles, isLoading } = useProfiles();

    // Filtrar apenas usuários ativos
    const vendedores = profiles?.filter(p => p.is_active) || [];

    // Encontrar vendedor selecionado
    const vendedorSelecionado = vendedores.find(v => v.id === value);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Carregando vendedores...
            </div>
        );
    }

    // Extrair iniciais
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Texto do cargo
    const getCargoText = (role: string) => {
        return role === 'admin' ? 'Administrador' :
            role === 'manager' ? 'Gerente' : 'Vendedor';
    };

    return (
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Vendedor:
            </label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-[280px] h-9">
                    {value === "todos" ? (
                        <span className="text-sm">Todos os vendedores</span>
                    ) : vendedorSelecionado ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={vendedorSelecionado.avatar_url} alt={vendedorSelecionado.full_name} />
                                <AvatarFallback className="bg-primary/10 text-primary font-medium text-[10px]">
                                    {getInitials(vendedorSelecionado.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-medium leading-none">
                                    {vendedorSelecionado.full_name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {getCargoText(vendedorSelecionado.role)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <span className="text-sm text-muted-foreground">Selecione...</span>
                    )}
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todos">
                        <span className="font-medium text-sm">Todos os vendedores</span>
                    </SelectItem>
                    {vendedores.map((vendedor) => (
                        <SelectItem key={vendedor.id} value={vendedor.id}>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={vendedor.avatar_url} alt={vendedor.full_name} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-[10px]">
                                        {getInitials(vendedor.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm">{vendedor.full_name}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {getCargoText(vendedor.role)}
                                    </span>
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
