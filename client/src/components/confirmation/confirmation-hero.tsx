"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useOrderStore, type PlacedOrder } from "@/store/order-store";

/** True once the persisted last order has been loaded from localStorage (false on the server). */
export function useOrderHydrated() {
  return useSyncExternalStore(
    (cb) => useOrderStore.persist.onFinishHydration(cb),
    () => useOrderStore.persist.hasHydrated(),
    () => false,
  );
}

/** "ASAP" -> typical window for the fulfilment; a scheduled label is shown as-is. */
export function estimatedTime(order: Pick<PlacedOrder, "deliveryTime" | "fulfilment">) {
  const label = order.deliveryTime?.trim();
  if (!label || label.toUpperCase() === "ASAP") {
    return order.fulfilment === "collection" ? "15 - 20 mins" : "25 - 35 mins";
  }
  return label;
}

/** e.g. "13 Nov 2026, 17:01". Empty string when the date is missing or invalid. */
export function formatPlacedAt(iso: string | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

const heroBg =
  "bg-radial-[closest-side] from-[#05511d] via-[#043a15] to-[#03230d]";

const sectionClass = `flex w-full flex-col items-center gap-32 px-80 py-80 ${heroBg} max-lg:gap-[28px] max-lg:px-[40px] max-lg:py-[64px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:py-[48px]`;

const btnBase =
  "flex items-center justify-center rounded-pill px-24 py-16 font-heading text-16 leading-[normal] font-extrabold whitespace-nowrap text-white uppercase transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white max-lg:min-h-[52px] max-lg:px-[24px] max-lg:py-[14px] max-lg:text-[15px] max-sm:w-full";

function HeroSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading your order"
      className={`${sectionClass} h-603 max-lg:h-[540px] max-sm:h-[600px]`}
    >
      <div className="size-100 animate-pulse rounded-pill bg-pw-green-900 motion-reduce:animate-none max-lg:size-[88px]" />
      <div className="h-112 w-640 max-w-full animate-pulse rounded-24 bg-pw-green-900 motion-reduce:animate-none max-lg:h-[96px] max-lg:rounded-[20px]" />
      <div className="h-102 w-490 max-w-full animate-pulse rounded-16 bg-pw-green-900 motion-reduce:animate-none max-lg:h-[96px] max-lg:rounded-[16px] max-sm:h-[170px]" />
    </div>
  );
}

