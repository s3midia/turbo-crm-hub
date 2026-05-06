import React, { useState, useEffect } from "react";
import { TrendingUp, Plus, Building2, BarChart3, Percent, ArrowUpRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { formatBRL } from "@/lib/formatters";
import { CurrencyInput } from "@/components/ui/currency-input";
function formatPct(v: number) { return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`; }

interface Investimento {
  id: number;
  nome: string;
  tipo: "Renda Fixa" | "Fundos" | "Imóveis" | "Equipamentos" | "Participações";
  aporte: number;
  rendimentoPct: number;
  dataAporte: string;
  saldoAtual: number;
}

const TIPOS_COLOR: Record<string, string> = {
  "Renda Fixa": "bg-emerald-500/10 text-emerald-600",
  "Fundos": "bg-blue-500/10 text-blue-600",
  "Imóveis": "bg-amber-500/10 text-amber-600",
  "Equipamentos": "bg-violet-500/10 text-violet-600",
  "Participações": "bg-cyan-500/10 text-cyan-600",
};

const INITIAL: Investimento[] = [];

export default function InvestimentosTab() {
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestimentos = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('company_investments')
        .select('*')
        .eq('user_id', user.id);

      if (data) {
        setInvestimentos(data.map(i => ({
          id: i.id,
          nome: i.nome,
          tipo: i.tipo as Investimento["tipo"],
          aporte: Number(i.aporte),
          rendimentoPct: Number(i.rendimento_pct),
          dataAporte: i.data_aporte,
          saldoAtual: Number(i.saldo_atual)
        })));
      }
      setLoading(false);
    };

    fetchInvestimentos();
  }, []);

  const [form, setForm] = useState({ nome: "", tipo: "Renda Fixa" as Investimento["tipo"], aporte: 0, rendimento: "", data: "" });

  const totalAporte = investimentos.reduce((s, i) => s + i.aporte, 0);
  const totalAtual = investimentos.reduce((s, i) => s + i.saldoAtual, 0);
  const rentabilidade = totalAporte > 0 ? ((totalAtual - totalAporte) / totalAporte) * 100 : 0;

  async function handleAdd() {
    if (!form.nome || !form.aporte) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const aporte = form.aporte;
    const rendPct = parseFloat(form.rendimento) || 0;
    const saldoAtual = aporte * (1 + rendPct / 100);

    const { data, error } = await supabase.from('company_investments').insert([{
      user_id: user.id,
      nome: form.nome,
      tipo: form.tipo,
      aporte: aporte,
      rendimento_pct: rendPct,
      data_aporte: form.data || new Date().toISOString().split('T')[0],
      saldo_atual: saldoAtual
    }]).select();

    if (data) {
      const inv = data[0];
      setInvestimentos(prev => [...prev, {
        id: inv.id,
        nome: inv.nome,
        tipo: inv.tipo as Investimento["tipo"],
        aporte: Number(inv.aporte),
        rendimentoPct: Number(inv.rendimento_pct),
        dataAporte: inv.data_aporte,
        saldoAtual: Number(inv.saldo_atual)
      }]);
      setShowForm(false);
      setForm({ nome: "", tipo: "Renda Fixa", aporte: 0, rendimento: "", data: "" });
      toast.success("Investimento salvo com sucesso!");
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('company_investments').delete().eq('id', id);
    if (!error) {
      setInvestimentos(prev => prev.filter(i => String(i.id) !== String(id)));
      toast.success("Investimento removido!");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Aportado", value: formatBRL(totalAporte), color: "text-foreground", bg: "bg-muted/30" },
          { label: "Patrimônio Atual", value: formatBRL(totalAtual), color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Rentabilidade Total", value: formatPct(rentabilidade), color: rentabilidade >= 0 ? "text-emerald-500" : "text-rose-500", bg: rentabilidade >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10" },
        ].map((k, i) => (
          <div key={i} className={cn("p-5 rounded-2xl border border-border/30", k.bg)}>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">{k.label}</p>
            <p className={cn("text-2xl font-black", k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Evolution Chart */}
      <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            Evolução Patrimonial
          </h3>
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Últimos 6 meses</span>
        </div>
        <div className="flex items-end gap-3 h-36 mt-4">
          {evolutionData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full relative group">
                <div
                  className="w-full bg-primary/80 hover:bg-primary transition-all rounded-t-xl cursor-pointer relative"
                  style={{ height: `${(d.valor / maxEvol) * 120}px` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatBRL(d.valor)}
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{d.month}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Investments Table */}
      <div className="rounded-3xl border border-border/40 bg-card/50 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-muted/10">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Building2 size={16} className="text-muted-foreground" /> Carteira de Investimentos
          </h3>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            <Plus size={13} /> Novo Investimento
          </button>
        </div>

        {showForm && (
          <div className="p-6 border-b border-border/30 bg-muted/5">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <input placeholder="Nome do investimento" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                className="col-span-2 px-3 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as any }))}
                className="px-3 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all">
                {Object.keys(TIPOS_COLOR).map(t => <option key={t}>{t}</option>)}
              </select>
              <CurrencyInput placeholder="Aporte (R$)" value={form.aporte} onChange={val => setForm(f => ({ ...f, aporte: val }))}
                className="px-3 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all h-[42px]" />
              <input placeholder="Rendimento (%)" type="number" value={form.rendimento} onChange={e => setForm(f => ({ ...f, rendimento: e.target.value }))}
                className="px-3 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleAdd} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all">Salvar</button>
              <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl border border-border bg-background text-xs font-bold hover:bg-muted transition-all">Cancelar</button>
            </div>
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/30 bg-muted/10">
              {["Investimento", "Tipo", "Aporte", "Saldo Atual", "Rentab.", "Rendimento", ""].map(h => (
                <th key={h} className="px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-black">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {investimentos.map((inv, idx) => {
              const ganho = inv.saldoAtual - inv.aporte;
              return (
                <tr key={inv.id} className={cn("border-b border-border/20 hover:bg-muted/10 transition-all group", idx === investimentos.length - 1 && "border-0")}>
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-bold text-foreground">{inv.nome}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{inv.dataAporte}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-lg", TIPOS_COLOR[inv.tipo])}>{inv.tipo}</span>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-foreground">{formatBRL(inv.aporte)}</td>
                  <td className="px-5 py-4 text-sm font-black text-foreground">{formatBRL(inv.saldoAtual)}</td>
                  <td className="px-5 py-4">
                    <span className={cn("text-sm font-black flex items-center gap-1",
                      inv.rendimentoPct >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {inv.rendimentoPct >= 0 ? <ArrowUpRight size={14} /> : null}
                      {formatPct(inv.rendimentoPct)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("text-sm font-black", ganho >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {ganho >= 0 ? "+" : ""}{formatBRL(ganho)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleDelete(String(inv.id))}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
