import React, { useEffect, useRef, useState } from 'react';
import { X, Bold, Italic, Link as LinkIcon, Link2Off, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, Trash2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorEditorModal } from './ColorEditorModal';

interface Props {
  open: boolean;
  initialHtml: string;
  rootColor: string;
  rootBgColor?: string;
  brandColors: { primary: string; secondary: string };
  elementTag?: string;
  onClose: () => void;
  onSave: (html: string, rootColor: string, rootBg: string) => void;
  onDelete?: () => void;
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.innerText;
}

export function EditParagraphModal({
  open,
  initialHtml,
  rootColor,
  rootBgColor,
  brandColors,
  elementTag = 'p',
  onClose,
  onSave,
  onDelete,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(initialHtml);
  const [currentRootColor, setCurrentRootColor] = useState(rootColor);
  const [currentRootBg, setCurrentRootBg] = useState(rootBgColor || 'transparent');
  const [colorEditorOpen, setColorEditorOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setHtml(initialHtml);
      setCurrentRootColor(rootColor);
      setCurrentRootBg(rootBgColor || 'transparent');
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = initialHtml;
          editorRef.current.focus();
        }
      }, 50);
    }
  }, [open, initialHtml, rootColor, rootBgColor]);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    syncFromDom();
    editorRef.current?.focus();
  };

  const syncFromDom = () => {
    if (editorRef.current) setHtml(editorRef.current.innerHTML);
  };

  const setAlign = (a: 'left' | 'center' | 'right' | 'justify') =>
    exec('justify' + a.charAt(0).toUpperCase() + a.slice(1));

  const handleLink = () => {
    const url = prompt('URL do link:');
    if (url) exec('createLink', url);
  };

  const handleClearAlign = () => {
    setAlign('left');
  };

  if (!open) return null;

  const charCount = stripHtml(html).length;

  return (
    <>
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="p-6 space-y-5">
            {/* HEADER */}
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Type className="h-5 w-5" /> Editar Parágrafo
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ORIGINAL */}
            <div>
              <div className="text-xs text-gray-500 mb-1.5">Texto original:</div>
              <div className="p-3 rounded-xl bg-gray-50 text-sm text-gray-700 max-h-24 overflow-hidden line-clamp-3"
                   dangerouslySetInnerHTML={{ __html: initialHtml }} />
            </div>

            {/* NOVO TEXTO */}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">Novo texto:</div>

              {/* TOOLBAR */}
              <div className="flex items-center gap-1 p-2 rounded-xl bg-gray-50 border border-gray-200">
                <button onClick={() => exec('bold')} className="h-8 w-8 rounded-lg border-2 border-blue-500 flex items-center justify-center hover:bg-blue-50">
                  <Bold className="h-4 w-4" />
                </button>
                <button onClick={() => exec('italic')} className="h-8 w-8 rounded-lg hover:bg-gray-200 flex items-center justify-center">
                  <Italic className="h-4 w-4" />
                </button>
                <span className="w-px h-5 bg-gray-300 mx-1" />
                <button onClick={handleLink} className="h-8 w-8 rounded-lg hover:bg-gray-200 flex items-center justify-center">
                  <LinkIcon className="h-4 w-4" />
                </button>
                <button onClick={() => exec('unlink')} className="h-8 w-8 rounded-lg hover:bg-gray-200 flex items-center justify-center">
                  <Link2Off className="h-4 w-4" />
                </button>
              </div>

              {/* ALIGN */}
              <div className="flex items-center gap-3 px-1">
                <span className="text-sm text-gray-500">Alinhamento:</span>
                <div className="flex gap-1 p-1 rounded-lg bg-gray-50 border border-gray-200">
                  <button onClick={() => setAlign('left')} className="h-8 w-8 rounded bg-blue-500 text-white flex items-center justify-center">
                    <AlignLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setAlign('center')} className="h-8 w-8 rounded hover:bg-gray-200 flex items-center justify-center">
                    <AlignCenter className="h-4 w-4" />
                  </button>
                  <button onClick={() => setAlign('right')} className="h-8 w-8 rounded hover:bg-gray-200 flex items-center justify-center">
                    <AlignRight className="h-4 w-4" />
                  </button>
                  <button onClick={() => setAlign('justify')} className="h-8 w-8 rounded hover:bg-gray-200 flex items-center justify-center">
                    <AlignJustify className="h-4 w-4" />
                  </button>
                </div>
                <button onClick={handleClearAlign} className="text-sm text-gray-500 underline hover:text-gray-700">Limpar</button>
              </div>

              {/* CONTENT EDITABLE */}
              <div
                ref={editorRef}
                contentEditable
                onInput={syncFromDom}
                className="min-h-[140px] p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                style={{ color: currentRootColor, backgroundColor: currentRootBg === 'transparent' ? undefined : currentRootBg }}
              />

              <div className="text-right text-xs text-gray-500">{charCount} caracteres</div>
            </div>

            {/* COR */}
            <button
              type="button"
              onClick={() => setColorEditorOpen(true)}
              className="w-full p-3 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-medium text-gray-700 transition-colors"
            >
              <Palette className="h-4 w-4" /> Editar cores deste texto
            </button>

            {/* ACTIONS */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1 h-11">Cancelar</Button>
              <Button onClick={() => onSave(html, currentRootColor, currentRootBg)} className="flex-1 h-11 font-bold">Salvar</Button>
            </div>

            {onDelete && (
              <button
                onClick={() => { if (confirm('Excluir este bloco?')) { onDelete(); onClose(); } }}
                className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 pt-2"
              >
                <Trash2 className="h-4 w-4" /> Excluir este bloco
              </button>
            )}
          </div>
        </div>
      </div>

      <ColorEditorModal
        open={colorEditorOpen}
        html={html}
        rootColor={currentRootColor}
        rootBgColor={currentRootBg}
        brandColors={brandColors}
        elementTag={elementTag}
        elementLabel={stripHtml(html)}
        onClose={() => setColorEditorOpen(false)}
        onApply={(newHtml, newRoot, newBg) => {
          setHtml(newHtml);
          setCurrentRootColor(newRoot);
          setCurrentRootBg(newBg);
          if (editorRef.current) editorRef.current.innerHTML = newHtml;
        }}
      />
    </>
  );
}
