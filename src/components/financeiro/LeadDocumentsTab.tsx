import React, { useState, useEffect } from "react";
import { Plus, Eye, Pencil, Trash2, Send, FileEdit, Link as LinkIcon, Upload, Check, ExternalLink, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatBRL } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PdfViewModal } from "@/components/PdfViewModal";
import { ProposalViewModal } from "@/components/ProposalViewModal";
import { EditDocModal } from "@/components/EditDocModal";
import { ManualProposalModal } from "@/components/ManualProposalModal";
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Doc {
    id: number;
    titulo: string;
    subtipo: string;
    cliente: string;
    valor: number;
    status: "pendente" | "aprovado" | "cancelado";
    data: string;
    conteudo?: string;
    arquivoUrl?: string;
    leadId?: string;
}

interface LeadDocumentsTabProps {
    leadId: string;
    leadName: string;
}

export const LeadDocumentsTab = ({ leadId, leadName }: LeadDocumentsTabProps) => {
    const [docs, setDocs] = useState<Doc[]>([]);
    const [isPdfViewOpen, setIsPdfViewOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isManualProposalOpen, setIsManualProposalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
    const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
    const [isUploadPdfModalOpen, setIsUploadPdfModalOpen] = useState(false);

    const [linkForm, setLinkForm] = useState({
        url: "",
        titulo: "Contrato de Prestação de Serviços",
        cliente: leadName,
        leadId: leadId,
        valor: 0,
        status: "pendente" as const
    });

    const [uploadForm, setUploadForm] = useState({
        cliente: leadName,
        leadId: leadId,
        file: null as File | null,
        titulo: ""
    });

    useEffect(() => {
        const savedDocs = localStorage.getItem("crm_documents");
        if (savedDocs) {
            try {
                const parsed = JSON.parse(savedDocs);
                if (Array.isArray(parsed)) {
                    setDocs(parsed.filter(d => d.leadId === leadId));
                }
            } catch (e) {
                console.error("Erro ao carregar documentos", e);
            }
        }
    }, [leadId]);

    const saveToLocalStorage = (newDocs: Doc[]) => {
        const allDocs = JSON.parse(localStorage.getItem("crm_documents") || "[]");
        // Update or add
        const updatedAllDocs = [...allDocs];
        newDocs.forEach(newDoc => {
            const index = updatedAllDocs.findIndex(d => d.id === newDoc.id);
            if (index >= 0) {
                updatedAllDocs[index] = newDoc;
            } else {
                updatedAllDocs.unshift(newDoc);
            }
        });
        localStorage.setItem("crm_documents", JSON.stringify(updatedAllDocs));
    };

    const handleSaveLink = () => {
        if (!linkForm.url || !linkForm.titulo) {
            toast.error("Preencha todos os campos obrigatórios.");
            return;
        }

        const newDoc: Doc = {
            id: Math.floor(Math.random() * 1000) + 3000,
            titulo: linkForm.titulo,
            subtipo: "Link Externo",
            cliente: leadName,
            leadId: leadId,
            valor: linkForm.valor,
            status: linkForm.status,
            data: new Date().toLocaleDateString("pt-BR"),
            arquivoUrl: linkForm.url
        };

        const updatedDocs = [newDoc, ...docs];
        setDocs(updatedDocs);
        saveToLocalStorage([newDoc]);
        toast.success("Documento vinculado com sucesso!");
        setIsAddLinkModalOpen(false);
        setLinkForm({ url: "", titulo: "Contrato de Prestação de Serviços", cliente: leadName, leadId: leadId, valor: 0, status: "pendente" });
    };

    const handleFileUpload = async (file: File, titulo: string) => {
        try {
            const loadingToast = toast.loading("Enviando arquivo...");
            
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `contracts/${fileName}`;

            const { error } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (error) {
                toast.dismiss(loadingToast);
                toast.error("Erro ao subir arquivo: " + error.message);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            const newDoc: Doc = {
                id: Math.floor(Math.random() * 1000),
                titulo: titulo || file.name,
                subtipo: "Upload PDF",
                cliente: leadName,
                leadId: leadId,
                valor: 0,
                status: "pendente",
                data: new Date().toLocaleDateString("pt-BR"),
                conteudo: "",
                arquivoUrl: publicUrl
            };
            
            const updatedDocs = [newDoc, ...docs];
            setDocs(updatedDocs);
            saveToLocalStorage([newDoc]);
            toast.dismiss(loadingToast);
            toast.success("Arquivo salvo permanentemente!");
            setIsUploadPdfModalOpen(false);
            setUploadForm({ cliente: leadName, leadId: leadId, file: null, titulo: "" });
        } catch (error: any) {
            toast.error("Erro inesperado: " + error.message);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("Tem certeza que deseja excluir este documento?")) {
            const updatedDocs = docs.filter(doc => doc.id !== id);
            setDocs(updatedDocs);
            
            const allDocs = JSON.parse(localStorage.getItem("crm_documents") || "[]");
            localStorage.setItem("crm_documents", JSON.stringify(allDocs.filter((d: any) => d.id !== id)));
            
            toast.success("Documento excluído!");
        }
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            <Card className="bg-card border-border shadow-sm overflow-hidden">
                <CardHeader className="py-3 px-5 border-b bg-muted/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                        <FileText className="h-4 w-4" /> Documentos do Cliente
                    </CardTitle>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                size="sm" 
                                className="h-8 gap-2 font-bold uppercase text-[10px]"
                                disabled={!leadId}
                            >
                                <Plus className="w-3.5 h-3.5" /> Novo Documento
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setIsAddLinkModalOpen(true)} className="gap-2 cursor-pointer">
                                <LinkIcon className="w-4 h-4 text-primary" />
                                Vincular Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsUploadPdfModalOpen(true)} className="gap-2 cursor-pointer">
                                <Upload className="w-4 h-4 text-emerald-500" />
                                Subir PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>

                <CardContent className="p-0">
                    {!leadId ? (
                        <div className="flex flex-col items-center justify-center py-12 opacity-60 bg-muted/5">
                            <Zap className="h-8 w-8 mb-3 text-amber-500" />
                            <p className="text-xs font-black uppercase tracking-widest text-center px-6">
                                Salve os dados gerais primeiro<br/>para liberar o gerenciamento de documentos
                            </p>
                        </div>
                    ) : docs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 opacity-40">
                            <FileText className="h-10 w-10 mb-3 text-muted-foreground" />
                            <p className="text-xs font-black uppercase tracking-widest">Nenhum documento</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Vincule um link ou suba um PDF para este cliente
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {docs.map((doc) => (
                                <div key={doc.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/10 transition-colors group">
                                    <div className={cn(
                                        "p-2 rounded-xl shrink-0",
                                        doc.subtipo === "Upload PDF" ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                                    )}>
                                        {doc.subtipo === "Upload PDF" ? <FileText size={14} /> : <LinkIcon size={14} />}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-foreground truncate">{doc.titulo}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-muted-foreground font-bold">{doc.data}</span>
                                            <Badge variant="outline" className="text-[9px] font-black px-1.5 py-0 border-muted-foreground/20 h-4">
                                                {doc.subtipo}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                                            onClick={() => {
                                                setSelectedDoc(doc);
                                                if (doc.arquivoUrl) setIsPdfViewOpen(true);
                                                else setIsViewModalOpen(true);
                                            }}
                                        >
                                            <Eye size={12} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(doc.id)}
                                        >
                                            <Trash2 size={12} />
                                        </Button>
                                        {doc.arquivoUrl && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                onClick={() => window.open(doc.arquivoUrl, "_blank")}
                                            >
                                                <ExternalLink size={12} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <Dialog open={isAddLinkModalOpen} onOpenChange={setIsAddLinkModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-primary" />
                            Vincular Documento Externo
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Cliente</Label>
                            <Input value={leadName} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>URL do Documento</Label>
                            <Input 
                                placeholder="https://..." 
                                value={linkForm.url} 
                                onChange={e => setLinkForm(f => ({ ...f, url: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Título do Documento</Label>
                            <Input 
                                placeholder="Ex: Contrato de Mentoria" 
                                value={linkForm.titulo} 
                                onChange={e => setLinkForm(f => ({ ...f, titulo: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={linkForm.status} onValueChange={(val: any) => setLinkForm(f => ({ ...f, status: val }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="aprovado">Aprovado</SelectItem>
                                        <SelectItem value="cancelado">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Valor (Opcional)</Label>
                                <Input 
                                    type="number" 
                                    placeholder="0,00" 
                                    value={linkForm.valor || ""} 
                                    onChange={e => setLinkForm(f => ({ ...f, valor: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddLinkModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveLink} className="gap-2">
                            <Check className="w-4 h-4" /> Vincular
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isUploadPdfModalOpen} onOpenChange={setIsUploadPdfModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5 text-emerald-500" />
                            Subir Contrato PDF
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Cliente</Label>
                            <Input value={leadName} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Título do Documento</Label>
                            <Input 
                                placeholder="Ex: Contrato assinado" 
                                value={uploadForm.titulo} 
                                onChange={e => setUploadForm(f => ({ ...f, titulo: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Arquivo PDF</Label>
                            <Button 
                                variant="outline" 
                                className="w-full border-dashed border-2 h-20 flex flex-col gap-2 hover:bg-muted/50 transition-all"
                                onClick={() => document.getElementById('pdf-upload-input-sidebar')?.click()}
                            >
                                {uploadForm.file ? (
                                    <>
                                        <Check className="w-6 h-6 text-emerald-500" />
                                        <span className="text-xs font-semibold">{uploadForm.file.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Clique para selecionar o PDF</span>
                                    </>
                                )}
                            </Button>
                            <input 
                                id="pdf-upload-input-sidebar"
                                type="file" 
                                className="hidden" 
                                accept=".pdf" 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setUploadForm(f => ({ ...f, file, titulo: f.titulo || file.name }));
                                    }
                                }} 
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadPdfModalOpen(false)}>Cancelar</Button>
                        <Button 
                            disabled={!uploadForm.file}
                            onClick={() => uploadForm.file && handleFileUpload(uploadForm.file, uploadForm.titulo)} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        >
                            <Upload className="w-4 h-4" /> Finalizar Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PdfViewModal 
                open={isPdfViewOpen}
                onOpenChange={setIsPdfViewOpen}
                url={selectedDoc?.arquivoUrl || ""}
                title={selectedDoc?.titulo || "Documento"}
            />
            
            <ProposalViewModal 
                open={isViewModalOpen}
                onOpenChange={setIsViewModalOpen}
                proposal={selectedDoc}
            />
        </div>
    );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
