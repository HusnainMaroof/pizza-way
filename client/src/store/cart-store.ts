import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrderItem } from "@/schemas/order";

export const MAX_ITEM_QTY = 20;

type CartState = {
  items: OrderItem[];
  /** Adds one (or `qty`) of an item; merges by id. */
  add: (item: Omit<OrderItem, "qty">, qty?: number) => void;
  /** Sets the quantity of an item (removes it when < 1). */
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Sum of price * qty. */
  total: () => number;
  /** Total number of pizzas/items (sum of qty). */
  count: () => number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const found = s.items.find((i) => i.id === item.id);
          return {
            items: found
              ? s.items.map((i) => (i.id === item.id ? { ...i, qty: Math.min(i.qty + qty, MAX_ITEM_QTY) } : i))
              : [...s.items, { ...item, qty: Math.min(qty, MAX_ITEM_QTY) }],
          };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          items:
            qty < 1
              ? s.items.filter((i) => i.id !== id)
              : s.items.map((i) => (i.id === id ? { ...i, qty: Math.min(Math.round(qty), MAX_ITEM_QTY) } : i)),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      total: () => round2(get().items.reduce((sum, i) => sum + i.price * i.qty, 0)),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: "pizzaway-cart", partialize: (s) => ({ items: s.items }), skipHydration: true },
  ),
);
