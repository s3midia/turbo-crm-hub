import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEvolutionAPI } from "../hooks/useEvolutionAPI";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ceoReport from "../relatorio_estrategico_ceo.md?raw";
import { generateAgentActivity, conductAgentMeeting, AGENT_PERSONAS } from "../lib/agentIntelligence";
import AgentMeetingPanel from "../components/AgentMeetingPanel";

import { 
  Bot, 
  Search, 
  Building2, 
  Globe, 
  MessageSquare, 
  Play, 
  Pause,
  Activity,
  X,
  ExternalLink,
  CheckCircle2,
  Clock,
  Zap,
  ChevronRight,
  ArrowRight,
  Send,
  User,
  Users,
  Plus,
  Pencil,
  Trash2
} from "lucide-react";

const AGENTS = [
  { id: 'rafa', name: 'Rafa', role: 'Líder de Estratégia', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Rafa&backgroundColor=e0e7ff', icon: Search, color: 'text-indigo-600', route: '/radar-leads', routeLabel: 'Abrir Radar de Leads', description: 'Orquestradora master da prospecção. Gerencia Bia, Icarus e Clara.', logs: [] },
  { id: 'bia', name: 'Bia', role: 'Prospecção (Apify)', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Bia&backgroundColor=c7d2fe', icon: Search, color: 'text-indigo-500', route: '/radar-leads', routeLabel: 'Ver Prospecção', description: 'Especialista em encontrar pistas usando automações Apify.', logs: [] },
  { id: 'icarus', name: 'Icarus', role: 'Investigador (CNPJ)', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Icarus&backgroundColor=bae6fd', icon: Search, color: 'text-sky-500', route: '/radar-leads', routeLabel: 'Ver Dados', description: 'Procura informações profundas na web e Receita Federal.', logs: [] },
  { id: 'clara', name: 'Clara', role: 'Copymaker', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Clara&backgroundColor=fbcfe8', icon: Search, color: 'text-pink-500', route: '/radar-leads', routeLabel: 'Ver Briefings', description: 'Desenvolve os briefings super persuasivos para as landigs pages.', logs: [] },
  { id: 'dani', name: 'Dani', role: 'Vendas & Deploy', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Dani&backgroundColor=d1fae5', icon: Globe, color: 'text-emerald-600', route: '/funil-kanban', routeLabel: 'Ver Templates no Kanban', description: 'Transforma leads qualificados em oportunidades.', logs: [] },
  { id: 'malu', name: 'Malu', role: 'Atendimento & Conversão', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Malu&backgroundColor=ffedd5', icon: MessageSquare, color: 'text-orange-600', route: '/atendimentos', routeLabel: 'Visualizar Conversas WhatsApp', description: 'O braço de atendimento da Torre.', logs: [] },
  { id: 'ceo', name: 'João Paulo', role: 'Estratégia & CEO', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=CEO&backgroundColor=f3f4f6', icon: Building2, color: 'text-slate-600', route: '/', routeLabel: 'Visão Geral do Negócio', logs: [] }
];

interface Meeting { id: string; name: string; participants: string[]; messages: any[]; topic: string; isLoading: boolean; isOpen: boolean; color?: string; }
interface ChatMessage { role: 'system' | 'user' | 'agent'; content: string; agent?: string; avatar?: string; color?: string; isAuto?: boolean; }

export default function AgentsPage() {
  const [pipelineActive, setPipelineActive] = useState(() => localStorage.getItem('s3_agents_paused') !== 'true');
  const [activeAgents, setActiveAgents] = useState(AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<typeof AGENTS[0] | null>(null);
  const [viewMode, setViewMode] = useState<'tower' | 'battalion'>('tower');
  const [commandInput, setCommandInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'Iniciando Stream de Operações.' },
    { role: 'agent', agent: 'João Paulo', content: 'Batalhão, reportar atividades.', avatar: AGENTS.find(a => a.id === 'ceo')?.avatar, color: AGENTS.find(a => a.id === 'ceo')?.color, isAuto: true }
  ]);
  const [rafaStatus, setRafaStatus] = useState({ isScanning: false, currentNiche: 'Clínicas Odontológicas', leadsFound: 0 });
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem('s3_meetings');
    return saved ? JSON.parse(saved) : [
      { id: 'ceo-room', name: 'Sala CEO', participants: ['ceo', 'rafa'], messages: [], topic: 'Alinhamento Estratégico', isLoading: false, isOpen: false, color: 'bg-indigo-500' },
      { id: 'vendas-room', name: 'Sala VENDAS', participants: ['dani'], messages: [], topic: 'Faturamento Mensal', isLoading: false, isOpen: false, color: 'bg-rose-500' },
      { id: 'mkt-room', name: 'MKT', participants: ['malu', 'bia'], messages: [], topic: 'Campanhas Ativas', isLoading: false, isOpen: false, color: 'bg-emerald-500' }
    ];
  });
  
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [newMeetingName, setNewMeetingName] = useState("");
  const [newMeetingTopic, setNewMeetingTopic] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('s3_meetings', JSON.stringify(meetings));
  }, [meetings]);

  const handleCreateOrUpdateMeeting = () => {
    if (!newMeetingName.trim()) return;
    
    if (editingMeeting) {
      setMeetings(prev => prev.map(m => m.id === editingMeeting.id ? { ...m, name: newMeetingName, topic: newMeetingTopic, participants: selectedParticipants } : m));
    } else {
      const newRoom: Meeting = {
        id: Math.random().toString(36).substr(2, 9),
        name: newMeetingName,
        topic: newMeetingTopic,
        participants: selectedParticipants,
        messages: [],
        isLoading: false,
        isOpen: false,
        color: `bg-${['indigo', 'emerald', 'rose', 'orange', 'sky'][Math.floor(Math.random() * 5)]}-500`
      };
      setMeetings(prev => [...prev, newRoom]);
    }
    
    setShowNewMeetingModal(false);
    setEditingMeeting(null);
    setNewMeetingName("");
    setNewMeetingTopic("");
    setSelectedParticipants([]);
  };

  const handleDeleteMeeting = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja realmente excluir esta sala?')) {
      setMeetings(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleOpenEditModal = (meeting: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMeeting(meeting);
    setNewMeetingName(meeting.name);
    setNewMeetingTopic(meeting.topic);
    setSelectedParticipants(meeting.participants);
    setShowNewMeetingModal(true);
  };
  
  const toggleAgentInMeeting = (meetingId: string, agentId: string) => {
     setMeetings(prev => prev.map(m => {
       if (m.id === meetingId) {
         const exists = m.participants.includes(agentId);
         return {
           ...m,
           participants: exists ? m.participants.filter(p => p !== agentId) : [...m.participants, agentId]
         };
       }
       return m;
     }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedAgent(null); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartMeeting = async (meetingId: string, userPrompt?: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, isLoading: true, isOpen: true, messages: userPrompt ? [...m.messages, { role: 'user', content: userPrompt }] : m.messages } : m));

    try {
      const deliberation = await conductAgentMeeting(meeting.topic, meeting.participants, userPrompt);
      const parsed = JSON.parse(deliberation);
      const newMessages = parsed.map((msg: any) => ({ ...msg, avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${msg.name}`, color: AGENT_PERSONAS[msg.agent]?.color || 'text-slate-500' }));
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, messages: [...m.messages, ...newMessages], isLoading: false } : m));
    } catch (error) {
      console.error(error);
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, isLoading: false } : m));
    }
  };

  useEffect(() => {
    const fetchLeadCount = async () => {
      const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true });
      if (count !== null) setRafaStatus(prev => ({ ...prev, leadsFound: count }));
    };
    fetchLeadCount();
  }, []);

  useEffect(() => {
    const fetchRealLogs = async () => {
      const { data } = await supabase.from('agent_logs').select('*').order('created_at', { ascending: false }).limit(20);
      if (data) {
        setActiveAgents(prev => prev.map(a => ({ ...a, logs: data.filter(l => l.agent_id === a.id).map(l => ({ time: new Date(l.created_at).toLocaleTimeString().slice(0,5), msg: l.message })) })));
      }
    };
    fetchRealLogs();
    const sub = supabase.channel('logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_logs' }, fetchRealLogs).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const [deliveryEffect, setDeliveryEffect] = useState<{ from: string, to: string } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const from = ['rafa', 'dani', 'malu'][Math.floor(Math.random() * 3)];
      const to = ['bia', 'icarus', 'clara'][Math.floor(Math.random() * 3)];
      setDeliveryEffect({ from, to });
      setTimeout(() => setDeliveryEffect(null), 3000);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const currentAgent = selectedAgent ? activeAgents.find(a => a.id === selectedAgent.id) : null;

  return (
    <div className="relative">
      {/* Header — Premium */}
      <div className="relative overflow-hidden px-8 py-5 border-b border-white/10 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="absolute top-0 left-1/3 w-96 h-32 bg-indigo-500/5 blur-[80px] rounded-full" />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/20">
                <Zap className="h-5 w-5 text-indigo-400" />
              </div>
              Torre de IAs S3
            </h1>
            <p className="text-indigo-300/60 text-xs font-medium mt-1.5 tracking-wide">
              Visualize o fluxo estratégico dos seus agentes.
            </p>
          </div>
          <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-sm">
             <button onClick={() => setViewMode('tower')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-bold tracking-wider uppercase transition-all duration-300 ${viewMode === 'tower' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <Activity className="w-3.5 h-3.5" /> Estratégico
             </button>
             <button onClick={() => setViewMode('battalion')} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-bold tracking-wider uppercase transition-all duration-300 ${viewMode === 'battalion' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <Users className="w-3.5 h-3.5" /> Modo Batalhão
             </button>
          </div>
        </div>
      </div>


      <div className="flex flex-col lg:flex-row gap-6 px-8 pb-8 pt-6 bg-gradient-to-b from-slate-50/50 to-white">
        {/* Main Content Area */}
        {viewMode === 'tower' ? (
          <div className="flex-1 flex flex-col gap-6">
            
            {/* === MAIN LAYOUT: Salas (Left) + Batalhão (Right) === */}
            <div className="flex flex-col xl:flex-row gap-6 min-h-[650px]">
              
              {/* ===== LEFT: SALAS DE REUNIÕES ===== */}
              <div className="xl:w-[360px] flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Salas de Reuniões</h2>
                    <p className="text-[9px] font-semibold text-slate-400 tracking-widest uppercase mt-0.5">Ambiente Operacional</p>
                  </div>
                  <button 
                    onClick={() => { setEditingMeeting(null); setNewMeetingName(""); setNewMeetingTopic(""); setSelectedParticipants([]); setShowNewMeetingModal(true); }} 
                    className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 border border-indigo-400/30"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Premium Room Cards */}
                {meetings.map((m, idx) => {
                  const roomAgents = m.participants.map(pid => AGENTS.find(a => a.id === pid)).filter(Boolean) as typeof AGENTS;
                  const movingAgent = deliveryEffect ? AGENTS.find(a => a.id === deliveryEffect.from && m.participants.includes(deliveryEffect.from)) : null;
                  const gradients = ['from-indigo-500/10 to-violet-500/5', 'from-emerald-500/10 to-teal-500/5', 'from-orange-500/10 to-amber-500/5', 'from-rose-500/10 to-pink-500/5'];
                  const accents = ['border-indigo-200/60', 'border-emerald-200/60', 'border-orange-200/60', 'border-rose-200/60'];

                  return (
                    <div 
                      key={m.id}
                      className={`group relative rounded-2xl border ${accents[idx % 4]} bg-gradient-to-br ${gradients[idx % 4]} p-4 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer backdrop-blur-sm`}
                      style={{ animationDelay: `${idx * 100}ms` }}
                      onClick={() => setMeetings(prev => prev.map(mm => mm.id === m.id ? { ...mm, isOpen: true } : mm))}
                    >
                      {/* Room Header */}
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className={`w-2 h-2 rounded-full ${roomAgents.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            {roomAgents.length > 0 && <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />}
                          </div>
                          <h4 className="text-[13px] font-extrabold text-slate-800 tracking-tight">{m.name}</h4>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <button onClick={(e) => handleOpenEditModal(m, e)} className="p-1.5 hover:bg-white/60 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Pencil className="w-3 h-3" /></button>
                          <button onClick={(e) => handleDeleteMeeting(m.id, e)} className="p-1.5 hover:bg-white/60 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500/80 font-medium italic mb-3">{m.topic || 'Sem pauta definida'}</p>

                      {/* Agents Inside Room — Premium */}
                      <div className="min-h-[70px] bg-white/60 backdrop-blur-sm border border-white/80 rounded-xl p-3 flex flex-wrap gap-4 items-center justify-center shadow-inner shadow-slate-100/50">
                        {roomAgents.length > 0 ? roomAgents.map(agent => (
                          <button
                            key={agent.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedAgent(agent); }}
                            className={`flex flex-col items-center gap-1.5 transition-all duration-200 hover:scale-110 hover:-translate-y-1 ${movingAgent?.id === agent.id ? 'animate-bounce' : ''}`}
                          >
                            <div className="relative">
                              <div className="absolute -inset-1 bg-gradient-to-br from-indigo-400/20 to-emerald-400/20 rounded-full blur-sm group-hover:blur-md transition-all" />
                              <img src={agent.avatar} className="relative w-11 h-11 rounded-full border-2 border-white shadow-lg bg-white" alt="" />
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                            </div>
                            <span className="text-[8px] font-bold text-slate-700">{agent.name}</span>
                            {movingAgent?.id === agent.id && (
                              <span className="text-[7px] font-bold text-indigo-500 animate-pulse tracking-wide">RECEBENDO</span>
                            )}
                          </button>
                        )) : (
                          <span className="text-[10px] font-medium text-slate-300 italic">Sala vazia</span>
                        )}
                      </div>

                      {/* Room Status */}
                      {roomAgents.length > 0 && (
                        <div className="mt-2.5 text-[8px] font-bold text-emerald-600/80 uppercase tracking-[0.15em] flex items-center gap-1.5">
                          <Activity className="w-3 h-3" /> Em operação
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Performance Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl mt-auto border border-indigo-500/10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 blur-[60px] rounded-full translate-x-10 -translate-y-10" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-300/60">Status Geral</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider border border-emerald-500/20">Ativo</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-400 to-emerald-400 h-full w-full rounded-full shadow-[0_0_12px_rgba(129,140,248,0.4)]" />
                    </div>
                  </div>
                </div>
              </div>


              {/* ===== RIGHT: BATALHÃO DE AGENTES ===== */}
              <div className="flex-1 flex flex-col gap-5">
                <div className="mb-2">
                  <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Batalhão de Agentes <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">(Em Produção)</span></h2>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5 tracking-wide">Pipeline operacional autônomo.</p>
                </div>

                {/* Main Agent Cards — 3 Managers */}
                <div className="flex flex-col gap-4 flex-1">
                  {[
                    { id: 'rafa', label: 'Marketing & Prospecção', arrowGradient: 'from-indigo-100 to-violet-100', arrowColor: 'text-indigo-500', hoverGlow: 'hover:shadow-indigo-100/50', tag: 'LEAD!', tagGradient: 'from-orange-500 to-rose-500', hasSubs: true },
                    { id: 'dani', label: 'Vendas & Deploy', arrowGradient: 'from-emerald-100 to-teal-100', arrowColor: 'text-emerald-500', hoverGlow: 'hover:shadow-emerald-100/50', tag: null, tagGradient: '', hasSubs: false },
                    { id: 'malu', label: 'Atendimento & Conversão', arrowGradient: 'from-orange-100 to-amber-100', arrowColor: 'text-orange-500', hoverGlow: 'hover:shadow-orange-100/50', tag: null, tagGradient: '', hasSubs: false },
                  ].map((card, idx) => {
                    const agent = activeAgents.find(a => a.id === card.id)!;
                    const currentRoom = meetings.find(m => m.participants.includes(card.id));
                    const isMoving = deliveryEffect?.from === card.id || deliveryEffect?.to === card.id;

                    return (
                      <div key={card.id} className="flex flex-col gap-2.5" style={{ animationDelay: `${idx * 80}ms` }}>
                        <button
                          onClick={() => setSelectedAgent(agent)}
                          className={`relative bg-white/90 backdrop-blur-sm border border-slate-100/80 rounded-2xl px-5 py-4 flex items-center gap-4 ${card.hoverGlow} hover:shadow-xl hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300 group text-left ${isMoving ? 'ring-2 ring-indigo-200/60 bg-indigo-50/20' : ''}`}
                        >
                          {/* Lead Tag */}
                          {card.tag && (
                            <div className={`absolute -top-2.5 left-8 bg-gradient-to-r ${card.tagGradient} text-white text-[8px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-orange-200/50 flex items-center gap-1.5`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              {card.tag}
                            </div>
                          )}

                          {/* Avatar with gradient ring */}
                          <div className="relative flex-shrink-0">
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-200 to-violet-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <img src={agent.avatar} className="relative w-14 h-14 rounded-full border-2 border-white shadow-md bg-white" alt="" />
                            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-[2.5px] border-white shadow-sm ${currentRoom ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[14px] font-extrabold text-slate-800 tracking-tight">{card.label}</h4>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Agente {agent.name}</p>
                            {currentRoom && (
                              <p className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-wider mt-1 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Em: {currentRoom.name}
                              </p>
                            )}
                            {isMoving && (
                              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider mt-1 animate-pulse">
                                ⚡ Transferindo informações...
                              </p>
                            )}
                          </div>

                          {/* Premium Circular Arrow */}
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${card.arrowGradient} flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 flex-shrink-0`}>
                            <ChevronRight className={`w-5 h-5 ${card.arrowColor}`} />
                          </div>
                        </button>

                        {/* Sub-agents under Rafa — refined pills */}
                        {card.hasSubs && (
                          <div className="flex items-center gap-2 pl-8">
                            <div className="w-px h-5 bg-gradient-to-b from-indigo-200 to-transparent" />
                            <div className="flex gap-1.5">
                              {['bia', 'icarus', 'clara'].map(sid => {
                                const sub = activeAgents.find(a => a.id === sid)!;
                                const subRoom = meetings.find(m => m.participants.includes(sid));
                                return (
                                  <button 
                                    key={sid} 
                                    onClick={() => setSelectedAgent(sub)} 
                                    className={`flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-full shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200 text-left ${subRoom ? 'border-indigo-200 bg-indigo-50/60' : ''}`}
                                  >
                                    <img src={sub.avatar} className="w-5 h-5 rounded-full bg-slate-50" alt="" />
                                    <span className="text-[9px] font-bold text-slate-600">{sub.name}</span>
                                    {subRoom && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* CEO Card — Premium Dark */}
                <button 
                  onClick={() => setSelectedAgent(activeAgents.find(a => a.id === 'ceo')!)} 
                  className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-2xl hover:shadow-indigo-900/20 transition-all duration-300 group border border-indigo-500/10"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.1),transparent_60%)]" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full translate-x-10" />
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-400/30 to-violet-400/30 rounded-full group-hover:opacity-100 opacity-50 transition-opacity" />
                    <img src={AGENTS.find(a => a.id === 'ceo')?.avatar} className="relative w-14 h-14 rounded-full border-2 border-white/20" alt="" />
                  </div>
                  <div className="flex-1 relative z-10">
                    <h4 className="text-[14px] font-extrabold tracking-tight">João Paulo</h4>
                    <p className="text-[10px] text-indigo-300/60 font-medium tracking-wide">Estratégia & CEO</p>
                    <p className="text-[9px] text-emerald-400/80 font-bold uppercase tracking-wider mt-0.5">{meetings.find(m => m.participants.includes('ceo'))?.name ? `Em: ${meetings.find(m => m.participants.includes('ceo'))?.name}` : 'Supervisão Geral'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300 flex-shrink-0 relative z-10">
                    <ChevronRight className="w-5 h-5 text-indigo-300/60" />
                  </div>
                </button>
              </div>

            </div>

            {/* === BOTTOM STATUS BAR — Premium === */}
            <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl px-6 py-3.5 flex items-center justify-between shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/30 via-transparent to-emerald-50/30" />
              <div className="flex items-center gap-2.5 text-[13px] font-extrabold text-slate-700 tracking-tight relative z-10">
                <div className="p-1.5 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-lg">
                  <Zap className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                Fluxograma em Tempo Real
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50/80 px-3.5 py-1.5 rounded-xl border border-emerald-100/60 relative z-10">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                </div>
                Processando Base ({rafaStatus.leadsFound} Leads)
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white border rounded-3xl flex flex-col overflow-hidden">
             <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <img src={m.avatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=User'} className="w-8 h-8 rounded-full" alt="" />
                    <div className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{m.content}</div>
                  </div>
                ))}
             </div>
             <form onSubmit={(e) => {
               e.preventDefault();
               if (!commandInput.trim()) return;
               setChatMessages(prev => [...prev, { role: 'user', content: commandInput }]);
               const cmd = commandInput; setCommandInput("");
               setTimeout(() => generateAgentActivity('ceo', cmd), 500);
             }} className="p-4 border-t flex gap-2">
                <input value={commandInput} onChange={e => setCommandInput(e.target.value)} className="flex-1 bg-slate-50 rounded-xl px-4" placeholder="Comandar..." />
                <button className="p-2 bg-indigo-600 text-white rounded-xl"><Send className="w-4 h-4" /></button>
             </form>
          </div>
        )}
      </div>

      {/* Global Chat Widget */}
      <div className="fixed bottom-8 right-8 z-[300] flex flex-col items-end gap-4">
        {isChatOpen && (
          <div className="w-96 h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h4 className="font-black text-sm tracking-tight">Hub de Comando S3</h4>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Interface de Linguagem Natural</p>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-3 rounded-[1.5rem] text-xs font-medium shadow-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!commandInput.trim()) return;
                setChatMessages(prev => [...prev, { role: 'user', content: commandInput }]);
                const cmd = commandInput; setCommandInput("");
                setTimeout(() => generateAgentActivity('ceo', cmd), 500);
              }} 
              className="p-4 bg-white border-t flex gap-2"
            >
              <input 
                value={commandInput} 
                onChange={e => setCommandInput(e.target.value)} 
                className="flex-1 bg-slate-50 rounded-xl px-4 text-xs font-bold border-none focus:ring-2 ring-indigo-500" 
                placeholder="Digite seu comando..." 
              />
              <button className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-md shadow-indigo-100"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        )}
        
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`p-5 rounded-full shadow-2xl transition-all active:scale-90 ${isChatOpen ? 'bg-slate-800 text-white scale-90' : 'bg-indigo-600 text-white hover:scale-110 hover:rotate-12'}`}
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      </div>

    {currentAgent && (
        <div className="fixed inset-0 z-[250] flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedAgent(null)}>
           <div className="w-full max-w-sm h-full bg-white shadow-2xl p-8 flex flex-col gap-8 animate-in slide-in-from-right duration-500" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="relative">
                     <img src={currentAgent.avatar} className="w-16 h-16 rounded-full border-4 border-indigo-50" alt="" />
                     <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                   </div>
                   <div>
                     <h2 className="font-black text-slate-800 tracking-tight">{currentAgent.name}</h2>
                     <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{currentAgent.role}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedAgent(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Procedimento Padrão</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl">{currentAgent.description}</p>
                </div>
                
                <div className="space-y-3">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memória do Sistema</h4>
                   <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                      <p className="text-[10px] font-bold text-indigo-700 italic leading-relaxed">
                         "Atualmente focado em otimizar faturamento via prospecção proativa. Priorizando nicho: {rafaStatus.currentNiche}. Identificando interrupções no pipeline de {currentAgent.name}."
                      </p>
                   </div>
                </div>

                <div className="space-y-3">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Log de Atividades</h4>
                   {currentAgent.logs?.map((l: any, i: number) => (
                     <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm flex gap-3">
                        <div className="text-[10px] text-indigo-500 font-black pt-0.5">{l.time}</div>
                        <p className="text-xs font-bold text-slate-700 leading-snug">{l.msg}</p>
                     </div>
                   ))}
                </div>
              </div>
              
              <button 
                onClick={() => { setSelectedAgent(null); navigate(currentAgent.route); }} 
                className="p-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                Ir para Canal <ExternalLink className="w-4 h-4" />
              </button>
           </div>
        </div>
      )}

      {meetings.map(m => m.isOpen && (
        <div key={m.id} className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm pointer-events-none p-4">
           <div className="w-[500px] h-[650px] pointer-events-auto animate-in zoom-in-95 duration-300 shadow-2xl rounded-[3rem] overflow-hidden">
              <AgentMeetingPanel 
                messages={m.messages} 
                isLoading={m.isLoading} 
                topic={m.topic} 
                onClose={() => setMeetings(prev => prev.map(mm => mm.id === m.id ? { ...mm, isOpen: false } : mm))} 
                onSendMessage={t => handleStartMeeting(m.id, t)} 
              />
           </div>
        </div>
      ))}
    </div>
  );
}
