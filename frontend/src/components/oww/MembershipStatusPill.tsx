import type { MembershipStatus } from '@/types';
import { cn } from '@/lib/utils';

const STYLES: Record<MembershipStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-900 ring-emerald-200' },
  complimentary: { label: 'Complimentary', className: 'bg-sky-100 text-sky-900 ring-sky-200' },
  past_due: { label: 'Past due', className: 'bg-amber-100 text-amber-900 ring-amber-200' },
  pending: { label: 'Pending', className: 'bg-slate-100 text-slate-700 ring-slate-200' },
  canceled: { label: 'Canceling', className: 'bg-orange-100 text-orange-900 ring-orange-200' },
  expired: { label: 'Expired', className: 'bg-rose-100 text-rose-900 ring-rose-200' },
};

export function MembershipStatusPill({ status, className }: { status: MembershipStatus | string; className?: string }) {
  const s = STYLES[status as MembershipStatus] ?? { label: status, className: 'bg-slate-100 text-slate-700 ring-slate-200' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset', s.className, className)}>
      {s.label}
    </span>
  );
}

export function membershipStatusLabel(status: string): string {
  return STYLES[status as MembershipStatus]?.label ?? status;
}
