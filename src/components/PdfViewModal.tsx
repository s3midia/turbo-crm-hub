import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { X, ExternalLink } from "lucide-react";

interface PdfViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
}

export function PdfViewModal({ open, onOpenChange, url, title }: PdfViewModalProps) {
  if (!url) return null;

  // Convert Google Drive links to preview format if necessary
  const getEmbedUrl = (originalUrl: string) => {
    if (originalUrl.includes("drive.google.com")) {
      if (originalUrl.includes("/view")) {
        return originalUrl.replace("/view", "/preview");
      }
      if (originalUrl.includes("id=")) {
        // Handle id= format
        try {
          const id = new URL(originalUrl).searchParams.get("id");
          if (id) return `https://drive.google.com/file/d/${id}/preview`;
        } catch (e) {
          return originalUrl;
        }
      }
    }
    return originalUrl;
  };

  const embedUrl = getEmbedUrl(url);
  const isGoogleDrive = url.includes("drive.google.com");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] h-[95vh] flex flex-col p-0 overflow-hidden bg-background border-border">
        <DialogHeader className="p-4 border-b border-border bg-muted/20 shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            📄 {isGoogleDrive ? "Documento Google Drive" : "Visualizar PDF"}: {title}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all"
              title="Abrir em nova aba"
            >
              <ExternalLink size={14} />
              Abrir Original
            </a>
          </div>
        </DialogHeader>
        
        <div className="flex-1 bg-muted/10 relative flex flex-col items-center justify-center">
          {isGoogleDrive && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full text-[10px] font-bold border border-amber-500/20 animate-pulse">
              Se o arquivo não carregar, clique em "Abrir Original" acima
            </div>
          )}
          <iframe 
            src={isGoogleDrive ? embedUrl : `${embedUrl}#toolbar=0`} 
            className="w-full h-full border-none bg-white"
            title={title}
            allow="autoplay"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
