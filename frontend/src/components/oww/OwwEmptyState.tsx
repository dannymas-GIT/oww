import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function OwwEmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center',
        className
      )}
    >
      <p className="font-display text-lg font-semibold text-navy">{title}</p>
      {description ? <p className="mt-2 max-w-md text-base text-slate-600">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
