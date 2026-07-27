import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckSquare, Square } from 'lucide-react';

import { EmptyState } from '@/components/EmptyState';
import { GuestShell } from '@/components/GuestShell';
import { SectionCard } from '@/components/SectionCard';
import { useGuestRoomGuard } from '@/hooks/useGuestRoomGuard';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency, formatDateTime, getTotalItemUnits } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { useSessionStore } from '@/store/sessionStore';
import type { MenuItem, Order } from '@/types/domain';

export default function CheckoutPage() {
  useGuestRoomGuard();

  const navigate = useNavigate();
  const authUser = useSessionStore((state) => state.authUser);
  const room = useSessionStore((state) => state.room);
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [recentOrder, setRecentOrder] = useState<Order | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!room) {
      return;
    }

    let ignore = false;

    async function loadCheckoutData() {
      const [{ data: menuData, error: menuError }, { data: orderData, error: orderError }] =
        await Promise.all([
          supabase.from('menu_items').select('*').eq('is_available', true),
          supabase
            .from('orders')
            .select('*')
            .eq('room_number', room.room_number)
            .neq('status', 'Canceled')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      if (ignore) {
        return;
      }

      if (menuError) {
        setErrorMessage(getErrorMessage(menuError));
      } else {
        setMenuItems((menuData as MenuItem[]) ?? []);
      }

      if (!orderError) {
        setRecentOrder((orderData as Order | null) ?? null);
      }
    }

    loadCheckoutData();

    return () => {
      ignore = true;
    };
  }, [room]);

  const itemLines = useMemo(() => {
    return cartItems
      .map((item) => {
        const menuItem = menuItems.find((candidate) => candidate.id === item.item_id);

        if (!menuItem) {
          return null;
        }

        return {
          ...item,
          title: menuItem.title,
          price: Number(menuItem.price),
          lineTotal: Number(menuItem.price) * item.quantity,
        };
      })
      .filter(Boolean) as Array<
      {
        item_id: string;
        quantity: number;
        title: string;
        price: number;
        lineTotal: number;
      }
    >;
  }, [cartItems, menuItems]);

  const totalUnits = getTotalItemUnits(cartItems);
  const displayTotal = itemLines.reduce((sum, item) => sum + item.lineTotal, 0);
  const lastOrderTime = recentOrder ? new Date(recentOrder.created_at).getTime() : 0;
  const minutesSinceLastOrder = lastOrderTime
    ? Math.floor((Date.now() - lastOrderTime) / 60000)
    : null;
  const isRateLimited =
    minutesSinceLastOrder !== null && minutesSinceLastOrder < 10;

  if (!authUser || !room) {
    return <Navigate replace to="/login" />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!acceptedTerms) {
      setErrorMessage('You must accept the non-cancelable order policy.');
      return;
    }

    if (!cartItems.length) {
      setErrorMessage('Add at least one item to continue.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { data, error } = await ((supabase.from('orders') as any)
      .insert({
        room_number: room.room_number,
        items: cartItems,
      })
      .select('*')
      .single() as Promise<{ data: Order; error: unknown }>);

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(getErrorMessage(error));
      return;
    }

    clearCart();
    navigate('/status', {
      state: { orderId: (data as Order).id },
    });
  }

  return (
    <GuestShell
      title="Review your order"
      subtitle="Totals shown here are for preview only. Supabase recalculates the final bill from the live menu prices before saving your order."
    >
      {!cartItems.length ? (
        <EmptyState
          title="Your cart is empty"
          description="Browse the menu to add something first."
          action={
            <Link
              className="inline-flex rounded-full bg-amber-300 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-amber-200"
              to="/menu"
            >
              Return to menu
            </Link>
          }
        />
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <SectionCard
            title="Cart summary"
            description={`${totalUnits} total item units selected`}
          >
            <div className="space-y-3">
              {itemLines.map((item) => (
                <div
                  key={item.item_id}
                  className="flex items-center justify-between rounded-3xl bg-white/5 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-100">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {item.quantity} x {formatCurrency(item.price)}
                    </div>
                  </div>
                  <div className="text-amber-100">{formatCurrency(item.lineTotal)}</div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                <span className="text-slate-300">Estimated total</span>
                <span className="font-medium text-amber-50">
                  {formatCurrency(displayTotal)}
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Submission checks"
            description="The server enforces one order per room every 10 minutes and no more than 5 total item units in one order."
          >
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Room blocked check</span>
                <span className="text-emerald-200">Passed</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Item quantity limit</span>
                <span className={totalUnits > 5 ? 'text-rose-200' : 'text-emerald-200'}>
                  {totalUnits > 5 ? 'Too many items' : 'Passed'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>10-minute interval</span>
                <span className={isRateLimited ? 'text-rose-200' : 'text-emerald-200'}>
                  {isRateLimited
                    ? `Wait ${10 - (minutesSinceLastOrder ?? 0)} more minute(s)`
                    : 'Passed'}
                </span>
              </div>
              {recentOrder ? (
                <p className="text-xs text-slate-400">
                  Last active order: {formatDateTime(recentOrder.created_at)}
                </p>
              ) : null}
            </div>
          </SectionCard>

          <label className="flex items-start gap-3 rounded-[28px] border border-white/10 bg-slate-950/70 p-5 text-sm text-slate-300">
            <button
              className="mt-0.5 shrink-0 text-amber-200"
              onClick={() => setAcceptedTerms((current) => !current)}
              type="button"
            >
              {acceptedTerms ? (
                <CheckSquare className="h-5 w-5" />
              ) : (
                <Square className="h-5 w-5" />
              )}
            </button>
            <span>
              I agree that orders cannot be canceled once placed.
            </span>
          </label>

          {errorMessage ? (
            <div className="rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-400/30">
              {errorMessage}
            </div>
          ) : null}

          {(isRateLimited || totalUnits > 5) && (
            <div className="flex items-start gap-3 rounded-2xl bg-amber-500/15 px-4 py-3 text-sm text-amber-100 ring-1 ring-amber-400/30">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                The database will reject this order until the timing and item
                limits are back within policy.
              </span>
            </div>
          )}

          <button
            className="w-full rounded-2xl bg-amber-300 px-5 py-4 text-sm font-medium text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || !acceptedTerms || isRateLimited || totalUnits > 5}
            type="submit"
          >
            {isSubmitting ? 'Placing order...' : 'Confirm order'}
          </button>
        </form>
      )}
    </GuestShell>
  );
}
