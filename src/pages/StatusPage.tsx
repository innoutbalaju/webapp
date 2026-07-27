import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { EmptyState } from '@/components/EmptyState';
import { GuestShell } from '@/components/GuestShell';
import { SectionCard } from '@/components/SectionCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useGuestRoomGuard } from '@/hooks/useGuestRoomGuard';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/store/sessionStore';
import type { Order } from '@/types/domain';

const statusNarrative: Record<Order['status'], string> = {
  Pending: 'Your request has been received and is waiting for the service team.',
  Printed: 'The front desk ticket has been printed and handed off for preparation.',
  Preparing: 'The team is actively preparing your room service order.',
  Delivered: 'Your order has been marked as delivered to the room.',
  Completed: 'The service workflow is complete.',
  Canceled: 'Reception canceled this order.',
};

export default function StatusPage() {
  useGuestRoomGuard();

  const authUser = useSessionStore((state) => state.authUser);
  const room = useSessionStore((state) => state.room);

  const [orders, setOrders] = useState<Order[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      return;
    }

    let ignore = false;

    async function loadOrders() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('room_number', room.room_number)
        .order('created_at', { ascending: false });

      if (ignore) {
        return;
      }

      if (error) {
        setErrorMessage(getErrorMessage(error));
        return;
      }

      setOrders((data as Order[]) ?? []);
    }

    loadOrders();

    const channel = supabase
      .channel(`room-orders-${room.room_number}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `room_number=eq.${room.room_number}`,
        },
        () => {
          loadOrders();
        },
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [room]);

  if (!authUser || !room) {
    return <Navigate replace to="/login" />;
  }

  return (
    <GuestShell
      title="Live order status"
      subtitle="Status changes from the reception dashboard appear here automatically without reloading."
    >
      {errorMessage ? (
        <div className="mb-5 rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-400/30">
          {errorMessage}
        </div>
      ) : null}

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Once you place an order, it will appear here with live updates from reception."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <SectionCard
              key={order.id}
              title={`Order ${order.id.slice(0, 8).toUpperCase()}`}
              description={formatDateTime(order.created_at)}
              actions={<StatusBadge status={order.status} />}
            >
              <div className="space-y-3">
                <p className="text-sm text-slate-300">
                  {statusNarrative[order.status]}
                </p>
                <div className="rounded-3xl bg-white/5 px-4 py-4 text-sm text-slate-200">
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    <span className="font-medium text-amber-50">
                      {formatCurrency(order.total_price)}
                    </span>
                  </div>
                  <div className="mt-3 border-t border-white/10 pt-3 text-xs text-slate-400">
                    Room {order.room_number} · {order.items.length} menu lines
                  </div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </GuestShell>
  );
}
