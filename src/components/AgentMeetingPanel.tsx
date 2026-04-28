
import React, { useEffect, useState, useRef } from 'react';
import { Bot, MessageSquare, Activity, X, Users, MessageCircle, Zap } from 'lucide-react';
import { AGENT_PERSONAS } from '../lib/agentIntelligence';

interface MeetingMessage {
  agent: string;
  name: string;
  content: string;
  avatar: string;
  color: string;
}

interface AgentMeetingPanelProps {
  messages: MeetingMessage[];
  isLoading: boolean;
  onClose: () => void;
  topic: string;
  onSendMessage?: (message: string) => void;
}

export default function AgentMeetingPanel({ messages, isLoading, onClose, topic, onSendMessage }: AgentMeetingPanelProps) {
  const [userInput, setUserInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() && onSendMessage) {
      onSendMessage(userInput);
      setUserInput("");
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-900/98 backdrop-blur-2xl flex flex-col animate-in fade-in duration-500 overflow-hidden rounded-[2.5rem]">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight uppercase">Sala de Deliberação</h2>
            <div className="flex items-center gap-2 text-[10px] text-indigo-300/70 font-bold tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              REUNIÃO ESTRATÉGICA ATIVA
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Topic Banner */}
      <div className="px-5 py-3 bg-indigo-600/5 border-b border-indigo-500/10">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-4 h-4 text-indigo-400 opacity-70" />
          <p className="text-xs font-bold text-indigo-200/80 italic line-clamp-1">
            "{topic}"
          </p>
        </div>
      </div>

      {/* Conference Grid (Avatars) - Compacted */}
      <div className="p-4 grid grid-cols-4 md:grid-cols-7 gap-3 bg-black/40 border-b border-white/5">
        {Object.values(AGENT_PERSONAS).map(agent => {
          const isSpeaking = messages.length > 0 && messages[messages.length - 1].agent === agent.id;
          return (
            <div 
              key={agent.id}
              className={`p-2 rounded-xl border transition-all duration-500 flex flex-col items-center gap-1.5 ${
                isSpeaking 
                  ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] scale-105' 
                  : 'bg-white/5 border-white/10 opacity-40'
              }`}
            >
              <div className="relative">
                <img 
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${agent.name}&backgroundColor=f8fafc`} 
                  className="w-10 h-10 rounded-full border border-white/10"
                  alt={agent.name}
                />
                {isSpeaking && (
                   <div className="absolute -bottom-1 -right-1 bg-indigo-500 p-1 rounded-full shadow-lg">
                      <Activity className="w-2 h-2 text-white animate-pulse" />
                   </div>
                )}
              </div>
              <span className="text-[8px] font-black text-white/70 uppercase truncate w-full text-center">
                {agent.name.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Discussion Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10"
      >
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
             <Bot className="w-10 h-10" />
             <p className="text-xs font-bold uppercase tracking-widest">Aguardando início...</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div 
            key={i} 
            className="flex gap-4 animate-in slide-in-from-bottom-2 duration-500"
          >
            <div className="shrink-0">
               <img src={msg.avatar} className="w-8 h-8 rounded-lg border border-white/10 shadow-lg" />
            </div>
            <div className="flex-1 space-y-1">
               <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${msg.color}`}>{msg.name}</span>
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[8px] text-slate-500 uppercase font-black">S3-INTEL</span>
               </div>
               <div className="text-slate-200 text-xs leading-relaxed bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5 shadow-inner">
                  {msg.content}
               </div>
            </div>
          </div>
        ))}

        {isLoading && (
           <div className="flex gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-white/5" />
              <div className="flex-1 space-y-2">
                 <div className="h-2 w-20 bg-white/10 rounded" />
                 <div className="h-10 w-full bg-white/5 rounded-2xl" />
              </div>
           </div>
        )}
      </div>

      {/* Interaction Footer */}
      <div className="p-5 bg-black/40 border-t border-white/10">
         <form onSubmit={handleSubmit} className="flex gap-3">
            <input 
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isLoading}
              placeholder="Dê uma ordem ou tire uma dúvida..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-0 transition-all font-medium"
            />
            <button 
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase">Enviar</span>
            </button>
         </form>
         <div className="mt-4 flex items-center justify-between opacity-30">
            <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 tracking-[0.2em] uppercase">
               <Bot className="w-3 h-3" />
               S3 Intelligence Kernel v2.5
            </div>
            <div className="text-[8px] font-black text-indigo-400 tracking-[0.2em] uppercase">
               Ready for Command
            </div>
         </div>
      </div>
    </div>
  );
}
