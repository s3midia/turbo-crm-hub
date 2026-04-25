import React from 'react';
import './AutomacaoFunil.css';
import { useAgentSkills, AgentSkill } from '@/hooks/useAgentSkills';
import { 
  Bot, 
  Play, 
  Pause, 
  Settings, 
  Zap, 
  Clock, 
  BarChart, 
  MessageSquare,
  Search,
  Code,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function AutomacaoFunil() {
  const { skills, loading, updateSkillStatus } = useAgentSkills();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Sparkles className="h-8 w-8 animate-pulse text-orange-500" />
      </div>
    );
  }

  const getStatusLabel = (status: AgentSkill['status']) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'paused': return 'Pausado';
      case 'error': return 'Erro';
      default: return status;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="automacao-funil-container space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-8 w-8 text-orange-500" />
            Configurações de Skills
          </h1>
          <p className="text-muted-foreground mt-1">
            Programação e controle individual das habilidades de cada agente autônomo.
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Bot className="mr-2 h-4 w-4" />
          Novo Agente / Skill
        </Button>
      </div>

      <motion.div 
        className="agent-skills-grid"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {skills.map((skill) => (
          <motion.div key={skill.id} variants={item}>
            <Card className="skill-card">
              <div className="skill-header">
                <div className="agent-info">
                  <div className="agent-avatar" style={{ borderColor: `var(--${skill.color}-500)` }}>
                    {skill.agentName.charAt(0)}
                  </div>
                  <div className="agent-details">
                    <h3>{skill.agentName}</h3>
                    <p>{skill.agentRole}</p>
                  </div>
                </div>
                <Badge className={`skill-status-badge status-${skill.status}`}>
                  {getStatusLabel(skill.status)}
                </Badge>
              </div>

              <div className="skill-title-area">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <h4>{skill.skillTitle}</h4>
                </div>
                <div className="programmed-logic">
                  {skill.programmedLogic}
                </div>
              </div>

              <div className="skill-actions">
                {skill.status === 'active' ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="skill-btn btn-secondary"
                    onClick={() => updateSkillStatus(skill.id, 'paused')}
                  >
                    <Pause className="h-3 w-3" /> Pausar
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="skill-btn btn-primary bg-green-600 hover:bg-green-700"
                    onClick={() => updateSkillStatus(skill.id, 'active')}
                  >
                    <Play className="h-3 w-3" /> Retomar
                  </Button>
                )}
                <Button variant="outline" size="sm" className="skill-btn btn-secondary">
                  <Settings className="h-3 w-3" /> Configurar
                </Button>
              </div>

              <div className="skill-footer">
                <div className="last-run">
                  <Clock className="h-3 w-3" />
                  {skill.lastRun}
                </div>
                <div className="performance">
                  <BarChart className="h-3 w-3 inline mr-1" />
                  <span className="performance-metric">{skill.performance}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-8 p-6 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-orange-500" />
          Insight do Sistema
        </h3>
        <p className="text-sm text-muted-foreground">
          O agente <strong>João Paulo</strong> detectou uma alta taxa de resposta em leads do setor de tecnologia. 
          A Skill de qualificação foi otimizada automaticamente para priorizar esses perfis nas próximas extrações.
        </p>
      </div>
    </div>
  );
}
