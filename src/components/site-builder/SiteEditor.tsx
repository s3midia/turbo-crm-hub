import React, { useState } from 'react';
import { SectionRenderer } from './SectionRenderer';
import { editSection } from '@/lib/skills/siteSkills';
import type { SiteTemplate, FilledSlots } from '@/lib/templates/types';
import type { OrchestrationResult } from '@/lib/skills/siteOrchestrator';
import {
  Eye, Edit3, Send, Loader2, Undo2, Monitor, Smartphone,
  Save, Download, Sparkles, BarChart3, Layers, ChevronRight,
  MousePointer2, MessageSquare, Palette,
} from 'lucide-react';

interface Props {
  template: SiteTemplate;
  result: OrchestrationResult;
  onSave?: (slots: FilledSlots) => void;
  onExportHtml?: () => void;
}

type EditorPanel = 'sections' | 'chat' | 'colors';

export function SiteEditor({ template, result, onSave, onExportHtml }: Props) {
  const [filledSlots, setFilledSlots] = useState<FilledSlots>(structuredClone(result.filledSlots));
  const [colors, setColors] = useState(result.colors);
  const [editMode, setEditMode] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [history, setHistory] = useState<{ slots: FilledSlots; colors: typeof result.colors }[]>([]);
  const [panel, setPanel] = useState<EditorPanel>('sections');

  // Chat IA state
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [targetSection, setTargetSection] = useState<string>(template.sections[0]?.id || '');
  const [aiEditsUsed, setAiEditsUsed] = useState(0);

  const pushHistory = () => {
    setHistory(h => [...h.slice(-19), { slots: structuredClone(filledSlots), colors: { ...colors } }]);
  };

  const handleSlotChange = (sectionId: string, key: string, value: any) => {
    pushHistory();
    setFilledSlots(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [key]: value },
    }));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFilledSlots(prev.slots);
    setColors(prev.colors);
    setHistory(h => h.slice(0, -1));
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatHistory(h => [...h, { role: 'user', text: msg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      pushHistory();
      const current = filledSlots[targetSection] || {};
      const res = await editSection(current, msg);
      setFilledSlots(prev => ({
        ...prev,
        [targetSection]: { ...prev[targetSection], ...res.data },
      }));
      setAiEditsUsed(n => n + 1);
      setChatHistory(h => [...h, { role: 'ai', text: `Seção "${targetSection}" atualizada com sucesso.` }]);
    } catch (e: any) {
      setChatHistory(h => [...h, { role: 'ai', text: `Erro: ${e.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const PANEL_TABS = [
    { id: 'sections' as EditorPanel, icon: Layers,        label: 'Seções' },
    { id: 'chat'     as EditorPanel, icon: MessageSquare,  label: 'Chat IA' },
    { id: 'colors'   as EditorPanel, icon: Palette,        label: 'Cores' },
  ];

  return (
    <div className="flex flex-col h-full bg-wa-bg-main">

      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-wa-surface border-b border-wa-border shrink-0">
        <div className="flex items-center gap-2">
          {/* Edit / Preview toggle */}
          <button
            onClick={() => setEditMode(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              editMode ? 'bg-blue-500 text-white' : 'bg-wa-bg-subtle text-wa-text-muted hover:text-wa-text-main'
            }`}
          >
            {editMode ? <MousePointer2 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {editMode ? 'Editar (clique nos textos)' : 'Visualizar'}
          </button>

          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Desfazer (Ctrl+Z)"
            className="p-2 rounded-lg text-wa-text-muted hover:bg-wa-bg-subtle disabled:opacity-30 transition-colors"
          >
            <Undo2 className="h-4 w-4" />
          </button>

          {/* Viewport toggle */}
          <div className="flex bg-wa-bg-subtle rounded-lg p-0.5 border border-wa-border">
            <button onClick={() => setViewport('desktop')} className={`p-1.5 rounded ${viewport === 'desktop' ? 'bg-white shadow-sm' : ''}`} title="Desktop">
              <Monitor className="h-4 w-4" />
            </button>
            <button onClick={() => setViewport('mobile')} className={`p-1.5 rounded ${viewport === 'mobile' ? 'bg-white shadow-sm' : ''}`} title="Mobile">
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-wa-text-muted mr-2">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>~{result.stats.totalTokens} tokens · {result.stats.timeMs}ms</span>
            {result.stats.cachedCalls > 0 && (
              <span className="text-green-500 font-medium">({result.stats.cachedCalls} cache)</span>
            )}
          </div>

          <button
            onClick={() => onSave?.(filledSlots)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            <Save className="h-4 w-4" /> Salvar
          </button>

          <button
            onClick={onExportHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-wa-bg-subtle text-wa-text-muted hover:bg-wa-bg-subtle/80 border border-wa-border transition-colors"
          >
            <Download className="h-4 w-4" /> HTML
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel ──────────────────────────────────── */}
        <div className="w-72 border-r border-wa-border bg-wa-surface flex flex-col shrink-0">
          {/* Panel tabs */}
          <div className="flex border-b border-wa-border">
            {PANEL_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setPanel(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  panel === tab.id ? 'border-b-2 border-primary text-primary' : 'text-wa-text-muted hover:text-wa-text-main'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Panel: Sections ── */}
          {panel === 'sections' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="text-[11px] text-wa-text-muted px-2 mb-3 leading-tight">
                {editMode
                  ? 'Modo edição ativo — clique em qualquer texto no preview para editar diretamente.'
                  : 'Ative o modo edição na toolbar para editar textos clicando neles.'}
              </p>
              {template.sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => { setTargetSection(section.id); setPanel('chat'); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm hover:bg-wa-bg-subtle transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="capitalize text-wa-text-main font-medium">{section.id}</span>
                    <span className="text-[10px] text-wa-text-muted capitalize">({section.type})</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-wa-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {/* ── Panel: Chat IA ── */}
          {panel === 'chat' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Section selector */}
              <div className="px-3 pt-3 pb-2 border-b border-wa-border">
                <label className="text-[11px] text-wa-text-muted mb-1 block font-medium">Seção alvo</label>
                <select
                  value={targetSection}
                  onChange={e => setTargetSection(e.target.value)}
                  className="w-full text-sm px-2 py-1.5 rounded-lg bg-wa-bg-subtle border border-wa-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {template.sections.map(s => (
                    <option key={s.id} value={s.id}>{s.id} ({s.type})</option>
                  ))}
                </select>
                <p className="text-[10px] text-wa-text-muted mt-1">Edições IA: {aiEditsUsed}/50</p>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatHistory.length === 0 && (
                  <div className="space-y-2 pt-4">
                    <p className="text-[11px] text-wa-text-muted text-center font-medium">Exemplos de instrução:</p>
                    {[
                      'Mude o título para algo mais impactante',
                      'Adicione um serviço de consultoria',
                      'Reescreva o texto sobre a empresa mais formal',
                      'Altere o CTA para urgência maior',
                    ].map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setChatInput(ex)}
                        className="block w-full text-left text-[11px] p-2 rounded-lg bg-wa-bg-subtle hover:bg-primary/5 text-wa-text-muted hover:text-primary transition-colors"
                      >
                        "{ex}"
                      </button>
                    ))}
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white ml-4'
                      : 'bg-wa-bg-subtle text-wa-text-main mr-4'
                  }`}>
                    {msg.text}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs text-wa-text-muted mr-4 p-2.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Editando...
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-wa-border">
                <div className="flex gap-2">
                  <textarea
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit(); } }}
                    placeholder="Instrução para a IA... (Enter para enviar)"
                    rows={2}
                    className="flex-1 text-xs px-3 py-2 rounded-lg bg-wa-bg-subtle border border-wa-border focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={handleChatSubmit}
                    disabled={chatLoading || !chatInput.trim()}
                    className="self-end p-2 rounded-lg bg-primary text-white disabled:opacity-40 transition-opacity"
                  >
                    {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-wa-text-muted mt-1.5">Shift+Enter para nova linha · Enter para enviar</p>
              </div>
            </div>
          )}

          {/* ── Panel: Cores ── */}
          {panel === 'colors' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <p className="text-[11px] text-wa-text-muted leading-tight">
                Altere as cores do site. As mudanças são aplicadas em tempo real no preview.
              </p>
              {[
                { key: 'primary', label: 'Cor Primária', desc: 'Botões, títulos, destaques' },
                { key: 'secondary', label: 'Cor Secundária', desc: 'Fundos, bordas, detalhes' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-wa-text-main">{label}</p>
                    <p className="text-[11px] text-wa-text-muted">{desc}</p>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-xl shadow-md ring-2 ring-wa-border group-hover:ring-primary transition-all"
                        style={{ backgroundColor: colors[key as 'primary' | 'secondary'] }}
                      />
                      <input
                        type="color"
                        value={colors[key as 'primary' | 'secondary']}
                        onChange={e => {
                          pushHistory();
                          setColors(c => ({ ...c, [key]: e.target.value }));
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <div>
                      <p className="font-mono text-sm text-wa-text-main">{colors[key as 'primary' | 'secondary']}</p>
                      <p className="text-[10px] text-wa-text-muted">Clique para alterar</p>
                    </div>
                  </label>

                  {/* Presets rápidos */}
                  <div className="flex gap-2 flex-wrap">
                    {['#ea580c', '#2563eb', '#16a34a', '#9333ea', '#b45309', '#0ea5e9', '#dc2626', '#475569'].map(preset => (
                      <button
                        key={preset}
                        onClick={() => { pushHistory(); setColors(c => ({ ...c, [key]: preset })); }}
                        className="w-7 h-7 rounded-lg shadow-sm ring-1 ring-wa-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: preset }}
                        title={preset}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Preview */}
              <div className="p-4 rounded-xl border border-wa-border space-y-2">
                <p className="text-[11px] text-wa-text-muted font-medium">Preview</p>
                <div className="h-8 rounded-lg" style={{ backgroundColor: colors.primary }} />
                <div className="h-8 rounded-lg" style={{ backgroundColor: colors.secondary }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Preview ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-gray-200 flex justify-center">
          <div className={`bg-white shadow-2xl transition-all duration-300 ${viewport === 'mobile' ? 'max-w-[390px] my-6 rounded-2xl overflow-hidden' : 'w-full'}`}>
            <SectionRenderer
              template={template}
              filledSlots={filledSlots}
              colors={colors}
              editMode={editMode}
              onSlotChange={handleSlotChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
