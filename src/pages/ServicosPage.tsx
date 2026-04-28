import React from "react";
import { Briefcase, Plus } from "lucide-react";

const SERVICOS = [
    { nome: "Criação de Site Básico", preco: "R$ 1.500", descricao: "Landing page de 1 página com formulário de captura" },
    { nome: "Sistema Personalizado", preco: "R$ 5.000 - R$ 15.000", descricao: "Sistema sob medida com CRM e automações integradas" },
    { nome: "Automação WhatsApp", preco: "R$ 800/mês", descricao: "Bot para WhatsApp com qualificação de leads" },
    { nome: "Gestão de Tráfego", preco: "R$ 1.200/mês", descricao: "Google Ads e Meta Ads para geração de leads" },
];

export default function ServicosPage() {
    return (
        <div className="flex flex-col h-full bg-background overflow-y-auto">
            <div className="px-6 py-3 border-b border-border">
                <span className="text-base font-semibold text-foreground">Painel</span>
            </div>
            <div className="flex-1 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Briefcase className="w-7 h-7 text-[hsl(265,85%,65%)]" /> Serviços
                    </h1>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[hsl(265,85%,60%)] hover:bg-[hsl(265,85%,52%)] text-white text-[13px] font-semibold">
                        <Plus className="w-4 h-4" /> Novo Serviço
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SERVICOS.map((s) => (
                        <div key={s.nome} className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-start justify-between">
                                <h3 className="text-[14px] font-bold text-foreground">{s.nome}</h3>
                                <span className="text-[13px] font-bold text-[hsl(265,85%,65%)]">{s.preco}</span>
                            </div>
                            <p className="text-[12px] text-muted-foreground mt-2">{s.descricao}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
