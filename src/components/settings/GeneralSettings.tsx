import { useState, useEffect } from 'react';
import { useSystemSettings, useUpdateSystemSettings, ThemePalette } from '@/hooks/useSystemSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import LogoUpload from './LogoUpload';
import ColorPalette from './ColorPalette';

export default function GeneralSettings() {
    const { data: settings, isLoading } = useSystemSettings();
    const updateSettings = useUpdateSystemSettings();

    const [companyName, setCompanyName] = useState('');

    // Three separate logos
    const [logoFavicon, setLogoFavicon] = useState<string | null>(null);
    const [logoCollapsed, setLogoCollapsed] = useState<string | null>(null);
    const [logoExpanded, setLogoExpanded] = useState<string | null>(null);

    // Logo sizes
    const [logoFaviconSize, setLogoFaviconSize] = useState(32);
    const [logoCollapsedSize, setLogoCollapsedSize] = useState(40);
    const [logoExpandedSize, setLogoExpandedSize] = useState(40);

    const [themeColor, setThemeColor] = useState('#000000');
    const [themePalette, setThemePalette] = useState<ThemePalette | undefined>(undefined);

    // Update local state when settings are loaded
    useEffect(() => {
        if (settings && !isLoading) {
            setCompanyName(settings.company_name || '');
            setLogoFavicon(settings.logo_favicon || null);
            setLogoCollapsed(settings.logo_collapsed || null);
            setLogoExpanded(settings.logo_expanded || null);
            setLogoFaviconSize(settings.logo_favicon_size || 32);
            setLogoCollapsedSize(settings.logo_collapsed_size || 40);
            setLogoExpandedSize(settings.logo_expanded_size || 40);
            setThemeColor(settings.theme_color || '#000000');
            setThemePalette(settings.theme_palette || undefined);
        }
    }, [settings, isLoading]);

    const handleSave = () => {
        const updates = {
            company_name: companyName,
            logo_favicon: logoFavicon || undefined,
            logo_collapsed: logoCollapsed || undefined,
            logo_expanded: logoExpanded || undefined,
            logo_favicon_size: logoFaviconSize,
            logo_collapsed_size: logoCollapsedSize,
            logo_expanded_size: logoExpandedSize,
            theme_color: themeColor,
            theme_palette: themePalette,
        };

        updateSettings.mutate(updates);

        // Update favicon dynamically
        updateFavicon(logoFavicon);
    };

    // Function to update favicon dynamically
    const updateFavicon = (faviconDataUrl: string | null) => {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;

        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }

        if (faviconDataUrl) {
            link.href = faviconDataUrl;
        } else {
            // use default favicon
            link.href = '/favicon.ico';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informações da Empresa</CardTitle>
                    <CardDescription>
                        Configure as informações básicas e a identidade visual completa da sua empresa
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Company Name */}
                    <div className="space-y-2">
                        <Label htmlFor="company-name">Nome da Empresa</Label>
                        <Input
                            id="company-name"
                            placeholder="Digite o nome da empresa"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />
                    </div>

                    <Separator />

                    {/* Favicon Upload */}
                    <LogoUpload
                        title="Favicon (Ícone do Navegador)"
                        description="Ícone que aparece na aba do navegador. Recomendado: imagem quadrada, 32x32px ou maior."
                        currentLogo={logoFavicon || undefined}
                        onLogoChange={setLogoFavicon}
                        logoSize={logoFaviconSize}
                        onSizeChange={setLogoFaviconSize}
                        minSize={16}
                        maxSize={64}
                    />

                    <Separator />

                    {/* Collapsed Sidebar Logo */}
                    <LogoUpload
                        title="Logo Sidebar Colapsada"
                        description="Logo exibida quando a barra lateral está fechada. Recomendado: ícone ou versão simplificada do logo."
                        currentLogo={logoCollapsed || undefined}
                        onLogoChange={setLogoCollapsed}
                        logoSize={logoCollapsedSize}
                        onSizeChange={setLogoCollapsedSize}
                        minSize={24}
                        maxSize={80}
                    />

                    <Separator />

                    {/* Expanded Sidebar Logo */}
                    <LogoUpload
                        title="Logo Sidebar Expandida"
                        description="Logo exibida quando a barra lateral está expandida. Recomendado: logo horizontal completo da empresa."
                        currentLogo={logoExpanded || undefined}
                        onLogoChange={setLogoExpanded}
                        logoSize={logoExpandedSize}
                        onSizeChange={setLogoExpandedSize}
                        minSize={20}
                        maxSize={100}
                    />

                    <Separator />

                    {/* Color Palette */}
                    <ColorPalette
                        selectedColor={themeColor}
                        onColorChange={setThemeColor}
                        currentPalette={themePalette}
                        onPaletteChange={setThemePalette}
                    />
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={updateSettings.isPending}
                >
                    {updateSettings.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar Alterações
                </Button>
            </div>
        </div>
    );
}
