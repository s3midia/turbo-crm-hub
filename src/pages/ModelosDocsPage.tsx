import React, { useState } from "react";
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
import { Link } from "lucide-react";

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
}

const MOCK_DOCS: Doc[] = [
    { id: 43, titulo: "Proposta de Serviços", subtipo: "Contrato", cliente: "Giovanna", valor: 4956400, status: "pendente", data: "19/12/2025" },
    { id: 23, titulo: "Proposta de Serviços", subtipo: "Contrato", cliente: "Cliente Avulso", valor: 300, status: "pendente", data: "10/12/2025" },
    { id: 22, titulo: "Proposta de Serviços", subtipo: "Proposta", cliente: "Cliente Avulso", valor: 5000, status: "pendente", data: "10/12/2025" },
    { id: 21, titulo: "Proposta de Serviços", subtipo: "Contrato", cliente: "Cliente Avulso", valor: 200, status: "pendente", data: "10/12/2025" },
    { id: 20, titulo: "Proposta de Serviços", subtipo: "Contrato", cliente: "Cliente Avulso", valor: 200, status: "aprovado", data: "10/12/2025" },
];

export default function ModelosDocsPage() {
    const [docs, setDocs] = useState<Doc[]>(MOCK_DOCS);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isManualProposalOpen, setIsManualProposalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isVisualSettingsOpen, setIsVisualSettingsOpen] = useState(false);
    const [isPdfViewOpen, setIsPdfViewOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
    const [activeTab, setActiveTab] = useState<"propostas" | "contratos">("propostas");

    const handleAIProposalGenerated = (proposal: { titulo: string; cliente: string; conteudo: string }) => {
        const newDoc: Doc = {
            id: Math.floor(Math.random() * 1000),
            titulo: proposal.titulo,
            subtipo: "Proposta Premium",
            cliente: proposal.cliente,
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
                cliente: proposal.cliente,
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const newDoc: Doc = {
                id: Math.floor(Math.random() * 1000),
                titulo: file.name,
                subtipo: "Upload PDF",
                cliente: "N/A",
                valor: 0,
                status: "pendente",
                data: new Date().toLocaleDateString("pt-BR"),
                conteudo: "",
                arquivoUrl: URL.createObjectURL(file)
            };
            setDocs([newDoc, ...docs]);
            toast.success("Arquivo anexado com sucesso!");
        }
    };

    const handleAddLink = () => {
        const url = prompt("Cole o link do PDF (Zapsign, S3, etc):");
        if (url) {
            const newDoc: Doc = {
                id: Math.floor(Math.random() * 1000) + 3000,
                titulo: "Contrato via Link",
                subtipo: "Link Externo",
                cliente: "N/A",
                valor: 0,
                status: "pendente",
                data: new Date().toLocaleDateString("pt-BR"),
                arquivoUrl: url
            };
            setDocs([newDoc, ...docs]);
            toast.success("Link do contrato adicionado!");
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex items-center justify-between px-6 py-3 border-b border-border">
                <span className="text-base font-semibold text-foreground">Painel</span>
            </div>

            <div className="flex-1 p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            📄 Central de Documentos
                        </h1>
                        <p className="text-[13px] text-muted-foreground mt-1">
                            Gerencie propostas, contratos e arquivos em um só lugar.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsVisualSettingsOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-transparent border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800 text-[12px] font-semibold transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Configuração Visual
                        </button>
                        
                        {activeTab === "propostas" ? (
                            <>
                                <button 
                                    onClick={() => setIsAIModalOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-transparent border border-[hsl(265,85%,60%)] text-[hsl(265,85%,60%)] hover:bg-[hsl(265,85%,60%,0.1)] text-[12px] font-semibold transition-colors"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Gerar com IA
                                </button>
                                <button 
                                    onClick={handleCreatePremium}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#00bcd4] hover:bg-[#0097a7] text-white text-[12px] font-semibold transition-colors shadow-sm"
                                >
                                    <FileEdit className="w-4 h-4" />
                                    Nova Proposta Premium
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleAddLink}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-muted border border-border text-foreground hover:bg-muted/80 text-[12px] font-semibold transition-colors shadow-sm"
                                >
                                    <Link className="w-4 h-4" />
                                    Adicionar por Link
                                </button>
                                <label className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold transition-colors shadow-sm cursor-pointer">
                                    <Plus className="w-4 h-4" />
                                    Subir Arquivo PDF
                                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs de Documentos */}
                <div className="flex border-b border-border">
                    <button 
                        onClick={() => setActiveTab("propostas")}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === "propostas" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                        Propostas Geradas
                    </button>
                    <button 
                        onClick={() => setActiveTab("contratos")}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === "contratos" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                        Gerenciamento de Contratos
                    </button>
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
        </div>
    );
}
