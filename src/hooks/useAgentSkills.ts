import { useState, useEffect } from 'react';

export interface AgentSkill {
  id: string;
  agentName: string;
  agentRole: string;
  skillTitle: string;
  programmedLogic: string;
  status: 'active' | 'paused' | 'error';
  lastRun?: string;
  performance?: string;
  color?: string;
}

const SKILLS_KEY = 'crm_agent_skills';

const initialSkills: AgentSkill[] = [
  {
    id: '1',
    agentName: 'João Paulo',
    agentRole: 'SDR Estratégico',
    skillTitle: 'Qualificação de Leads LinkedIn',
    programmedLogic: 'Extrai perfis via Apify, filtra por cargo (CEO, Fundador) e gera abordagem personalizada baseada no histórico da empresa.',
    status: 'active',
    lastRun: '2 min atrás',
    performance: '85% conv.',
    color: 'blue'
  },
  {
    id: '2',
    agentName: 'Rafa Tech',
    agentRole: 'Arquiteto de Dados',
    skillTitle: 'Enriquecimento de Dados Receita',
    programmedLogic: 'Consulta APIs da Receita Federal para validar CNPJ, extrair quadro societário e faturamento estimado.',
    status: 'active',
    lastRun: '15 min atrás',
    performance: '99% precisão',
    color: 'indigo'
  },
  {
    id: '3',
    agentName: 'Dani Entrega',
    agentRole: 'Designer de Conversão',
    skillTitle: 'Geração de Landing Pages Dinâmicas',
    programmedLogic: 'Cria templates personalizados de sites baseados no nicho do lead captado, injetando depoimentos e provas sociais do mesmo setor.',
    status: 'active',
    lastRun: '1h atrás',
    performance: '42 builds/dia',
    color: 'emerald'
  },
  {
    id: '4',
    agentName: 'Malu Growth',
    agentRole: 'Especialista em Escala',
    skillTitle: 'Abordagem Multi-Canal WhatsApp',
    programmedLogic: 'Gerencia disparos via API Evolution, controlando intervalos para evitar banimentos e utilizando IA para responder dúvidas iniciais.',
    status: 'paused',
    lastRun: '3h atrás',
    performance: '12% click-through',
    color: 'orange'
  }
];

export const useAgentSkills = () => {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SKILLS_KEY);
    if (stored) {
      setSkills(JSON.parse(stored));
    } else {
      setSkills(initialSkills);
      localStorage.setItem(SKILLS_KEY, JSON.stringify(initialSkills));
    }
    setLoading(false);
  }, []);

  const updateSkillStatus = (id: string, status: AgentSkill['status']) => {
    const newSkills = skills.map(skill => 
      skill.id === id ? { ...skill, status } : skill
    );
    setSkills(newSkills);
    localStorage.setItem(SKILLS_KEY, JSON.stringify(newSkills));
  };

  return { skills, loading, updateSkillStatus };
};
