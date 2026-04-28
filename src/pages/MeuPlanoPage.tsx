import React from "react";
import { CreditCard, Check } from "lucide-react";

const PLANS = [
    {
        name: "Starter",
        price: "R$ 97",
        period: "/mês",
        color: "hsl(220,10%,45%)",
        features: ["50 leads/mês no Radar", "Funil Kanban básico", "5 automações de WhatsApp", "Suporte por e-mail"],
        current: false,
    },
    {
        name: "Pro",
        price: "R$ 297",
        period: "/mês",
        color: "hsl(265,85%,65%)",
        features: ["Leads ilimitados no Radar", "Funil Kanban completo", "Automações ilimitadas", "Gerador de sites", "Financeiro e documentos", "Suporte prioritário"],
        current: true,
    },
    {
        name: "Agency",
        price: "R$ 697",
        period: "/mês",
        color: "hsl(38,92%,55%)",
        features: ["Tudo do Pro", "Multi-usuário (até 5)", "White-label", "API access", "Gerente de conta dedicado"],
        current: false,
    },
];

export default function MeuPlanoPage() {
    return (
        <div className="flex flex-col h-full bg-background">
            <div className="px-6 py-3 border-b border-border">
                <span className="text-base font-semibold text-foreground">Painel</span>
            </div>
            <div className="flex-1 p-6 space-y-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="w-7 h-7 text-[hsl(265,85%,65%)]" /> Meu Plano
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl">
                    {PLANS.map(plan => (
                        <div
                            key={plan.name}
                            className={`bg-card rounded-xl p-5 space-y-4 ${plan.current
                                    ? "border-2 border-[hsl(265,85%,60%)] shadow-[0_0_20px_hsl(265,85%,60%,0.15)]"
                                    : "border border-border"
                                }`}
                        >
                            {plan.current && (
                                <span className="text-[11px] bg-[hsl(265,85%,60%)] text-white px-2 py-0.5 rounded-full font-semibold">
                                    Plano Atual
                                </span>
                            )}
                            <div>
                                <h3 className="text-[15px] font-bold text-foreground">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black" style={{ color: plan.color }}>{plan.price}</span>
                                    <span className="text-[12px] text-muted-foreground">{plan.period}</span>
                                </div>
                            </div>
                            <ul className="space-y-2">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-start gap-2 text-[12px] text-[hsl(220,10%,65%)]">
                                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: plan.color }} />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                className={`w-full py-2 rounded-lg text-[13px] font-semibold transition-colors ${plan.current
                                        ? "bg-[hsl(265,85%,60%,0.2)] text-[hsl(265,85%,70%)] cursor-default"
                                        : "bg-[hsl(224,18%,20%)] text-foreground hover:bg-[hsl(224,18%,26%)]"
                                    }`}
                            >
                                {plan.current ? "Plano Ativo" : "Fazer Upgrade"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
