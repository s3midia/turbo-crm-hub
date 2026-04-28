import React, { useState } from "react";
import { Building2, Save } from "lucide-react";

export default function PerfilEmpresaPage() {
    const [form, setForm] = useState({
        nome: "S3 Mídia",
        telefone: "",
        email: "",
        site: "",
        endereco: "",
        cnpj: "",
        logoUrl: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="px-6 py-3 border-b border-border">
                <span className="text-base font-semibold text-foreground">Painel</span>
            </div>
            <div className="flex-1 p-6 space-y-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Building2 className="w-7 h-7 text-[hsl(265,85%,65%)]" /> Perfil da Empresa
                </h1>
                <div className="bg-card border border-border rounded-xl p-6 max-w-lg space-y-4">
                    {[
                        { name: "nome", label: "Nome da Empresa", placeholder: "Ex: S3 Mídia" },
                        { name: "telefone", label: "Telefone / WhatsApp", placeholder: "77999999999" },
                        { name: "email", label: "E-mail", placeholder: "contato@empresa.com" },
                        { name: "site", label: "Site", placeholder: "https://empresa.com" },
                        { name: "endereco", label: "Endereço", placeholder: "Barreiras, BA" },
                        { name: "cnpj", label: "CNPJ (Opcional)", placeholder: "00.000.000/0001-00" },
                        { name: "logoUrl", label: "URL da Logo", placeholder: "https://..." },
                    ].map(f => (
                        <div key={f.name} className="space-y-1.5">
                            <label className="text-[12px] font-medium text-[hsl(220,10%,60%)]">{f.label}</label>
                            <input
                                name={f.name}
                                value={(form as any)[f.name]}
                                onChange={handleChange}
                                placeholder={f.placeholder}
                                className="w-full px-3 py-2.5 rounded-md bg-background border border-border text-foreground text-[13px] focus:outline-none focus:border-[hsl(265,85%,60%)]"
                            />
                        </div>
                    ))}
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[hsl(265,85%,60%)] hover:bg-[hsl(265,85%,52%)] text-white font-semibold text-[13px] mt-2">
                        <Save className="w-4 h-4" /> Salvar Perfil
                    </button>
                </div>
            </div>
        </div>
    );
}
