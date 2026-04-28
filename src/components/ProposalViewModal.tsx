
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Download, Send } from "lucide-react";
import { toast } from "sonner";
import ModernProposalTemplate from "./ModernProposalTemplate";

interface ProposalViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: {
    titulo: string;
    cliente: string;
    conteudo?: string;
  } | null;
}

export function ProposalViewModal({ open, onOpenChange, proposal }: ProposalViewModalProps) {
  const [parsedData, setParsedData] = useState<any>(null);

  useEffect(() => {
    if (proposal?.conteudo) {
      try {
        const data = JSON.parse(proposal.conteudo);
        setParsedData(data);
      } catch (e) {
        // Not a JSON string (could be old proposal markdown)
        setParsedData(null);
      }
    } else {
      setParsedData(null);
    }
  }, [proposal]);

  if (!proposal) return null;

  const handleCopy = () => {
    if (proposal.conteudo) {
      navigator.clipboard.writeText(proposal.conteudo);
      toast.success("Conteúdo copiado!");
    }
  };

  const handleWhatsApp = () => {
    if (proposal.conteudo) {
      const text = encodeURIComponent(`Olá ${proposal.cliente}, segue a proposta comercial da S3 Mídia.`);
      // No futuro, link direto ou PDF. Por enquanto, a mensagem padrão.
      window.open(`https://wa.me/?text=${text}`, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[95vh] overflow-hidden flex flex-col bg-[#050505] border-gray-800 p-0 rounded-xl">
        <DialogHeader className="border-b border-gray-900 p-4 shrink-0 bg-[#0a0a0a]">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <FileText className="w-5 h-5 text-[#cfff04]" />
            {proposal.titulo}
          </DialogTitle>
          <p className="text-sm text-gray-500">Visualização de Proposta Premium</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-black p-4">
          {parsedData ? (
             <div className="flex justify-center w-full min-h-full">
               {/* Container adjusts to fit the max-w-6xl inside the template */}
               <div className="w-full max-w-[1100px]">
                 <ModernProposalTemplate data={parsedData} />
               </div>
             </div>
          ) : (
            <div className="prose prose-invert max-w-none text-white whitespace-pre-wrap font-sans leading-relaxed p-6">
              {proposal.conteudo || "Nenhum conteúdo disponível para esta proposta."}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-gray-900 p-4 shrink-0 bg-[#0a0a0a]">
          <div className="flex w-full justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 border-gray-700 bg-transparent text-gray-300 hover:text-white hover:bg-gray-800">
                <Copy className="w-4 h-4" />
                Copiar JSON
              </Button>
              <Button variant="outline" size="sm" className="gap-2 border-gray-700 bg-transparent text-gray-300 hover:text-white hover:bg-gray-800" onClick={() => toast.info('Impressão em PDF em desenvolvimento.')}>
                <Download className="w-4 h-4" />
                Baixar PDF
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="border-gray-700 bg-transparent text-gray-300 hover:text-white hover:bg-gray-800">
                Fechar
              </Button>
              <Button size="sm" onClick={handleWhatsApp} className="bg-[#cfff04] hover:bg-[#b5e600] text-black gap-2 font-bold">
                <Send className="w-4 h-4" />
                Enviar Web
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
