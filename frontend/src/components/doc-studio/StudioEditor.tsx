/**
 * OWW Document Studio TipTap editor — WYSIWYG with slash-ish toolbar,
 * image upload, and screen grab (WW360 ScreenshotCaptureTool).
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CharacterCount from '@tiptap/extension-character-count';
import { Markdown } from 'tiptap-markdown';
import {
  Bold,
  Camera,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadAsset } from '@/services/docStudioService';
import { ScreenshotCaptureTool } from '@/components/doc-studio/ScreenshotCaptureTool';
import { VideoEmbed } from '@/components/oww/tiptapVideo';
import './docStudio.css';

export interface StudioEditorHandle {
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  focus: () => void;
  isEmpty: () => boolean;
}

export interface StudioEditorProps {
  initialMarkdown?: string;
  readOnly?: boolean;
  placeholder?: string;
  documentId?: string | null;
  onChange?: (markdown: string) => void;
  onUploadError?: (message: string) => void;
  className?: string;
}

function ToolbarBtn({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      className={cn('min-h-[44px] min-w-[44px] px-2', active && 'bg-oww-cyan text-white hover:bg-sky-700')}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export const StudioEditor = forwardRef<StudioEditorHandle, StudioEditorProps>(function StudioEditor(
  {
    initialMarkdown = '',
    readOnly = false,
    placeholder,
    documentId,
    onChange,
    onUploadError,
    className,
  },
  ref
) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [shotOpen, setShotOpen] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: { class: 'rounded-xl max-w-full h-auto my-3' },
      }),
      VideoEmbed,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
        breaks: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing — use the toolbar for media, tables, and screen grab…',
      }),
    ],
    content: initialMarkdown || '',
    onUpdate: ({ editor: ed }) => {
      const storage = ed.storage as unknown as { markdown?: { getMarkdown: () => string } };
      const md = storage.markdown?.getMarkdown() ?? ed.getHTML();
      onChangeRef.current?.(md);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  const getMarkdown = useCallback(() => {
    if (!editor) return '';
    const storage = editor.storage as unknown as { markdown?: { getMarkdown: () => string } };
    return storage.markdown?.getMarkdown() ?? editor.getHTML();
  }, [editor]);

  useImperativeHandle(
    ref,
    () => ({
      getMarkdown,
      setMarkdown: (markdown: string) => {
        editor?.commands.setContent(markdown || '', { emitUpdate: false });
      },
      focus: () => editor?.commands.focus(),
      isEmpty: () => !editor || editor.isEmpty,
    }),
    [editor, getMarkdown]
  );

  const insertImageFile = useCallback(
    async (file: File) => {
      if (!editor) return;
      try {
        const asset = await uploadAsset(file, documentId);
        editor.chain().focus().setImage({ src: asset.url, alt: file.name }).run();
      } catch (err) {
        onUploadError?.(err instanceof Error ? err.message : 'Image upload failed');
      }
    },
    [editor, documentId, onUploadError]
  );

  if (!editor) return null;

  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-300 bg-white', className)}>
      {!readOnly ? (
        <div className="sticky top-0 z-10 flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
          <ToolbarBtn label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Strike" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Bullets" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Numbered" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Checklist" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
            <ListTodo className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn
            label="Table"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          >
            <Table2 className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn
            label="Link"
            active={editor.isActive('link')}
            onClick={() => {
              const prev = editor.getAttributes('link').href as string | undefined;
              const url = window.prompt('Link URL', prev || 'https://');
              if (url === null) return;
              if (!url.trim()) {
                editor.chain().focus().unsetLink().run();
                return;
              }
              editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
            }}
          >
            <Link2 className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Upload image" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Screen grab" onClick={() => setShotOpen(true)}>
            <Camera className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Undo" onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn label="Redo" onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 className="h-4 w-4" />
          </ToolbarBtn>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={e => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void insertImageFile(f);
            }}
          />
        </div>
      ) : null}
      <EditorContent
        editor={editor}
        className="prose prose-slate max-w-none min-h-[320px] px-4 py-3 text-lg focus-within:outline-none"
      />
      <ScreenshotCaptureTool
        isOpen={shotOpen}
        onClose={() => setShotOpen(false)}
        onInsert={(url, filename) => {
          editor.chain().focus().setImage({ src: url, alt: filename }).run();
          setShotOpen(false);
        }}
        topicId={documentId}
        uploadScreenshot={async (blob, filename) => {
          const file = new File([blob], filename, { type: blob.type || 'image/png' });
          const asset = await uploadAsset(file, documentId);
          return { url: asset.url, filename: asset.filename };
        }}
      />
    </div>
  );
});

export default StudioEditor;
