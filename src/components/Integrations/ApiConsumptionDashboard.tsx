import React, { useMemo } from 'react';
import { useApiUsageStats } from '@/hooks/useApiManager';
import { PieChart, Activity, TrendingUp, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function ApiConsumptionDashboard() {
  const { data, isLoading } = useApiUsageStats();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-card/50 border border-border rounded-xl animate-pulse flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/20" />
          </div>
        ))}
      </div>
    );
  }

  // Animation percentages for the bars
  const maxUsage = Math.max(...data.byDay.map(d => d.value), 1);

  return (
    <div className="space-y-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Total de Requisições" 
          value={data.total} 
          icon={<Activity className="w-4 h-4" />} 
          color="text-blue-400"
          bg="bg-blue-500/10"
        />
        <MetricCard 
          title="Taxa de Sucesso" 
          value={`${data.successRate.toFixed(1)}%`} 
          icon={<CheckCircle2 className="w-4 h-4" />} 
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <MetricCard 
          title="Agentes Ativos" 
          value={data.byAgent.length} 
          icon={<Users className="w-4 h-4" />} 
          color="text-purple-400"
          bg="bg-purple-500/10"
        />
        <MetricCard 
          title="Status da Rede" 
          value="Otimizado" 
          icon={<TrendingUp className="w-4 h-4" />} 
          color="text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Animated Bar Chart (Usage by Day) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Atividade dos Últimos 7 Dias
            </h3>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Requisições/Dia</span>
          </div>
          
          <div className="flex items-end justify-between h-40 gap-2 px-2">
            {data.byDay.map((day, i) => (
              <div key={day.name} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full flex flex-col justify-end h-32">
                  <div 
                    className="w-full bg-gradient-to-t from-[hsl(265,85%,60%)] to-[hsl(215,85%,65%)] rounded-t-md transition-all duration-1000 ease-out delay-[200ms]"
                    style={{ 
                        height: `${(day.value / maxUsage) * 100}%`,
                        opacity: 0.8 + (i * 0.05)
                    }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded border border-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {day.value} reqs
                  </div>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground mt-2 uppercase tracking-tight">{day.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut-style Chart (Usage by Agent) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-500" /> Distribuição por Agente
            </h3>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 py-4">
            {/* Custom SVG Donut */}
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/20" />
                {renderDonutSectors(data.byAgent, data.total)}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-foreground leading-none">{data.total}</span>
                <span className="text-[8px] text-muted-foreground uppercase font-semibold">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-3 w-full">
              {data.byAgent.map((agent, i) => (
                <div key={agent.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getAgentColor(agent.name, i) }} />
                    <span className="text-xs font-medium text-foreground capitalize">{agent.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-muted-foreground">{((agent.value / data.total) * 100).toFixed(0)}%</span>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 delay-500" 
                        style={{ 
                            width: `${(agent.value / data.total) * 100}%`,
                            backgroundColor: getAgentColor(agent.name, i)
                        }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, bg }: { title: string, value: string | number, icon: React.ReactNode, color: string, bg: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-primary/30 transition-colors">
      <div className={`p-2 rounded-lg ${bg} ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
      </div>
    </div>
  );
}

function getAgentColor(name: string, index: number) {
  if (name.toLowerCase().includes('rafa')) return '#A855F7';
  if (name.toLowerCase().includes('dani')) return '#3B82F6';
  if (name.toLowerCase().includes('system')) return '#64748B';
  const colors = ['#F59E0B', '#10B981', '#EC4899', '#6366F1'];
  return colors[index % colors.length];
}

function renderDonutSectors(agents: {name: string, value: number}[], total: number) {
  let offset = 0;
  return agents.map((agent, i) => {
    const percentage = (agent.value / total) * 100;
    const strokeDasharray = `${percentage} ${100 - percentage}`;
    const strokeDashoffset = -offset;
    offset += percentage;
    
    return (
      <circle
        key={agent.name}
        cx="18" cy="18" r="15.915"
        fill="none"
        stroke={getAgentColor(agent.name, i)}
        strokeWidth="3.5"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-1000 ease-out"
      />
    );
  });
}
