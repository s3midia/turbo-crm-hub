import React, { useState, useCallback, useRef, useEffect } from "react";
import { Brain, Save, Check, Users, GripVertical, Bot, Network, FolderKanban, MessageSquare, Target, Settings, GitCompareArrows, Wand2, Bold, Italic, List, FileText, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { optimizePOPWithAI } from "@/lib/agentIntelligence";

// --- CUSTOM NODES ---
const StartNode = ({ data }: any) => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-full border-[3px] border-[#0A58CA] bg-white flex items-center justify-center font-bold text-[#0A58CA] shadow-sm">I</div>
    <Handle type="source" position={Position.Right} className="opacity-0" />
    <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />
    <Handle type="target" position={Position.Top} id="top" className="opacity-0" />
  </div>
);

const EndNode = ({ data }: any) => (
  <div className="flex items-center gap-3 bg-white border-2 border-[#8B0000] rounded-full px-4 py-1.5 shadow-sm">
    <div className="w-4 h-4 rounded-full bg-[#8B0000]"></div>
    <span className="text-[12px] font-bold text-[#8B0000]">{data.label || 'Venda Concluída'}</span>
    <Handle type="target" position={Position.Left} className="opacity-0" />
    <Handle type="target" position={Position.Top} id="top" className="opacity-0" />
  </div>
);

const ModuleNode = ({ data }: any) => (
  <div className={`bg-white border-2 border-transparent shadow-md rounded-xl px-4 py-3 min-w-[140px] text-center text-[12px] font-medium text-slate-700 flex flex-col items-center justify-center min-h-[70px] border-b-4 ${data.color || 'border-b-[#0A58CA]'}`}>
    <div className={`w-6 h-6 rounded-md mb-1.5 flex items-center justify-center ${data.iconColor || 'bg-indigo-50 text-indigo-600'}`}>
      {data.icon === 'search' && <Target className="w-3.5 h-3.5" />}
      {data.icon === 'api' && <Network className="w-3.5 h-3.5" />}
      {data.icon === 'kanban' && <FolderKanban className="w-3.5 h-3.5" />}
      {data.icon === 'message' && <MessageSquare className="w-3.5 h-3.5" />}
      {data.icon === 'agent' && <Bot className="w-3.5 h-3.5" />}
      {data.icon === 'ceo' && <Users className="w-3.5 h-3.5" />}
      {!data.icon && <Bot className="w-3.5 h-3.5" />}
    </div>
    {data.label}
    <Handle type="target" position={Position.Left} className={`!w-2 !h-2 ${data.handleBg || '!bg-[#0A58CA]'}`} />
    <Handle type="target" position={Position.Top} id="top" className={`!w-2 !h-2 ${data.handleBg || '!bg-[#0A58CA]'}`} />
    <Handle type="source" position={Position.Right} className={`!w-2 !h-2 ${data.handleBg || '!bg-[#0A58CA]'}`} />
    <Handle type="source" position={Position.Bottom} id="bottom" className={`!w-2 !h-2 ${data.handleBg || '!bg-[#0A58CA]'}`} />
  </div>
);

const DecisionNode = ({ data }: any) => (
  <div className="relative flex items-center justify-center w-[120px] h-[120px]">
    <div className={`absolute inset-0 transform rotate-45 rounded-lg shadow-sm ${data.bg || 'bg-[#0A58CA]'}`}></div>
    <div className="relative text-white text-[10px] font-medium text-center px-4 leading-tight">
      {data.label}
    </div>
    <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-white" />
    <Handle type="target" position={Position.Top} id="top" className="!w-2 !h-2 !bg-white" />
    <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-white" />
    <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-white" />
  </div>
);

const EmptyDecisionNode = ({ data }: any) => (
  <div className="relative flex items-center justify-center w-[60px] h-[60px]">
    <div className="absolute inset-0 bg-[#0A58CA] transform rotate-45 rounded-lg shadow-sm"></div>
    <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-white" />
    <Handle type="target" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-white" />
    <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-white" />
  </div>
);

const LaneNode = ({ data }: any) => (
  <div className={`w-[800px] h-[180px] rounded-2xl flex border-l-[12px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.03)] relative overflow-hidden bg-[#EDF3FD] ${data.borderColor}`}>
    <div className={`w-[40px] ${data.headerBg} flex items-center justify-center shrink-0`}>
      <span className="text-white text-[11px] font-bold -rotate-90 whitespace-nowrap tracking-wider">
        {data.label}
      </span>
    </div>
    <div className="flex-1 border border-dashed border-slate-300 m-2 rounded-xl pointer-events-none"></div>
  </div>
);

const ProcessHeaderNode = ({ data }: any) => (
  <div className="w-[40px] h-[560px] bg-[#0A123C] rounded-xl flex items-center justify-center shrink-0 shadow-md">
    <span className="text-white text-xs font-semibold -rotate-90 whitespace-nowrap tracking-widest">
      {data.label || 'FUNIL INTELIGENTE (S3)'}
    </span>
  </div>
);

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  module: ModuleNode,
  decision: DecisionNode,
  emptyDecision: EmptyDecisionNode,
  lane: LaneNode,
  processHeader: ProcessHeaderNode
};

