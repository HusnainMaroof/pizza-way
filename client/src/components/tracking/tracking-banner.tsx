"use client";

import { useOrderStore } from "@/store/order-store";
import { useOrderHydrated } from "@/components/confirmation/confirmation-hero";

/** Green header banner (Figma 97:2079): label, heading and the huge faded order number. */
export function TrackingBanner() {
  const hydrated = useOrderHydrated();
  const order = useOrderStore((s) => s.lastOrder);
  const number = hydrated && order ? `#${order.id}` : "#--";

  return (
    <section
      aria-labelledby="tracking-heading"
      className="flex w-full flex-col items-start gap-16 bg-pw-green-700 p-80 leading-[normal] wrap-break-word max-lg:gap-[12px] max-lg:px-[40px] max-lg:py-[56px] max-sm:px-[20px] max-sm:py-[40px]"
    >
      <p className="w-full font-heading text-14 leading-[normal] font-extrabold text-pw-green-500 uppercase">
        Live telemetry workspace
      </p>
      <div className="flex w-full flex-wrap items-center justify-between gap-x-32 font-heading font-black max-lg:flex-col max-lg:items-start max-lg:gap-[8px]">
        <h1
          id="tracking-heading"
          className="font-heading text-48 leading-[normal] font-black whitespace-nowrap text-white uppercase max-lg:text-[length:clamp(30px,5vw,44px)] max-sm:text-[length:clamp(26px,8.5vw,34px)] max-sm:whitespace-normal"
        >
          Track your order
        </h1>
        <p
          aria-label={hydrated && order ? `Order number ${order.id}` : "No order number"}
          className="min-w-0 max-w-full text-[length:calc(128*var(--u))] leading-[normal] whitespace-nowrap text-[#28a751] max-lg:text-[length:clamp(64px,11vw,110px)] max-sm:text-[length:clamp(40px,13vw,72px)] max-sm:whitespace-normal max-sm:wrap-anywhere"
        >
          {number}
        </p>
      </div>
    </section>
  );
}
