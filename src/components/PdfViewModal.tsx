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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] h-[95vh] flex flex-col p-0 overflow-hidden bg-background border-border">
        <DialogHeader className="p-4 border-b border-border bg-muted/20 shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            📄 Visualizar PDF: {title}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
              title="Abrir em nova aba"
            >
              <ExternalLink size={18} />
            </a>
          </div>
        </DialogHeader>
        
        <div className="flex-1 bg-muted/10 relative">
          <iframe 
            src={`${url}#toolbar=0`} 
            className="w-full h-full border-none"
            title={title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
