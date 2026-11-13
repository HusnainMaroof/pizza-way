"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/store/cart-store";

import type { Pizza, PizzaSize, PizzaTag } from "./pizza-data";
import { PIZZA_SIZES, pizzaPrice, pizzas } from "./pizza-data";

// Re-exported so existing imports from "./pizza-section" keep working (client components only).
export { PIZZA_SIZES, pizzaPrice, pizzas };
export type { Pizza, PizzaSize, PizzaTag };

function PizzaCard({ pizza }: { pizza: Pizza }) {
  const [size, setSize] = useState<PizzaSize>('12"');
  const addToCart = useCartStore((st) => st.add);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function handleAdd() {
    addToCart({
      id: `menu-${pizza.id}-${size.replace('"', "")}`,
      name: `${pizza.name} ${size}`,
      price: pizzaPrice(pizza, size),
      meta: `${size} sourdough pizza`,
      image: pizza.image,
    });
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  }

  return (
    <article className="flex items-center gap-24 rounded-32 border-[1.5px] border-pw-line bg-pw-surface p-32 max-lg:flex-col max-lg:items-stretch max-lg:gap-[20px] max-lg:p-[24px] max-sm:gap-[16px] max-sm:rounded-[24px] max-sm:p-[20px]">
      <Link href={`/menu/${pizza.id}`} aria-label={`View ${pizza.name}`} className="block size-200 shrink-0 overflow-hidden rounded-pill max-lg:aspect-square max-lg:h-auto max-lg:w-[min(180px,60%)] max-lg:self-center max-sm:w-[min(200px,70%)]">
        <Image
          src={pizza.image}
          alt={pizza.name}
          width={200}
          height={200}
          sizes="(max-width: 640px) 200px, (max-width: 1023px) 180px, 14vw"
          className="block size-full object-cover"
        />
      </Link>
      <div className="flex min-w-0 flex-[1_0_0] flex-col items-start gap-16 max-lg:flex-auto max-lg:gap-[12px]">
        <div className="flex w-full items-center justify-between gap-12 leading-[normal] max-lg:flex-wrap max-lg:gap-y-[4px]">
          <h3 className="min-w-0 font-heading text-28 font-extrabold leading-[normal] text-pw-ink max-lg:text-[22px] max-lg:leading-[1.2]">
            <Link href={`/menu/${pizza.id}`} className="no-underline hover:underline">
              {pizza.name}
            </Link>
          </h3>
          <p className="shrink-0 whitespace-nowrap font-heading text-20 font-black text-pw-green-700 max-lg:text-[18px]">
            {pizza.price}
          </p>
        </div>
        <p className="w-full font-body text-14 font-normal leading-22 text-pw-muted max-lg:text-[14px] max-lg:leading-[22px]">
          {pizza.description}
        </p>
        <div
          role="group"
          aria-label={`${pizza.name} size`}
          className="flex flex-wrap items-start gap-8 max-lg:gap-[8px]"
        >
          {PIZZA_SIZES.map((s) => {
            const active = s === size;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => setSize(s)}
                className={`inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-pill border border-solid px-16 py-8 font-heading text-12 font-extrabold leading-[normal] max-lg:min-h-[44px] max-lg:min-w-[52px] max-lg:px-[14px] max-lg:py-[8px] max-lg:text-[13px] ${
                  active
                    ? "border-pw-green-700 bg-pw-green-700 text-white"
                    : "border-pw-line bg-white text-pw-muted"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        <div className="flex w-full items-start">
          <button
            type="button"
            aria-label={`Add ${size} ${pizza.name} to basket`}
            onClick={handleAdd}
            className="flex min-w-0 flex-[1_0_0] cursor-pointer items-center justify-center whitespace-nowrap rounded-pill bg-pw-green-700 px-24 py-12 font-heading text-14 font-extrabold uppercase leading-[normal] text-white max-lg:min-h-[48px] max-lg:px-[24px] max-lg:py-[12px] max-lg:text-[14px]"
          >
            {added ? "Added ✓" : "Add to Basket"}
          </button>
        </div>
      </div>
    </article>
  );
}

type PizzaSectionProps = {
  /** Only show pizzas with this tag. Omit to show all. */
  tag?: PizzaTag;
};

export function PizzaSection({ tag }: PizzaSectionProps) {
  const list = tag ? pizzas.filter((p) => p.tags.includes(tag)) : pizzas;

  return (
    <section
      className="flex w-full flex-col items-start gap-48 bg-white px-80 pb-96 pt-80 max-lg:gap-[32px] max-lg:px-[40px] max-lg:pb-[64px] max-lg:pt-[56px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:pb-[48px] max-sm:pt-[40px]"
      aria-labelledby="pizza-section-title"
    >
      <div className="flex flex-col items-start gap-8 leading-[normal] max-lg:gap-[8px]">
        <p className="font-heading text-16 font-extrabold uppercase text-pw-green-700 max-sm:text-[13px]">
          SIGNATURE PIES
        </p>
        <h2
          id="pizza-section-title"
          className="font-heading text-40 font-black leading-[normal] text-pw-ink max-lg:text-[length:clamp(28px,4.5vw,40px)] max-lg:leading-[1.15] max-sm:text-[length:clamp(26px,7.5vw,34px)]"
        >
          Fired by hand. Crafted to order.
        </h2>
      </div>

      <div className="grid w-full grid-cols-2 items-start gap-32 max-lg:gap-[20px] max-sm:grid-cols-1 max-sm:gap-[16px]">
        {list.map((pizza) => (
          <PizzaCard key={pizza.id} pizza={pizza} />
        ))}
      </div>
    </section>
  );
}
