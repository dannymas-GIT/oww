/**
 * TipTap rich-text editor for blog sections, email bodies, and marketing copy.
 * HTML in / HTML out (matches CMS rich_text storage). Supports image/video insert.
 */
import { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { VideoEmbed } from '@/components/oww/tiptapVideo';

export interface RichTextMediaUploadResult {
  url: string;
  kind?: string;
}

export interface RichTextTemplateOption {
  id: string;
  label: string;
  bodyHtml: string;
}

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClass?: string;
  editable?: boolean;
  /** When set, toolbar shows Upload image / video controls that call this uploader. */
  onUploadMedia?: (file: File) => Promise<RichTextMediaUploadResult>;
  /** Document Studio–style “insert section from template” options. */
  insertTemplates?: RichTextTemplateOption[];
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      className={cn('min-h-[44px] min-w-[44px] px-2 text-base', active && 'bg-oww-cyan text-white hover:bg-sky-700')}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

function isVideoFile(file: File, kind?: string): boolean {
  if (kind?.startsWith('video')) return true;
  if (file.type.startsWith('video/')) return true;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(file.name);
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your message…',
  className,
  minHeightClass = 'min-h-[200px]',
  editable = true,
  onUploadMedia,
  insertTemplates,
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-sky-800 underline' },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: { class: 'rounded-xl max-w-full h-auto my-3' },
      }),
      VideoEmbed,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '<p></p>',
    editable,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-slate max-w-none px-3 py-3 text-base focus:outline-none',
          '[&_video]:my-3 [&_video]:w-full [&_video]:max-w-full [&_video]:rounded-xl',
          '[&_img]:rounded-xl',
          minHeightClass
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || '<p></p>';
    if (current !== next && editor.isEmpty && !value) return;
    if (value != null && value !== current && !editor.isFocused) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev || 'https://');
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  function insertImageByUrl() {
    if (!editor) return;
    const url = window.prompt('Image URL', 'https://');
    if (!url?.trim()) return;
    editor.chain().focus().setImage({ src: url.trim(), alt: '' }).run();
  }

  function insertVideoByUrl() {
    if (!editor) return;
    const url = window.prompt('Video URL (mp4 / webm)', 'https://');
    if (!url?.trim()) return;
    editor
      .chain()
      .focus()
      .insertContent(
        `<p></p><video controls playsinline src="${url.trim().replace(/"/g, '')}"></video><p></p>`
      )
      .run();
  }

  async function handleMediaFile(file: File | undefined, preferVideo: boolean) {
    if (!file || !editor || !onUploadMedia || uploadingRef.current) return;
    uploadingRef.current = true;
    try {
      const asset = await onUploadMedia(file);
      const asVideo = preferVideo || isVideoFile(file, asset.kind);
      if (asVideo) {
        editor
          .chain()
          .focus()
          .insertContent(
            `<p></p><video controls playsinline src="${asset.url.replace(/"/g, '')}"></video><p></p>`
          )
          .run();
      } else {
        editor.chain().focus().setImage({ src: asset.url, alt: file.name }).run();
      }
    } catch {
      window.alert('Media upload failed. Try again or paste a URL.');
    } finally {
      uploadingRef.current = false;
    }
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-300 bg-white', className)}>
      {editable ? (
        <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
          <ToolbarButton
            label="Bold"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Strike"
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Heading"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Bullet list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Quote"
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Link" active={editor.isActive('link')} onClick={setLink}>
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          {insertTemplates?.length ? (
            <label className="inline-flex min-h-[44px] items-center gap-1 text-base">
              <span className="sr-only">Insert from Document Studio template</span>
              <select
                className="min-h-[44px] max-w-[12rem] rounded-md border border-slate-300 bg-white px-2 text-base"
                defaultValue=""
                aria-label="Insert from template"
                onChange={e => {
                  const id = e.target.value;
                  e.target.value = '';
                  const t = insertTemplates.find(x => x.id === id);
                  if (!t || !editor) return;
                  editor.chain().focus().insertContent(t.bodyHtml).run();
                }}
              >
                <option value="">Insert template…</option>
                {insertTemplates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {onUploadMedia ? (
            <>
              <ToolbarButton label="Upload image" onClick={() => imageInputRef.current?.click()}>
                <ImagePlus className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton label="Upload video" onClick={() => videoInputRef.current?.click()}>
                <Video className="h-4 w-4" />
              </ToolbarButton>
              <input
                ref={imageInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={e => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  void handleMediaFile(f, false);
                }}
              />
              <input
                ref={videoInputRef}
                type="file"
                className="hidden"
                accept="video/*"
                onChange={e => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  void handleMediaFile(f, true);
                }}
              />
            </>
          ) : (
            <>
              <ToolbarButton label="Insert image URL" onClick={insertImageByUrl}>
                <ImagePlus className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton label="Insert video URL" onClick={insertVideoByUrl}>
                <Video className="h-4 w-4" />
              </ToolbarButton>
            </>
          )}
          <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;
