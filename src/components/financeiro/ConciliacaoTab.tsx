import React, { useState } from "react";
import { Upload, CheckCircle2, AlertCircle, HelpCircle, Link2, FileText, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface BankEntry {
  id: number;
  data: string;
  descricao: string;
  valor: number;
  tipo: "credito" | "debito";
  status: "conciliado" | "divergencia" | "nao_encontrado";
  vinculadoA?: string;
}

const MOCK_BANK: BankEntry[] = [
  { id: 1, data: "20/12/2025", descricao: "TED RECEBIDA ANDREA OLIVEIRA", valor: 7400, tipo: "credito", status: "conciliado", vinculadoA: "Criação de sistema" },
  { id: 2, data: "20/12/2025", descricao: "TED RECEBIDA GIOVANNA", valor: 2577, tipo: "credito", status: "conciliado", vinculadoA: "Criação de Site" },
  { id: 3, data: "19/12/2025", descricao: "PIX ENVIADO OPENAI", valor: 220, tipo: "debito", status: "conciliado", vinculadoA: "API OpenAI - Usage" },
  { id: 4, data: "15/12/2025", descricao: "DÉBITO AWS", valor: 1450, tipo: "debito", status: "conciliado", vinculadoA: "Hospedagem AWS" },
  { id: 5, data: "10/12/2025", descricao: "TED MKTNG SOLUTIONS", valor: 3000, tipo: "debito", status: "divergencia", vinculadoA: "Consultoria Marketing (diferença R$0,50)" },
  { id: 6, data: "05/12/2025", descricao: "PIX RECEBIDO 5231xxxx", valor: 1800, tipo: "credito", status: "nao_encontrado" },
];

import { formatBRL } from "@/lib/formatters";

const statusConfig = {
  conciliado: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Conciliado" },
  divergencia: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", label: "Divergência" },
  nao_encontrado: { icon: HelpCircle, color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20", label: "Não encontrado" },
};

export default function ConciliacaoTab() {
  const [entries, setEntries] = useState<BankEntry[]>(MOCK_BANK);
  const [isDragging, setIsDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const stats = {
    total: entries.length,
    conciliados: entries.filter(e => e.status === "conciliado").length,
    divergencias: entries.filter(e => e.status === "divergencia").length,
    naoEncontrados: entries.filter(e => e.status === "nao_encontrado").length,
  };
  const pct = Math.round((stats.conciliados / stats.total) * 100);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    setUploaded(true);
  }

  function handleVincular(id: number) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: "conciliado", vinculadoA: "Vínculo manual" } : e));
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Upload Area */}
      {!uploaded ? (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-3xl p-12 flex flex-col items-center gap-4 transition-all cursor-pointer",
            isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/50 hover:border-primary/40 hover:bg-muted/10"
          )}
          onClick={() => setUploaded(true)}
        >
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Upload size={28} className="text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-foreground">Arraste o extrato bancário aqui</p>
            <p className="text-sm text-muted-foreground">Formatos aceitos: OFX, CSV, XLSX — ou clique para simular</p>
          </div>
          <div className="flex gap-3 mt-2">
            {["OFX", "CSV", "XLSX"].map(f => (
              <span key={f} className="px-3 py-1 rounded-lg bg-muted text-xs font-black text-muted-foreground">.{f}</span>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total de Movimentos", value: stats.total, color: "text-foreground", bg: "bg-muted/30" },
              { label: "Conciliados", value: stats.conciliados, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Divergências", value: stats.divergencias, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Não Encontrados", value: stats.naoEncontrados, color: "text-rose-500", bg: "bg-rose-500/10" },
            ].map((s, i) => (
              <div key={i} className={cn("p-4 rounded-2xl border border-border/30", s.bg)}>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className={cn("text-3xl font-black mt-1", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Accuracy Bar */}
          <div className="p-5 rounded-2xl bg-card border border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <RefreshCw size={16} className="text-primary" />
                Acurácia da Conciliação
              </span>
              <span className="text-2xl font-black text-primary">{pct}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{stats.conciliados} de {stats.total} movimentos conciliados com sucesso.</p>
          </div>

          {/* Table */}
          <div className="rounded-3xl border border-border/40 bg-card/50 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-muted-foreground" />
                <span className="text-sm font-bold">Extrato — Dezembro 2025</span>
              </div>
              <button onClick={() => setUploaded(false)} className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Upload size={12} /> Novo Extrato
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/30">
                  {["Data", "Descrição do Banco", "Tipo", "Valor", "Lançamento Vinculado", "Status", "Ação"].map(h => (
                    <th key={h} className="px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, idx) => {
                  const cfg = statusConfig[e.status];
                  return (
                    <tr key={e.id} className={cn("border-b border-border/20 hover:bg-muted/10 transition-all group", idx === entries.length - 1 && "border-0")}>
                      <td className="px-5 py-4 text-[12px] font-semibold text-muted-foreground">{e.data}</td>
                      <td className="px-5 py-4 text-[13px] font-bold text-foreground">{e.descricao}</td>
                      <td className="px-5 py-4">
                        <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-lg uppercase",
                          e.tipo === "credito" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                        )}>
                          {e.tipo === "credito" ? "Crédito" : "Débito"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("text-[14px] font-black", e.tipo === "credito" ? "text-emerald-500" : "text-rose-500")}>
                          {e.tipo === "credito" ? "+" : "-"} {formatBRL(e.valor)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[12px] text-muted-foreground">{e.vinculadoA ?? "—"}</td>
                      <td className="px-5 py-4">
                        <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1.5 w-fit", cfg.bg)}>
                          <cfg.icon size={11} className={cfg.color} /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {e.status !== "conciliado" && (
                          <button onClick={() => handleVincular(e.id)} className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors opacity-0 group-hover:opacity-100">
                            <Link2 size={12} /> Vincular
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
