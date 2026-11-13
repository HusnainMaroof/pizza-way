"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCartHydrated } from "@/components/cart/cart-items";
import { useCartStore } from "@/store/cart-store";
import { CheckoutForm } from "./checkout-form";
import { OrderSummaryCard } from "./order-summary-card";

const sectionClass =
  "flex w-full items-start gap-48 bg-white px-80 py-80 max-lg:flex-col max-lg:gap-[32px] max-lg:px-[40px] max-lg:py-[48px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:py-[32px]";

function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading checkout" className={sectionClass}>
      <div className="flex w-740 min-w-0 shrink-0 flex-col gap-40 max-lg:w-full max-lg:gap-[32px]">
        <div className="h-87 w-340 animate-pulse rounded-pill bg-pw-surface motion-reduce:animate-none max-lg:h-[87px] max-lg:w-full max-lg:max-w-[340px] max-lg:rounded-[24px]" />
        <div className="h-211 w-full animate-pulse rounded-24 border border-solid border-pw-line bg-pw-surface motion-reduce:animate-none max-lg:h-[220px] max-lg:rounded-[20px]" />
        <div className="h-429 w-full animate-pulse rounded-24 border border-solid border-pw-line bg-pw-surface motion-reduce:animate-none max-lg:h-[440px] max-lg:rounded-[20px]" />
        <div className="h-92 w-full animate-pulse rounded-24 border border-solid border-pw-line bg-pw-surface motion-reduce:animate-none max-lg:h-[100px] max-lg:rounded-[20px]" />
        <div className="h-339 w-full animate-pulse rounded-24 border border-solid border-pw-line bg-pw-surface motion-reduce:animate-none max-lg:h-[360px] max-lg:rounded-[20px]" />
      </div>
      <div className="h-615 w-492 min-w-0 shrink-0 animate-pulse rounded-28 border-[1.5px] border-solid border-pw-line bg-pw-surface motion-reduce:animate-none max-lg:h-[520px] max-lg:w-full max-lg:rounded-[24px]" />
    </div>
  );
}

function EmptyCheckout() {
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
            Add a pizza or two before checking out.
          </p>
        </div>
        <Link
          href="/menu"
          className="flex items-center justify-center rounded-pill bg-pw-red-600 px-36 py-18 font-heading text-16 leading-[normal] font-extrabold whitespace-nowrap text-white uppercase transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[52px] max-lg:px-[28px] max-lg:py-[14px] max-lg:text-[15px] max-sm:w-full"
        >
          Browse the menu
        </Link>
      </div>
    </div>
  );
}

function Redirecting() {
  return (
    <div className={sectionClass}>
      <p
        role="status"
        className="w-full rounded-24 bg-pw-green-100 px-40 py-40 text-center font-heading text-20 leading-[normal] font-extrabold text-pw-green-900 max-lg:rounded-[20px] max-lg:px-[24px] max-lg:py-[32px] max-lg:text-[18px]"
      >
        Order placed. Taking you to your confirmation...
      </p>
    </div>
  );
}

/** Checkout workspace (Figma 97:1705): form on the left, order summary on the right (below on tablet/phone). */
export function CheckoutWorkspace() {
  const hydrated = useCartHydrated();
  const isEmpty = useCartStore((s) => s.items.length === 0);
  // Placing an order clears the basket; keep the empty state from flashing before navigation.
  const [placed, setPlaced] = useState(false);

  if (!hydrated) return <WorkspaceSkeleton />;
  if (placed) return <Redirecting />;
  if (isEmpty) return <EmptyCheckout />;

  return (
    <section aria-label="Checkout" className={sectionClass}>
      <div className="w-740 min-w-0 shrink-0 max-lg:w-full max-lg:shrink">
        <CheckoutForm onPlaced={() => setPlaced(true)} />
      </div>
      <div className="w-492 min-w-0 shrink-0 self-start lg:sticky lg:top-120 max-lg:w-full max-lg:shrink">
        <OrderSummaryCard />
      </div>
    </section>
  );
}
