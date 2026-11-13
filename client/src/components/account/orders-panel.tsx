"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useOrderStore, type PlacedOrder } from "@/store/order-store";
import { useCartStore } from "@/store/cart-store";
import { getTrackingState, useNow } from "@/lib/tracking";
import { useOrderHydrated } from "@/components/confirmation/confirmation-hero";
import { money } from "@/components/cart/cart-items";

/** Panel heading style shared by the account panels (Figma "Recent Orders"). */
const headingClass =
  "font-heading text-32 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(24px,4vw,30px)]";

const cardClass =
  "flex w-full items-center justify-between gap-24 rounded-20 border-[1.5px] border-solid border-pw-line bg-white p-24 max-lg:rounded-[18px] max-lg:p-[20px] max-sm:flex-col max-sm:items-stretch max-sm:gap-[16px] max-sm:p-[16px]";

const pillBtn =
  "flex items-center justify-center rounded-pill px-24 py-12 font-heading text-13 leading-[normal] font-extrabold whitespace-nowrap text-white uppercase transition-colors hover:bg-pw-green-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[44px] max-lg:px-[22px] max-lg:text-[13px]";

/** "15 Jan 2026" */
function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

/** '2 × Margherita 12", Garlic Bread (4PCS)' */
function itemsSummary(order: PlacedOrder) {
  return order.items.map((i) => (i.qty > 1 ? `${i.qty} × ${i.name}` : i.name)).join(", ");
}

function OrderStatus({ order, now }: { order: PlacedOrder; now: Date | null }) {
  if (!now) return <div aria-hidden="true" className="h-17 max-lg:h-[17px]" />;
  const { done } = getTrackingState(order, now);
  const isCollection = order.fulfilment === "collection";

  if (done) {
    return (
      <p className="flex items-center gap-6 font-body text-13 leading-[normal] font-bold whitespace-nowrap text-pw-green-700 max-lg:gap-[6px]">
        <span aria-hidden="true" className="block size-8 shrink-0 rounded-pill bg-pw-green-700 max-lg:size-[8px]" />
        {isCollection ? "Collected ✓" : "Delivered ✓"}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-12 max-lg:gap-[12px]">
      <p className="flex items-center gap-6 font-body text-13 leading-[normal] font-bold whitespace-nowrap text-amber-700 max-lg:gap-[6px]">
        <span
          aria-hidden="true"
          className="block size-8 shrink-0 animate-pulse rounded-pill bg-amber-500 motion-reduce:animate-none max-lg:size-[8px]"
        />
        In progress
      </p>
      <Link
        href="/order-tracking"
        className="font-body text-13 leading-[normal] font-bold text-pw-green-700 underline underline-offset-2 hover:text-pw-green-600 max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center"
      >
        Track
      </Link>
    </div>
  );
}

function OrderCard({ order, now }: { order: PlacedOrder; now: Date | null }) {
  const add = useCartStore((s) => s.add);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function reorder() {
    order.items.forEach(({ qty, ...item }) => add(item, qty));
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  }

  return (
    <li className={cardClass}>
      <div className="flex w-500 max-w-full min-w-0 shrink flex-col items-start gap-12 max-lg:gap-[10px] max-sm:w-full">
        <div className="flex flex-wrap items-center gap-x-12 gap-y-4 leading-[normal] max-lg:gap-x-[12px] max-lg:gap-y-[4px]">
          <h3 className="font-heading text-18 leading-[normal] font-extrabold text-pw-ink max-lg:text-[17px]">
            Order #{order.id}
          </h3>
          <p className="font-body text-13 leading-[normal] font-normal text-pw-muted">
            Placed on <time dateTime={order.placedAt}>{formatDay(order.placedAt)}</time>
          </p>
        </div>
        <p className="w-full font-body text-14 leading-[normal] font-normal wrap-break-word text-pw-muted">
          {itemsSummary(order)}
        </p>
        <OrderStatus order={order} now={now} />
      </div>

      <div className="flex shrink-0 items-center gap-32 max-lg:gap-[20px] max-sm:justify-between">
        <p className="font-heading text-22 leading-[normal] font-black whitespace-nowrap text-pw-ink max-lg:text-[20px]">
          {money(order.totals.total)}
        </p>
        <div className="flex flex-col items-center gap-6 max-lg:gap-[4px]">
          <button
            type="button"
            onClick={reorder}
            className={`${pillBtn} ${added ? "bg-pw-green-600" : "bg-pw-green-700"}`}
          >
            <span aria-live="polite">
              {added ? "Added ✓" : "Reorder"}
              <span className="sr-only">{added ? " to basket" : ` order ${order.id}`}</span>
            </span>
          </button>
          {added && (
            <Link
              href="/cart"
              className="font-body text-12 leading-[normal] font-bold text-pw-green-700 underline underline-offset-2 hover:text-pw-green-600 max-lg:inline-flex max-lg:min-h-[32px] max-lg:items-center"
            >
              View basket
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

function EmptyOrders() {
  return (
    <div className="flex w-full flex-col items-center gap-16 rounded-20 border-[1.5px] border-solid border-pw-line bg-white px-32 py-48 text-center max-lg:gap-[14px] max-lg:rounded-[18px] max-lg:px-[24px] max-lg:py-[40px] max-sm:px-[16px] max-sm:py-[32px]">
      <h3 className="font-heading text-22 leading-[normal] font-black text-pw-ink max-lg:text-[20px]">No orders yet</h3>
      <p className="max-w-[44ch] font-body text-14 leading-[1.5] font-normal text-pw-muted max-lg:text-[14px]">
        Your past orders will show up here so you can reorder your favourites in one tap.
      </p>
      <Link href="/menu" className={`${pillBtn} bg-pw-green-700`}>
        Browse the menu
      </Link>
    </div>
  );
}

/** "My Orders" tab (Figma 97:2807): recent orders from this device, newest first. */
export function OrdersPanel() {
  const hydrated = useOrderHydrated();
  const history = useOrderStore((s) => s.history);
  const now = useNow();

  return (
    <section aria-labelledby="orders-heading" className="flex w-full flex-col items-start gap-32 max-lg:gap-[24px] max-sm:gap-[20px]">
      <h2 id="orders-heading" className={headingClass}>
        Recent Orders
      </h2>
      {!hydrated ? (
        <div aria-busy="true" aria-label="Loading your orders" className="flex w-full flex-col gap-16 max-lg:gap-[14px]">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-136 w-full animate-pulse rounded-20 bg-pw-line motion-reduce:animate-none max-lg:h-[130px] max-lg:rounded-[18px] max-sm:h-[190px]"
            />
          ))}
        </div>
      ) : history.length === 0 ? (
        <EmptyOrders />
      ) : (
        <ul className="flex w-full flex-col gap-16 max-lg:gap-[14px]">
          {history.map((order) => (
            <OrderCard key={`${order.id}-${order.placedAt}`} order={order} now={now} />
          ))}
        </ul>
      )}
    </section>
  );
}
