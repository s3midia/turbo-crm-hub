import React, { useState } from "react";
import { Shield, Download, Mail, Clock, CheckCircle2, AlertCircle, RefreshCw, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackupEntry {
  id: number;
  data: string;
  tamanho: string;
  status: "concluido" | "falha";
  tipo: "automatico" | "manual";
}

const BACKUP_LOG: BackupEntry[] = [
  { id: 1, data: "28/04/2026 02:00", tamanho: "2.3 MB", status: "concluido", tipo: "automatico" },
  { id: 2, data: "27/04/2026 02:00", tamanho: "2.1 MB", status: "concluido", tipo: "automatico" },
  { id: 3, data: "26/04/2026 02:00", tamanho: "2.0 MB", status: "falha", tipo: "automatico" },
  { id: 4, data: "25/04/2026 14:30", tamanho: "1.9 MB", status: "concluido", tipo: "manual" },
  { id: 5, data: "25/04/2026 02:00", tamanho: "1.9 MB", status: "concluido", tipo: "automatico" },
];

export default function ConfiguracoesFinanceiroTab() {
  const [emails, setEmails] = useState(["gestor@s3midia.com.br"]);
  const [novoEmail, setNovoEmail] = useState("");
  const [agendamento, setAgendamento] = useState<"diario" | "semanal" | "mensal">("diario");
  const [horario, setHorario] = useState("02:00");
  const [backupAtivo, setBackupAtivo] = useState(true);
  const [backupLog, setBackupLog] = useState(BACKUP_LOG);
  const [rodandoBackup, setRodandoBackup] = useState(false);

  function addEmail() {
    if (!novoEmail || emails.includes(novoEmail)) return;
    setEmails(prev => [...prev, novoEmail]);
    setNovoEmail("");
  }

  function removeEmail(email: string) {
    setEmails(prev => prev.filter(e => e !== email));
  }

  function runManualBackup() {
    setRodandoBackup(true);
    setTimeout(() => {
      setRodandoBackup(false);
      const now = new Date();
      const dateStr = now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      setBackupLog(prev => [
        { id: Date.now(), data: dateStr, tamanho: "2.4 MB", status: "concluido", tipo: "manual" },
        ...prev,
      ]);
    }, 2000);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
      {/* Backup Status Card */}
      <div className={cn(
        "p-6 rounded-3xl border shadow-sm relative overflow-hidden",
        backupAtivo ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/30 border-border/40"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", backupAtivo ? "bg-emerald-500/20" : "bg-muted/50")}>
              <Shield size={24} className={backupAtivo ? "text-emerald-500" : "text-muted-foreground"} />
            </div>
            <div>
              <h3 className="font-black text-foreground text-lg">Backup Automático</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {backupAtivo ? `Último backup: ${backupLog.find(b => b.status === "concluido")?.data ?? "—"}` : "Backup desativado"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setBackupAtivo(!backupAtivo)}
            className={cn("relative w-14 h-7 rounded-full transition-all duration-300", backupAtivo ? "bg-emerald-500" : "bg-muted")}
          >
            <div className={cn("absolute top-1.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300", backupAtivo ? "left-8" : "left-1.5")} />
          </button>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agendamento */}
        <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-sm space-y-4">
          <h3 className="text-sm font-black flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            Agendamento do Backup
          </h3>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Frequência</label>
            <div className="flex gap-2">
              {(["diario", "semanal", "mensal"] as const).map(a => (
                <button key={a} onClick={() => setAgendamento(a)}
                  className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                    agendamento === a ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
                  )}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Horário de Execução</label>
            <input type="time" value={horario} onChange={e => setHorario(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 p-3 rounded-xl bg-muted/20 border border-border/20 text-center">
              <p className="text-[10px] font-black text-muted-foreground uppercase">Formato</p>
              <p className="text-sm font-black text-foreground flex items-center justify-center gap-1.5 mt-1">
                <FileSpreadsheet size={14} className="text-emerald-500" /> Excel (.xlsx)
              </p>
            </div>
            <div className="flex-1 p-3 rounded-xl bg-muted/20 border border-border/20 text-center">
              <p className="text-[10px] font-black text-muted-foreground uppercase">Retenção</p>
              <p className="text-sm font-black text-foreground mt-1">30 dias</p>
            </div>
          </div>
          <button onClick={runManualBackup} disabled={rodandoBackup}
            className={cn("w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
              rodandoBackup ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            )}>
            <RefreshCw size={14} className={rodandoBackup ? "animate-spin" : ""} />
            {rodandoBackup ? "Executando Backup..." : "Executar Backup Agora"}
          </button>
        </div>

        {/* E-mail Recipients */}
        <div className="p-6 rounded-3xl border border-border/50 bg-card shadow-sm space-y-4">
          <h3 className="text-sm font-black flex items-center gap-2">
            <Mail size={16} className="text-primary" />
            Envio Automático por E-mail
          </h3>
          <div className="space-y-2">
            {emails.map(email => (
              <div key={email} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/20 group">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-xs font-bold text-foreground">{email}</span>
                </div>
                {emails.length > 1 && (
                  <button onClick={() => removeEmail(email)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-all">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Adicionar e-mail..."
              value={novoEmail}
              onChange={e => setNovoEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addEmail()}
              className="flex-1 px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button onClick={addEmail} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all">
              <Plus size={14} />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">O backup em Excel será enviado automaticamente para todos os e-mails cadastrados.</p>
        </div>
      </div>

      {/* Backup Log */}
      <div className="rounded-3xl border border-border/40 bg-card/50 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border/30 bg-muted/10">
          <h3 className="text-sm font-bold">Histórico de Backups</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/20">
              {["Data/Hora", "Tipo", "Tamanho", "Status", "Download"].map(h => (
                <th key={h} className="px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-black">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {backupLog.slice(0, 5).map((b, idx) => (
              <tr key={b.id} className={cn("border-b border-border/20 hover:bg-muted/10 transition-all", idx === Math.min(4, backupLog.length - 1) && "border-0")}>
                <td className="px-5 py-3 text-[12px] font-semibold text-foreground">{b.data}</td>
                <td className="px-5 py-3">
                  <span className={cn("text-[10px] font-black px-2 py-1 rounded-lg",
                    b.tipo === "automatico" ? "bg-blue-500/10 text-blue-500" : "bg-violet-500/10 text-violet-500"
                  )}>
                    {b.tipo === "automatico" ? "Automático" : "Manual"}
                  </span>
                </td>
                <td className="px-5 py-3 text-[12px] text-muted-foreground">{b.tamanho}</td>
                <td className="px-5 py-3">
                  <span className={cn("text-[10px] font-black flex items-center gap-1.5 w-fit",
                    b.status === "concluido" ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {b.status === "concluido" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {b.status === "concluido" ? "Concluído" : "Falha"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {b.status === "concluido" && (
                    <button className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors">
                      <Download size={12} /> Baixar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
