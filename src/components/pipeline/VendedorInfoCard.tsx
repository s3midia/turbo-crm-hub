import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Profile } from "@/hooks/useProfiles";

interface VendedorInfoCardProps {
    vendedor: Profile;
}

export function VendedorInfoCard({ vendedor }: VendedorInfoCardProps) {
    // Extrair iniciais do nome para o avatar
    const initials = vendedor.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    // Texto do cargo de forma discreta
    const cargoText = vendedor.role === 'admin' ? 'Administrador' :
        vendedor.role === 'manager' ? 'Gerente' : 'Vendedor';

    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
            {/* Avatar compacto */}
            <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                    {initials}
                </AvatarFallback>
            </Avatar>

            {/* Nome e cargo */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-none mb-0.5 truncate">
                    {vendedor.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                    {cargoText}
                </p>
            </div>
        </div>
    );
}
