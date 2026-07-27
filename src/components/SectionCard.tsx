import type { PropsWithChildren, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type SectionCardProps = PropsWithChildren<{
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}>;

export function SectionCard({
  title,
  description,
  actions,
  className,
  children,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur',
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg text-amber-50">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-300">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
