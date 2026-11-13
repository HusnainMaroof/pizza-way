"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { pizzas, pizzaPrice, type Pizza } from "@/components/menu/pizza-section";

/** Pizzas suggested in the design, in order (ids from the menu `pizzas` array). */
const UPSELL_IDS = ["meat-feast", "american-hot"];

const upsellPizzas: Pizza[] = UPSELL_IDS.map((id) => pizzas.find((p) => p.id === id)).filter(
  (p): p is Pizza => Boolean(p),
);

const formatPrice = (n: number) => `£${n.toFixed(2)}`;

function UpsellCard({ pizza }: { pizza: Pizza }) {
  const addToCart = useCartStore((s) => s.add);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const price = pizzaPrice(pizza, '12"');

  function handleAdd() {
    addToCart({
      id: `menu-${pizza.id}-12`,
      name: `${pizza.name} 12"`,
      price,
      meta: `12" sourdough pizza`,
      image: pizza.image,
    });
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  }

  return (
    <article className="flex min-w-0 items-center gap-24 rounded-24 bg-pw-green-900 p-24 max-lg:flex-col max-lg:items-stretch max-lg:gap-[16px] max-lg:rounded-[20px] max-lg:p-[20px] max-sm:flex-row max-sm:items-center max-sm:gap-[14px] max-sm:p-[16px]">
      <div className="size-140 shrink-0 overflow-hidden rounded-pill max-lg:size-[120px] max-lg:self-center max-sm:size-[88px] max-sm:self-center">
        <Image
          src={pizza.image}
          alt={pizza.name}
          width={140}
          height={140}
          sizes="(max-width: 640px) 88px, (max-width: 1023px) 120px, 10vw"
          className="block size-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-[1_0_0] flex-col items-start gap-12 max-lg:flex-auto max-lg:gap-[10px]">
        <div className="flex w-full items-center justify-between gap-12 leading-[normal] max-lg:flex-wrap max-lg:gap-x-[12px] max-lg:gap-y-[2px]">
          <h3 className="min-w-0 font-heading text-22 font-extrabold leading-[normal] text-white max-lg:text-[20px] max-sm:text-[18px]">
            {pizza.name}
          </h3>
          <p className="shrink-0 whitespace-nowrap font-heading text-18 font-black text-pw-green-500 max-lg:text-[17px] max-sm:text-[16px]">
            {formatPrice(price)}
          </p>
        </div>
        <p className="w-full font-body text-13 font-normal leading-20 text-pw-green-100 max-lg:text-[13px] max-lg:leading-[20px]">
          {pizza.description}
        </p>
        <button
          type="button"
          aria-label={`Add 12" ${pizza.name} to order`}
          onClick={handleAdd}
          className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-pill bg-white px-16 py-8 font-heading text-12 font-extrabold uppercase leading-[normal] text-pw-ink max-lg:min-h-[44px] max-lg:px-[20px] max-lg:text-[13px]"
        >
          {added ? "Added ✓" : "Add to Order"}
        </button>
      </div>
    </article>
  );
}

export function UpsellsSection() {
  return (
    <section
      aria-labelledby="upsells-title"
      className="flex w-full flex-col items-start gap-56 bg-pw-green-700 px-80 py-120 max-lg:gap-[32px] max-lg:px-[40px] max-lg:py-[72px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:py-[48px]"
    >
      <div className="flex w-full flex-col items-start gap-16 leading-[normal] max-lg:gap-[8px]">
        <p className="w-full font-heading text-14 font-extrabold uppercase text-pw-green-500 max-sm:text-[13px]">
          While you wait...
        </p>
        <h2
          id="upsells-title"
          className="w-full font-heading text-48 font-black leading-[normal] text-white max-lg:text-[length:clamp(28px,4.5vw,40px)] max-lg:leading-[1.15] max-sm:text-[length:clamp(26px,7.5vw,34px)]"
        >
          Plot your next formulation
        </h2>
      </div>

      <div className="grid w-full grid-cols-2 items-stretch gap-32 max-lg:gap-[20px] max-sm:grid-cols-1 max-sm:gap-[16px]">
        {upsellPizzas.map((pizza) => (
          <UpsellCard key={pizza.id} pizza={pizza} />
        ))}
      </div>
    </section>
  );
}
