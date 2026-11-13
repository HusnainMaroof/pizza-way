"use client";

import { useCartStore } from "@/store/cart-store";
import { useCartHydrated } from "./cart-items";

export function CartHeader() {
  const hydrated = useCartHydrated();
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));

  return (
    <section
      aria-labelledby="cart-title"
      className="flex h-120 w-full items-center gap-16 bg-pw-green-700 px-80 max-lg:h-auto max-lg:min-h-[96px] max-lg:gap-[12px] max-lg:px-[40px] max-lg:py-[24px] max-sm:min-h-[80px] max-sm:px-[20px] max-sm:py-[20px]"
    >
      <h1
        id="cart-title"
        className="font-heading text-36 leading-[normal] font-black whitespace-nowrap text-white max-lg:text-[length:clamp(26px,4.5vw,36px)] max-sm:text-[length:clamp(22px,7vw,28px)]"
      >
        YOUR BASKET
      </h1>
      <p
        aria-live="polite"
        className={`flex shrink-0 items-start rounded-pill bg-pw-red-600 px-10 py-4 font-heading text-14 leading-[normal] font-extrabold whitespace-nowrap text-white transition-opacity max-lg:px-[10px] max-lg:py-[4px] max-lg:text-[13px] ${
          hydrated ? "opacity-100" : "opacity-0"
        }`}
      >
        {count} {count === 1 ? "item" : "items"}
      </p>
    </section>
  );
}
