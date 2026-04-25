import React, { useState } from "react";
import { 
  Bot, 
  Search, 
  Building2, 
  Globe, 
  MessageSquare, 
  Play, 
  Pause,
  ArrowRight,
  Activity
} from "lucide-react";

export default function AgentsPage() {
  const [pipelineActive, setPipelineActive] = useState(true);

  // Mock data for the agents pipeline
  const stats = [
    { title: "Leads Captados (Apify)", value: "1,245", agent: "Rafa (Tech)", icon: Search, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Enriquecidos (Receita)", value: "982", agent: "Rafa (Tech)", icon: Building2, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Templates Gerados", value: "315", agent: "Dani (Entrega)", icon: Globe, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Abordagens (WhatsApp)", value: "207", agent: "Malu (Growth)", icon: MessageSquare, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  const activeWorkflows = [
    { id: 1, name: "Consultórios Odontológicos SP", status: "Em andamento", step: "Qualificação Malu", progress: 65 },
    { id: 2, name: "Escritórios de Advocacia RJ", status: "Pausado", step: "Construção Dani", progress: 40 },
    { id: 3, name: "Clínicas de Estética MG", status: "Em andamento", step: "Disparo API WhatsApp", progress: 85 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-orange-500" />
            Torre de Agentes S3
          </h1>
          <p className="text-muted-foreground mt-1">
            Orquestração CAIO: Monitore o funil autônomo de inteligência, captação e vendas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pipelineActive ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${pipelineActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            {pipelineActive ? 'Agentes Ativos' : 'Pipeline Pausado'}
          </div>
          <button 
            onClick={() => setPipelineActive(!pipelineActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              pipelineActive 
                ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
            }`}
          >
            {pipelineActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {pipelineActive ? 'Pausar Automações' : 'Retomar Automações'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border border-border/50 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 w-fit px-2 py-1 rounded-md">
              <Bot className="w-3 h-3" />
              {stat.agent}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual pipeline */}
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/50 flex justify-between items-center bg-muted/20">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Fluxograma em Tempo Real
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
              {/* Desktop connection lines */}
              <div className="hidden md:block absolute top-1/2 left-8 right-8 h-0.5 bg-border -translate-y-1/2 z-0"></div>
              
              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center gap-3 bg-card p-2 rounded-lg">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border-2 transition-colors ${pipelineActive ? 'border-blue-500 bg-blue-50' : 'border-border bg-muted text-muted-foreground'}`}>
                  <Search className={`w-6 h-6 ${pipelineActive ? 'text-blue-600' : ''}`} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm">Apify</p>
                  <p className="text-xs text-muted-foreground">Busca</p>
                </div>
              </div>

              <ArrowRight className="text-muted-foreground md:hidden" />

              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center gap-3 bg-card p-2 rounded-lg">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border-2 transition-colors ${pipelineActive ? 'border-indigo-500 bg-indigo-50' : 'border-border bg-muted text-muted-foreground'}`}>
                  <Building2 className={`w-6 h-6 ${pipelineActive ? 'text-indigo-600' : ''}`} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm">Receita</p>
                  <p className="text-xs text-muted-foreground">CNPJ/Sócios</p>
                </div>
              </div>

              <ArrowRight className="text-muted-foreground md:hidden" />

              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center gap-3 bg-card p-2 rounded-lg">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border-2 transition-colors ${pipelineActive ? 'border-emerald-500 bg-emerald-50' : 'border-border bg-muted text-muted-foreground'}`}>
                  <Globe className={`w-6 h-6 ${pipelineActive ? 'text-emerald-600' : ''}`} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm">Deploy</p>
                  <p className="text-xs text-muted-foreground">Template</p>
                </div>
              </div>

              <ArrowRight className="text-muted-foreground md:hidden" />

              {/* Step 4 */}
              <div className="relative z-10 flex flex-col items-center gap-3 bg-card p-2 rounded-lg">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border-2 transition-colors ${pipelineActive ? 'border-orange-500 bg-orange-50' : 'border-border bg-muted text-muted-foreground'}`}>
                  <MessageSquare className={`w-6 h-6 ${pipelineActive ? 'text-orange-600' : ''}`} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm">ZAP API</p>
                  <p className="text-xs text-muted-foreground">Abordagem</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground border border-border/50">
              <p><strong>Status CAIO:</strong> Monitorando 3 campanhas ativas. Nenhum gargalo detectado na construção de templates. Taxa de qualificação atual de 78% nos perfis extraídos.</p>
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-card border border-border/50 rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-border/50 bg-muted/20">
            <h2 className="font-semibold text-lg">Campanhas em Lote</h2>
          </div>
          <div className="p-0 flex-1 overflow-y-auto max-h-[400px]">
            {activeWorkflows.map((workflow, idx) => (
              <div key={workflow.id} className={`p-4 ${idx !== activeWorkflows.length - 1 ? 'border-b border-border/50' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">{workflow.name}</h4>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    workflow.status === 'Em andamento' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {workflow.status}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5 mt-3">
                  <span>Sincronização atual</span>
                  <span>{workflow.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-in-out ${workflow.status === 'Em andamento' ? 'bg-orange-500' : 'bg-muted-foreground/30'}`} 
                    style={{ width: `${workflow.progress}%` }}
                  ></div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                  <Bot className="w-3 h-3" /> 
                  Ação IA: <span className="font-medium text-foreground">{workflow.step}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border/50 bg-muted/10">
            <button className="w-full py-2 text-sm font-medium text-orange-600 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg transition-colors">
              + Nova Campanha Lote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
