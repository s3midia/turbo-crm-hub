import React, { useState } from "react";
import { Calculator } from "lucide-react";
import { formatBRL } from "@/lib/formatters";

export default function CalculadoraMetasPage() {
    const [ticketMedio, setTicketMedio] = useState(3000);
    const [metaMensal, setMetaMensal] = useState(20000);
    const [taxaConversao, setTaxaConversao] = useState(10);

    const vendasNecessarias = Math.ceil(metaMensal / ticketMedio);
    const leadsNecessarios = Math.ceil(vendasNecessarias / (taxaConversao / 100));
    const leadsPorDia = Math.ceil(leadsNecessarios / 30);

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="px-6 py-3 border-b border-border">
                <span className="text-base font-semibold text-foreground">Painel</span>
            </div>
            <div className="flex-1 p-6 space-y-6 max-w-xl">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Calculator className="w-7 h-7 text-[hsl(265,85%,65%)]" /> Calculadora de Metas
                </h1>

                <div className="bg-card border border-border rounded-xl p-5 space-y-5">
                    {[
                        { label: "Ticket Médio (R$)", value: ticketMedio, set: setTicketMedio, min: 100, max: 50000 },
                        { label: "Meta Mensal (R$)", value: metaMensal, set: setMetaMensal, min: 1000, max: 500000 },
                        { label: "Taxa de Conversão (%)", value: taxaConversao, set: setTaxaConversao, min: 1, max: 100 },
                    ].map(({ label, value, set, min, max }) => (
                        <div key={label} className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-[13px] font-medium text-[hsl(220,10%,65%)]">{label}</label>
                                <span className="text-[13px] font-bold text-foreground">{formatBRL(value)}</span>
                            </div>
                            <input type="range" min={min} max={max} value={value}
                                onChange={e => set(Number(e.target.value))}
                                className="w-full accent-[hsl(265,85%,60%)] cursor-pointer" />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Vendas/mês", value: vendasNecessarias, color: "hsl(142,70%,55%)" },
                        { label: "Leads/mês", value: leadsNecessarios, color: "hsl(265,85%,65%)" },
                        { label: "Leads/dia", value: leadsPorDia, color: "hsl(38,92%,55%)" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
                            <p className="text-2xl font-black" style={{ color }}>{value}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-[hsl(265,85%,60%,0.1)] border border-[hsl(265,85%,60%,0.25)] rounded-xl p-4">
                    <p className="text-[13px] text-[hsl(220,15%,75%)]">
                        Para atingir <span className="font-bold text-foreground">{formatBRL(metaMensal)}/mês</span> com ticket médio de <span className="font-bold text-foreground">{formatBRL(ticketMedio)}</span>, você precisa capturar <span className="font-bold text-[hsl(265,85%,70%)]">{leadsPorDia} leads por dia</span> e fechar {taxaConversao}% deles.
                    </p>
                </div>
            </div>
        </div>
    );
}
