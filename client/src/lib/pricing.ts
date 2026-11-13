import { z } from "zod";
import { create } from "zustand";

/** Flat delivery fee shown in the cart design (£2.99). */
export const DELIVERY_FEE = 2.99;

/** Promo codes -> percent off the subtotal. */
export const PROMO_CODES: Readonly<Record<string, number>> = {
  PIZZA10: 10,
};

export type Fulfilment = "delivery" | "collection";

/** Promo input: trimmed, upper-cased, 3-20 letters/digits. */
export const promoCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{3,20}$/, "Invalid promo code");

export type Totals = { subtotal: number; discount: number; delivery: number; total: number };

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Basket totals. Delivery is 0 when the basket is empty or when the order is collected.
 * `fulfilment` is optional so `calcTotals(subtotal, percent)` keeps working.
 */
export function calcTotals(subtotal: number, promoPercent = 0, fulfilment: Fulfilment = "delivery"): Totals {
  const sub = round2(Math.max(0, subtotal));
  const pct = Math.min(100, Math.max(0, promoPercent));
  const discount = round2((sub * pct) / 100);
  const delivery = sub > 0 && fulfilment === "delivery" ? DELIVERY_FEE : 0;
  return { subtotal: sub, discount, delivery, total: round2(sub - discount + delivery) };
}

type PromoState = {
  code: string | null;
  percent: number;
  /** Validates + applies a code. Returns false (and keeps the current promo) when invalid/unknown. */
  apply: (code: string) => boolean;
  clear: () => void;
};

/** In-memory (non-persisted) applied promo, shared by cart and checkout. */
export const usePromoStore = create<PromoState>()((set) => ({
  code: null,
  percent: 0,
  apply: (raw) => {
    const parsed = promoCodeSchema.safeParse(raw);
    if (!parsed.success) return false;
    const percent = PROMO_CODES[parsed.data];
    if (percent === undefined) return false;
    set({ code: parsed.data, percent });
    return true;
  },
  clear: () => set({ code: null, percent: 0 }),
}));

type FulfilmentState = { mode: Fulfilment; setMode: (mode: Fulfilment) => void };

/** In-memory delivery/collection choice (cart design toggle), shared with checkout. */
export const useFulfilmentStore = create<FulfilmentState>()((set) => ({
  mode: "delivery",
  setMode: (mode) => set({ mode }),
}));
