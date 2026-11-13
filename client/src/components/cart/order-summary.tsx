"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useMemo, useState, type FormEvent } from "react";
import { calcTotals, promoCodeSchema, useFulfilmentStore, usePromoStore, type Fulfilment } from "@/lib/pricing";
import { useCartStore } from "@/store/cart-store";

const money = (n: number) => `£${n.toFixed(2)}`;

const rowLabel = "min-w-0 font-body text-15 font-normal text-pw-muted max-lg:text-[15px]";
const rowValue = "shrink-0 whitespace-nowrap font-heading text-16 font-extrabold text-pw-ink max-lg:text-[16px]";

const toggleBase =
  "flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-pill py-10 font-heading text-14 font-extrabold uppercase leading-[normal] transition-colors max-lg:min-h-[44px] max-lg:py-[10px] max-lg:text-[14px]";

const MODES: { value: Fulfilment; label: string }[] = [
  { value: "delivery", label: "DELIVERY" },
  { value: "collection", label: "COLLECTION" },
];

export function OrderSummary() {
  // Subscribe to items so the subtotal re-renders on every basket change.
  const items = useCartStore((s) => s.items);
  const getSubtotal = useCartStore((s) => s.total);
  const subtotal = useMemo(() => {
    void items;
    return getSubtotal();
  }, [items, getSubtotal]);

  const promoCode = usePromoStore((s) => s.code);
  const promoPercent = usePromoStore((s) => s.percent);
  const applyPromo = usePromoStore((s) => s.apply);
  const clearPromo = usePromoStore((s) => s.clear);
  const mode = useFulfilmentStore((s) => s.mode);
  const setMode = useFulfilmentStore((s) => s.setMode);

  const totals = useMemo(() => calcTotals(subtotal, promoPercent, mode), [subtotal, promoPercent, mode]);
  const empty = items.length === 0;

  const [code, setCode] = useState(promoCode ?? "");
  const [status, setStatus] = useState<"idle" | "error" | "success">(promoCode ? "success" : "idle");
  const inputId = useId();
  const msgId = useId();

  const handleApply = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = promoCodeSchema.safeParse(code);
    if (parsed.success && applyPromo(parsed.data)) {
      setCode(parsed.data);
      setStatus("success");
    } else {
      clearPromo();
      setStatus("error");
    }
  };

  return (
    <section
      aria-labelledby="order-summary-title"
      className="flex w-full flex-col items-start gap-28 rounded-28 border-[1.5px] border-solid border-pw-line bg-pw-surface p-32 max-lg:gap-[24px] max-lg:rounded-[24px] max-lg:p-[24px] max-sm:gap-[20px] max-sm:rounded-[20px] max-sm:p-[16px]"
    >
      <h2
        id="order-summary-title"
        className="whitespace-nowrap font-heading text-24 font-black uppercase leading-[normal] text-pw-ink max-lg:text-[length:clamp(20px,3vw,24px)]"
      >
        Order Summary
      </h2>

      {/* Rows */}
      <dl className="flex w-full flex-col items-start gap-16 leading-[normal] max-lg:gap-[14px]">
        <div className="flex w-full items-start justify-between gap-16">
          <dt className={rowLabel}>Subtotal</dt>
          <dd className={rowValue}>{money(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 && (
          <div className="flex w-full items-start justify-between gap-16">
            <dt className={rowLabel}>Discount ({promoCode})</dt>
            <dd className={`${rowValue} text-pw-green-700`}>-{money(totals.discount)}</dd>
          </div>
        )}
        <div className="flex w-full items-start justify-between gap-16">
          <dt className={rowLabel}>Delivery Fee</dt>
          <dd className={rowValue}>{mode === "collection" && !empty ? "Free" : money(totals.delivery)}</dd>
        </div>
        <hr className="w-full border-0 border-t border-solid border-pw-line" />
        <div className="flex w-full items-center justify-between gap-16">
          <dt className="whitespace-nowrap font-heading text-18 font-extrabold text-pw-ink max-lg:text-[17px]">Total</dt>
          <dd
            aria-live="polite"
            className="whitespace-nowrap font-heading text-28 font-black text-pw-green-700 max-lg:text-[length:clamp(24px,4vw,28px)]"
          >
            {money(totals.total)}
          </dd>
        </div>
      </dl>

      {/* Delivery / Collection toggle */}
      <div
        role="radiogroup"
        aria-label="Delivery or collection"
        className="flex w-full items-start gap-4 rounded-pill bg-pw-line p-4 max-lg:gap-[4px] max-lg:p-[4px]"
      >
        {MODES.map((m) => {
          const active = mode === m.value;
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(m.value)}
              className={`${toggleBase} ${active ? "bg-pw-green-700 text-white" : "text-pw-muted hover:text-pw-ink"}`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Promo */}
      <form onSubmit={handleApply} noValidate className="flex w-full flex-col items-start gap-8 max-lg:gap-[8px]">
        <div className="flex w-full items-center justify-between gap-8 rounded-pill border border-solid border-pw-line bg-white py-4 pr-4 pl-16 max-lg:py-[4px] max-lg:pr-[4px] max-lg:pl-[16px]">
          <label htmlFor={inputId} className="sr-only">
            Promo code
          </label>
          <input
            id={inputId}
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            placeholder="Enter Promo Code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={30}
            aria-invalid={status === "error"}
            aria-describedby={status !== "idle" ? msgId : undefined}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 font-body text-14 font-normal leading-[normal] text-pw-ink outline-none placeholder:text-pw-muted max-lg:min-h-[40px] max-lg:text-[14px] max-sm:text-[16px]"
          />
          <button
            type="submit"
            className="shrink-0 cursor-pointer rounded-pill bg-pw-green-700 px-20 py-10 font-heading text-12 font-extrabold uppercase leading-[normal] text-white transition-colors hover:bg-pw-green-600 max-lg:min-h-[44px] max-lg:px-[20px] max-lg:py-[10px] max-lg:text-[13px]"
          >
            APPLY
          </button>
        </div>
        {status === "error" && (
          <p id={msgId} role="alert" className="pl-16 font-body text-13 font-medium leading-[normal] text-pw-red-600 max-lg:pl-[16px] max-lg:text-[13px]">
            Invalid promo code
          </p>
        )}
        {status === "success" && promoCode && (
          <p id={msgId} role="status" className="pl-16 font-body text-13 font-medium leading-[normal] text-pw-green-700 max-lg:pl-[16px] max-lg:text-[13px]">
            {promoCode} applied: {promoPercent}% off
          </p>
        )}
      </form>

      {/* Estimated time */}
      <div className="flex w-full items-center gap-8 max-lg:gap-[8px]">
        <Image src="/brand/cart/icon-clock.svg" alt="" width={18} height={18} className="block size-18 shrink-0 max-lg:size-[18px]" />
        <p className="min-w-0 font-body text-14 font-normal leading-[normal] text-pw-ink max-lg:text-[14px]">
          {mode === "delivery" ? "Estimated Delivery Time: " : "Estimated Collection Time: "}
          <span className="whitespace-nowrap font-bold text-pw-green-700">
            {mode === "delivery" ? "25 - 35 mins" : "15 - 20 mins"}
          </span>
        </p>
      </div>

      {/* CTA */}
      <div className="flex w-full flex-col items-start gap-12 max-lg:gap-[12px]">
        <Link
          href="/checkout"
          aria-disabled={empty}
          tabIndex={empty ? -1 : undefined}
          onClick={(e) => {
            if (empty) e.preventDefault();
          }}
          className={`flex w-full items-center justify-center rounded-pill px-36 py-18 text-center font-heading text-16 font-extrabold uppercase leading-[normal] text-white transition-colors max-lg:min-h-[52px] max-lg:px-[24px] max-lg:py-[14px] max-lg:text-[15px] ${
            empty ? "cursor-not-allowed bg-[#aeaeae]" : "bg-pw-red-600 hover:bg-[#c40c01]"
          }`}
        >
          PROCEED TO CHECKOUT
        </Link>
        <Link
          href="/menu"
          className="flex w-full items-center justify-center font-heading text-14 font-extrabold leading-[normal] text-pw-green-700 hover:underline max-lg:min-h-[44px] max-lg:text-[14px]"
        >
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}
