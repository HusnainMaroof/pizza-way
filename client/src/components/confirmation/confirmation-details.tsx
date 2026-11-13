"use client";

import Link from "next/link";
import { estimatedTime, formatPlacedAt, useOrderHydrated } from "@/components/confirmation/confirmation-hero";
import { useOrderStore } from "@/store/order-store";

const money = (n: number | undefined) => `£${(Number.isFinite(n) ? (n as number) : 0).toFixed(2)}`;

const sectionClass =
  "flex w-full items-start gap-48 bg-pw-surface px-80 py-96 max-lg:flex-col max-lg:gap-[32px] max-lg:px-[40px] max-lg:py-[56px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:py-[40px]";

const panelClass =
  "flex min-w-0 flex-[1_0_0] flex-col items-start gap-16 rounded-24 border-[1.5px] border-solid border-pw-line bg-white p-32 wrap-break-word max-lg:gap-[12px] max-lg:rounded-[20px] max-lg:p-[24px] max-sm:w-full max-sm:flex-none max-sm:p-[20px]";

const panelTitle = "w-full font-heading text-18 leading-[normal] font-extrabold text-pw-ink max-lg:text-[17px]";

const panelText = "font-body text-14 leading-22 font-normal text-pw-muted max-lg:text-[14px] max-lg:leading-[22px]";

const btnBase =
  "flex w-full items-center justify-center rounded-pill px-24 py-16 text-center font-heading text-16 leading-[normal] font-extrabold text-white uppercase transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white max-lg:min-h-[52px] max-lg:px-[24px] max-lg:py-[14px] max-lg:text-[15px]";

function DetailsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading order details" className={sectionClass}>
      <div className="flex min-w-0 flex-[1_0_0] flex-col gap-32 max-lg:w-full max-lg:flex-none max-lg:gap-[24px]">
        <div className="h-377 w-full animate-pulse rounded-32 border-[1.5px] border-solid border-pw-line bg-white motion-reduce:animate-none max-lg:h-[360px] max-lg:rounded-[24px]" />
        <div className="h-166 w-full animate-pulse rounded-24 border-[1.5px] border-solid border-pw-line bg-white motion-reduce:animate-none max-lg:h-[170px] max-lg:rounded-[20px] max-sm:h-[330px]" />
      </div>
      <div className="h-373 w-400 shrink-0 animate-pulse rounded-32 bg-pw-green-900 motion-reduce:animate-none max-lg:h-[320px] max-lg:w-full max-lg:rounded-[24px]" />
    </div>
  );
}

