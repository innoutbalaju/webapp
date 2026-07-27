import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ConciergeBell, Plus, Power, Trash2 } from 'lucide-react';

import { AdminShell } from '@/components/AdminShell';
import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/store/sessionStore';
import type { MenuCategory, MenuItem } from '@/types/domain';

const categories: MenuCategory[] = ['Food', 'Beverage', 'Amenities'];

const initialForm = {
  title: '',
  category: 'Food' as MenuCategory,
  price: '0.00',
};

export default function AdminMenuPage() {
  const role = useSessionStore((state) => state.role);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMenu();
  }, []);

  if (role !== 'admin') {
    return <Navigate replace to="/login" />;
  }

  async function loadMenu() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category')
      .order('title');

    if (error) {
      setErrorMessage(getErrorMessage(error));
      return;
    }

    setMenuItems((data as MenuItem[]) ?? []);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { error } = await (supabase.from('menu_items') as any).insert({
      title: form.title,
      category: form.category,
      price: Number(form.price),
      is_available: true,
    });

    if (error) {
      setErrorMessage(getErrorMessage(error));
      return;
    }

    setForm(initialForm);
    await loadMenu();
  }

  async function toggleAvailability(item: MenuItem) {
    const { error } = await (supabase.from('menu_items') as any)
      .update({ is_available: !item.is_available })
      .eq('id', item.id);

    if (error) {
      setErrorMessage(getErrorMessage(error));
      return;
    }

    await loadMenu();
  }

  async function removeItem(itemId: string) {
    const { error } = await (supabase.from('menu_items') as any).delete().eq('id', itemId);

    if (error) {
      setErrorMessage(getErrorMessage(error));
      return;
    }

    await loadMenu();
  }

  return (
    <AdminShell
      title="Menu management"
      subtitle="Control what guests can order, keep prices current, and hide items immediately when stock runs out."
    >
      {errorMessage ? (
        <div className="mb-5 rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-400/30">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_1.6fr]">
        <SectionCard
          title="Add menu item"
          description="New items become available to guests immediately after they are saved."
        >
          <form className="space-y-4" onSubmit={handleCreate}>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
                Item title
              </span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm outline-none focus:border-amber-300"
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                value={form.title}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
                Category
              </span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm outline-none focus:border-amber-300"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value as MenuCategory,
                  }))
                }
                value={form.category}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
                Price
              </span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm outline-none focus:border-amber-300"
                onChange={(event) =>
                  setForm((current) => ({ ...current, price: event.target.value }))
                }
                value={form.price}
              />
            </label>
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-300 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-amber-200"
              type="submit"
            >
              <Plus className="h-4 w-4" />
              Add item
            </button>
          </form>
        </SectionCard>

        {menuItems.length === 0 ? (
          <EmptyState
            title="No menu items yet"
            description="Create at least one menu item before opening the guest portal."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {menuItems.map((item) => (
              <SectionCard
                key={item.id}
                title={item.title}
                description={item.category}
                actions={
                  <span className="text-sm font-medium text-amber-100">
                    {formatCurrency(item.price)}
                  </span>
                }
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-3xl bg-white/5 px-4 py-3 text-sm">
                    <span className="text-slate-300">Availability</span>
                    <span className={item.is_available ? 'text-emerald-200' : 'text-rose-200'}>
                      {item.is_available ? 'Visible to guests' : 'Hidden from guests'}
                    </span>
                  </div>
                  <div className="grid gap-2">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10"
                      onClick={() => toggleAvailability(item)}
                      type="button"
                    >
                      <Power className="h-4 w-4" />
                      {item.is_available ? 'Disable item' : 'Enable item'}
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-100 transition hover:bg-rose-500/25"
                      onClick={() => removeItem(item.id)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove item
                    </button>
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
