
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, Plus } from "lucide-react";

interface EditDocModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: {
    id: number;
    titulo: string;
    cliente: string;
    conteudo?: string;
  } | null;
  onSave: (doc: { id: number; titulo: string; cliente: string; conteudo: string }) => void;
}

export function EditDocModal({ open, onOpenChange, doc, onSave }: EditDocModalProps) {
  const [titulo, setTitulo] = useState("");
  const [cliente, setCliente] = useState("");
  const [conteudo, setConteudo] = useState("");

  useEffect(() => {
    if (doc) {
      setTitulo(doc.titulo);
      setCliente(doc.cliente);
      setConteudo(doc.conteudo || "");
    }
  }, [doc, open]);

  const handleSave = () => {
    if (doc) {
      onSave({
        id: doc.id,
        titulo,
        cliente,
        conteudo
      });
      onOpenChange(false);
    }
  };

  if (!doc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            {doc?.id === 0 ? (
              <Plus className="w-5 h-5 text-[hsl(265,85%,60%)]" />
            ) : (
              <Pencil className="w-5 h-5 text-muted-foreground" />
            )}
            {doc?.id === 0 ? "Criar Novo Documento" : "Editar Documento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-titulo" className="text-foreground">Título</Label>
            <Input 
              id="edit-titulo" 
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="bg-background border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-cliente" className="text-foreground">Cliente</Label>
            <Input 
              id="edit-cliente" 
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="bg-background border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-conteudo" className="text-foreground">Conteúdo</Label>
            <Textarea 
              id="edit-conteudo" 
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="bg-background border-border min-h-[300px] text-foreground font-mono text-[13px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-[hsl(265,85%,60%)] hover:bg-[hsl(265,85%,52%)] text-white gap-2">
            <Save className="w-4 h-4" />
            {doc?.id === 0 ? "Criar Documento" : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
