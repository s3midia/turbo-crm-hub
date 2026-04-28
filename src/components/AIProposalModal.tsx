import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Check } from "lucide-react";
import { generateMarketingProposal, CompanyInfo } from "@/lib/proposalGenerator";
import { toast } from "sonner";
import ModernProposalTemplate from "./ModernProposalTemplate";

interface AIProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProposalGenerated: (proposal: { titulo: string; cliente: string; conteudo: string }) => void;
}

export function AIProposalModal({ open, onOpenChange, onProposalGenerated }: AIProposalModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "result">("form");
  const [formData, setFormData] = useState<CompanyInfo>({
    name: "",
    niche: "",
    services: [],
    tone: "persuasivo"
  });
  const [servicesText, setServicesText] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);

  const handleGenerate = async () => {
    if (!formData.name || !formData.niche || !servicesText) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const info: CompanyInfo = {
        ...formData,
        services: servicesText.split(",").map(s => s.trim()).filter(s => s.length > 0)
      };
      
      const content = await generateMarketingProposal(info);
      setGeneratedContent(content);
      try {
        setParsedData(JSON.parse(content));
      } catch (e) {
        setParsedData(null);
      }
      setStep("result");
      toast.success("Proposta gerada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar proposta.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onProposalGenerated({
      titulo: `Proposta: ${formData.name}`,
      cliente: formData.name,
      conteudo: generatedContent
    });
    onOpenChange(false);
    setTimeout(() => {
      setStep("form");
      setGeneratedContent("");
      setParsedData(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${step === "result" ? "max-w-[95vw] w-[1200px] h-[95vh] p-0" : "sm:max-w-[600px]"} bg-card border-border overflow-hidden flex flex-col`}>
        <DialogHeader className={step === "result" ? "p-6 border-b border-border bg-muted/20 shrink-0" : ""}>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Sparkles className="w-5 h-5 text-[hsl(265,85%,60%)]" />
            Gerar Proposta com IA
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {step === "form" 
              ? "Informe os detalhes da empresa para que nossa IA crie uma proposta premium."
              : "Sua proposta premium está pronta. Salve-a para editar ou enviar."}
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Nome da Empresa</Label>
              <Input 
                id="name" 
                placeholder="Ex: Agência Alpha Marketing" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="niche" className="text-foreground">Nicho / Ramo de Atuação</Label>
              <Input 
                id="niche" 
                placeholder="Ex: Imobiliárias, E-commerce, Saúde" 
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="services" className="text-foreground">Serviços Oferecidos (separados por vírgula)</Label>
              <Textarea 
                id="services" 
                placeholder="Ex: Gestão de Tráfego, Social Media, Criação de Sites" 
                value={servicesText}
                onChange={(e) => setServicesText(e.target.value)}
                className="bg-background border-border min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone" className="text-foreground">Tom de Voz</Label>
              <select 
                id="tone"
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.tone}
                onChange={(e: any) => setFormData({ ...formData, tone: e.target.value })}
              >
                <option value="persuasivo">Persuasivo (Recomendado)</option>
                <option value="formal">Formal</option>
                <option value="criativo">Criativo</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-black p-4">
            {parsedData ? (
               <div className="flex justify-center w-full min-h-full">
                 <div className="w-full max-w-[1100px]">
                   <ModernProposalTemplate data={parsedData} />
                 </div>
               </div>
            ) : (
              <div className="prose prose-invert max-w-none text-white whitespace-pre-wrap font-sans leading-relaxed p-6">
                {generatedContent}
              </div>
            )}
          </div>
        )}

        <DialogFooter className={`gap-2 sm:gap-0 ${step === "result" ? "p-4 border-t border-border shrink-0 bg-muted/20" : ""}`}>
          {step === "form" ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border hover:bg-muted">
                Cancelar
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={loading}
                className="bg-[hsl(265,85%,60%)] hover:bg-[hsl(265,85%,52%)] text-white gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? "Gerando..." : "Gerar Proposta Premium"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("form")} className="border-border hover:bg-muted gap-2">
                Voltar e Alterar
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,35%)] text-white gap-2"
              >
                <Check className="w-4 h-4" />
                Salvar Proposta Premium
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
