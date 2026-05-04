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
import { FileEdit, Plus, Trash2, Check, Sparkles, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { RichTextEditor } from "./ui/RichTextEditor";
import { generateMarketingProposal } from "@/lib/proposalGenerator";
import { toast } from "sonner";
import { ClientSearch } from "./ClientSearch";

interface ServiceItem {
  nome: string;
  descricao: string;
}

interface InvestmentItem {
  item: string;
  valorOriginal: number;
  valorFinal: number;
  recorrente: boolean;
}

interface ProposalData {
  cliente: string;
  nicho: string;
  introducao: string;
  servicos: ServiceItem[];
  investimentos: InvestmentItem[];
  prazo: string;
  parcelamento: string;
  capaBgUrl?: string;
  logoUrl?: string;
}

interface ManualProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (doc: { id?: number; titulo: string; cliente: string; conteudo: string }) => void;
  doc?: { id: number; titulo: string; cliente: string; conteudo?: string } | null;
}

export function ManualProposalModal({ open, onOpenChange, onSave, doc }: ManualProposalModalProps) {
  const [step, setStep] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [data, setData] = useState<ProposalData>({
    cliente: "",
    nicho: "",
    introducao: "",
    servicos: [
        { nome: "", descricao: "" }
    ],
    investimentos: [
        { item: "", valorOriginal: 0, valorFinal: 0, recorrente: false }
    ],
    prazo: "30 Dias",
    parcelamento: "A combinar",
    capaBgUrl: "",
    logoUrl: ""
  });

  const handleAIGenerate = async () => {
    if (!data.cliente || !data.nicho) {
      toast.error("Preencha ao menos o Nome do Cliente e o Nicho para a IA gerar a proposta.");
      return;
    }
    setAiLoading(true);
    try {
      const info = {
        name: data.cliente,
        niche: data.nicho,
        services: data.servicos.map(s => s.nome).filter(Boolean),
        tone: "persuasivo" as const
      };
      if (info.services.length === 0) {
         info.services = ["Marketing Digital"];
      }
      
      const jsonStr = await generateMarketingProposal(info);
      const generatedData = JSON.parse(jsonStr);
      
      setData(prev => ({
         ...prev,
         introducao: generatedData.introducao || prev.introducao,
         servicos: generatedData.servicos && generatedData.servicos.length > 0 ? generatedData.servicos : prev.servicos,
         investimentos: generatedData.investimentos && generatedData.investimentos.length > 0 ? generatedData.investimentos : prev.investimentos,
         prazo: generatedData.prazo || prev.prazo,
         parcelamento: generatedData.parcelamento || prev.parcelamento
      }));
      toast.success("Proposta preenchida com IA!");
      setStep(4);
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar com IA");
    } finally {
      setAiLoading(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      setStep(1);
      if (doc && doc.conteudo) {
        try {
          const parsed = JSON.parse(doc.conteudo);
          setData(parsed);
        } catch (e) {
          // fallback if json parse fails
        }
      } else {
        setData({
          cliente: "", nicho: "", introducao: "",
          servicos: [{ nome: "", descricao: "" }],
          investimentos: [{ item: "", valorOriginal: 0, valorFinal: 0, recorrente: false }],
          prazo: "30 Dias", parcelamento: "A combinar", capaBgUrl: "", logoUrl: ""
        });
      }
    } else {
      setTimeout(() => setStep(1), 300);
    }
  }, [open, doc]);

  const updateField = (field: keyof ProposalData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddService = () => {
    setData(prev => ({ ...prev, servicos: [...prev.servicos, { nome: "", descricao: "" }] }));
  };

  const handleRemoveService = (index: number) => {
    setData(prev => ({ ...prev, servicos: prev.servicos.filter((_, i) => i !== index) }));
  };

  const updateService = (index: number, field: keyof ServiceItem, value: string) => {
    const newServices = [...data.servicos];
    newServices[index] = { ...newServices[index], [field]: value };
    setData(prev => ({ ...prev, servicos: newServices }));
  };

  const handleAddInvestment = () => {
    setData(prev => ({ ...prev, investimentos: [...prev.investimentos, { item: "", valorOriginal: 0, valorFinal: 0, recorrente: false }] }));
  };

  const handleRemoveInvestment = (index: number) => {
    setData(prev => ({ ...prev, investimentos: prev.investimentos.filter((_, i) => i !== index) }));
  };

  const updateInvestment = (index: number, field: keyof InvestmentItem, value: any) => {
    const newInvestments = [...data.investimentos];
    newInvestments[index] = { ...newInvestments[index], [field]: value };
    setData(prev => ({ ...prev, investimentos: newInvestments }));
  };

  const handleSaveBtn = () => {
    onSave({
      id: doc?.id,
      titulo: `Proposta: ${data.cliente}`,
      cliente: data.cliente,
      // Stringify to simulate what AI would return
      conteudo: JSON.stringify(data)
    });
    onOpenChange(false);
    // Reset state silently
    setTimeout(() => {
        setData({
            cliente: "", nicho: "", introducao: "",
            servicos: [{ nome: "", descricao: "" }],
            investimentos: [{ item: "", valorOriginal: 0, valorFinal: 0, recorrente: false }],
            prazo: "30 Dias", parcelamento: "A combinar", capaBgUrl: "", logoUrl: ""
        });
        setStep(1);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col bg-card border-border p-0">
        <DialogHeader className="p-6 border-b border-border bg-muted/20 shrink-0">
          <DialogTitle className="flex items-center justify-between text-xl font-bold text-white">
            <div className="flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-[#cfff04]" />
              Criar Proposta (Design Premium)
            </div>
            <Button 
               onClick={handleAIGenerate} 
               disabled={aiLoading} 
               className="bg-[hsl(265,85%,60%)] hover:bg-[hsl(265,85%,52%)] text-white gap-2 h-8 text-[12px] px-3 font-semibold"
            >
               {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
               {aiLoading ? "Gerando..." : "Preencher com IA"}
            </Button>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Etapa {step} de 4 — {step === 1 ? "Dados básicos do cliente" : step === 2 ? "Detalhes da solução e serviços" : step === 3 ? "Tabela de investimentos" : "Condições e visual"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Step 1: Secao Básica */}
            {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                   <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">1. Dados Básicos</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome do Cliente / Empresa</Label>
                        <ClientSearch 
                          value={data.cliente} 
                          onChange={(name) => updateField("cliente", name)} 
                          placeholder="Pesquisar cliente..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nicho (E-commerce, etc)</Label>
                        <Input placeholder="Doceria Artesanal" value={data.nicho} onChange={(e) => updateField("nicho", e.target.value)} />
                      </div>
                   </div>
                </div>
            )}

            {/* Step 2: Secao Serviços */}
            {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="flex justify-between items-center border-b border-border pb-2">
                      <h3 className="text-lg font-semibold text-foreground">2. Serviços (Solução)</h3>
                      <Button variant="outline" size="sm" onClick={handleAddService} className="h-8 gap-1"><Plus className="w-3 h-3"/> Serviço</Button>
                   </div>
                   
                   {data.servicos.map((svc, i) => (
                      <div key={i} className="flex gap-4 items-start p-4 border border-border rounded-lg bg-muted/10 relative group">
                         <button onClick={() => handleRemoveService(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Trash2 className="w-4 h-4"/>
                         </button>
                         <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                                <Label>Nome do Serviço</Label>
                                <Input placeholder="Ex: Criação de Site Institucional" value={svc.nome} onChange={(e) => updateService(i, "nome", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <RichTextEditor placeholder="Como isso ajuda o cliente..." value={svc.descricao} onChange={(val) => updateService(i, "descricao", val)} />
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
            )}

            {/* Step 3: Secao Investimentos */}
            {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="flex justify-between items-center border-b border-border pb-2">
                      <h3 className="text-lg font-semibold text-foreground">3. Tabela de Investimentos</h3>
                      <Button variant="outline" size="sm" onClick={handleAddInvestment} className="h-8 gap-1"><Plus className="w-3 h-3"/> Item</Button>
                   </div>
                   
                   {data.investimentos.map((inv, i) => (
                      <div key={i} className="flex gap-4 items-start p-4 border border-border rounded-lg bg-muted/10 relative group">
                         <button onClick={() => handleRemoveInvestment(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Trash2 className="w-4 h-4"/>
                         </button>
                         <div className="flex-1 grid grid-cols-12 gap-4">
                            <div className="space-y-2 col-span-5">
                                <Label>Item do Pacote</Label>
                                <Input placeholder="Ex: Fee Mensal Tráfego" value={inv.item} onChange={(e) => updateInvestment(i, "item", e.target.value)} />
                            </div>
                            <div className="space-y-2 col-span-3">
                                <Label>Valor Original</Label>
                                <Input type="number" placeholder="2500" value={inv.valorOriginal || ""} onChange={(e) => updateInvestment(i, "valorOriginal", parseFloat(e.target.value))} />
                            </div>
                            <div className="space-y-2 col-span-3">
                                <Label>Valor S3 (Final)</Label>
                                <Input type="number" placeholder="1500" value={inv.valorFinal || ""} onChange={(e) => updateInvestment(i, "valorFinal", parseFloat(e.target.value))} />
                            </div>
                            <div className="space-y-2 col-span-1 pt-8 flex items-center justify-center">
                                <label className="flex flex-col items-center gap-1 cursor-pointer">
                                   <input type="checkbox" checked={inv.recorrente} onChange={(e) => updateInvestment(i, "recorrente", e.target.checked)} className="w-4 h-4 accent-[#cfff04]" />
                                   <span className="text-[10px] text-muted-foreground font-semibold">Mensal?</span>
                                </label>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
            )}

            {/* Step 4: Fechamento & Visual */}
            {step === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                       <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">4. Condições Comerciais</h3>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Prazo Estimado de Entrega</Label>
                            <Input placeholder="Ex: 30 Dias ou 15 Dias Úteis" value={data.prazo} onChange={(e) => updateField("prazo", e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Opções de Parcelamento</Label>
                            <Input placeholder="Ex: Pix com 5% OFF, ou em até 12x no cartão" value={data.parcelamento} onChange={(e) => updateField("parcelamento", e.target.value)} />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">5. Personalização Visual</h3>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>URL da Imagem de Fundo (Capa)</Label>
                            <Input placeholder="Ex: https://..." value={data.capaBgUrl || ""} onChange={(e) => updateField("capaBgUrl", e.target.value)} />
                            <p className="text-[11px] text-muted-foreground">Deixe em branco para o fundo preto padrão.</p>
                          </div>
                          <div className="space-y-2">
                            <Label>URL da Logo da S3 (Opcional)</Label>
                            <Input placeholder="Ex: https://..." value={data.logoUrl || ""} onChange={(e) => updateField("logoUrl", e.target.value)} />
                            <p className="text-[11px] text-muted-foreground">Use a URL da imagem (ou digite 'none' para remover a logo original).</p>
                          </div>
                       </div>
                    </div>
                </div>
            )}
        </div>

        <DialogFooter className="p-4 border-t border-border shrink-0 bg-muted/20 flex sm:justify-between items-center w-full">
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                   Cancelar
                </Button>
                {step > 1 && (
                    <Button variant="secondary" onClick={() => setStep(step - 1)} className="gap-1">
                        <ChevronLeft className="w-4 h-4" /> Voltar
                    </Button>
                )}
            </div>
            <div className="flex gap-2">
                {step < 4 ? (
                    <Button onClick={() => setStep(step + 1)} className="bg-primary text-primary-foreground gap-1">
                        Próximo <ChevronRight className="w-4 h-4" />
                    </Button>
                ) : (
                    <Button onClick={handleSaveBtn} className="bg-[#cfff04] hover:bg-[#b5e600] text-black gap-2 font-bold">
                       <Check className="w-4 h-4" />
                       Gerar Proposta PDF
                    </Button>
                )}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
