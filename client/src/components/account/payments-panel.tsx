"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useOrderHydrated } from "@/components/confirmation/confirmation-hero";
import { useOrderStore, type PlacedOrder } from "@/store/order-store";

type SavedCard = { key: string; brand: string; last4: string; lastUsed: string };

const SECTION = "flex w-full min-w-0 flex-col items-start gap-32 max-lg:gap-[24px]";
const HEADING =
  "font-heading text-32 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(24px,4vw,30px)]";
const CARD =
  "flex w-full min-w-0 items-center justify-between gap-24 rounded-20 border-[1.5px] border-solid border-pw-line bg-white p-24 max-lg:gap-[16px] max-lg:rounded-[20px] max-lg:p-[20px] max-sm:flex-col max-sm:items-start max-sm:p-[16px]";
const PILL =
  "inline-flex items-center justify-center rounded-pill bg-pw-green-700 px-24 py-12 font-heading text-13 leading-[normal] font-extrabold whitespace-nowrap text-white uppercase transition-colors hover:bg-pw-green-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[44px] max-lg:px-[24px] max-lg:text-[14px] max-sm:w-full";

function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

/** Unique cards (brand + last 4) from the order history, newest first. */
function deriveCards(history: PlacedOrder[]): SavedCard[] {
  const map = new Map<string, SavedCard>();
  for (const order of history) {
    const last4 = order.payment?.last4?.trim();
    if (!last4) continue;
    const brand = order.payment.brand?.trim() || "Card";
    const key = `${brand.toLowerCase()}|${last4}`;
    if (!map.has(key)) map.set(key, { key, brand, last4, lastUsed: order.placedAt });
  }
  return [...map.values()];
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your payment methods" className="flex w-full flex-col gap-16 max-lg:gap-[16px]">
      {[0, 1].map((i) => (
        <div key={i} className="h-96 w-full animate-pulse rounded-20 bg-pw-line motion-reduce:animate-none max-lg:h-[96px] max-lg:rounded-[20px]" />
      ))}
    </div>
  );
}

/** Account "Payment Methods" tab: cards used on this device (brand + last 4 only). */
export function PaymentsPanel() {
  const hydrated = useOrderHydrated();
  const history = useOrderStore((s) => s.history);
  const cards = useMemo(() => deriveCards(history ?? []), [history]);

  return (
    <section aria-labelledby="account-payments-heading" className={SECTION}>
      <h2 id="account-payments-heading" className={HEADING}>
        Payment Methods
      </h2>

      {!hydrated ? (
        <Skeleton />
      ) : cards.length === 0 ? (
        <div className={`${CARD} max-lg:flex-col max-lg:items-start`}>
          <p className="font-body text-15 leading-[1.5] font-normal text-pw-muted max-lg:text-[15px]">
            No saved payment methods yet. Cards you pay with will appear here after your first order.
          </p>
          <Link href="/menu" className={PILL}>
            Browse the menu
          </Link>
        </div>
      ) : (
        <ul className="m-0 flex w-full list-none flex-col gap-16 p-0 max-lg:gap-[16px]">
          {cards.map(({ key, brand, last4, lastUsed }) => {
            const day = formatDay(lastUsed);
            return (
              <li key={key} className={CARD}>
                <div className="flex min-w-0 items-center gap-16 max-lg:gap-[14px]">
                  <span
                    aria-hidden="true"
                    className="flex shrink-0 items-center justify-center rounded-[calc(6*var(--u))] border-[1.5px] border-solid border-pw-green-700 bg-white px-10 py-6 font-heading text-12 leading-[normal] font-extrabold text-pw-ink uppercase max-lg:rounded-[6px] max-lg:px-[10px] max-lg:py-[6px] max-lg:text-[12px]"
                  >
                    {brand}
                  </span>
                  <div className="flex min-w-0 flex-col gap-4 leading-[normal] max-lg:gap-[4px]">
                    <p className="font-heading text-18 leading-[normal] font-extrabold text-pw-ink max-lg:text-[17px]">{brand}</p>
                    <p className="font-body text-14 leading-[normal] font-normal whitespace-nowrap text-pw-muted max-lg:text-[14px]">
                      Ending in •••• {last4}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-6 max-lg:gap-[6px]">
                  <span aria-hidden="true" className="block size-8 shrink-0 rounded-pill bg-pw-green-700 max-lg:size-[8px]" />
                  <p className="font-body text-13 leading-[normal] font-bold whitespace-nowrap text-pw-green-700 max-lg:text-[13px]">
                    {day ? `Last used ${day}` : "Used recently"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="w-full rounded-16 bg-pw-green-100 px-20 py-16 font-body text-14 leading-[1.5] font-normal text-pw-green-900 max-lg:rounded-[16px] max-lg:px-[16px] max-lg:py-[14px] max-lg:text-[14px]">
        For your security we only keep the card brand and last 4 digits.
      </p>
    </section>
  );
}
