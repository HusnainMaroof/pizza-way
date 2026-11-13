"use client";

import { getTrackingState, useNow } from "@/lib/tracking";
import { useOrderStore } from "@/store/order-store";

const money = (n: number | undefined) => `£${(Number.isFinite(n) ? (n as number) : 0).toFixed(2)}`;

const cardClass =
  "flex w-full min-w-0 flex-col items-start gap-20 rounded-24 border-[1.5px] border-solid border-pw-line bg-white p-32 wrap-break-word max-lg:gap-[16px] max-lg:rounded-[20px] max-lg:p-[24px] max-sm:p-[20px]";

const divider = <div aria-hidden="true" className="h-0 w-full border-t-[1.5px] border-solid border-pw-line" />;

/** Order tracking live sidebar (Figma 97:2143): courier / collection card + compact order summary. */
export function TrackingSidebar() {
  const order = useOrderStore((s) => s.lastOrder);
  const now = useNow(30000);

  if (!order) return null;

  const isCollection = order.fulfilment === "collection";
  const items = order.items ?? [];
  const firstName = items[0]?.name ?? "order";
  const state = getTrackingState(order, now ?? undefined);
  const mins = state.etaMinutes;

  const person = isCollection
    ? { initial: "P", name: "Pizzaway Counter", role: "Collection counter" }
    : { initial: "A", name: "Ahmed", role: "Professional Pizzaway Courier" };

  const quote = isCollection
    ? state.done
      ? "Your order is ready and waiting for you at the collection counter."
      : "Your order will be waiting for you at the collection counter."
    : state.done
      ? `Hi, I'm Ahmed. Your ${firstName} has arrived. I'm here!`
      : `Hi, I'm Ahmed. Your ${firstName} is locked securely in my thermal box. I'll see you in about ${mins} ${mins === 1 ? "minute" : "minutes"}.`;

  return (
    <aside
      aria-label="Live order details"
      className="flex w-400 shrink-0 flex-col items-start gap-32 max-lg:grid max-lg:w-full max-lg:grid-cols-2 max-lg:items-stretch max-lg:gap-[20px] max-sm:grid-cols-1 max-sm:gap-[16px]"
    >
      {/* Courier / collection card */}
      <div className={cardClass}>
        <div className="flex w-full items-center gap-16 max-lg:gap-[14px]">
          <div
            aria-hidden="true"
            className="flex size-64 shrink-0 items-center justify-center rounded-32 bg-pw-green-700 max-lg:size-[56px] max-lg:rounded-[28px]"
          >
            <span className="font-heading text-24 leading-[normal] font-extrabold text-white max-lg:text-[22px]">
              {person.initial}
            </span>
          </div>
          <div className="flex min-w-0 flex-[1_0_0] flex-col items-start gap-4 leading-[normal] max-lg:gap-[4px]">
            <p className="w-full font-heading text-18 leading-[normal] font-extrabold text-pw-ink max-lg:text-[17px]">
              {person.name}
            </p>
            <p className="w-full font-body text-14 leading-[normal] font-normal text-pw-muted max-lg:text-[14px]">
              {person.role}
            </p>
          </div>
        </div>
        {divider}
        <p
          aria-live="polite"
          className="w-full font-body text-14 leading-22 font-normal text-pw-muted max-lg:text-[14px] max-lg:leading-[22px]"
        >
          &ldquo;{quote}&rdquo;
        </p>
      </div>

      {/* Compact order summary */}
      <div className={cardClass}>
        <h2 className="w-full font-heading text-18 leading-[normal] font-extrabold text-pw-ink max-lg:text-[17px]">
          Order Summary
        </h2>
        <ul className="flex w-full flex-col items-start gap-12 font-body text-14 leading-[normal] font-normal text-pw-ink max-lg:gap-[10px] max-lg:text-[14px]">
          {items.map((item, i) => (
            <li key={`${item.id}-${i}`} className="flex w-full items-start justify-between gap-16 max-lg:gap-[12px]">
              <span className="min-w-0 wrap-break-word">
                {item.qty} × {item.name}
              </span>
              <span className="shrink-0 whitespace-nowrap">{money(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
        {divider}
        <dl className="flex w-full items-start justify-between gap-16 font-heading leading-[normal] font-black whitespace-nowrap">
          <dt className="text-16 text-pw-ink max-lg:text-[16px]">Total Paid</dt>
          <dd className="text-18 text-pw-green-700 max-lg:text-[18px]">{money(order.totals?.total)}</dd>
        </dl>
      </div>
    </aside>
  );
}
