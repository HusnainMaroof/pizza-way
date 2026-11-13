"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { money, useCartHydrated } from "@/components/cart/cart-items";
import { calcTotals, useFulfilmentStore, usePromoStore } from "@/lib/pricing";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";

const PLACEHOLDER = "£–";

const rowLabel = "min-w-0 font-body text-14 font-normal text-pw-muted max-lg:text-[14px]";
const rowValue = "shrink-0 whitespace-nowrap font-heading text-14 font-bold text-pw-ink max-lg:text-[14px]";
const divider = "m-0 w-full border-0 border-t border-solid border-pw-line";

const TRUST = [
  { icon: "/brand/checkout/summary-shield.svg", label: "Secure SSL Checkout" },
  { icon: "/brand/checkout/summary-clock.svg", label: "Precision Hot-box Delivery" },
  { icon: "/brand/checkout/summary-chef-hat.svg", label: "100% Freshness Guaranteed" },
];

export function OrderSummaryCard() {
  const hydrated = useCartHydrated();
  const items = useCartStore((s) => s.items);
  const promoCode = usePromoStore((s) => s.code);
  const promoPercent = usePromoStore((s) => s.percent);
  const mode = useFulfilmentStore((s) => s.mode);
  const submitting = useCheckoutStore((s) => s.submitting);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items]);
  const totals = useMemo(() => calcTotals(subtotal, promoPercent, mode), [subtotal, promoPercent, mode]);

  const empty = items.length === 0;
  const disabled = !hydrated || empty || submitting;
  const show = (n: number) => (hydrated ? money(n) : PLACEHOLDER);

  return (
    <section
      aria-labelledby="checkout-summary-title"
      className="flex w-full flex-col items-start gap-28 rounded-28 border-[1.5px] border-solid border-pw-line bg-pw-surface p-32 max-lg:gap-[24px] max-lg:rounded-[24px] max-lg:p-[24px] max-sm:gap-[20px] max-sm:rounded-[20px] max-sm:p-[16px]"
    >
      <div className="flex w-full items-baseline justify-between gap-16">
        <h2
          id="checkout-summary-title"
          className="whitespace-nowrap font-heading text-24 font-black uppercase leading-[normal] text-pw-ink max-lg:text-[length:clamp(20px,3vw,24px)]"
        >
          Your Order
        </h2>
        <Link
          href="/cart"
          className="shrink-0 font-body text-13 font-medium leading-[normal] text-pw-green-700 hover:underline max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center max-lg:text-[13px]"
        >
          Edit basket
        </Link>
      </div>

      {/* Lines */}
      {hydrated && (
        <ul className="flex w-full flex-col items-start gap-16 leading-[normal] text-pw-ink max-lg:gap-[14px]">
          {empty ? (
            <li className="font-body text-14 font-normal text-pw-muted max-lg:text-[14px]">Your basket is empty.</li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="flex w-full items-start justify-between gap-16">
                <span className="min-w-0 break-words font-body text-14 font-semibold max-lg:text-[14px]">
                  {item.qty}× {item.name}
                </span>
                <span className="shrink-0 whitespace-nowrap font-heading text-14 font-bold max-lg:text-[14px]">
                  {money(item.price * item.qty)}
                </span>
              </li>
            ))
          )}
        </ul>
      )}

      <hr className={divider} />

      {/* Pricing */}
      <dl className="flex w-full flex-col items-start gap-12 leading-[normal] max-lg:gap-[12px]">
        <div className="flex w-full items-start justify-between gap-16">
          <dt className={rowLabel}>Subtotal</dt>
          <dd className={rowValue}>{show(totals.subtotal)}</dd>
        </div>
        {hydrated && totals.discount > 0 && (
          <div className="flex w-full items-start justify-between gap-16">
            <dt className={rowLabel}>Discount ({promoCode})</dt>
            <dd className={`${rowValue} text-pw-green-700`}>-{money(totals.discount)}</dd>
          </div>
        )}
        <div className="flex w-full items-start justify-between gap-16">
          <dt className={rowLabel}>Delivery</dt>
          <dd className={rowValue}>{hydrated && mode === "collection" && !empty ? "Free" : show(totals.delivery)}</dd>
        </div>
        <hr className={divider} />
        <div className="flex w-full items-center justify-between gap-16">
          <dt className="whitespace-nowrap font-heading text-18 font-extrabold text-pw-ink max-lg:text-[17px]">To Pay</dt>
          <dd
            aria-live="polite"
            className="whitespace-nowrap font-heading text-28 font-black text-pw-green-700 max-lg:text-[length:clamp(24px,4vw,28px)]"
          >
            {show(totals.total)}
          </dd>
        </div>
      </dl>

      {/* Place order */}
      <button
        type="submit"
        form="checkout-form"
        disabled={disabled}
        aria-disabled={disabled}
        aria-live="polite"
        className={`flex w-full items-center justify-center rounded-pill px-36 py-18 text-center font-heading text-16 font-extrabold uppercase leading-[normal] text-white transition-colors max-lg:min-h-[52px] max-lg:px-[24px] max-lg:py-[14px] max-lg:text-[15px] ${
          disabled ? "cursor-not-allowed bg-[#aeaeae]" : "cursor-pointer bg-pw-red-600 hover:bg-[#c40c01]"
        }`}
      >
        {submitting ? "PLACING ORDER..." : `PLACE ORDER — ${show(totals.total)}`}
      </button>

      <hr className={divider} />

      {/* Trust badges */}
      <ul className="flex w-full flex-col items-start gap-16 max-lg:gap-[14px]">
        {TRUST.map((t) => (
          <li key={t.label} className="flex w-full items-center gap-12 max-lg:gap-[12px]">
            <span className="flex size-24 shrink-0 items-center justify-center rounded-12 bg-pw-green-700 max-lg:size-[24px] max-lg:rounded-[12px]">
              <Image src={t.icon} alt="" width={12} height={12} className="block size-12 max-lg:size-[12px]" />
            </span>
            <span className="min-w-0 font-body text-14 font-semibold leading-[normal] text-pw-ink max-lg:text-[14px]">
              {t.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
