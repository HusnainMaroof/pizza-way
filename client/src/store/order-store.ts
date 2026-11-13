import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrderItem } from "@/schemas/order";
import type { Fulfilment, Totals } from "@/lib/pricing";
import { useCartStore } from "@/store/cart-store";
import { usePromoStore } from "@/lib/pricing";

/** A placed order. Kept in localStorage so the confirmation and tracking pages can read it. NEVER store card numbers. */
export type PlacedOrder = {
  id: string; // e.g. "PW-48213"
  placedAt: string; // ISO date
  items: OrderItem[];
  totals: Totals;
  promoCode: string | null;
  fulfilment: Fulfilment;
  /** "ASAP" or a scheduled label such as "Today, 19:30". */
  deliveryTime: string;
  customer: { name: string; email: string; phone: string };
  /** Delivery only. */
  address?: { postcode: string; line1: string; line2?: string; city: string; instructions?: string };
  payment: { method: "card"; brand?: string; last4: string };
};

type OrderState = {
  lastOrder: PlacedOrder | null;
  /** All placed orders on this device, newest first (max 20). Shown in the account "My Orders" tab. */
  history: PlacedOrder[];
  /** Stores the order, clears the basket and the applied promo. Returns the order id. */
  place: (order: Omit<PlacedOrder, "id" | "placedAt">) => string;
  clearLast: () => void;
};

function makeOrderId() {
  return `PW-${Math.floor(10000 + Math.random() * 90000)}`;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      lastOrder: null,
      history: [],
      place: (order) => {
        const id = makeOrderId();
        const placed: PlacedOrder = { ...order, id, placedAt: new Date().toISOString() };
        set((s) => ({ lastOrder: placed, history: [placed, ...s.history].slice(0, 20) }));
        useCartStore.getState().clear();
        usePromoStore.getState().clear();
        return id;
      },
      clearLast: () => set({ lastOrder: null }),
    }),
    { name: "pizzaway-order", partialize: (s) => ({ lastOrder: s.lastOrder, history: s.history }), skipHydration: true },
  ),
);
