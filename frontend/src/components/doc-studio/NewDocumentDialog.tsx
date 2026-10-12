import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  OWW_CATEGORY_ORDER,
  OWW_STUDIO_CATEGORIES,
  OWW_STUDIO_TEMPLATES,
  type OwwStudioCategory,
  type OwwStudioTemplate,
} from '@/config/owwStudioTemplates';
import { cn } from '@/lib/utils';

interface NewDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: {
    title: string;
    templateId?: string;
    bodyHtml: string;
    folderHint?: OwwStudioCategory;
  }) => void;
}

function templateToMarkdown(t: OwwStudioTemplate): string {
  // Prefer body HTML; Studio TipTap markdown plugin accepts HTML when html:true
  return t.bodyHtml || `# ${t.name}\n\n`;
}

export function NewDocumentDialog({ open, onClose, onCreate }: NewDocumentDialogProps) {
  const [category, setCategory] = useState<OwwStudioCategory | 'all'>('blog');
  const [selected, setSelected] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  const templates = useMemo(() => {
    if (category === 'all') return OWW_STUDIO_TEMPLATES;
    return OWW_STUDIO_TEMPLATES.filter(t => t.category === category);
  }, [category]);

  if (!open) return null;

  const active = templates.find(t => t.id === selected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-xl text-oww-navy">New document</h2>
          <p className="text-base text-slate-600">
            Pick a Document Studio starter — you edit it in place in the WYSIWYG editor.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
          <Button
            type="button"
            variant={category === 'all' ? 'default' : 'outline'}
            className="min-h-[44px] text-base"
            onClick={() => setCategory('all')}
          >
            All
          </Button>
          {OWW_CATEGORY_ORDER.map(c => (
            <Button
              key={c}
              type="button"
              variant={category === c ? 'default' : 'outline'}
              className="min-h-[44px] text-base"
              onClick={() => setCategory(c)}
            >
              {OWW_STUDIO_CATEGORIES[c]}
            </Button>
          ))}
        </div>
        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden md:grid-cols-2">
          <ul className="overflow-y-auto border-r border-slate-100 p-2">
            <li>
              <button
                type="button"
                className={cn(
                  'mb-1 flex min-h-[52px] w-full flex-col rounded-lg px-3 py-2 text-left',
                  !selected ? 'bg-sky-100' : 'hover:bg-slate-50'
                )}
                onClick={() => {
                  setSelected(null);
                  setTitle('Untitled');
                }}
              >
                <span className="font-semibold text-oww-navy">Blank document</span>
                <span className="text-sm text-slate-600">Empty page — write from scratch</span>
              </button>
            </li>
            {templates.map(t => (
              <li key={t.id}>
                <button
                  type="button"
                  className={cn(
                    'mb-1 flex min-h-[52px] w-full flex-col rounded-lg px-3 py-2 text-left',
                    selected === t.id ? 'bg-sky-100' : 'hover:bg-slate-50'
                  )}
                  onClick={() => {
                    setSelected(t.id);
                    setTitle(t.subject || t.name);
                  }}
                >
                  <span className="font-semibold text-oww-navy">{t.name}</span>
                  <span className="text-sm text-slate-600">{t.preview}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="space-y-4 overflow-y-auto p-5">
            <div className="space-y-2">
              <Label className="text-base">Title</Label>
              <Input
                className="min-h-[44px] text-base"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Document title"
              />
            </div>
            {active ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-base text-slate-700">
                <p className="font-semibold text-oww-navy">{active.name}</p>
                <p className="mt-1">{active.description}</p>
                {active.sourceStudioId ? (
                  <p className="mt-2 text-sm text-slate-500">From WW360 Studio: {active.sourceStudioId}</p>
                ) : null}
              </div>
            ) : (
              <p className="text-base text-slate-600">Blank document — no starter content.</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button type="button" variant="outline" className="min-h-[44px] text-base" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="min-h-[44px] bg-oww-cyan text-base text-white hover:bg-sky-700"
            onClick={() => {
              onCreate({
                title: title.trim() || active?.name || 'Untitled',
                templateId: active?.id,
                bodyHtml: active ? templateToMarkdown(active) : '<p></p>',
                folderHint: active?.category,
              });
              onClose();
            }}
          >
            Open in editor
          </Button>
        </div>
      </div>
    </div>
  );
}