/** Confirmation details (Figma 97:1943): items + totals, delivery and payment panels, next-step actions. */
export function ConfirmationDetails() {
  const hydrated = useOrderHydrated();
  const order = useOrderStore((s) => s.lastOrder);

  if (!hydrated) return <DetailsSkeleton />;
  // The hero shows the friendly "no recent order" card.
  if (!order) return null;

  const isCollection = order.fulfilment === "collection";
  const items = order.items ?? [];
  const totals = order.totals;
  const placedAt = formatPlacedAt(order.placedAt);
  const address = order.address;
  const cityLine = [address?.city, address?.postcode].filter(Boolean).join(", ");
  const brand = order.payment?.brand?.trim() || "card";
  const last4 = order.payment?.last4 || "••••";
  const showDiscount = Boolean(order.promoCode) && (totals?.discount ?? 0) > 0;

  return (
    <section aria-label="Order details" className={sectionClass}>
      <div className="flex min-w-0 flex-[1_0_0] flex-col items-start gap-32 max-lg:w-full max-lg:flex-none max-lg:gap-[24px]">
        {/* Order summary */}
        <div className="flex w-full flex-col items-start gap-24 rounded-32 border-[1.5px] border-solid border-pw-line bg-white p-40 max-lg:gap-[20px] max-lg:rounded-[24px] max-lg:p-[28px] max-sm:rounded-[20px] max-sm:p-[20px]">
          <div className="flex w-full flex-col items-start gap-8 leading-[normal] max-lg:gap-[6px]">
            <h2 className="w-full font-heading text-28 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(22px,3.4vw,26px)]">
              Your Selection
            </h2>
            {placedAt ? (
              <p className="font-body text-14 leading-[normal] font-normal text-pw-muted max-lg:text-[14px]">
                Placed <time dateTime={order.placedAt}>{placedAt}</time>
              </p>
            ) : null}
          </div>

          <ul className="flex w-full flex-col items-start gap-16 leading-[normal] text-pw-ink max-lg:gap-[14px]">
            {items.map((item, i) => (
              <li key={`${item.id}-${i}`} className="flex w-full items-center justify-between gap-16 max-lg:gap-[12px] max-sm:items-start">
                <p className="min-w-0 font-body text-16 leading-[normal] font-semibold wrap-break-word max-lg:text-[15px] max-lg:leading-[1.4]">
                  {item.qty} × {item.name}
                  {item.meta ? ` (${item.meta})` : ""}
                </p>
                <p className="shrink-0 font-heading text-16 leading-[normal] font-extrabold whitespace-nowrap max-lg:text-[15px] max-lg:leading-[1.4]">
                  {money(item.price * item.qty)}
                </p>
              </li>
            ))}
          </ul>

          <div aria-hidden="true" className="h-0 w-full border-t-[1.5px] border-solid border-pw-line" />

          <dl className="flex w-full flex-col items-start gap-12 leading-[normal] whitespace-nowrap max-lg:gap-[10px]">
            <div className="flex w-full items-start justify-between gap-16 font-body text-14 font-normal max-lg:text-[14px]">
              <dt className="text-pw-muted">Subtotal</dt>
              <dd className="text-pw-ink">{money(totals?.subtotal)}</dd>
            </div>
            {showDiscount ? (
              <div className="flex w-full items-start justify-between gap-16 font-body text-14 font-normal max-lg:text-[14px]">
                <dt className="min-w-0 truncate text-pw-muted">Discount ({order.promoCode})</dt>
                <dd className="font-bold text-pw-green-700">-{money(totals?.discount)}</dd>
              </div>
            ) : null}
            <div className="flex w-full items-start justify-between gap-16 font-body text-14 max-lg:text-[14px]">
              <dt className="font-normal text-pw-muted">{isCollection ? "Collection" : "Precision GPS Delivery"}</dt>
              {(totals?.delivery ?? 0) > 0 ? (
                <dd className="font-normal text-pw-ink">{money(totals?.delivery)}</dd>
              ) : (
                <dd className="font-bold text-pw-green-700">FREE</dd>
              )}
            </div>
            <div className="flex w-full items-start justify-between gap-16 pt-8 font-heading font-black max-lg:pt-[8px]">
              <dt className="text-20 text-pw-ink max-lg:text-[19px]">Total Paid</dt>
              <dd className="text-24 text-pw-green-700 max-lg:text-[22px]">{money(totals?.total)}</dd>
            </div>
          </dl>
        </div>

        {/* Logistics */}
        <div className="flex w-full items-start gap-32 max-lg:gap-[20px] max-sm:flex-col max-sm:gap-[16px]">
          <div className={panelClass}>
            <h3 className={panelTitle}>{isCollection ? "Collection" : "Delivery Destination"}</h3>
            {isCollection ? (
              <p className={panelText}>
                Collect your order from your Pizza Way store. Ready for {estimatedTime(order)}.
              </p>
            ) : address ? (
              <address className={`${panelText} not-italic`}>
                {address.line1 ? <span className="block">{address.line1}</span> : null}
                {address.line2 ? <span className="block">{address.line2}</span> : null}
                {cityLine ? <span className="block">{cityLine}</span> : null}
                {address.instructions ? (
                  <span className="mt-8 block italic max-lg:mt-[8px]">Note: {address.instructions}</span>
                ) : null}
              </address>
            ) : (
              <p className={panelText}>Address not available.</p>
            )}
          </div>

          <div className={panelClass}>
            <h3 className={panelTitle}>Payment Formula</h3>
            <div className="flex w-full flex-wrap items-center gap-12 max-lg:gap-[10px]">
              <span className="flex items-start rounded-[calc(8*var(--u))] bg-pw-ink px-12 py-6 font-heading text-12 leading-[normal] font-extrabold whitespace-nowrap text-white lowercase max-lg:rounded-[8px] max-lg:px-[12px] max-lg:py-[6px]">
                {brand}
              </span>
              <p className="font-body text-14 leading-[normal] font-normal whitespace-nowrap text-pw-muted max-lg:text-[14px]">
                <span className="sr-only">{brand} </span>Ending in •••• {last4}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <aside
        aria-labelledby="whats-next-heading"
        className="flex w-400 shrink-0 flex-col items-start gap-24 rounded-32 bg-pw-green-900 p-40 max-lg:w-full max-lg:gap-[20px] max-lg:rounded-[24px] max-lg:p-[28px] max-sm:rounded-[20px] max-sm:p-[20px]"
      >
        <h2
          id="whats-next-heading"
          className="w-full font-heading text-24 leading-[normal] font-black text-white max-lg:text-[length:clamp(20px,3vw,24px)]"
        >
          What&apos;s Next?
        </h2>
        <p className="w-full font-body text-14 leading-22 font-normal text-pw-green-100 max-lg:text-[14px] max-lg:leading-[22px]">
          {isCollection
            ? "Follow your Neapolitan sourdough live as it bakes. We'll let you know the moment it's ready to collect."
            : "You can monitor your Neapolitan sourdough live. Our high-precision GPS will track the driver directly to your door."}
        </p>
        <Link href="/order-tracking" className={`${btnBase} bg-pw-red-600`}>
          Track Your Order
        </Link>
        <Link href="/menu" className={`${btnBase} border-[1.5px] border-solid border-white`}>
          Order Again
        </Link>
        <Link
          href="/contact"
          className="self-center font-body text-14 leading-[normal] font-medium text-pw-green-100 underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white max-lg:flex max-lg:min-h-[48px] max-lg:items-center max-lg:text-[14px]"
        >
          Need help with your order?
        </Link>
      </aside>
    </section>
  );
}
