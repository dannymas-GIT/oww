import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function OwwSection({
  title,
  description,
  children,
  className,
  id,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn('space-y-4', className)}>
      {(title || description) && (
        <div>
          {title ? <h2 className="font-display text-xl font-semibold text-navy md:text-2xl">{title}</h2> : null}
          {description ? <p className="mt-1 text-lg text-slate-600">{description}</p> : null}
        </div>
      )}
      {children}
    </section>
  );
}
