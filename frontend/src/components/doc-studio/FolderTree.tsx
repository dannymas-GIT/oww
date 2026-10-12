import { Folder, FolderOpen, FileText } from 'lucide-react';
import { ALL_DOCS, UNFILED, type DocFolder } from '@/services/docStudioService';
import { cn } from '@/lib/utils';

interface FolderTreeProps {
  folders: DocFolder[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function FolderTree({ folders, selectedId, onSelect }: FolderTreeProps) {
  return (
    <nav className="space-y-1 text-base" aria-label="Document folders">
      <button
        type="button"
        className={cn(
          'flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 text-left',
          selectedId === ALL_DOCS ? 'bg-sky-100 text-oww-navy font-semibold' : 'hover:bg-slate-100'
        )}
        onClick={() => onSelect(ALL_DOCS)}
      >
        <FileText className="h-4 w-4 shrink-0" />
        All documents
      </button>
      {folders.map(f => {
        const active = selectedId === f.id;
        return (
          <button
            key={f.id}
            type="button"
            className={cn(
              'flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 text-left',
              active ? 'bg-sky-100 text-oww-navy font-semibold' : 'hover:bg-slate-100'
            )}
            onClick={() => onSelect(f.id)}
            title={f.description || undefined}
          >
            {active ? <FolderOpen className="h-4 w-4 shrink-0" /> : <Folder className="h-4 w-4 shrink-0" />}
            <span className="flex-1 truncate">{f.name}</span>
            <span className="text-sm text-slate-500">{f.document_count}</span>
          </button>
        );
      })}
      <button
        type="button"
        className={cn(
          'flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 text-left',
          selectedId === UNFILED ? 'bg-sky-100 text-oww-navy font-semibold' : 'hover:bg-slate-100'
        )}
        onClick={() => onSelect(UNFILED)}
      >
        <Folder className="h-4 w-4 shrink-0 opacity-60" />
        Unfiled
      </button>
    </nav>
  );
}

export { ALL_DOCS, UNFILED };