const defaultEdgeOptions = {
  style: { stroke: '#0848AA', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#0848AA' },
};

// --- PREDEFINED FLOWS ---

// 1. FLOW PORTAL GERAL (Macro)
const flowPortalNodes: Node[] = [
  { id: 'header', type: 'processHeader', position: { x: 0, y: 0 }, data: { label: 'OMNICHANNEL MACRO' }, selectable: false, draggable: false },
  { id: 'lane1', type: 'lane', position: { x: 60, y: 0 }, data: { label: 'CAPTAÇÃO DE CNPJ', borderColor: 'border-[#4f46e5]', headerBg: 'bg-[#4f46e5]' }, selectable: false, draggable: false },
  { id: 'lane2', type: 'lane', position: { x: 60, y: 190 }, data: { label: 'GERAÇÃO KABRA', borderColor: 'border-[#10b981]', headerBg: 'bg-[#10b981]' }, selectable: false, draggable: false },
  { id: 'lane3', type: 'lane', position: { x: 60, y: 380 }, data: { label: 'ABORDAGEM ZAP', borderColor: 'border-[#f59e0b]', headerBg: 'bg-[#f59e0b]' }, selectable: false, draggable: false },

  { id: 'start', type: 'start', position: { x: 120, y: 70 }, data: {}, parentId: 'lane1', extent: 'parent' },
  { id: 'radar', type: 'module', position: { x: 220, y: 55 }, data: { label: 'Radar Apify', icon: 'search' }, parentId: 'lane1', extent: 'parent' },
  { id: 'api', type: 'module', position: { x: 440, y: 55 }, data: { label: 'Enriquecimento Receita', icon: 'api' }, parentId: 'lane1', extent: 'parent' },

  { id: 'kanban', type: 'module', position: { x: 180, y: 60 }, data: { label: 'Criação de Landing Page', icon: 'kanban', color: 'border-b-[#10b981]', iconColor: 'bg-emerald-50 text-emerald-600', handleBg: '!bg-[#10b981]' }, parentId: 'lane2', extent: 'parent' },
  { id: 'disp', type: 'decision', position: { x: 420, y: 35 }, data: { label: 'Site foi aprovado?', bg: 'bg-[#10b981]' }, parentId: 'lane2', extent: 'parent' },

  { id: 'zap', type: 'module', position: { x: 300, y: 55 }, data: { label: 'Evolution API', icon: 'message', color: 'border-b-[#f59e0b]', iconColor: 'bg-orange-50 text-orange-600', handleBg: '!bg-[#f59e0b]' }, parentId: 'lane3', extent: 'parent' },
  { id: 'end', type: 'end', position: { x: 600, y: 75 }, data: {}, parentId: 'lane3', extent: 'parent' },
];

const flowPortalEdges: Edge[] = [
  { id: 'e-start-radar', source: 'start', target: 'radar', type: 'step' },
  { id: 'e-radar-api', source: 'radar', target: 'api', type: 'step' },
  { id: 'e-api-kanban', source: 'api', sourceHandle: 'bottom', target: 'kanban', targetHandle: 'top', type: 'step', style: { stroke: '#10b981', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } },
  { id: 'e-kanban-disp', source: 'kanban', target: 'disp', type: 'step', style: { stroke: '#10b981', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } },
  { id: 'e-disp-sim', source: 'disp', sourceHandle: 'right', target: 'zap', targetHandle: 'top', type: 'step', label: 'SIM', labelStyle: { fill: '#333', fontWeight: 600, fontSize: 11 }, style: { stroke: '#f59e0b', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' } },
  { id: 'e-zap-end', source: 'zap', target: 'end', type: 'step', style: { stroke: '#f59e0b', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' } },
];

// 2. FLOW DE COMUNICAÇÃO (Eventos entre Torre)
const flowComunicacaoNodes: Node[] = [
  // Banco de Dados / Barramento Central
  { id: 'db', type: 'module', position: { x: 400, y: 300 }, data: { label: 'Barramento / Supabase', icon: 'db', color: 'border-b-indigo-800', iconColor: 'bg-indigo-100 text-indigo-800', handleBg: '!bg-indigo-800' } },

  // Agentes (Nós independentes mas conectados ao Barramento)
  { id: 'ceo1', type: 'module', position: { x: 400, y: 50 }, data: { label: 'CEO (Aciona / Fecha)', icon: 'ceo', color: 'border-b-slate-800', iconColor: 'bg-slate-100 text-slate-800', handleBg: '!bg-slate-800' } },
  { id: 'rafa', type: 'module', position: { x: 50, y: 300 }, data: { label: 'Rafa (Prospecção API)', icon: 'search', color: 'border-b-indigo-500', iconColor: 'bg-indigo-50 text-indigo-600', handleBg: '!bg-indigo-500' } },
  { id: 'dani', type: 'module', position: { x: 400, y: 550 }, data: { label: 'Dani (Deploy Automático)', icon: 'kanban', color: 'border-b-emerald-500', iconColor: 'bg-emerald-50 text-emerald-600', handleBg: '!bg-emerald-500' } },
  { id: 'malu', type: 'module', position: { x: 750, y: 300 }, data: { label: 'Malu (Abordagem ZAP)', icon: 'message', color: 'border-b-orange-500', iconColor: 'bg-orange-50 text-orange-600', handleBg: '!bg-orange-500' } },

  // Eventos Transicionais explicitando as triggers (Listeners)
  { id: 'ev_start', type: 'decision', position: { x: 180, y: 150 }, data: { label: 'Ordem Manual: Iniciar Apify', bg: 'bg-indigo-500' } },
  { id: 'ev_db', type: 'decision', position: { x: 200, y: 440 }, data: { label: 'Trigger: insert on public.leads', bg: 'bg-emerald-500' } },
  { id: 'ev_site', type: 'decision', position: { x: 620, y: 440 }, data: { label: 'Trigger: update site_url', bg: 'bg-orange-500' } },
  { id: 'ev_reuniao', type: 'decision', position: { x: 620, y: 150 }, data: { label: 'Trigger: reuniao_marcada', bg: 'bg-slate-800' } },
];

const flowComunicacaoEdges: Edge[] = [
  // CEO Inicia Processo via comando
  { id: 'c1', source: 'ceo1', sourceHandle: 'left', target: 'ev_start', targetHandle: 'top', type: 'step', style: { stroke: '#6366f1', strokeWidth: 2 } },
  { id: 'c2', source: 'ev_start', sourceHandle: 'bottom', target: 'rafa', targetHandle: 'top', type: 'step', style: { stroke: '#6366f1', strokeWidth: 2 } },

  // Rafa Insere Lead -> Dispara Dani
  { id: 'c3_a', source: 'rafa', sourceHandle: 'right', target: 'db', targetHandle: 'left', type: 'step', style: { stroke: '#10b981', strokeWidth: 2 }, animated: true },
  { id: 'c3_b', source: 'db', sourceHandle: 'bottom', target: 'ev_db', targetHandle: 'right', type: 'step', style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'c4', source: 'ev_db', sourceHandle: 'bottom', target: 'dani', targetHandle: 'left', type: 'step', style: { stroke: '#10b981', strokeWidth: 2 } },

  // Dani Cria Site -> Dispara Malu
  { id: 'c5_a', source: 'dani', sourceHandle: 'top', target: 'db', targetHandle: 'bottom', type: 'step', style: { stroke: '#f59e0b', strokeWidth: 2 }, animated: true },
  { id: 'c5_b', source: 'db', sourceHandle: 'top', target: 'ev_site', targetHandle: 'left', type: 'step', style: { stroke: '#f59e0b', strokeWidth: 2 } },
  { id: 'c6', source: 'ev_site', sourceHandle: 'right', target: 'malu', targetHandle: 'bottom', type: 'step', style: { stroke: '#f59e0b', strokeWidth: 2 } },

  // Malu Agenda -> Notifica CEO
  { id: 'c7_a', source: 'malu', sourceHandle: 'top', target: 'db', targetHandle: 'right', type: 'step', style: { stroke: '#1e293b', strokeWidth: 2 }, animated: true },
  { id: 'c7_b', source: 'db', sourceHandle: 'top', target: 'ev_reuniao', targetHandle: 'bottom', type: 'step', style: { stroke: '#1e293b', strokeWidth: 2 } },
  { id: 'c8', source: 'ev_reuniao', sourceHandle: 'top', target: 'ceo1', targetHandle: 'right', type: 'step', style: { stroke: '#1e293b', strokeWidth: 2 } },
];

// Helper to get specific agent flow
const getAgentFlowNodes = (agentId: string) => {
  switch (agentId) {
    case 'dani':
      return [
        { id: 'agent_rafa', type: 'module', position: { x: 50, y: 50 }, data: { label: 'Rafa (Gerador de DB)', icon: 'search', color: 'border-b-indigo-500', iconColor: 'bg-indigo-50 text-indigo-600', handleBg: '!bg-indigo-500' } },
        { id: 'ev1_in', type: 'decision', position: { x: 250, y: 20 }, data: { label: 'Realtime on public.leads', bg: 'bg-[#10b981]' } },

        { id: 'start', type: 'start', position: { x: 50, y: 250 }, data: {} },
        { id: 'step_1', type: 'module', position: { x: 180, y: 240 }, data: { label: '1 - Extrair Dados do Supabase: Nome, Nicho', icon: 'api', color: 'border-b-[#10b981]', iconColor: 'bg-emerald-50 text-emerald-600', handleBg: '!bg-[#10b981]' } },
        { id: 'step_2', type: 'module', position: { x: 380, y: 240 }, data: { label: '2 - Gerar Promessa Forte (H1)', icon: 'bot', color: 'border-b-[#10b981]', iconColor: 'bg-emerald-50 text-emerald-600', handleBg: '!bg-[#10b981]' } },
        { id: 'step_3', type: 'module', position: { x: 580, y: 240 }, data: { label: '3 - Criar Engine Tailwind + HTML', icon: 'kanban', color: 'border-b-[#10b981]', iconColor: 'bg-emerald-50 text-emerald-600', handleBg: '!bg-[#10b981]' } },
        { id: 'audit', type: 'decision', position: { x: 800, y: 205 }, data: { label: 'Qualidade: Tem Endereço Real e Botão Zap?', bg: 'bg-[#10b981]' } },
        { id: 'step_fallback', type: 'module', position: { x: 690, y: 400 }, data: { label: 'Re-gerar HTML (Retry)', icon: 'bot', color: 'border-b-[#ef4444]', iconColor: 'bg-red-50 text-red-600', handleBg: '!bg-[#ef4444]' } },
        { id: 'ev_out', type: 'decision', position: { x: 1000, y: 205 }, data: { label: 'Upload Bucket & Update site_url', bg: 'bg-[#10b981]' } },
        { id: 'end', type: 'end', position: { x: 1200, y: 245 }, data: { label: 'Dispara Trigger para Malu' } },

        { id: 'agent_malu', type: 'module', position: { x: 1100, y: 400 }, data: { label: 'Malu (Acordada)', icon: 'message', color: 'border-b-orange-500', iconColor: 'bg-orange-50 text-orange-600', handleBg: '!bg-orange-500' } },
      ];
    case 'rafa':
      return [
        { id: 'agent_ceo', type: 'module', position: { x: 50, y: 50 }, data: { label: 'Comando do CEO', icon: 'ceo', color: 'border-b-slate-800', iconColor: 'bg-slate-100 text-slate-800', handleBg: '!bg-slate-800' } },
        { id: 'ev1_in', type: 'decision', position: { x: 250, y: 20 }, data: { label: 'Job de Prospecção Inicializado', bg: 'bg-[#4f46e5]' } },

        { id: 'start', type: 'start', position: { x: 50, y: 250 }, data: {} },
        { id: 'step_1', type: 'module', position: { x: 180, y: 240 }, data: { label: '1 - Lançar Tasks Apify (Google Maps)', icon: 'search', color: 'border-b-[#4f46e5]', iconColor: 'bg-indigo-50 text-indigo-600', handleBg: '!bg-[#4f46e5]' } },
        { id: 'step_2', type: 'module', position: { x: 380, y: 240 }, data: { label: '2 - Bater Razão Social na Receita.WS', icon: 'api', color: 'border-b-[#4f46e5]', iconColor: 'bg-indigo-50 text-indigo-600', handleBg: '!bg-[#4f46e5]' } },
        { id: 'step_3', type: 'module', position: { x: 580, y: 240 }, data: { label: '3 - Cruzamento Receita Federal x Apify', icon: 'kanban', color: 'border-b-[#4f46e5]', iconColor: 'bg-indigo-50 text-indigo-600', handleBg: '!bg-[#4f46e5]' } },
        { id: 'audit', type: 'decision', position: { x: 800, y: 205 }, data: { label: 'Tem Telefone Válido? CNPJ Ativo?', bg: 'bg-[#4f46e5]' } },
        { id: 'step_fallback', type: 'module', position: { x: 690, y: 400 }, data: { label: 'Descartar Lead Defeituoso', icon: 'search', color: 'border-b-slate-500', iconColor: 'bg-slate-50 text-slate-600', handleBg: '!bg-slate-500' } },
        { id: 'ev_out', type: 'decision', position: { x: 1000, y: 205 }, data: { label: 'Insert on public.leads', bg: 'bg-[#4f46e5]' } },
        { id: 'end', type: 'end', position: { x: 1200, y: 245 }, data: { label: 'DB Recebeu Lead' } },

        { id: 'agent_dani', type: 'module', position: { x: 1100, y: 400 }, data: { label: 'Dani (Acordada)', icon: 'kanban', color: 'border-b-emerald-500', iconColor: 'bg-emerald-50 text-emerald-600', handleBg: '!bg-emerald-500' } },
      ];
    case 'malu':
      return [
        { id: 'agent_dani', type: 'module', position: { x: 50, y: 50 }, data: { label: 'Dani (Conclui Deploy)', icon: 'kanban', color: 'border-b-emerald-500', iconColor: 'bg-emerald-50 text-emerald-600', handleBg: '!bg-emerald-500' } },
        { id: 'ev1_in', type: 'decision', position: { x: 250, y: 20 }, data: { label: 'Trigger no site_url', bg: 'bg-[#f59e0b]' } },

        { id: 'start', type: 'start', position: { x: 50, y: 250 }, data: {} },
        { id: 'step_1', type: 'module', position: { x: 180, y: 240 }, data: { label: '1 - Ler Nicho, Nome e Analisar Site Feito', icon: 'search', color: 'border-b-[#f59e0b]', iconColor: 'bg-orange-50 text-orange-600', handleBg: '!bg-[#f59e0b]' } },
        { id: 'step_2', type: 'module', position: { x: 380, y: 240 }, data: { label: '2 - Gerar Resposta Personalizada', icon: 'message', color: 'border-b-[#f59e0b]', iconColor: 'bg-orange-50 text-orange-600', handleBg: '!bg-[#f59e0b]' } },
        { id: 'step_3', type: 'module', position: { x: 580, y: 240 }, data: { label: '3 - Evolution API: Disparar WhatsApp', icon: 'message', color: 'border-b-[#f59e0b]', iconColor: 'bg-orange-50 text-orange-600', handleBg: '!bg-[#f59e0b]' } },
        { id: 'audit', type: 'decision', position: { x: 800, y: 205 }, data: { label: 'Lead Respondeu e Demonstrou Interesse?', bg: 'bg-[#f59e0b]' } },
        { id: 'step_fallback', type: 'module', position: { x: 690, y: 400 }, data: { label: 'Follow up Programado (D+1, D+2)', icon: 'message', color: 'border-b-slate-500', iconColor: 'bg-slate-50 text-slate-600', handleBg: '!bg-slate-500' } },
        { id: 'ev_out', type: 'decision', position: { x: 1000, y: 205 }, data: { label: 'Update DB: status_reuniao = true', bg: 'bg-[#f59e0b]' } },
        { id: 'end', type: 'end', position: { x: 1200, y: 245 }, data: { label: 'Encerrou Passagem' } },

        { id: 'agent_ceo', type: 'module', position: { x: 1100, y: 400 }, data: { label: 'CEO (Call Consultiva)', icon: 'ceo', color: 'border-b-slate-800', iconColor: 'bg-slate-100 text-slate-800', handleBg: '!bg-slate-800' } },
      ];
    case 'jp':
    default:
      return [
        { id: 'agent_malu', type: 'module', position: { x: 50, y: 50 }, data: { label: 'Malu (Respondeu SIM)', icon: 'message', color: 'border-b-orange-500', iconColor: 'bg-orange-50 text-orange-600', handleBg: '!bg-orange-500' } },
        { id: 'ev1_in', type: 'decision', position: { x: 250, y: 20 }, data: { label: 'Webhook (Calendário Marcado)', bg: 'bg-slate-800' } },

        { id: 'start', type: 'start', position: { x: 50, y: 250 }, data: {} },
        { id: 'step_1', type: 'module', position: { x: 180, y: 240 }, data: { label: '1 - Extrair Dados do Lead + Site', icon: 'api', color: 'border-b-slate-800', iconColor: 'bg-slate-100 text-slate-800', handleBg: '!bg-slate-800' } },
        { id: 'step_2', type: 'module', position: { x: 380, y: 240 }, data: { label: '2 - Analisar Dores e Objeções Prévias', icon: 'search', color: 'border-b-slate-800', iconColor: 'bg-slate-100 text-slate-800', handleBg: '!bg-slate-800' } },
        { id: 'step_3', type: 'module', position: { x: 580, y: 240 }, data: { label: '3 - Reunião Consultiva High-Ticket', icon: 'ceo', color: 'border-b-slate-800', iconColor: 'bg-slate-100 text-slate-800', handleBg: '!bg-slate-800' } },
        { id: 'audit', type: 'decision', position: { x: 800, y: 205 }, data: { label: 'Fechou o Negócio e Assinou Contrato?', bg: 'bg-slate-800' } },
        { id: 'step_fallback', type: 'module', position: { x: 690, y: 400 }, data: { label: 'Add Pipeline de Retenção e Desconto', icon: 'ceo', color: 'border-b-orange-500', iconColor: 'bg-orange-50 text-orange-600', handleBg: '!bg-orange-500' } },
        { id: 'ev_out', type: 'decision', position: { x: 1000, y: 205 }, data: { label: 'Mutation: venda_concluida', bg: 'bg-slate-800' } },
        { id: 'end', type: 'end', position: { x: 1200, y: 245 }, data: { label: 'Cliente Ativo' } },
      ];
  }
};

const getAgentFlowEdges = (agentId: string) => {
  // Mesma logica estrutural para todos os agentes individuais (passo a passo)
  const defaultEdges = [
    { id: '1', source: 'start', target: 'ev1_in', type: 'step' },
    { id: '2', source: 'ev1_in', sourceHandle: 'right', target: 'step_1', targetHandle: 'left', type: 'step' },
    { id: '3', source: 'step_1', target: 'step_2', type: 'step' },
    { id: '4', source: 'step_2', target: 'step_3', type: 'step' },
    { id: '5', source: 'step_3', target: 'audit', type: 'step' },

    // Caminho SIM / Sucesso
    { id: '6', source: 'audit', sourceHandle: 'right', target: 'ev_out', targetHandle: 'left', type: 'step', label: 'SIM', labelStyle: { fill: '#10b981', fontWeight: 600, fontSize: 11 }, style: { stroke: '#10b981' } },
    { id: '7', source: 'ev_out', sourceHandle: 'right', target: 'end', targetHandle: 'left', type: 'step' },

    // Caminho NÃO / Falha / Retry
    { id: '8', source: 'audit', sourceHandle: 'bottom', target: 'step_fallback', targetHandle: 'top', type: 'step', label: 'NÃO', labelStyle: { fill: '#ef4444', fontWeight: 600, fontSize: 11 }, style: { stroke: '#ef4444' } },
    { id: '9', source: 'step_fallback', sourceHandle: 'left', target: 'step_1', targetHandle: 'bottom', type: 'step', style: { strokeDasharray: '4 4' }, animated: true },

    // Conexões de Contexto (Torre de IA)
    { id: 'ctx1', source: 'agent_rafa', sourceHandle: 'right', target: 'ev1_in', targetHandle: 'left', animated: true, style: { strokeDasharray: '3 3', stroke: '#cbd5e1' } },
    { id: 'ctx2', source: 'ev_out', sourceHandle: 'bottom', target: 'agent_malu', targetHandle: 'top', animated: true, style: { strokeDasharray: '3 3', stroke: '#cbd5e1' } },

    { id: 'ctx1b', source: 'agent_ceo', sourceHandle: 'right', target: 'ev1_in', targetHandle: 'left', animated: true, style: { strokeDasharray: '3 3', stroke: '#cbd5e1' } },
    { id: 'ctx2b', source: 'ev_out', sourceHandle: 'bottom', target: 'agent_dani', targetHandle: 'top', animated: true, style: { strokeDasharray: '3 3', stroke: '#cbd5e1' } },

    { id: 'ctx1c', source: 'agent_dani', sourceHandle: 'right', target: 'ev1_in', targetHandle: 'left', animated: true, style: { strokeDasharray: '3 3', stroke: '#cbd5e1' } },
    { id: 'ctx2c', source: 'ev_out', sourceHandle: 'bottom', target: 'agent_ceo', targetHandle: 'top', animated: true, style: { strokeDasharray: '3 3', stroke: '#cbd5e1' } },

    { id: 'ctx1d', source: 'agent_malu', sourceHandle: 'right', target: 'ev1_in', targetHandle: 'left', animated: true, style: { strokeDasharray: '3 3', stroke: '#cbd5e1' } },
  ];

  return defaultEdges;
};

// --- INTERNAL COMPONENT (HAS ACCESS TO REACT FLOW HOOKS) ---
function FlowEditor({ flowType, agentId }: { flowType: string, agentId: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  // Switch flow based on state
  useEffect(() => {
    if (flowType === 'portal') {
      setNodes(flowPortalNodes);
      setEdges(flowPortalEdges);
    } else if (flowType === 'comunicacao') {
      setNodes(flowComunicacaoNodes);
      setEdges(flowComunicacaoEdges);
    } else {
      setNodes(getAgentFlowNodes(agentId));
      setEdges(getAgentFlowEdges(agentId));
    }
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [flowType, agentId, setNodes, setEdges, fitView]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, type: 'step', style: { stroke: '#0848AA', strokeWidth: 2 } } as any, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type');
      const label = event.dataTransfer.getData('application/reactflow/label');
      const icon = event.dataTransfer.getData('application/reactflow/icon');

      if (typeof type === 'undefined' || !type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `dndnode_${Date.now()}`,
        type,
        position,
        data: { label, icon },
      };

      setNodes((nds) => nds.concat(newNode));
      toast.success("Módulo adicionado com sucesso!");
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div className="flex h-[750px] border border-border rounded-xl shadow-sm overflow-hidden bg-white">
      {/* SIDEBAR FOR DRAGGING */}
      <div className="w-64 bg-slate-50 border-r border-border p-4 flex flex-col">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-400" /> Ferramentas do S3
        </h3>
        <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
          Arraste as ferramentas para a tela. Selecione um nó e aperte Backspace para deletar.
        </p>
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
          <div
            className="bg-white border border-slate-200 p-3 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] cursor-grab hover:border-indigo-300 transition-colors flex items-center gap-3"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow/type', 'module');
              e.dataTransfer.setData('application/reactflow/label', 'Radar de Leads');
              e.dataTransfer.setData('application/reactflow/icon', 'search');
              e.dataTransfer.effectAllowed = 'move';
            }}
            draggable
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700">Radar</h4>
              <p className="text-[9px] text-slate-500 relative top-0.5">Captador de CNPJ</p>
            </div>
          </div>

          <div
            className="bg-white border border-slate-200 p-3 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] cursor-grab hover:border-indigo-300 transition-colors flex items-center gap-3"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow/type', 'module');
              e.dataTransfer.setData('application/reactflow/label', 'Geração Kabra (Site)');
              e.dataTransfer.setData('application/reactflow/icon', 'kanban');
              e.dataTransfer.effectAllowed = 'move';
            }}
            draggable
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700">Landing Page</h4>
              <p className="text-[9px] text-slate-500 relative top-0.5">Bot criador de LP</p>
            </div>
          </div>

          <div
            className="bg-white border border-slate-200 p-3 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] cursor-grab hover:border-indigo-300 transition-colors flex items-center gap-3"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow/type', 'module');
              e.dataTransfer.setData('application/reactflow/label', 'Apify API + Receita');
              e.dataTransfer.setData('application/reactflow/icon', 'api');
              e.dataTransfer.effectAllowed = 'move';
            }}
            draggable
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700">API Pública</h4>
              <p className="text-[9px] text-slate-500 relative top-0.5">Enriquecimento</p>
            </div>
          </div>

          <div
            className="bg-white border border-slate-200 p-3 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] cursor-grab hover:border-indigo-300 transition-colors flex items-center gap-3"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow/type', 'module');
              e.dataTransfer.setData('application/reactflow/label', 'Abordagem no Zap');
              e.dataTransfer.setData('application/reactflow/icon', 'message');
              e.dataTransfer.effectAllowed = 'move';
            }}
            draggable
          >
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700">WhatsApp Evolution</h4>
              <p className="text-[9px] text-slate-500 relative top-0.5">ZAP Automático</p>
            </div>
          </div>

          <div
            className="bg-white border border-slate-200 p-3 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] cursor-grab hover:border-indigo-300 transition-colors flex items-center gap-3"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow/type', 'module');
              e.dataTransfer.setData('application/reactflow/label', 'Ação Personalizada');
              e.dataTransfer.setData('application/reactflow/icon', 'agent');
              e.dataTransfer.effectAllowed = 'move';
            }}
            draggable
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700">Ação de Agente</h4>
              <p className="text-[9px] text-slate-500 relative top-0.5">Tarefa genérica</p>
            </div>
          </div>

          <div
            className="bg-white border border-slate-200 p-3 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] cursor-grab hover:border-indigo-300 transition-colors flex items-center justify-center"
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow/type', 'decision');
              e.dataTransfer.setData('application/reactflow/label', 'Evento / Desvio');
              e.dataTransfer.effectAllowed = 'move';
            }}
            draggable
          >
            <span className="text-[10px] font-bold text-[#0A58CA]">DECISÃO (Evento Supabase)</span>
          </div>
        </div>
      </div>

      {/* DRAG AND DROP AREA */}
      <div className="flex-1 bg-slate-50 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          attributionPosition="bottom-right"
        >
          <Controls />
          <MiniMap zoomable pannable
            nodeColor={(node) => {
              if (node.type === 'lane') return '#f0f0f0';
              if (node.type === 'decision' || node.type === 'emptyDecision') return '#0A58CA';
              if (node.type === 'module') return '#ffffff';
              if (node.type === 'start') return '#0A58CA';
              if (node.type === 'end') return '#8B0000';
              return '#eee';
            }}
          />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#cbd5e1" />
        </ReactFlow>
      </div>
    </div>
  );
}