function NoOrder() {
  return (
    <section aria-label="No recent order" className={`${sectionClass} min-h-603 justify-center max-lg:min-h-[480px]`}>
      <div className="flex w-640 max-w-full flex-col items-center gap-24 rounded-32 border-[1.5px] border-solid border-white/15 bg-pw-green-900 px-48 py-56 text-center max-lg:gap-[20px] max-lg:rounded-[24px] max-lg:px-[32px] max-lg:py-[44px] max-sm:rounded-[20px] max-sm:px-[20px] max-sm:py-[32px]">
        <div className="flex size-80 items-center justify-center rounded-pill bg-pw-green-100 max-lg:size-[72px]">
          <Image src="/brand/icons/pizza.svg" alt="" width={40} height={40} className="block size-40 max-lg:size-[36px]" />
        </div>
        <div className="flex flex-col items-center gap-8 leading-[normal] max-lg:gap-[8px]">
          <h1 className="font-heading text-32 leading-[normal] font-black text-white max-lg:text-[length:clamp(24px,4vw,32px)]">
            No recent order found
          </h1>
          <p className="max-w-[46ch] font-body text-16 leading-[1.5] font-normal text-pw-green-100 max-lg:text-[15px]">
            We couldn&apos;t find an order on this device. Start a fresh one or track an existing order.
          </p>
        </div>
        <div className="flex items-center gap-16 max-lg:gap-[12px] max-sm:w-full max-sm:flex-col">
          <Link href="/menu" className={`${btnBase} bg-pw-red-600`}>
            Browse the menu
          </Link>
          <Link href="/order-tracking" className={`${btnBase} border-[1.5px] border-solid border-white`}>
            Track an order
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Celebration hero (Figma 97:1923): success ring, heading, order reference + ETA, progress bar. */
export function ConfirmationHero() {
  const hydrated = useOrderHydrated();
  const order = useOrderStore((s) => s.lastOrder);

  if (!hydrated) return <HeroSkeleton />;
  if (!order) return <NoOrder />;

  const isCollection = order.fulfilment === "collection";
  const firstName = order.customer?.name?.trim().split(/\s+/)[0];
  const eta = estimatedTime(order);

  return (
    <section aria-labelledby="confirmation-heading" className={sectionClass}>
      <div className="flex size-100 shrink-0 items-center justify-center rounded-pill border-4 border-solid border-pw-green-500 bg-pw-green-900 max-lg:size-[88px] max-lg:border-[4px]">
        <Image
          src="/brand/confirmation/check.svg"
          alt=""
          width={40}
          height={40}
          className="block size-40 max-lg:size-[36px]"
        />
      </div>

      <div className="flex w-full flex-col items-center gap-16 text-center leading-[normal] wrap-break-word max-lg:gap-[12px]">
        <h1
          id="confirmation-heading"
          className="w-full font-heading text-56 leading-[normal] font-black text-white uppercase max-lg:text-[length:clamp(32px,6vw,48px)] max-sm:text-[length:clamp(26px,8.5vw,36px)]"
        >
          Order confirmed!
        </h1>
        <p className="w-full font-body text-20 leading-[normal] font-normal text-pw-green-100 max-lg:text-[17px] max-lg:leading-[1.45] max-sm:text-[16px]">
          {firstName ? `Thanks, ${firstName}! ` : ""}Your pizza is being prepared with absolute sourdough perfection.
        </p>
      </div>

      <div className="flex items-center gap-48 rounded-16 bg-pw-green-900 p-24 max-lg:gap-[32px] max-lg:rounded-[16px] max-lg:p-[20px] max-sm:w-full max-sm:flex-col max-sm:items-start max-sm:gap-[16px]">
        <div className="flex flex-col items-start gap-4 leading-[normal] whitespace-nowrap max-lg:gap-[4px]">
          <p className="font-heading text-12 leading-[normal] font-extrabold text-pw-green-500 uppercase">
            Order Reference
          </p>
          <p className="font-heading text-28 leading-[normal] font-black text-white max-lg:text-[24px] max-sm:text-[22px]">
            #{order.id}
          </p>
        </div>
        <div
          aria-hidden="true"
          className="h-48 w-0 shrink-0 border-l border-solid border-white/15 max-lg:h-[48px] max-sm:h-0 max-sm:w-full max-sm:border-t max-sm:border-l-0"
        />
        <div className="flex flex-col items-start gap-4 leading-[normal] whitespace-nowrap max-lg:gap-[4px] max-sm:whitespace-normal">
          <p className="font-heading text-12 leading-[normal] font-extrabold text-pw-green-500 uppercase">
            {isCollection ? "Estimated Collection" : "Estimated Delivery"}
          </p>
          <p className="font-heading text-28 leading-[normal] font-black text-white max-lg:text-[24px] max-sm:text-[22px]">
            {eta}
          </p>
        </div>
      </div>

      <div className="flex w-500 max-w-full flex-col items-start gap-8 max-lg:w-[440px] max-lg:gap-[8px]">
        <div
          role="progressbar"
          aria-label="Order progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={35}
          aria-valuetext="Hand-stretching base"
          className="flex h-8 w-full items-start overflow-clip rounded-[calc(4*var(--u))] bg-pw-green-900 max-lg:h-[8px] max-lg:rounded-[4px]"
        >
          <div className="h-full w-[35%] bg-pw-green-500" />
        </div>
        <div className="flex w-full items-start justify-between gap-12 font-body text-12 leading-[normal] font-normal text-pw-green-100">
          <p>Hand-stretching base</p>
          <p className="opacity-60">{isCollection ? "Ready to collect" : "Out for delivery"}</p>
        </div>
      </div>
    </section>
  );
}
