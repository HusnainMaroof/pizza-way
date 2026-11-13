"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/store/cart-store";

type QuickAddItem = {
  slug: string;
  name: string;
  price: number;
  description: string;
  meta: "Side" | "Drink";
  image: string;
};

const items: QuickAddItem[] = [
  {
    slug: "garlic-bread",
    name: "Premium Garlic Bread",
    price: 3.5,
    description: "Hand-stretched sourdough with fresh garlic butter",
    meta: "Side",
    image: "/brand/product/quick-garlic-bread.png",
  },
  {
    slug: "potato-wedges",
    name: "Crispy Potato Wedges",
    price: 3.5,
    description: "Oven baked seasoned wedges with garlic dip",
    meta: "Side",
    image: "/brand/product/quick-potato-wedges.png",
  },
  {
    slug: "pepsi",
    name: "Cold Soft Drink",
    price: 1.5,
    description: "Ice-cold refreshing\nPepsi 500ml",
    meta: "Drink",
    image: "/brand/product/quick-pepsi.png",
  },
];

const ADDED_MS = 1600;

/** "Add to your order" band on the product page: quick-add sides and drinks. */
export function ProductQuickAdd() {
  const addToCart = useCartStore((st) => st.add);
  const [addedSlug, setAddedSlug] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const quickAdd = (item: QuickAddItem) => {
    addToCart({
      id: `product-${item.slug}`,
      name: item.name,
      price: item.price,
      meta: item.meta,
      image: item.image,
    });
    setAddedSlug(item.slug);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAddedSlug(null), ADDED_MS);
  };

  return (
    <section
      className="w-full bg-pw-green-700 p-80 max-lg:px-[40px] max-lg:py-[64px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="product-quick-add-title"
    >
      <div className="flex flex-col gap-40 max-lg:gap-[32px] max-sm:gap-[24px]">
        <h2
          id="product-quick-add-title"
          className="font-heading text-32 font-black uppercase leading-[normal] text-white max-lg:text-[length:clamp(24px,4.5vw,32px)] max-lg:leading-[1.1] max-sm:text-[length:clamp(22px,7vw,28px)]"
        >
          Add to your order
        </h2>

        <ul className="grid grid-cols-3 items-start gap-24 max-lg:items-stretch max-lg:gap-[16px] max-[899px]:grid-cols-1">
          {items.map((item) => {
            const added = addedSlug === item.slug;
            return (
              <li
                key={item.slug}
                className="flex min-w-0 items-center gap-20 rounded-24 bg-pw-green-900 p-24 max-lg:flex-col max-lg:items-start max-lg:gap-[16px] max-lg:rounded-[20px] max-lg:p-[20px] max-[899px]:flex-row max-[899px]:items-center max-sm:gap-[14px] max-sm:p-[16px]"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  width={1024}
                  height={1024}
                  className="size-100 shrink-0 rounded-full object-cover max-lg:size-[88px] max-sm:size-[72px]"
                />
                <div className="flex min-w-0 flex-1 flex-col items-start gap-12 max-lg:w-full max-lg:gap-[10px]">
                  <div className="flex w-full items-center justify-between gap-12 whitespace-nowrap leading-[normal] max-lg:items-start max-lg:whitespace-normal">
                    <h3 className="min-w-0 font-heading text-18 font-extrabold leading-[normal] text-white max-lg:text-[17px] max-lg:leading-[1.2] max-sm:text-[16px]">
                      {item.name}
                    </h3>
                    <p className="shrink-0 font-heading text-16 font-black leading-[normal] text-pw-green-500 max-lg:text-[16px] max-lg:leading-[1.2]">
                      £{item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="whitespace-pre-line font-body text-13 font-normal leading-20 text-pw-green-100 max-lg:text-[13px] max-lg:leading-[20px]">
                    {item.description}
                  </p>
                  <button
                    type="button"
                    aria-label={`Quick add ${item.name}`}
                    onClick={() => quickAdd(item)}
                    className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-pill bg-white px-16 py-8 font-heading text-12 font-extrabold uppercase leading-[normal] text-pw-ink max-lg:min-h-[44px] max-lg:px-[20px] max-lg:py-[10px] max-lg:text-[12px]"
                  >
                    <span aria-live="polite">{added ? "Added ✓" : "Quick Add"}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
