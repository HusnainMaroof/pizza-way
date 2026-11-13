"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";
import { useOrderStore } from "@/store/order-store";
import { useAuthStore } from "@/store/auth-store";

/** Loads the saved basket and last order from localStorage after hydration (avoids server/client mismatch). */
export function CartHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    void useOrderStore.persist.rehydrate();
    void useAuthStore.persist.rehydrate();
  }, []);
  return null;
}
