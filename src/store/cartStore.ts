import { create } from 'zustand';

import type { MenuItem, OrderItemInput } from '@/types/domain';

type CartState = {
  items: OrderItemInput[];
  addItem: (menuItem: MenuItem) => void;
  removeItem: (itemId: string) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
};

function upsertItem(
  currentItems: OrderItemInput[],
  itemId: string,
  quantity: number,
) {
  const existing = currentItems.find((item) => item.item_id === itemId);

  if (!existing && quantity > 0) {
    return [...currentItems, { item_id: itemId, quantity }];
  }

  return currentItems
    .map((item) =>
      item.item_id === itemId ? { ...item, quantity } : item,
    )
    .filter((item) => item.quantity > 0);
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (menuItem) =>
    set((state) => {
      const existing =
        state.items.find((item) => item.item_id === menuItem.id)?.quantity ?? 0;

      return {
        items: upsertItem(state.items, menuItem.id, existing + 1),
      };
    }),
  removeItem: (itemId) =>
    set((state) => ({
      items: state.items.filter((item) => item.item_id !== itemId),
    })),
  setQuantity: (itemId, quantity) =>
    set((state) => ({
      items: upsertItem(state.items, itemId, quantity),
    })),
  clearCart: () => set({ items: [] }),
}));
