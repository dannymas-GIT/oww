import { Button } from '@/components/ui/button';
import type { DocVersion } from '@/services/docStudioService';
import { formatDateTime } from '@/lib/format';

interface VersionHistoryPanelProps {
  versions: DocVersion[];
  onRestore: (versionId: string) => void;
  busy?: boolean;
}

export function VersionHistoryPanel({ versions, onRestore, busy }: VersionHistoryPanelProps) {
  if (!versions.length) {
    return <p className="text-base text-slate-600">No versions yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {versions.map(v => (
        <li key={v.id} className="rounded-lg border border-slate-200 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-base font-semibold text-oww-navy">
                v{v.version_no} · {v.kind}
              </p>
              <p className="text-sm text-slate-500">
                {v.created_at ? formatDateTime(v.created_at) : '—'}
                {v.note ? ` · ${v.note}` : ''}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] text-base"
              disabled={busy}
              onClick={() => onRestore(v.id)}
            >
              Restore
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
