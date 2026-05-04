import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Eye, Pencil, Trash2, Send, FileEdit, Settings, Sparkles } from "lucide-react";
import { ProposalViewModal } from "@/components/ProposalViewModal";
import { AIProposalModal } from "@/components/AIProposalModal";
import { EditDocModal } from "@/components/EditDocModal";
import { ManualProposalModal } from "@/components/ManualProposalModal";
import { VisualSettingsModal } from "@/components/VisualSettingsModal";
import { S3_PROPOSAL_TEMPLATE } from "@/lib/documentTemplates";
import { toast } from "sonner";
import { formatBRL } from "@/lib/formatters";
import { PdfViewModal } from "@/components/PdfViewModal";
import { Link as LinkIcon, Upload, Check } from "lucide-react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

const MOCK_DOCS: Doc[] = [
    { id: 43, titulo: "Proposta de Serviços", subtipo: "Contrato", cliente: "Giovanna", valor: 4956400, status: "pendente", data: "19/12/2025", leadId: "1" },
    { id: 23, titulo: "Proposta de Serviços", subtipo: "Contrato", cliente: "Cliente Avulso", valor: 300, status: "pendente", data: "10/12/2025" },
];

export default function ModelosDocsPage() {
    const [docs, setDocs] = useState<Doc[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const currentLeadId = searchParams.get("leadId");
    const currentClientName = searchParams.get("cliente");
    const activeTab = (searchParams.get("tab") as "propostas" | "contratos") || "propostas";

    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isManualProposalOpen, setIsManualProposalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isVisualSettingsOpen, setIsVisualSettingsOpen] = useState(false);
    const [isPdfViewOpen, setIsPdfViewOpen] = useState(false);
    const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);

    const setActiveTab = (tab: "propostas" | "contratos") => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set("tab", tab);
            return next;
        });
    };

    // Persistência Local
    useEffect(() => {
        const savedDocs = localStorage.getItem("crm_documents");
        if (savedDocs) {
            try {
                const parsed = JSON.parse(savedDocs);
                if (Array.isArray(parsed)) {
                    // Limpar URLs temporárias que expiram
                    const cleanedDocs = parsed.map(doc => ({
                        ...doc,
                        arquivoUrl: doc.arquivoUrl?.startsWith('blob:') ? undefined : doc.arquivoUrl
                    }));
                    setDocs(cleanedDocs);
                } else {
                    setDocs(MOCK_DOCS);
                }
            } catch (e) {
                console.error("Erro ao carregar documentos", e);
                setDocs(MOCK_DOCS);
            }
        } else {
            setDocs(MOCK_DOCS);
        }
    }, []);

    useEffect(() => {
        if (docs.length > 0 || localStorage.getItem("crm_documents")) {
            localStorage.setItem("crm_documents", JSON.stringify(docs));
        }
    }, [docs]);

    // Form states for adding link
    const [linkForm, setLinkForm] = useState({
        url: "",
        titulo: "Contrato de Prestação de Serviços",
        cliente: "",
        valor: 0,
        status: "pendente" as const
    });

    useEffect(() => {
        if (currentClientName) {
            setLinkForm(prev => ({ ...prev, cliente: currentClientName }));
        }
    }, [currentClientName]);

    const handleAIProposalGenerated = (proposal: { titulo: string; cliente: string; conteudo: string }) => {
        const newDoc: Doc = {
            id: Math.floor(Math.random() * 1000),
            titulo: proposal.titulo,
            subtipo: "Proposta Premium",
            cliente: proposal.cliente || currentClientName || "Desconhecido",
            leadId: currentLeadId || undefined,
            valor: 0,
            status: "pendente",
            data: new Date().toLocaleDateString("pt-BR"),
            conteudo: proposal.conteudo
        };
        setDocs([newDoc, ...docs]);
        toast.success("Proposta IA gerada e salva com sucesso!");
    };

    const handleManualProposalSaved = (proposal: { id?: number; titulo: string; cliente: string; conteudo: string }) => {
        if (proposal.id) {
            setDocs(docs.map(doc => 
                doc.id === proposal.id 
                    ? { ...doc, titulo: proposal.titulo, cliente: proposal.cliente, conteudo: proposal.conteudo } 
                    : doc
            ));
            toast.success("Proposta Premium atualizada com sucesso!");
        } else {
            const newDoc: Doc = {
                id: Math.floor(Math.random() * 1000) + 2000,
                titulo: proposal.titulo,
                subtipo: "Proposta Premium",
                cliente: proposal.cliente || currentClientName || "Desconhecido",
                leadId: currentLeadId || undefined,
                valor: 0,
                status: "pendente",
                data: new Date().toLocaleDateString("pt-BR"),
                conteudo: proposal.conteudo
            };
            setDocs([newDoc, ...docs]);
            toast.success("Proposta construída e pronta!");
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("Tem certeza que deseja excluir este documento?")) {
            setDocs(docs.filter(doc => doc.id !== id));
            toast.success("Documento excluído!");
        }
    };

    const handleView = (doc: Doc) => {
        setSelectedDoc(doc);
        if (doc.arquivoUrl) {
            setIsPdfViewOpen(true);
        } else {
            setIsViewModalOpen(true);
        }
    };

    const handleEdit = (doc: Doc) => {
        setSelectedDoc(doc);
        if (doc.subtipo === "Proposta Premium") {
            setIsManualProposalOpen(true);
        } else {
            setIsEditModalOpen(true);
        }
    };

    const handleCreatePremium = () => {
        setSelectedDoc(null);
        setIsManualProposalOpen(true);
    };

    const handleCreateManual = () => {
        const newDoc: Doc = {
            id: 0,
            titulo: "Novo Documento",
            cliente: "Cliente",
            subtipo: "Manual",
            valor: 0,
            status: "pendente",
            data: new Date().toLocaleDateString("pt-BR"),
            conteudo: S3_PROPOSAL_TEMPLATE
        };
        setSelectedDoc(newDoc);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = (updatedDoc: { id: number; titulo: string; cliente: string; conteudo: string }) => {
        if (updatedDoc.id === 0) {
            const newDoc: Doc = {
                ...updatedDoc,
                id: Math.floor(Math.random() * 1000) + 100,
                subtipo: "Manual",
                valor: 0,
                status: "pendente",
                data: new Date().toLocaleDateString("pt-BR")
            };
            setDocs([newDoc, ...docs]);
            toast.success("Documento criado!");
        } else {
            setDocs(docs.map(doc => 
                doc.id === updatedDoc.id 
                    ? { ...doc, titulo: updatedDoc.titulo, cliente: updatedDoc.cliente, conteudo: updatedDoc.conteudo } 
                    : doc
            ));
            toast.success("Alterações salvas!");
        }
    };

    const handleSendWhatsApp = (doc: Doc) => {
        const content = doc.conteudo || `Olá ${doc.cliente}, segue o documento: ${doc.titulo}`;
        const text = encodeURIComponent(content);
        window.open(`https://wa.me/?text=${text}`, "_blank");
        toast.success("Abrindo WhatsApp...");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const loadingToast = toast.loading("Enviando arquivo para o servidor...");
                
                // Gerar nome único para o arquivo
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
                const filePath = `contracts/${fileName}`;

                const { data, error } = await supabase.storage
                    .from('documents')
                    .upload(filePath, file);

                if (error) {
                    toast.dismiss(loadingToast);
                    if (error.message.includes("bucket not found")) {
                        toast.error("Erro: O bucket 'documents' não foi encontrado no Supabase.");
                    } else {
                        toast.error("Erro ao subir arquivo: " + error.message);
                    }
                    return;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(filePath);

                const newDoc: Doc = {
                    id: Math.floor(Math.random() * 1000),
                    titulo: file.name,
                    subtipo: "Upload PDF",
                    cliente: "N/A",
                    valor: 0,
                    status: "pendente",
                    data: new Date().toLocaleDateString("pt-BR"),
                    conteudo: "",
                    arquivoUrl: publicUrl
                };
                
                setDocs([newDoc, ...docs]);
                setActiveTab("contratos");
                toast.dismiss(loadingToast);
                toast.success("Arquivo salvo permanentemente!");
            } catch (error: any) {
                toast.error("Erro inesperado: " + error.message);
            }
        }
    };

    const handleAddLink = () => {
        setIsAddLinkModalOpen(true);
    };

    const handleSaveLink = () => {
        if (!linkForm.url || !linkForm.titulo || !linkForm.cliente) {
            toast.error("Preencha todos os campos obrigatórios.");
            return;
        }

        const newDoc: Doc = {
            id: Math.floor(Math.random() * 1000) + 3000,
            titulo: linkForm.titulo,
            subtipo: "Link Externo",
            cliente: linkForm.cliente,
            leadId: currentLeadId || undefined,
            valor: linkForm.valor,
            status: linkForm.status as any,
            data: new Date().toLocaleDateString("pt-BR"),
            arquivoUrl: linkForm.url
        };

        setDocs([newDoc, ...docs]);
        setActiveTab("contratos");
        toast.success("Documento vinculado com sucesso!");
        setIsAddLinkModalOpen(false);
        setLinkForm({ url: "", titulo: "Contrato de Prestação de Serviços", cliente: currentClientName || "", valor: 0, status: "pendente" });
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex items-center justify-between px-6 py-3 border-b border-border">
                <span className="text-base font-semibold text-foreground">Painel</span>
            </div>

            <div className="flex-1 p-6 space-y-6">
                {/* Header Superior com Abas e Botões */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                📄 Central de Documentos
                                {currentClientName && (
                                    <span className="text-sm font-normal text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg flex items-center gap-2 border border-border/50">
                                        Contexto: <b className="text-primary">{currentClientName}</b>
                                        <button onClick={() => setSearchParams({})} className="hover:text-rose-500 transition-colors">×</button>
                                    </span>
                                )}
                            </h1>
                            <p className="text-[13px] text-muted-foreground mt-1">
                                Gerencie propostas e contratos em uma interface unificada.
                            </p>
                        </div>
                        
                        {activeTab === "propostas" && (
                            <button 
                                onClick={() => setIsVisualSettingsOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-transparent border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800 text-[12px] font-semibold transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                Configuração Visual
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between border-b border-border pb-0">
                        <div className="flex gap-1">
                            <button 
                                onClick={() => setActiveTab("propostas")}
                                className={cn(
                                    "px-6 py-3 text-[13px] font-bold transition-all relative",
                                    activeTab === "propostas" 
                                        ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" 
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Propostas Geradas
                            </button>
                            <button 
                                onClick={() => setActiveTab("contratos")}
                                className={cn(
                                    "px-6 py-3 text-[13px] font-bold transition-all relative",
                                    activeTab === "contratos" 
                                        ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" 
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Gerenciamento de Contratos
                            </button>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            {activeTab === "propostas" ? (
                                <>
                                    <button 
                                        onClick={() => setIsAIModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(265,85%,60%)]/10 text-[hsl(265,85%,60%)] text-[12px] font-bold border border-[hsl(265,85%,60%)]/20 hover:bg-[hsl(265,85%,60%)]/20 transition-all"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Gerar com IA
                                    </button>
                                    <button 
                                        onClick={handleCreatePremium}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-bold shadow-sm hover:bg-primary/90 transition-all"
                                    >
                                        <FileEdit className="w-3.5 h-3.5" />
                                        Nova Proposta
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        onClick={handleAddLink}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-foreground hover:bg-muted/80 text-[12px] font-bold transition-all"
                                    >
                                        <LinkIcon className="w-3.5 h-3.5" />
                                        Vincular Link
                                    </button>
                                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[12px] font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer">
                                        <Upload className="w-3.5 h-3.5" />
                                        Subir PDF
                                        <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                                    </label>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                {["#", "Título", "Cliente", "Valor", "Status", "Data", "Ações"].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-semibold first:pl-5 last:pr-5">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {docs
                                .filter(d => activeTab === "propostas" ? d.subtipo.includes("Proposta") : !d.subtipo.includes("Proposta"))
                                .filter(d => currentLeadId ? d.leadId === currentLeadId : true)
                                .map((doc) => (
                                <tr key={doc.id} className="border-b border-[hsl(224,18%,15%)] hover:bg-card transition-colors">
                                    <td className="px-4 py-3.5 pl-5 text-[13px] font-bold text-muted-foreground">{doc.id}</td>
                                    <td className="px-4 py-3.5">
                                        <p className="text-[13px] font-semibold text-foreground">{doc.titulo}</p>
                                        <p className="text-[11px] text-muted-foreground">{doc.subtipo}</p>
                                    </td>
                                    <td className="px-4 py-3.5 text-[13px] text-[hsl(220,15%,75%)]">{doc.cliente}</td>
                                    <td className="px-4 py-3.5 text-[13px] font-semibold text-foreground">
                                        {formatBRL(doc.valor)}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${doc.status === "aprovado"
                                                ? "bg-[hsl(142,70%,45%,0.2)] text-[hsl(142,70%,55%)]"
                                                : doc.status === "cancelado"
                                                    ? "bg-[hsl(0,85%,60%,0.2)] text-[hsl(0,85%,65%)]"
                                                    : "bg-[hsl(38,92%,55%,0.2)] text-[hsl(38,92%,65%)]"
                                            }`}>
                                            {doc.status === "aprovado" ? "Aprovado" : doc.status === "cancelado" ? "Cancelado" : "Pendente"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-[13px] text-[hsl(220,15%,65%)]">{doc.data}</td>
                                    <td className="px-4 py-3.5 pr-5">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                className="text-[hsl(210,80%,55%)] hover:text-[hsl(210,80%,70%)]" 
                                                title="Visualizar"
                                                onClick={() => handleView(doc)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button 
                                                className="text-muted-foreground hover:text-foreground" 
                                                title="Editar"
                                                onClick={() => handleEdit(doc)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button 
                                                className="text-muted-foreground hover:text-[hsl(0,70%,60%)]" 
                                                title="Excluir"
                                                onClick={() => handleDelete(doc.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                className="text-[hsl(142,70%,45%)] hover:text-[hsl(142,70%,60%)]" 
                                                title="WhatsApp"
                                                onClick={() => handleSendWhatsApp(doc)}
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AIProposalModal 
                open={isAIModalOpen}
                onOpenChange={setIsAIModalOpen}
                onProposalGenerated={handleAIProposalGenerated}
            />

            <ManualProposalModal 
                open={isManualProposalOpen}
                onOpenChange={setIsManualProposalOpen}
                onSave={handleManualProposalSaved}
                doc={selectedDoc}
            />

            <ProposalViewModal 
                open={isViewModalOpen}
                onOpenChange={setIsViewModalOpen}
                proposal={selectedDoc}
            />

            <EditDocModal 
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                doc={selectedDoc}
                onSave={handleSaveEdit}
            />

            <VisualSettingsModal 
                open={isVisualSettingsOpen}
                onOpenChange={setIsVisualSettingsOpen}
            />

            <PdfViewModal 
                open={isPdfViewOpen}
                onOpenChange={setIsPdfViewOpen}
                url={selectedDoc?.arquivoUrl || ""}
                title={selectedDoc?.titulo || "Documento"}
            />

            {/* Modal Adicionar Link */}
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
                            <Label>URL do Documento (Zapsign/PDF)</Label>
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
                                <Label>Cliente</Label>
                                <Input 
                                    placeholder="Nome do Cliente" 
                                    value={linkForm.cliente} 
                                    onChange={e => setLinkForm(f => ({ ...f, cliente: e.target.value }))}
                                />
                            </div>
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
                        </div>
                        <div className="space-y-2">
                            <Label>Valor do Contrato (Opcional)</Label>
                            <Input 
                                type="number" 
                                placeholder="0,00" 
                                value={linkForm.valor || ""} 
                                onChange={e => setLinkForm(f => ({ ...f, valor: parseFloat(e.target.value) || 0 }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddLinkModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveLink} className="bg-primary text-primary-foreground gap-2">
                            <Check className="w-4 h-4" /> Vincular Contrato
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
