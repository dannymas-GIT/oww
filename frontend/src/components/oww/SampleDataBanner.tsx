import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SampleDataBannerProps {
  /** Short label for what is sample (e.g. "jobs", "candidates"). */
  section?: string;
  onClear?: () => void | Promise<void>;
  clearing?: boolean;
  className?: string;
}

/** Amber banner when illustrative sample rows are shown. */
export function SampleDataBanner({ section, onClear, clearing, className }: SampleDataBannerProps) {
  const what = section ? `${section} ` : '';
  return (
    <div
      className={
        className ??
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950'
      }
      role="status"
    >
      <div className="flex min-w-0 items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
        <div>
          <p className="text-base font-semibold">Sample data — illustrative only</p>
          <p className="text-base text-amber-900/90">
            These {what}rows are labeled sample so you can see how this area works. They are not real people or
            postings. When you add real data here, sample rows hide automatically. Clear the pack anytime.
          </p>
        </div>
      </div>
      {onClear ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px] shrink-0 border-amber-400 bg-white text-base text-amber-950 hover:bg-amber-100"
          disabled={clearing}
          onClick={() => void onClear()}
        >
          {clearing ? 'Clearing…' : 'Clear sample data'}
        </Button>
      ) : null}
    </div>
  );
}

/** Compact badge for a sample row. */
export function SampleBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-900">
      Sample
    </span>
  );
}
