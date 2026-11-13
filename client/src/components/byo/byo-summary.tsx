"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MAX_QTY } from "@/lib/byo-data";
import { useByoStore } from "@/store/byo-store";

const money = (n: number) => `£${n.toFixed(2)}`;

const rowLabel =
  "min-w-0 font-body font-normal text-pw-muted max-lg:text-[14px] max-lg:leading-[1.4]";
const rowValue =
  "shrink-0 whitespace-nowrap font-heading font-extrabold text-pw-ink max-lg:text-[14px]";

const stepBtn =
  "flex size-40 shrink-0 cursor-pointer items-center justify-center rounded-pill p-12 disabled:cursor-not-allowed disabled:opacity-30 max-lg:size-[44px] max-lg:p-[14px]";

export function SummarySidebar() {
  // Subscribe to every selection so derived prices re-render on change.
  const size = useByoStore((s) => s.size);
  const sauce = useByoStore((s) => s.sauce);
  const crust = useByoStore((s) => s.crust);
  const toppings = useByoStore((s) => s.toppings);
  const qty = useByoStore((s) => s.qty);
  const setQty = useByoStore((s) => s.setQty);
  const addToBasket = useByoStore((s) => s.addToBasket);
  const getSummary = useByoStore((s) => s.summary);
  const getTotal = useByoStore((s) => s.total);

  // size/sauce/crust/toppings/qty are subscribed above; the getters read the same state.
  void size;
  void sauce;
  void crust;
  void toppings;
  const summary = getSummary();
  const total = getTotal();
  const hasToppings = summary.toppingNames.length > 0;
  const valid = qty >= 1;

  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleAdd = () => {
    addToBasket();
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      id="byo-summary"
      className="flex w-full flex-col items-start gap-32 rounded-28 border-[1.5px] border-solid border-pw-line bg-pw-surface p-32 max-lg:gap-[24px] max-lg:rounded-[24px] max-lg:p-[24px] max-sm:gap-[20px] max-sm:rounded-[20px] max-sm:p-[16px]"
    >
      {/* Preview */}
      <div className="flex h-280 w-full shrink-0 items-center justify-center rounded-20 border border-solid border-pw-line bg-white max-lg:h-[260px] max-lg:rounded-[16px] max-sm:h-auto max-sm:py-[20px]">
        <div className="size-220 shrink-0 overflow-hidden rounded-pill max-lg:size-[200px] max-sm:aspect-square max-sm:h-auto max-sm:w-[min(200px,60vw)]">
          <Image
            src="/brand/byo/pizza-preview.png"
            alt="Preview of your custom pizza"
            width={220}
            height={220}
            sizes="(max-width: 640px) 60vw, (max-width: 1023px) 200px, 16vw"
            className="block size-full object-cover"
          />
        </div>
      </div>

      {/* Specification */}
      <div className="flex w-full flex-col items-start gap-20 max-lg:gap-[16px]">
        <div className="flex w-full flex-col items-start gap-4 leading-[normal] max-lg:gap-[4px]">
          <p className="font-heading text-12 font-extrabold uppercase text-pw-green-700">
            FORMULATION SPECIFICATION
          </p>
          <h2 className="font-heading text-24 font-black leading-[normal] text-pw-ink max-lg:text-[length:clamp(20px,3vw,24px)]">
            Sourdough Blueprint
          </h2>
        </div>

        <hr className="w-full border-0 border-t border-solid border-pw-line" />

        <dl className="flex w-full flex-col items-start gap-12 text-14 leading-[normal] max-lg:gap-[10px]">
          <div className="flex w-full items-start justify-between gap-16 max-lg:gap-[12px]">
            <dt className={rowLabel}>{summary.base}</dt>
            <dd className={rowValue}>{money(summary.basePrice)}</dd>
          </div>
          <div className="flex w-full items-start justify-between gap-16 max-lg:gap-[12px]">
            <dt className={rowLabel}>{summary.sauce}</dt>
            <dd className={rowValue}>Included</dd>
          </div>
          <div className="flex w-full items-start justify-between gap-16 max-lg:gap-[12px]">
            <dt className={rowLabel}>{summary.crust}</dt>
            <dd className={rowValue}>Included</dd>
          </div>
          <div className="flex w-full items-start justify-between gap-16 max-lg:gap-[12px]">
            <dt className={rowLabel}>
              {hasToppings ? summary.toppingNames.join(", ") : "No extra toppings"}
            </dt>
            <dd className={rowValue}>{hasToppings ? money(summary.toppingsPrice) : "-"}</dd>
          </div>
        </dl>

        <hr className="w-full border-0 border-t border-solid border-pw-line" />

        <div className="flex w-full items-center justify-between gap-16 leading-[normal]">
          <p className="whitespace-nowrap font-heading text-18 font-extrabold text-pw-ink max-lg:text-[17px]">
            Total Price
          </p>
          <p
            aria-live="polite"
            className="whitespace-nowrap font-heading text-32 font-black text-pw-green-700 max-lg:text-[length:clamp(26px,4vw,32px)]"
          >
            {money(total)}
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex w-full flex-col items-start gap-16 max-lg:gap-[12px]">
        <div
          role="group"
          aria-label="Quantity"
          className="flex w-full items-center justify-between rounded-pill border border-solid border-pw-line bg-white max-lg:p-[2px]"
        >
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={qty <= 1}
            onClick={() => setQty(qty - 1)}
            className={stepBtn}
          >
            <Image src="/brand/byo/icon-minus.svg" alt="" width={16} height={16} className="block size-16 max-lg:size-[16px]" />
          </button>
          <p
            aria-live="polite"
            className="font-heading text-16 font-extrabold leading-[normal] text-pw-ink max-lg:text-[16px]"
          >
            {qty}
          </p>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={qty >= MAX_QTY}
            onClick={() => setQty(qty + 1)}
            className={stepBtn}
          >
            <Image src="/brand/byo/icon-plus.svg" alt="" width={16} height={16} className="block size-16 max-lg:size-[16px]" />
          </button>
        </div>

        <button
          type="button"
          disabled={!valid}
          onClick={handleAdd}
          aria-live="polite"
          className={`flex w-full cursor-pointer items-center justify-center gap-8 whitespace-nowrap rounded-pill px-36 py-18 font-heading text-16 font-extrabold uppercase leading-[normal] text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#aeaeae] max-lg:min-h-[52px] max-lg:px-[24px] max-lg:py-[14px] max-lg:text-[15px] ${
            added ? "bg-pw-green-700" : "bg-pw-green-700 hover:bg-pw-green-600"
          }`}
        >
          {added ? (
            <>
              <span aria-hidden="true">&#10003;</span>
              Added to basket
            </>
          ) : (
            "ADD TO BASKET"
          )}
        </button>
      </div>
    </div>
  );
}
