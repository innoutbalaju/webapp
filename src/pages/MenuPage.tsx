import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ChevronRight, LogOut, Minus, Plus } from 'lucide-react';

import { EmptyState } from '@/components/EmptyState';
import { GuestShell } from '@/components/GuestShell';
import { SectionCard } from '@/components/SectionCard';
import { useGuestRoomGuard } from '@/hooks/useGuestRoomGuard';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency, getTotalItemUnits } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { useSessionStore } from '@/store/sessionStore';
import type { MenuCategory, MenuItem } from '@/types/domain';

const categories: MenuCategory[] = ['Food', 'Beverage', 'Amenities'];

export default function MenuPage() {
  useGuestRoomGuard();

  const authUser = useSessionStore((state) => state.authUser);
  const room = useSessionStore((state) => state.room);
  const role = useSessionStore((state) => state.role);
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const setQuantity = useCartStore((state) => state.setQuantity);

  const [activeCategory, setActiveCategory] = useState<MenuCategory>('Food');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadMenu() {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category')
        .order('title');

      if (ignore) {
        return;
      }

      setIsLoading(false);

      if (error) {
        setErrorMessage(getErrorMessage(error));
        return;
      }

      setMenuItems((data as MenuItem[]) ?? []);
    }

    loadMenu();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredItems = useMemo(
    () => menuItems.filter((item) => item.category === activeCategory),
    [activeCategory, menuItems],
  );

  const cartCount = getTotalItemUnits(cartItems);
  const cartTotal = cartItems.reduce((sum, item) => {
    const menuItem = menuItems.find((candidate) => candidate.id === item.item_id);
    return sum + Number(menuItem?.price ?? 0) * item.quantity;
  }, 0);

  if (role === 'admin') {
    return <Navigate replace to="/admin/orders" />;
  }

  if (!authUser || !room) {
    return <Navigate replace to="/login" />;
  }

  return (
    <GuestShell
      title={`Welcome, Room ${room.room_number}`}
      subtitle="Choose from the currently available kitchen, beverage, and amenities menu."
      headerAction={
        <button
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-slate-200 transition hover:bg-white/5"
          onClick={() => supabase.auth.signOut()}
          type="button"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      }
    >
      <SectionCard
        title="Menu categories"
        description="Unavailable items stay hidden automatically so guests only see what can be ordered right now."
      >
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              className={`rounded-full px-4 py-2 text-sm transition ${
                activeCategory === category
                  ? 'bg-amber-300 text-slate-950'
                  : 'bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      </SectionCard>

      {errorMessage ? (
        <div className="mt-5 rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-400/30">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        {isLoading ? (
          <SectionCard title="Loading menu" description="Fetching today's available items.">
            <div className="space-y-3">
              <div className="h-20 animate-pulse rounded-3xl bg-white/5" />
              <div className="h-20 animate-pulse rounded-3xl bg-white/5" />
            </div>
          </SectionCard>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="Nothing available in this category"
            description="Reception can enable menu items from the admin dashboard when stock returns."
          />
        ) : (
          filteredItems.map((item) => {
            const quantity =
              cartItems.find((entry) => entry.item_id === item.id)?.quantity ?? 0;

            return (
              <SectionCard
                key={item.id}
                className="p-5"
                title={item.title}
                description={item.category}
                actions={
                  <span className="text-sm font-medium text-amber-100">
                    {formatCurrency(item.price)}
                  </span>
                }
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-slate-400">
                    Freshly prepared and sent directly to your room.
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-2">
                    <button
                      className="rounded-full bg-white/5 p-2 text-slate-100 transition hover:bg-white/10"
                      onClick={() => setQuantity(item.id, Math.max(0, quantity - 1))}
                      type="button"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-8 text-center text-sm">{quantity}</span>
                    <button
                      className="rounded-full bg-amber-300 p-2 text-slate-950 transition hover:bg-amber-200"
                      onClick={() => addItem(item)}
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </SectionCard>
            );
          })
        )}
      </div>

      <Link
        className="mt-6 flex items-center justify-between rounded-[28px] border border-amber-300/20 bg-amber-300/10 px-5 py-4 text-sm text-amber-50 transition hover:bg-amber-300/15"
        to="/checkout"
      >
        <div>
          <div className="font-medium">{cartCount} item units in cart</div>
          <div className="mt-1 text-xs text-amber-100/70">
            Estimated total {formatCurrency(cartTotal)}
          </div>
        </div>
        <ChevronRight className="h-5 w-5" />
      </Link>
    </GuestShell>
  );
}
