import React from "react";
import { Star } from "lucide-react";

export default function PainelAfiliadoPage() {
    return (
        <div className="flex flex-col h-full bg-background">
            <div className="px-6 py-3 border-b border-border">
                <span className="text-base font-semibold text-foreground">Painel</span>
            </div>
            <div className="flex-1 p-6 space-y-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Star className="w-7 h-7 text-[hsl(38,92%,55%)]" /> Painel Afiliado
                </h1>

                <div className="grid grid-cols-3 gap-4 max-w-2xl">
                    {[
                        { label: "Indicações", value: "0", color: "hsl(265,85%,65%)" },
                        { label: "Comissões Geradas", value: "R$ 0,00", color: "hsl(142,70%,55%)" },
                        { label: "A Receber", value: "R$ 0,00", color: "hsl(38,92%,55%)" },
                    ].map(k => (
                        <div key={k.label} className="bg-card border border-border rounded-xl p-4 text-center">
                            <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">{k.label}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-[hsl(38,92%,55%,0.08)] border border-[hsl(38,92%,55%,0.2)] rounded-xl p-5 max-w-2xl">
                    <h3 className="text-[14px] font-bold text-foreground mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4 text-[hsl(38,92%,55%)]" />
                        Programa de Afiliados
                    </h3>
                    <p className="text-[13px] text-[hsl(220,10%,60%)] mb-4">
                        Indique o portal para outros empreendedores e ganhe <strong className="text-foreground">30% de comissão recorrente</strong> para cada cliente ativo que você trouxer.
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            readOnly
                            value="https://portal.s3midia.com.br/?ref=SEU_CODIGO"
                            className="flex-1 px-3 py-2 rounded-md bg-background border border-border text-muted-foreground text-[12px] font-mono focus:outline-none"
                        />
                        <button className="px-3 py-2 rounded-md bg-[hsl(38,92%,55%)] hover:bg-[hsl(38,92%,48%)] text-[hsl(224,22%,7%)] text-[12px] font-bold">
                            Copiar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
