"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { CartItems, useCartHydrated } from "./cart-items";
import { OrderSummary } from "./order-summary";

const sectionClass =
  "flex w-full items-start gap-48 bg-white px-80 py-80 max-lg:flex-col max-lg:gap-[32px] max-lg:px-[40px] max-lg:py-[48px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:py-[32px]";

function CartSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your basket" className={sectionClass}>
      <div className="flex min-w-0 flex-1 flex-col gap-24 max-lg:w-full max-lg:gap-[16px]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-150 w-full animate-pulse rounded-24 border border-solid border-pw-line bg-pw-surface motion-reduce:animate-none max-lg:h-[130px] max-lg:rounded-[20px] max-sm:h-[164px] max-sm:rounded-[16px]"
          />
        ))}
        <div className="h-110 w-full animate-pulse rounded-28 bg-pw-green-100 motion-reduce:animate-none max-lg:h-[100px] max-lg:rounded-[24px] max-sm:h-[150px]" />
      </div>
      <div className="h-560 w-432 shrink-0 animate-pulse rounded-28 border-[1.5px] border-solid border-pw-line bg-pw-surface motion-reduce:animate-none max-lg:h-[480px] max-lg:w-full max-lg:rounded-[24px]" />
    </div>
  );
}

function EmptyBasket() {
  return (
    <div className={sectionClass}>
      <div className="flex w-full flex-col items-center gap-24 rounded-28 border border-solid border-pw-line bg-pw-surface px-48 py-80 text-center max-lg:gap-[20px] max-lg:rounded-[24px] max-lg:px-[32px] max-lg:py-[56px] max-sm:rounded-[20px] max-sm:px-[20px] max-sm:py-[40px]">
        <div className="flex size-80 items-center justify-center rounded-pill bg-pw-green-100 max-lg:size-[72px]">
          <Image src="/brand/icons/pizza.svg" alt="" width={40} height={40} className="block size-40 max-lg:size-[36px]" />
        </div>
        <div className="flex flex-col items-center gap-8 leading-[normal] max-lg:gap-[8px]">
          <h2 className="font-heading text-32 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(24px,4vw,32px)]">
            Your basket is empty
          </h2>
          <p className="max-w-[46ch] font-body text-16 leading-[1.5] font-normal text-pw-muted max-lg:text-[15px]">
            Nothing in here yet. Pick a favourite from the menu or build your own sourdough pizza.
          </p>
        </div>
        <div className="flex items-center gap-12 max-sm:w-full max-sm:flex-col">
          <Link
            href="/menu"
            className="flex items-center justify-center rounded-pill bg-pw-red-600 px-36 py-18 font-heading text-16 leading-[normal] font-extrabold whitespace-nowrap text-white uppercase transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[52px] max-lg:px-[28px] max-lg:py-[14px] max-lg:text-[15px] max-sm:w-full"
          >
            Browse the menu
          </Link>
          <Link
            href="/build-your-pizza"
            className="flex items-center justify-center rounded-pill border-2 border-solid border-pw-green-700 px-36 py-16 font-heading text-16 leading-[normal] font-extrabold whitespace-nowrap text-pw-green-700 uppercase transition-colors hover:bg-pw-green-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[52px] max-lg:px-[28px] max-lg:py-[12px] max-lg:text-[15px] max-sm:w-full"
          >
            Build your own
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CartContent() {
  const hydrated = useCartHydrated();
  const isEmpty = useCartStore((s) => s.items.length === 0);

  if (!hydrated) return <CartSkeleton />;
  if (isEmpty) return <EmptyBasket />;

  return (
    <section aria-label="Basket" className={sectionClass}>
      <div className="flex min-w-0 flex-1 flex-col items-start max-lg:w-full">
        <CartItems />
      </div>
      <div className="w-432 shrink-0 max-lg:w-full">
        <OrderSummary />
      </div>
    </section>
  );
}
