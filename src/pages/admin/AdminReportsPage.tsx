import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { AdminShell } from '@/components/AdminShell';
import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { StatusBadge } from '@/components/StatusBadge';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency, formatDateTime, summarizeOrders } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/store/sessionStore';
import type { Order } from '@/types/domain';

export default function AdminReportsPage() {
  const role = useSessionStore((state) => state.role);

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadOrders(selectedDate);
  }, [selectedDate]);

  if (role !== 'admin') {
    return <Navigate replace to="/login" />;
  }

  async function loadOrders(date: string) {
    const start = `${date}T00:00:00`;
    const end = `${date}T23:59:59`;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMessage(getErrorMessage(error));
      return;
    }

    setOrders((data as Order[]) ?? []);
  }

  const summary = useMemo(() => summarizeOrders(orders), [orders]);

  return (
    <AdminShell
      title="Sales overview"
      subtitle="Track daily performance, monitor cancellations, and review how many orders were fully delivered."
    >
      {errorMessage ? (
        <div className="mb-5 rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-400/30">
          {errorMessage}
        </div>
      ) : null}

      <div className="mb-5 max-w-xs">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
            Report date
          </span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm outline-none focus:border-amber-300"
            onChange={(event) => setSelectedDate(event.target.value)}
            type="date"
            value={selectedDate}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Revenue">
          <div className="text-2xl font-semibold text-amber-50">
            {formatCurrency(summary.totalRevenue)}
          </div>
        </SectionCard>
        <SectionCard title="Orders">
          <div className="text-2xl font-semibold text-amber-50">
            {summary.totalOrders}
          </div>
        </SectionCard>
        <SectionCard title="Delivered">
          <div className="text-2xl font-semibold text-amber-50">
            {summary.deliveredOrders}
          </div>
        </SectionCard>
        <SectionCard title="Average order">
          <div className="text-2xl font-semibold text-amber-50">
            {formatCurrency(summary.averageOrderValue)}
          </div>
        </SectionCard>
      </div>

      <div className="mt-5">
        {orders.length === 0 ? (
          <EmptyState
            title="No orders for this day"
            description="Choose another date or wait for new room service orders to arrive."
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <SectionCard
                key={order.id}
                title={`Room ${order.room_number}`}
                description={formatDateTime(order.created_at)}
                actions={<StatusBadge status={order.status} />}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Order total</span>
                  <span className="font-medium text-amber-50">
                    {formatCurrency(order.total_price)}
                  </span>
                </div>
              </SectionCard>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
