import React, { useState, useEffect, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, RefreshCw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export interface VisualSettings {
  capaBgUrl: string;
  logoUrl: string;
  logoX: number; // % from left
  logoY: number; // % from top
  logoScale: number; // multiplier
}

export const DEFAULT_VISUAL_SETTINGS: VisualSettings = {
  capaBgUrl: "",
  logoUrl: "",
  logoX: 12,
  logoY: 6,
  logoScale: 1,
};

export const getVisualSettings = (): VisualSettings => {
  try {
    const stored = localStorage.getItem("s3_proposal_visual_settings");
    if (stored) return JSON.parse(stored);
  } catch (e) { /* noop */ }
  return DEFAULT_VISUAL_SETTINGS;
};

export function VisualSettingsModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [settings, setSettings] = useState<VisualSettings>(DEFAULT_VISUAL_SETTINGS);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (open) {
      setSettings(getVisualSettings());
    }
  }, [open]);

  const handleUpdate = (field: keyof VisualSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    // Calculate new X/Y based on mouse position relative to container
    let newX = ((e.clientX - rect.left) / rect.width) * 100;
    let newY = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain to container
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    setSettings(prev => ({ ...prev, logoX: newX, logoY: newY }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleSave = () => {
    localStorage.setItem("s3_proposal_visual_settings", JSON.stringify(settings));
    toast.success("Configurações visuais salvas globalmente!");
    onOpenChange(false);
  };

  const handleReset = () => {
    setSettings(DEFAULT_VISUAL_SETTINGS);
    toast.info("Configurações restauradas (lembre-se de salvar).");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] overflow-hidden flex flex-col bg-card border-border p-0">
        <DialogHeader className="p-6 border-b border-border bg-muted/20 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <Settings className="w-5 h-5 text-[#cfff04]" />
            Personalização Visual (Global)
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Defina a imagem de fundo padrão e arraste a logo na folha para determinar sua posição final em todas as páginas da proposta.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Esquerda: Controles */}
          <div className="w-1/2 p-6 border-r border-border bg-muted/5 flex flex-col gap-6 overflow-y-auto">
            <div className="space-y-2">
              <Label>URL da Imagem de Fundo (Capa)</Label>
              <Input 
                placeholder="Ex: https://.../fundo.jpg" 
                value={settings.capaBgUrl} 
                onChange={e => handleUpdate("capaBgUrl", e.target.value)} 
              />
              <p className="text-[11px] text-muted-foreground">Deixe em branco para o fundo preto padrão.</p>
            </div>

            <div className="space-y-2">
              <Label>URL da Logo (Opcional)</Label>
              <Input 
                placeholder="Ex: https://.../logo.png" 
                value={settings.logoUrl} 
                onChange={e => handleUpdate("logoUrl", e.target.value)} 
              />
              <p className="text-[11px] text-muted-foreground">Digite 'none' para remover a logo completamente ou deixe vazio para a logo padrão da S3.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border mt-auto">
              <Label className="flex justify-between">
                <span>Tamanho da Logo</span>
                <span className="text-muted-foreground">{(settings.logoScale * 100).toFixed(0)}%</span>
              </Label>
              <Slider 
                value={[settings.logoScale]} 
                min={0.2} max={3} step={0.1} 
                onValueChange={([val]) => handleUpdate("logoScale", val)} 
                className="py-4"
              />
              <p className="text-[11px] text-[hsl(38,92%,55%)] font-semibold mt-2">
                Aviso: Arraste a logo no quadro ao lado para definir exatamente onde ela ficará no documento final. O marcador (x) fica no centro da logo.
              </p>
            </div>
          </div>

          {/* Direita: Preview DND */}
          <div className="flex-1 bg-black/50 p-6 flex flex-col items-center justify-center relative shadow-inner">
             <div className="text-xs text-muted-foreground absolute top-2 uppercase tracking-widest font-bold">
               Preview (Arraste a Logo)
             </div>
             
             {/* A4 Canvas Container */}
             <div 
               ref={containerRef}
               className="w-[280px] h-[396px] bg-[#1a1a1a] border-2 border-dashed border-gray-700 relative overflow-hidden ring-1 ring-white/10"
             >
                {/* Simulated content lines to give context */}
                <div className="absolute top-[80px] left-[30px] w-[200px] h-2 bg-white/5 rounded"></div>
                <div className="absolute top-[100px] left-[30px] w-[180px] h-2 bg-white/5 rounded"></div>
                <div className="absolute top-[120px] left-[30px] w-[220px] h-2 bg-white/5 rounded"></div>
                <div className="absolute bottom-[40px] left-[30px] w-[100px] h-2 bg-white/5 rounded"></div>
             
                {/* Interactive Logo */}
                {settings.logoUrl !== "none" && (
                   <div 
                     onPointerDown={handlePointerDown}
                     onPointerMove={handlePointerMove}
                     onPointerUp={handlePointerUp}
                     onPointerCancel={handlePointerUp}
                     className="absolute cursor-move select-none p-2 border border-transparent hover:border-[#cfff04]/50 active:border-[#cfff04] transition-colors rounded"
                     style={{
                        left: `${settings.logoX}%`,
                        top: `${settings.logoY}%`,
                        transform: `translate(-50%, -50%) scale(${settings.logoScale})`,
                        touchAction: 'none' // Prevent scrolling while dragging on touch devices
                     }}
                   >
                     {settings.logoUrl && settings.logoUrl.trim() !== "" ? (
                        <div className="relative group">
                          <img 
                            src={settings.logoUrl} 
                            alt="Logo preview" 
                            className="max-h-8 object-contain pointer-events-none" 
                            draggable={false}
                          />
                          <div className="absolute inset-0 m-auto w-1 h-1 bg-[#cfff04] rounded-full opacity-50 pointer-events-none group-hover:opacity-100 shadow-[0_0_5px_#cfff04]" />
                        </div>
                     ) : (
                        <div className="flex items-center gap-1 opacity-80 pointer-events-none relative group">
                          <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#cfff04]" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21L5 14l2-8 5 3 5-3 2 8-7 7z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-7M5 14h14" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 6l2 4 3-1 3 1 2-4" />
                          </svg>
                          <span className="font-bold tracking-tight text-white text-xs">S3MÍDIA</span>
                          <div className="absolute inset-0 m-auto w-1 h-1 bg-[#cfff04] rounded-full opacity-0 pointer-events-none group-hover:opacity-100 shadow-[0_0_5px_#cfff04]" />
                        </div>
                     )}
                   </div>
                )}
             </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border shrink-0 bg-muted/20 flex sm:justify-between items-center w-full">
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-white">
               <RefreshCw className="w-4 h-4 mr-2" />
               Restaurar Padrões
            </Button>
            <div className="flex gap-2">
               <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
               </Button>
               <Button onClick={handleSave} className="bg-[#cfff04] hover:bg-[#b5e600] text-black font-bold gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Configurações
               </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
