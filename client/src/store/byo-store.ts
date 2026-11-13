import { create } from "zustand";
import { CRUSTS, MAX_QTY, SAUCES, SIZES, TOPPING_PRICE, TOPPINGS } from "@/lib/byo-data";
import type { CrustId, SauceId, SizeId } from "@/lib/byo-data";
import { useCartStore } from "@/store/cart-store";

type ByoState = {
  step: 1 | 2 | 3 | 4;
  size: SizeId;
  sauce: SauceId;
  crust: CrustId;
  toppings: string[]; // topping ids, in selection order
  qty: number;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setSize: (size: SizeId) => void;
  setSauce: (sauce: SauceId) => void;
  setCrust: (crust: CrustId) => void;
  toggleTopping: (id: string) => void;
  setQty: (qty: number) => void;
  reset: () => void;
  /** Unit price of one pizza: base size + toppings. */
  unitPrice: () => number;
  /** Price for qty pizzas. */
  total: () => number;
  /** Labels for the summary lines. */
  summary: () => { base: string; basePrice: number; sauce: string; crust: string; toppingNames: string[]; toppingsPrice: number };
  /** Adds qty copies of the configured pizza to the cart store. */
  addToBasket: () => void;
};

const initial = {
  step: 1 as const,
  size: "12" as SizeId,
  sauce: "tomato" as SauceId,
  crust: "stone-baked" as CrustId,
  toppings: ["double-cheese", "mushrooms", "pepperoni"],
  qty: 1,
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export const useByoStore = create<ByoState>((set, get) => ({
  ...initial,
  setStep: (step) => set({ step }),
  setSize: (size) => set({ size }),
  setSauce: (sauce) => set({ sauce }),
  setCrust: (crust) => set({ crust }),
  toggleTopping: (id) =>
    set((s) => ({ toppings: s.toppings.includes(id) ? s.toppings.filter((t) => t !== id) : [...s.toppings, id] })),
  setQty: (qty) => set({ qty: Math.min(MAX_QTY, Math.max(1, Math.round(qty))) }),
  reset: () => set({ ...initial }),
  unitPrice: () => {
    const { size, toppings } = get();
    const base = SIZES.find((s) => s.id === size)?.price ?? 0;
    return round2(base + toppings.length * TOPPING_PRICE);
  },
  total: () => round2(get().unitPrice() * get().qty),
  summary: () => {
    const { size, sauce, crust, toppings } = get();
    const sz = SIZES.find((s) => s.id === size)!;
    return {
      base: sz.summary,
      basePrice: sz.price,
      sauce: SAUCES.find((s) => s.id === sauce)!.summary,
      crust: CRUSTS.find((c) => c.id === crust)!.summary,
      toppingNames: toppings.map((id) => TOPPINGS.find((t) => t.id === id)?.label ?? id),
      toppingsPrice: round2(toppings.length * TOPPING_PRICE),
    };
  },
  addToBasket: () => {
    const { size, sauce, crust, toppings, qty } = get();
    const id = `byo-${size}-${sauce}-${crust}-${[...toppings].sort().join(".")}`;
    const sz = SIZES.find((s) => s.id === size)!;
    const name = `Custom ${sz.label} pizza`;
    const price = get().unitPrice();
    const meta = `${CRUSTS.find((c) => c.id === crust)!.label} · ${SAUCES.find((x) => x.id === sauce)!.label}${
      toppings.length ? ` · ${toppings.length} topping${toppings.length > 1 ? "s" : ""}` : ""
    }`;
    useCartStore.getState().add({ id, name, price, meta, image: "/brand/byo/pizza-preview.png" }, qty);
  },
}));
