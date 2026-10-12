import { FileText } from 'lucide-react';
import type { DocSummary } from '@/services/docStudioService';
import { isLibrarySampleDocument } from '@/services/docStudioService';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';

interface DocumentListProps {
  documents: DocSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function statusTone(status: string): string {
  if (status === 'published') return 'bg-emerald-100 text-emerald-900';
  if (status === 'archived') return 'bg-slate-200 text-slate-700';
  return 'bg-amber-50 text-amber-900';
}

export function DocumentList({ documents, selectedId, onSelect }: DocumentListProps) {
  if (!documents.length) {
    return (
      <p className="p-4 text-base text-slate-600">
        No documents in this folder yet. Create one to start editing in place.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-slate-200">
      {documents.map(doc => {
        const isSample = isLibrarySampleDocument(doc);
        return (
          <li key={doc.id}>
            <button
              type="button"
              className={cn(
                'flex min-h-[56px] w-full items-start gap-3 px-3 py-3 text-left hover:bg-slate-50',
                selectedId === doc.id && 'bg-sky-50'
              )}
              onClick={() => onSelect(doc.id)}
            >
              <FileText className="mt-1 h-4 w-4 shrink-0 text-oww-cyan" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-semibold text-oww-navy">
                  {doc.title || 'Untitled'}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  {isSample ? (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-900">
                      Sample · Save As
                    </span>
                  ) : (
                    <span className={cn('rounded-full px-2 py-0.5', statusTone(doc.status))}>
                      {doc.status}
                    </span>
                  )}
                  <span>v{doc.version_no}</span>
                  {doc.updated_at ? <span>{formatDateTime(doc.updated_at)}</span> : null}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
