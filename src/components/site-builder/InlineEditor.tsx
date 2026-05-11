import React, { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';

interface Props {
  value: string;
  multiline?: boolean;
  onSave: (value: string) => void;
  onCancel: () => void;
  className?: string;
}

export function InlineTextEditor({ value, multiline, onSave, onCancel, className = '' }: Props) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    (inputRef.current as HTMLInputElement)?.select?.();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); onSave(draft); }
    if (e.key === 'Enter' && e.metaKey) onSave(draft);
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className={`relative inline-flex items-start gap-1 ${className}`} onClick={e => e.stopPropagation()}>
      {multiline ? (
        <textarea
          ref={inputRef as React.Ref<HTMLTextAreaElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="block w-full min-w-[280px] px-3 py-2 text-sm rounded-lg bg-white border-2 border-blue-500 shadow-lg outline-none resize-none text-gray-900"
        />
      ) : (
        <input
          ref={inputRef as React.Ref<HTMLInputElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className="block min-w-[240px] px-3 py-2 text-sm rounded-lg bg-white border-2 border-blue-500 shadow-lg outline-none text-gray-900"
        />
      )}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => onSave(draft)}
          className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 shadow-md"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 shadow-md"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// Wrapper que torna qualquer elemento clicável e editável inline
interface EditableTextProps {
  value: string;
  multiline?: boolean;
  editMode: boolean;
  onSave: (value: string) => void;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function EditableText({
  value,
  multiline = false,
  editMode,
  onSave,
  className = '',
  as: Tag = 'span',
  style,
  children,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);

  if (!editMode) {
    return <Tag className={className} style={style}>{children ?? value}</Tag>;
  }

  if (editing) {
    return (
      <InlineTextEditor
        value={value}
        multiline={multiline}
        onSave={(v) => { onSave(v); setEditing(false); }}
        onCancel={() => setEditing(false)}
        className={className}
      />
    );
  }

  return (
    <Tag
      className={`${className} cursor-pointer relative group outline-none`}
      style={style}
      onClick={e => { e.stopPropagation(); setEditing(true); }}
      title="Clique para editar"
    >
      {children ?? value}
      <span className="absolute -top-1 -right-1 -bottom-1 -left-1 rounded border-2 border-dashed border-blue-400 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
      <span className="absolute -top-5 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">
        Editar
      </span>
    </Tag>
  );
}
