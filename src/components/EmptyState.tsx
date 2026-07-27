import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-950/60 p-8 text-center">
      <h3 className="font-serif text-lg text-amber-50">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