// --- POP RENDERER COMPONENT ---
const POPView = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  type ItemType = 'title' | 'intro' | 'section' | 'bullet' | 'text';
  const items: { type: ItemType; content: string; num?: string }[] = [];

  let hasSection = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Numbered Section title (e.g. "1. Prospecção Ativa (O Trigger)")
    const secMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (secMatch) {
      hasSection = true;
      items.push({ type: 'section', num: secMatch[1], content: secMatch[2] });
      return;
    }

    // Bullet: "- Key: description"
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      items.push({ type: 'bullet', content: trimmed.replace(/^[-*]\s+/, '') });
      return;
    }

    // Title line: ALL CAPS or contains "PROCEDIMENTO"
    if (!hasSection && (trimmed === trimmed.toUpperCase() || trimmed.includes('PROCEDIMENTO'))) {
      items.push({ type: 'title', content: trimmed });
      return;
    }

    items.push({ type: hasSection ? 'text' : 'intro', content: trimmed });
  });

  // Renders inline **bold** anywhere in any string
  const renderInline = (content: string): React.ReactNode => {
    // Split on **...** markers
    const parts = content.split(/\*\*(.*?)\*\*/g);
    if (parts.length === 1) {
      // No bold markers — check for "Key: description" pattern at start
      const colonCut = content.match(/^([^:]{2,45}):\s+(.*)/s);
      if (colonCut) return (
        <><strong className="font-semibold text-slate-800">{colonCut[1]}:</strong><span className="text-slate-500"> {colonCut[2].trim()}</span></>
      );
      return <>{content}</>;
    }
    return (
      <>
        {parts.map((part, i) =>
          i % 2 === 1
            ? <strong key={i} className="font-semibold text-slate-800">{part}</strong>
            : <span key={i}>{part}</span>
        )}
      </>
    );
  };


  const sectionColors = [
    'bg-indigo-50 text-indigo-700 border-indigo-200',
    'bg-violet-50 text-violet-700 border-violet-200',
    'bg-sky-50 text-sky-700 border-sky-200',
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'bg-orange-50 text-orange-700 border-orange-200',
  ];
  let sectionIdx = -1;

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm">
      {/* Header accent */}
      <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

      <div className="px-8 py-8 max-w-2xl">
        {items.map((item, idx) => {
          if (item.type === 'title') {
            return (
              <div key={idx} className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">Documento de Agente</span>
                </div>
                <h2 className="text-[15px] font-bold text-slate-900 leading-snug">
                  {item.content}
                </h2>
                <div className="mt-3 h-px bg-slate-100" />
              </div>
            );
          }

          if (item.type === 'intro') {
            return (
              <p key={idx} className="text-[13px] text-slate-500 leading-[1.75] mb-3">
                {renderInline(item.content)}
              </p>
            );
          }

          if (item.type === 'section') {
            sectionIdx = (sectionIdx + 1) % sectionColors.length;
            const colorClass = sectionColors[sectionIdx];
            return (
              <div key={idx} className="mt-7 mb-3">
                {/* Section divider line */}
                {sectionIdx > 0 && <div className="h-px bg-slate-100 mb-5" />}
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-black border ${colorClass}`}>
                    {item.num}
                  </span>
                  <h3 className="text-[14px] font-bold text-slate-800 leading-snug">
                    {renderInline(item.content)}
                  </h3>
                </div>
              </div>
            );
          }

          if (item.type === 'bullet') {
            return (
              <div key={idx} className="flex items-start gap-2.5 py-1.5 pl-8 group">
                <span className="mt-[7px] w-[4px] h-[4px] rounded-full bg-slate-300 shrink-0 group-hover:bg-indigo-400 transition-colors" />
                <p className="leading-[1.7] text-[13px]">
                  {renderInline(item.content)}
                </p>
              </div>
            );
          }

          if (item.type === 'text') {
            return (
              <p key={idx} className="text-[13px] text-slate-500 leading-[1.7] pl-8 mb-1">
                {renderInline(item.content)}
              </p>
            );
          }

          return null;
        })}

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Processo Validado
          </span>
          <span className="text-[11px] text-slate-300 font-mono tracking-wider">S3 MÍDIA · 2024</span>
        </div>
      </div>
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---
export default function TreinamentoIAPage() {
  const [agents, setAgents] = useState([
    {
      id: 'jp',
      name: 'João Paulo',
      role: 'Estratégia & CEO',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=CEO&backgroundColor=f3f4f6',
      tasks: `PROCEDIMENTO OPERACIONAL PADRÃO (POP) - JOÃO PAULO (CEO)

Objetivo Primário: Orquestrar a torre de agentes e realizar calls consultivas de alto valor (High-Ticket) para fechamento de vendas.

Passo a Passo de Execução:
1. ORQUESTRAÇÃO MACRO: Monitorar a saúde do funil de vendas, ordenando o Rafa (Prospecção) a alterar nichos de busca quando o funil estiver vazio.
2. REVISÃO DE MATURIDADE: Antes de qualquer call com o Lead, exigir que a Dani já tenha feito o deploy do Site com domínio propagado em homologação.
3. PREPARAÇÃO PARA REUNIÃO: Acordar a partir do evento "reuniao_agendada" disparado pela Malu. Revisar o dossiê do Lead, incluindo as informações da Receita Federal (encontradas pelo Rafa) e o design criado (pela Dani).
4. REUNIÃO DE FECHAMENTO (CALL): Conduzir a call vendendo o ecosistema de performance. Não vender apenas um site, e sim a "Máquina de Vendas" ou Batalhão de IA.
5. CONVERSÃO: Disparar o evento final alterando o lead para a coluna "venda_concluida" (ou equivalente) ao fechar o contrato. Em caso de objeção de preço, encaminhar para "Follow-Up".`,
    },
    {
      id: 'rafa',
      name: 'Rafa',
      role: 'Marketing & Prospecção Fria',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Rafa&backgroundColor=e0e7ff',
      tasks: `PROCEDIMENTO OPERACIONAL PADRÃO (POP) - RAFA (PROSPECÇÃO)

Objetivo Primário: Alimentar o Topo do Funil prospectando na internet, enriquecendo dados na Receita Federal.

Passo a Passo de Execução:
1. INICIAR BUSCAS: Ao receber ordem do CEO, identificar nicho e localização. Usar a ferramenta "start_prospecting" para vasculhar Google Maps (Actor Apify).
2. ENRIQUECIMENTO DE DADOS (CRUZAMENTO): Para cada CNPJ encontrado, cruzar automaticamente as informações consumindo a API da Receita Federal/ReceitaWS.
3. AUDITORIA DOS SÓCIOS: Acionar ferramenta de "deep_research" se necessário para buscar informações mais intrínsecas (Quadro Societário, Endereço Fiscal, Porte da Empresa).
4. CONTROLE DE QUALIDADE (FILTRO): Um lead deve ser imediatamente DESCARTADO se não possuir: (a) CNPJ "Ativo" e (b) Número de celular formatado corretamente para WhatsApp.
5. HANDOFF PARA O BANCO: Inserir todos os leads qualificados no Supabase (coluna Novo), disparando o evento que acorda a agente de Deploy (Dani).`,
    },
    {
      id: 'dani',
      name: 'Dani',
      role: 'Geração de Landing Pages (Deploy)',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Dani&backgroundColor=d1fae5',
      tasks: `PROCEDIMENTO OPERACIONAL PADRÃO (POP) - DANI (DEPLOY)

Objetivo Primário: Construir páginas HTML/Tailwind altamente personalizadas por lead (Kabra-Sites) de forma supersônica.

Passo a Passo de Execução:
1. TRIGGER DE INÍCIO: Escutar ativamente o banco de dados. Ao notar um novo lead inserido ("kanban_ready"), iniciar a ação em no máximo 2 minutos.
2. ANÁLISE DE CONTEXTO: Analisar o nome da empresa e o Nicho providos pelo Rafa. Definir imediatamente a Promessa Forte (Copy de H1) focada apenas nas "dores" daquele negócio específico.
3. CONSTRUÇÃO TÉCNICA: Acionar a ferramenta "generate_landing_page". Você vai codificar o corpo principal em HTML usando TailwindCSS.
4. REGRAS DE LAYOUT MANDATÓRIAS:
   - Header: Logotipo elegante e Tipografia forte.
   - Body: Incluir blocos para "Benefícios", "Sobre nós" (usando dados da Receita) e "Depoimentos" coerentes.
   - Footer / CTA: Endereço completo da empresa, e a injeção inegociável do "Botão Flutuante de WhatsApp" linkado ao comercial deles.
5. FINALIZAÇÃO E HANDOFF: Efetuar o upload da página gerada, registrar a "site_url" oficial e notificar a Malu que a armadilha está montada e ela pode começar o ataque.`,
    },
    {
      id: 'malu',
      name: 'Malu',
      role: 'Atendimento Omnichannel & Conversão',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Malu&backgroundColor=ffedd5',
      tasks: `PROCEDIMENTO OPERACIONAL PADRÃO (POP) - MALU (CONVERSÃO)

Objetivo Primário: Invadir a caixa de mensagens (WhatsApp) do lead com máxima empatia e táticas de conversão, enviando o site criado pela Dani.

Passo a Passo de Execução:
1. TRIGGER DE INÍCIO: Acordar imediatamente após a Dani carimbar a "site_url" no lead.
2. PREPARAÇÃO MENTAL: Absorver o Dossiê: quem é o lead, de qual cidade ele é (para criar sintonia usando gírias/cultura local sutil) e ver como ficou o site da Dani.
3. ABORDAGEM DE QUEBRA-GELO: Acionar a ferramenta "send_whatsapp_message". Sair do clichê corporativo! Se usar WhatsApp, configurar para enviar indicação de "comprising" (simular digitando) ou "recording" (áudio) de 5 a 8 segundos.
4. O SCRIPT DA ENTREGA:
   - Informar sutilmente que você é da agência e que vocês "tomaram a liberdade de criar um portal/site 100% novo para eles, de presente".
   - Enviar a URL "site_url" de forma limpa.
5. ROTINA DE RESPOSTA E AGENDAMENTO:
   - Se o lead não responder na hora, agendar ping (Follow-up) para o próximo ciclo (D+1, D+2).
   - Se o lead amar e quiser "saber custos", aplicar gatilho de curiosidade, não passando o preço por zap, e sim emitindo o status de "reuniao_agendada" repassando quente para o João Paulo (CEO) fechar no detalhe.`,
    }
  ]);

  const [activeAgentId, setActiveAgentId] = useState('jp');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [flowType, setFlowType] = useState<'portal' | 'comunicacao' | 'individual'>('portal');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd, value } = textareaRef.current;

    const selectedText = value.substring(selectionStart, selectionEnd);
    const beforeText = value.substring(0, selectionStart);
    const afterText = value.substring(selectionEnd);

    const newText = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`;
    updateActiveAgentTasks(newText);

    // Devolve foco e ajusta seleção
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorShift = prefix.length;
        textareaRef.current.setSelectionRange(
          selectionStart + cursorShift,
          selectionEnd + cursorShift
        );
      }
    }, 0);
  };

  const addList = () => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd, value } = textareaRef.current;

    const selectedText = value.substring(selectionStart, selectionEnd);
    const beforeText = value.substring(0, selectionStart);
    const afterText = value.substring(selectionEnd);

    // Se múltiplas linhas, adiciona traço em cada uma
    const lines = selectedText.split('\n');
    const formattedLines = lines.map(line => line.startsWith('- ') ? line : `- ${line}`).join('\n');

    const newText = `${beforeText}${formattedLines}${afterText}`;
    updateActiveAgentTasks(newText);
  };

  useEffect(() => {
    async function fetchConfigs() {
      const { data, error } = await supabase.from('agent_configs').select('*');
      if (error) {
        console.error('Error fetching agent configs:', error);
        return;
      }
      if (data && data.length > 0) {
        setAgents(prevAgents => prevAgents.map(ag => {
          const config = data.find(c => c.agent_id === ag.id);
          return config ? { ...ag, tasks: config.tasks } : ag;
        }));
      }
    }
    fetchConfigs();
  }, []);

  const activeAgent = agents.find(a => a.id === activeAgentId) || agents[0];

  const updateActiveAgentTasks = (newTasks: string) => {
    setAgents(prev => prev.map(a => a.id === activeAgentId ? { ...a, tasks: newTasks } : a));
  };

  const handleOptimizeWithAI = async () => {
    setIsOptimizing(true);
    try {
      const optimizedText = await optimizePOPWithAI(activeAgent.id, activeAgent.tasks);
      updateActiveAgentTasks(optimizedText);
      toast.success("POP otimizado pela Inteligência Artificial!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao otimizar o POP.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSavePOP = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('agent_configs').upsert({
        agent_id: activeAgent.id,
        tasks: activeAgent.tasks,
        updated_at: new Date().toISOString()
      }, { onConflict: 'agent_id' });

      if (error) throw error;
      toast.success('POP salvo com sucesso!');
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar o POP: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[100vh] bg-background overflow-hidden relative">
      <div className="px-6 py-3 border-b border-border bg-card shrink-0 shadow-sm z-10 flex items-center justify-between">
        <span className="text-base font-semibold text-foreground">Painel / Central de Treinamento Omnichannel</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24">

        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-2">
            <Brain className="w-7 h-7 text-[hsl(265,85%,65%)]" /> Configuração da Arquitetura Mestre
          </h1>
          <p className="text-sm text-muted-foreground">Defina as responsabilidades dos agentes em um modelo Omnichannel Orientado a Eventos.</p>
        </div>

        {/* TABS FOR SELECTING AGENT */}
        <div className="flex items-center gap-2 border-b border-border mb-4 overflow-x-auto">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => { setActiveAgentId(agent.id); setIsEditing(false); }}
              className={`px-5 py-3 text-sm font-semibold transition-all border-b-[3px] whitespace-nowrap flex items-center gap-2 ${activeAgentId === agent.id
                ? 'border-[hsl(265,85%,60%)] text-[hsl(265,85%,60%)]'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
            >
              <img src={agent.avatar} alt="avatar" className="w-6 h-6 rounded-full border border-slate-200" />
              {agent.name}
            </button>
          ))}
        </div>

        {/* ACTIVE AGENT CARD */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <img src={activeAgent.avatar} alt={activeAgent.name} className="w-16 h-16 rounded-2xl border-2 border-slate-200 shadow-sm bg-slate-50" />
              <div>
                <h3 className="text-xl font-bold text-foreground leading-tight">{activeAgent.name}</h3>
                <p className="text-sm text-foreground/70 font-medium">{activeAgent.role}</p>
              </div>
            </div>
            <button
              onClick={handleSavePOP}
              disabled={isSaving}
              className={`text-sm px-4 py-2 font-semibold rounded-md transition-colors flex items-center gap-2 ${isEditing ? 'bg-green-600 text-white hover:bg-green-700 shadow-md' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'} disabled:opacity-50`}
            >
              {isEditing ? <>{isSaving ? 'Salvando...' : <><Check className="w-4 h-4" /> Salvar POP</>}</> : 'Editar POP'}
            </button>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-500" /> PROCESSO OPERACIONAL PADRÃO (POP)
                </label>
                <p className="text-xs text-slate-500 mt-1">Refine os comandos para garantir uma execução perfeita da IA.</p>
              </div>
            </div>

            <div className="relative group border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
              {/* TOOLBAR PREMIUM */}
              {isEditing && (
                <div className="bg-slate-50/50 backdrop-blur-sm border-b border-slate-100 p-2.5 flex flex-wrap items-center justify-between gap-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => applyFormatting('**', '**')}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all active:scale-95"
                      title="Negrito (Ctrl+B)"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyFormatting('*', '*')}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all active:scale-95"
                      title="Itálico (Ctrl+I)"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button
                      onClick={addList}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-lg transition-all active:scale-95"
                      title="Lista com Marcadores"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleOptimizeWithAI}
                    disabled={isOptimizing}
                    className="group relative flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] text-white px-5 py-2.5 rounded-xl hover:bg-right transition-all duration-500 disabled:opacity-50 overflow-hidden shadow-indigo-100 shadow-lg active:scale-95"
                  >
                    {isOptimizing ? (
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Sintonizando IA...</span>
                      </span>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        <span>Otimizar com Inteligência Artificial</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {isEditing ? (
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={activeAgent.tasks}
                    onChange={(e) => updateActiveAgentTasks(e.target.value)}
                    disabled={isOptimizing}
                    placeholder="Diga à IA o que ela deve priorizar..."
                    className={`w-full min-h-[400px] p-6 text-sm bg-white border-0 focus:ring-0 outline-none resize-y text-slate-700 font-mono leading-relaxed transition-all selection:bg-indigo-100 ${isOptimizing ? 'opacity-40 grayscale blur-[1px]' : ''}`}
                  />
                  {isOptimizing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-indigo-100 flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                        <div className="relative">
                          <Wand2 className="w-10 h-10 text-indigo-600 animate-pulse" />
                          <div className="absolute -inset-2 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                        </div>
                        <span className="text-xs font-bold text-indigo-900 tracking-wider">REDEFININDO LOGICA...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <POPView text={activeAgent.tasks} />
              )}
            </div>
          </div>
        </div>

        {/* React Flow View Selector & Editor Covered in Provider */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-1">
                <GitCompareArrows className="w-6 h-6 text-[#0848AA]" /> Visualização de Fluxos da Torre
              </h2>
              <p className="text-sm text-muted-foreground">Analise as responsabilidades estruturais de cada passo da orquestração.</p>
            </div>

            {/* Dropdown/Buttons selector */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200 shrink-0">
              <button onClick={() => setFlowType('portal')} className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${flowType === 'portal' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}>
                Geral do Portal
              </button>
              <button onClick={() => setFlowType('comunicacao')} className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${flowType === 'comunicacao' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}>
                Eventos entre Agentes
              </button>
              <button onClick={() => setFlowType('individual')} className={`px-4 py-2 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${flowType === 'individual' ? 'bg-white shadow-sm text-orange-700' : 'text-slate-500 hover:text-slate-800'}`}>
                <img src={activeAgent.avatar} className="w-4 h-4 rounded-full border border-slate-200" alt="avatar" />
                Operacional do {activeAgent.name.split(' ')[0]}
              </button>
            </div>
          </div>

          <ReactFlowProvider>
            <FlowEditor flowType={flowType} agentId={activeAgentId} />
          </ReactFlowProvider>
        </div>

      </div>
    </div>
  );
}
