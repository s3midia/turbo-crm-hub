import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Toggle } from '@/components/ui/toggle';
import { Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = "150px" }: RichTextEditorProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Digite o conteúdo...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `prose prose-invert prose-sm max-w-none focus:outline-none min-h-[${minHeight}] p-4 text-gray-300`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content in sync if value changes externally (e.g. from completely resetting the form)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor || !isMounted) {
    return <div className={`min-h-[${minHeight}] border border-border rounded-md bg-muted/10`} />;
  }

  return (
    <div className="border border-border rounded-md overflow-hidden flex flex-col bg-background focus-within:border-[#cfff04]/50 transition-colors">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Toggle bold"
          className="data-[state=on]:bg-[#cfff04]/20 data-[state=on]:text-[#cfff04]"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Toggle italic"
          className="data-[state=on]:bg-[#cfff04]/20 data-[state=on]:text-[#cfff04]"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <div className="w-[1px] h-6 bg-border mx-1" />
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Toggle heading 2"
          className="data-[state=on]:bg-[#cfff04]/20 data-[state=on]:text-[#cfff04]"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <div className="w-[1px] h-6 bg-border mx-1" />
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Toggle bullet list"
          className="data-[state=on]:bg-[#cfff04]/20 data-[state=on]:text-[#cfff04]"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Toggle ordered list"
          className="data-[state=on]:bg-[#cfff04]/20 data-[state=on]:text-[#cfff04]"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
      </div>
      <div className="flex-1 bg-[#0a0a0a]">
        <style dangerouslySetInnerHTML={{__html: `
          .is-editor-empty:first-child::before {
            color: #6b7280;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
        `}} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
