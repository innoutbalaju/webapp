import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types/domain';

const statusClasses: Record<OrderStatus, string> = {
  Pending: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30',
  Printed: 'bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/30',
  Preparing: 'bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-400/30',
  Delivered: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30',
  Completed: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30',
  Canceled: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide',
        statusClasses[status],
      )}
    >
      {status}
    </span>
  );
}
