"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useOrderHydrated } from "@/components/confirmation/confirmation-hero";
import { useOrderStore, type PlacedOrder } from "@/store/order-store";

type SavedAddress = {
  key: string;
  address: NonNullable<PlacedOrder["address"]>;
  lastUsed: string;
  uses: number;
};

const SECTION = "flex w-full min-w-0 flex-col items-start gap-32 max-lg:gap-[24px]";
const HEADING =
  "font-heading text-32 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(24px,4vw,30px)]";
const CARD =
  "flex w-full min-w-0 flex-col items-start gap-12 rounded-20 border-[1.5px] border-solid border-pw-line bg-white p-24 wrap-break-word max-lg:gap-[10px] max-lg:rounded-[20px] max-lg:p-[20px] max-sm:p-[16px]";
const PILL =
  "inline-flex items-center justify-center rounded-pill bg-pw-green-700 px-24 py-12 font-heading text-13 leading-[normal] font-extrabold whitespace-nowrap text-white uppercase transition-colors hover:bg-pw-green-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[44px] max-lg:px-[24px] max-lg:text-[14px] max-sm:w-full";

/** "13 Nov 2026". Empty string when invalid. */
function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");

/** Unique delivery addresses from the order history (newest first = last used). */
function deriveAddresses(history: PlacedOrder[]): SavedAddress[] {
  const map = new Map<string, SavedAddress>();
  for (const order of history) {
    const a = order.address;
    if (!a?.line1) continue;
    const key = [a.line1, a.line2, a.city, a.postcode].map(norm).join("|");
    const found = map.get(key);
    if (found) found.uses += 1;
    else map.set(key, { key, address: a, lastUsed: order.placedAt, uses: 1 });
  }
  return [...map.values()];
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your addresses" className="grid w-full grid-cols-2 gap-16 max-lg:grid-cols-1 max-lg:gap-[16px]">
      {[0, 1].map((i) => (
        <div key={i} className="h-170 w-full animate-pulse rounded-20 bg-pw-line motion-reduce:animate-none max-lg:h-[150px] max-lg:rounded-[20px]" />
      ))}
    </div>
  );
}

/** Account "My Addresses" tab: delivery addresses used on this device. */
export function AddressesPanel() {
  const hydrated = useOrderHydrated();
  const history = useOrderStore((s) => s.history);
  const addresses = useMemo(() => deriveAddresses(history ?? []), [history]);

  return (
    <section aria-labelledby="account-addresses-heading" className={SECTION}>
      <h2 id="account-addresses-heading" className={HEADING}>
        My Addresses
      </h2>

      {!hydrated ? (
        <Skeleton />
      ) : addresses.length === 0 ? (
        <div className="flex w-full min-w-0 flex-col items-start gap-20 rounded-20 border-[1.5px] border-solid border-pw-line bg-white p-24 max-lg:gap-[16px] max-lg:rounded-[20px] max-lg:p-[20px] max-sm:p-[16px]">
          <p className="font-body text-15 leading-[1.5] font-normal text-pw-muted max-lg:text-[15px]">
            No saved addresses yet. Your delivery addresses will appear here after your first order.
          </p>
          <Link href="/menu" className={PILL}>
            Browse the menu
          </Link>
        </div>
      ) : (
        <ul className="m-0 grid w-full list-none grid-cols-2 gap-16 p-0 max-lg:grid-cols-1 max-lg:gap-[16px]">
          {addresses.map(({ key, address, lastUsed, uses }) => {
            const day = formatDay(lastUsed);
            return (
              <li key={key} className={CARD}>
                <p className="font-heading text-12 leading-[normal] font-extrabold text-pw-green-700 uppercase max-lg:text-[12px]">
                  Delivery address
                </p>
                <address className="flex w-full flex-col gap-4 not-italic leading-[normal] max-lg:gap-[4px]">
                  <span className="font-heading text-18 leading-[normal] font-extrabold text-pw-ink max-lg:text-[17px]">
                    {address.line1}
                  </span>
                  {address.line2 ? (
                    <span className="font-body text-14 leading-[normal] font-normal text-pw-muted max-lg:text-[14px]">
                      {address.line2}
                    </span>
                  ) : null}
                  <span className="font-body text-14 leading-[normal] font-normal text-pw-muted max-lg:text-[14px]">
                    {address.city}
                  </span>
                  <span className="font-body text-14 leading-[normal] font-bold text-pw-ink uppercase max-lg:text-[14px]">
                    {address.postcode}
                  </span>
                </address>
                <div className="flex flex-wrap items-center gap-6 max-lg:gap-[6px]">
                  <span aria-hidden="true" className="block size-8 shrink-0 rounded-pill bg-pw-green-700 max-lg:size-[8px]" />
                  <p className="font-body text-13 leading-[normal] font-bold text-pw-green-700 max-lg:text-[13px]">
                    {day ? `Last used ${day}` : "Used recently"}
                    {uses > 1 ? ` · ${uses} orders` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
