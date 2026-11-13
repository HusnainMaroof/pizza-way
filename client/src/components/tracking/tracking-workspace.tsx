"use client";

import Image from "next/image";
import Link from "next/link";
import { useOrderStore } from "@/store/order-store";
import { getTrackingState, useNow } from "@/lib/tracking";
import { useOrderHydrated } from "@/components/confirmation/confirmation-hero";
import { PipelineCard } from "./pipeline-card";
import { TransitMap } from "./transit-map";
import { TrackingSidebar } from "./tracking-sidebar";

const sectionClass =
  "flex w-full items-start gap-48 bg-pw-surface px-80 py-96 max-lg:flex-col max-lg:gap-[32px] max-lg:px-[40px] max-lg:py-[56px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:py-[40px]";

const btnBase =
  "flex min-h-[44px] items-center justify-center rounded-pill px-24 py-16 font-heading text-16 leading-[normal] font-extrabold whitespace-nowrap uppercase transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[52px] max-lg:px-[24px] max-lg:py-[14px] max-lg:text-[15px] max-sm:w-full";

const pulse = "animate-pulse bg-pw-line motion-reduce:animate-none";

function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your order" className={sectionClass}>
      <div className="flex min-w-0 flex-[1_0_0] flex-col gap-48 max-lg:w-full max-lg:flex-none max-lg:gap-[32px]">
        <div className={`h-402 w-full rounded-32 max-lg:h-[380px] max-lg:rounded-[24px] ${pulse}`} />
        <div className={`h-441 w-full rounded-24 max-lg:aspect-[832/441] max-lg:h-auto max-lg:rounded-[20px] max-sm:aspect-[4/3] ${pulse}`} />
      </div>
      <div className={`h-514 w-400 shrink-0 rounded-24 max-lg:h-[360px] max-lg:w-full max-lg:rounded-[20px] ${pulse}`} />
    </div>
  );
}

function NoOrder() {
  return (
    <section aria-labelledby="no-order-heading" className={`${sectionClass} justify-center max-lg:items-center`}>
      <div className="flex w-640 max-w-full flex-col items-center gap-24 rounded-32 border-[1.5px] border-solid border-pw-line bg-white px-48 py-56 text-center max-lg:gap-[20px] max-lg:rounded-[24px] max-lg:px-[32px] max-lg:py-[44px] max-sm:rounded-[20px] max-sm:px-[20px] max-sm:py-[32px]">
        <div className="flex size-80 items-center justify-center rounded-pill bg-pw-green-100 max-lg:size-[72px]">
          <Image src="/brand/icons/pizza.svg" alt="" width={40} height={40} className="block size-40 max-lg:size-[36px]" />
        </div>
        <div className="flex flex-col items-center gap-8 leading-[normal] max-lg:gap-[8px]">
          <h2 id="no-order-heading" className="font-heading text-32 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(24px,4vw,32px)]">
            No order to track
          </h2>
          <p className="max-w-[46ch] font-body text-16 leading-[1.5] font-normal text-pw-muted max-lg:text-[15px]">
            We couldn&apos;t find a recent order on this device. Place a new order or get in touch and we&apos;ll help.
          </p>
        </div>
        <div className="flex items-center gap-16 max-lg:gap-[12px] max-sm:w-full max-sm:flex-col">
          <Link href="/menu" className={`${btnBase} bg-pw-red-600 text-white`}>
            Browse the menu
          </Link>
          <Link href="/contact" className={`${btnBase} border-[1.5px] border-solid border-pw-green-700 text-pw-green-700`}>
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Tracking workspace (Figma 97:2084): live pipeline + transit map on the left, live sidebar on the right. */
export function TrackingWorkspace() {
  const hydrated = useOrderHydrated();
  const order = useOrderStore((s) => s.lastOrder);
  const now = useNow(30000);

  if (!hydrated) return <WorkspaceSkeleton />;
  if (!order) return <NoOrder />;

  const collection = order.fulfilment === "collection";
  const state = getTrackingState(order, now ?? new Date(order.placedAt));

  return (
    <section aria-label="Order tracking" className={sectionClass}>
      <div className="flex min-w-0 flex-[1_0_0] flex-col items-start gap-48 max-lg:w-full max-lg:flex-none max-lg:gap-[32px] max-sm:gap-[24px]">
        <PipelineCard state={state} collection={collection} />
        <TransitMap progress={state.progress} collection={collection} />
      </div>
      <TrackingSidebar />
    </section>
  );
}
