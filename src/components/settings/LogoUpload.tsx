import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LogoUploadProps {
    currentLogo?: string;
    onLogoChange: (logo: string | null) => void;
    logoSize?: number;
    onSizeChange?: (size: number) => void;
    title: string;
    description: string;
    minSize?: number;
    maxSize?: number;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

export default function LogoUpload({
    currentLogo,
    onLogoChange,
    logoSize = 40,
    onSizeChange,
    title,
    description,
    minSize = 20,
    maxSize = 100
}: LogoUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentLogo || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
            toast({
                title: 'Erro',
                description: 'Tipo de arquivo inválido. Use PNG, JPG, JPEG ou SVG.',
                variant: 'destructive',
            });
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            toast({
                title: 'Erro',
                description: 'Arquivo muito grande. O tamanho máximo é 2MB.',
                variant: 'destructive',
            });
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setPreview(base64String);
            onLogoChange(base64String);
        };
        reader.onerror = () => {
            toast({
                title: 'Erro',
                description: 'Erro ao ler o arquivo. Tente novamente.',
                variant: 'destructive',
            });
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setPreview(null);
        onLogoChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4">
            <div>
                <Label className="text-base">{title}</Label>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>

            {preview ? (
                <div className="space-y-4">
                    <div className="relative w-full max-w-xs p-6 border-2 border-dashed rounded-lg bg-muted/20">
                        <img
                            src={preview}
                            alt="Logo Preview"
                            style={{ height: `${logoSize}px`, width: 'auto' }}
                            className="object-contain mx-auto rounded-md"
                        />
                    </div>

                    {/* Size Control Slider */}
                    {onSizeChange && (
                        <div className="space-y-2 max-w-xs">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="logo-size" className="text-sm">Tamanho: {logoSize}px</Label>
                            </div>
                            <input
                                id="logo-size"
                                type="range"
                                min={minSize}
                                max={maxSize}
                                value={logoSize}
                                onChange={(e) => onSizeChange(Number(e.target.value))}
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{minSize}px</span>
                                <span>{maxSize}px</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleButtonClick}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Alterar Logo
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveLogo}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Remover Logo
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div
                        className="relative w-full max-w-xs p-8 border-2 border-dashed rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={handleButtonClick}
                    >
                        <div className="flex flex-col items-center justify-center text-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
                            <p className="text-sm font-medium text-foreground mb-1">
                                Clique para fazer upload
                            </p>
                            <p className="text-xs text-muted-foreground">
                                PNG, JPG, JPEG ou SVG (máx. 2MB)
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleButtonClick}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Escolher Arquivo
                    </Button>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}
