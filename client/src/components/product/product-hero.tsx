"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { money } from "@/components/cart/cart-items";
import type { Pizza, PizzaSize } from "@/components/menu/pizza-data";
import { PIZZA_SIZES, pizzaPrice } from "@/components/menu/pizza-data";
import { MAX_ITEM_QTY, useCartStore } from "@/store/cart-store";

/** Figma hero photo (different from the menu image); only used for this pizza. */
const HERO_IMAGE: Record<string, string> = {
  "pepperoni-plus": "/brand/product/pepperoni-plus-hero.png",
};

const CRUSTS = [
  { id: "classic-sourdough", label: "Classic Sourdough" },
  { id: "deep-pan", label: "Deep Pan" },
  { id: "stone-baked-italian", label: "Stone-baked Italian" },
] as const;
type CrustId = (typeof CRUSTS)[number]["id"];

/** Third extra topping: the pizza's primary topping. */
const PRIMARY_EXTRA: Record<string, string> = {
  margherita: "Extra Mozzarella",
  hawaiian: "Extra Pineapple",
  "pepperoni-plus": "Extra Pepperoni",
  "meat-feast": "Extra Brisket",
  "bbq-feast": "Extra Chicken",
  "chicken-choice": "Extra Chicken",
  "vegetarian-delight": "Extra Peppers",
  "american-hot": "Extra Pepperoni",
};

type Extra = { id: string; label: string; price: number };

function extrasFor(pizza: Pizza): Extra[] {
  const primary = PRIMARY_EXTRA[pizza.id] ?? "Extra Cheese";
  return [
    { id: "double-cheese", label: "Double Cheese", price: 0.8 },
    { id: "extra-mushrooms", label: "Extra Mushrooms", price: 0.7 },
    { id: primary.toLowerCase().replace(/[^a-z]+/g, "-"), label: primary, price: 0.8 },
    { id: "jalapenos", label: "Jalapeños", price: 0.7 },
  ];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const groupLabel =
  "mb-12 p-0 font-heading text-14 font-extrabold uppercase leading-[normal] text-pw-green-700 max-lg:mb-[12px] max-lg:text-[14px]";

const pill =
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-pill border border-solid border-pw-line bg-pw-surface px-18 py-12 font-heading text-14 font-bold leading-[normal] text-pw-ink transition-colors hover:border-pw-green-700 has-[:checked]:border-transparent has-[:checked]:bg-pw-green-700 has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-pw-green-700 max-lg:min-h-[44px] max-lg:px-[18px] max-lg:py-[10px] max-lg:text-[14px]";

const stepBtn =
  "flex size-32 shrink-0 cursor-pointer items-center justify-center rounded-16 font-heading text-18 font-extrabold leading-[normal] disabled:cursor-not-allowed disabled:opacity-30 max-lg:size-[44px] max-lg:rounded-[22px] max-lg:text-[18px]";

export function ProductHero({ pizza }: { pizza: Pizza }) {
  const uid = useId();
  const extras = extrasFor(pizza);
  const addToCart = useCartStore((s) => s.add);

  const [size, setSize] = useState<PizzaSize>('12"');
  const [crust, setCrust] = useState<CrustId>("classic-sourdough");
  const [checked, setChecked] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [hasAdded, setHasAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const chosenExtras = extras.filter((e) => checked.includes(e.id));
  const unitPrice = round2(pizzaPrice(pizza, size) + chosenExtras.reduce((s, e) => s + e.price, 0));
  const subtotal = round2(unitPrice * qty);
  const crustLabel = CRUSTS.find((c) => c.id === crust)?.label ?? "";

  function toggleExtra(id: string) {
    setChecked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function handleAdd() {
    const ids = chosenExtras.map((e) => e.id).sort();
    addToCart(
      {
        id: `menu-${pizza.id}-${size.replace('"', "")}-${crust}-${ids.join(".")}`,
        name: `${pizza.name} ${size}`,
        price: unitPrice,
        meta: `${size} · ${crustLabel}${
          chosenExtras.length ? ` · ${chosenExtras.map((e) => e.label).join(", ")}` : ""
        }`,
        image: pizza.image,
      },
      qty,
    );
    setAdded(true);
    setHasAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  }

  return (
    <section
      aria-labelledby={`${uid}-title`}
      className="flex w-full items-start gap-48 bg-white p-80 max-lg:flex-col max-lg:items-center max-lg:gap-[32px] max-lg:px-[40px] max-lg:py-[48px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:py-[32px]"
    >
      {/* Massive Image Column */}
      <div className="relative h-600 w-680 shrink-0 overflow-hidden rounded-32 max-lg:aspect-[680/600] max-lg:h-auto max-lg:w-full max-lg:max-w-[720px] max-lg:rounded-[24px] max-sm:rounded-[20px]">
        <Image
          src={HERO_IMAGE[pizza.id] ?? pizza.image}
          alt={pizza.name}
          fill
          priority
          sizes="(max-width: 1023px) min(720px, 100vw), 47vw"
          className="object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-pw-green-900/15" />
      </div>

      {/* Config Column */}
      <div className="flex w-552 min-w-0 shrink-0 flex-col items-start gap-32 max-lg:w-full max-lg:max-w-[720px] max-lg:shrink max-lg:gap-[28px] max-sm:gap-[24px]">
        <div className="flex w-full flex-col items-start gap-12 max-lg:gap-[10px]">
          <h1
            id={`${uid}-title`}
            className="w-full break-words font-heading text-56 font-black leading-[normal] text-pw-ink max-lg:text-[length:clamp(36px,6vw,56px)] max-lg:leading-[1.1] max-sm:text-[length:clamp(28px,9vw,40px)]"
          >
            {pizza.name.toUpperCase()}
          </h1>
          <div className="flex items-center gap-8 leading-[normal] max-lg:gap-[8px]">
            <div aria-hidden="true" className="flex items-start gap-4 max-lg:gap-[4px]">
              {[0, 1, 2, 3].map((i) => (
                <Image
                  key={i}
                  src="/brand/product/icon-star.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="block size-16 max-lg:size-[16px]"
                />
              ))}
              <Image
                src="/brand/product/icon-star-outline.svg"
                alt=""
                width={16}
                height={16}
                className="block size-16 max-lg:size-[16px]"
              />
            </div>
            <span className="sr-only">Rated 4.7 out of 5 from 128 reviews</span>
            <p aria-hidden="true" className="whitespace-nowrap font-body text-14 font-bold text-pw-ink max-lg:text-[14px]">
              4.7
            </p>
            <p aria-hidden="true" className="whitespace-nowrap font-body text-14 font-normal text-pw-muted max-lg:text-[14px]">
              (128 reviews)
            </p>
          </div>
        </div>

        <p className="w-full font-body text-16 font-normal leading-26 text-pw-muted max-lg:text-[16px] max-lg:leading-[26px] max-sm:text-[15px] max-sm:leading-[24px]">
          {pizza.description}
        </p>

        {/* Size */}
        <fieldset className="m-0 w-full min-w-0 border-0 p-0">
          <legend className={groupLabel}>Select Size</legend>
          <div className="flex w-full flex-wrap items-start gap-12 max-lg:gap-[10px] max-sm:gap-[8px]">
            {PIZZA_SIZES.map((s) => (
              <label key={s} className={pill}>
                <input
                  type="radio"
                  name={`${uid}-size`}
                  value={s}
                  checked={size === s}
                  onChange={() => setSize(s)}
                  className="sr-only"
                />
                {`${s} • ${money(pizzaPrice(pizza, s))}`}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Crust */}
        <fieldset className="m-0 w-full min-w-0 border-0 p-0">
          <legend className={groupLabel}>Select Crust</legend>
          <div className="flex w-full flex-wrap items-start gap-12 max-lg:gap-[10px] max-sm:gap-[8px]">
            {CRUSTS.map((c) => (
              <label key={c.id} className={pill}>
                <input
                  type="radio"
                  name={`${uid}-crust`}
                  value={c.id}
                  checked={crust === c.id}
                  onChange={() => setCrust(c.id)}
                  className="sr-only"
                />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Extra toppings */}
        <fieldset className="m-0 w-full min-w-0 border-0 p-0">
          <legend className="mb-16 p-0 font-heading text-14 font-extrabold uppercase leading-[normal] text-pw-green-700 max-lg:mb-[14px] max-lg:text-[14px]">
            Extra Toppings
          </legend>
          <div className="flex w-full flex-col items-start gap-12 max-lg:gap-[10px]">
            {extras.map((e) => (
              <label
                key={e.id}
                className="group flex w-full cursor-pointer items-center justify-between gap-12 rounded-16 bg-pw-surface p-16 leading-[normal] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-pw-green-700 max-lg:min-h-[56px] max-lg:gap-[12px] max-lg:rounded-[14px] max-lg:px-[16px] max-lg:py-[12px]"
              >
                <span className="flex min-w-0 items-center gap-12 max-lg:gap-[12px]">
                  <input
                    type="checkbox"
                    checked={checked.includes(e.id)}
                    onChange={() => toggleExtra(e.id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="flex size-24 shrink-0 items-center justify-center rounded-6 border-2 border-solid border-pw-line bg-transparent group-has-[:checked]:border-transparent group-has-[:checked]:bg-pw-green-700 max-lg:size-[24px] max-lg:rounded-[6px]"
                  >
                    <Image
                      src="/brand/product/icon-check.svg"
                      alt=""
                      width={12}
                      height={12}
                      className="invisible block size-12 group-has-[:checked]:visible max-lg:size-[12px]"
                    />
                  </span>
                  <span className="min-w-0 font-heading text-15 font-bold text-pw-ink max-lg:text-[15px]">
                    {e.label}
                  </span>
                </span>
                <span className="shrink-0 whitespace-nowrap font-heading text-14 font-bold text-pw-green-700 max-lg:text-[14px]">
                  +{money(e.price)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Add section */}
        <div className="flex w-full flex-col items-end gap-12 max-lg:gap-[12px]">
          <div className="flex w-full items-center justify-between gap-16 max-lg:gap-[16px] max-sm:flex-wrap">
            <div
              role="group"
              aria-label="Quantity"
              className="flex shrink-0 items-center gap-16 rounded-pill bg-pw-surface p-12 max-lg:gap-[12px] max-lg:p-[6px]"
            >
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className={`${stepBtn} bg-white text-pw-ink`}
              >
                -
              </button>
              <p
                aria-live="polite"
                className="min-w-[2ch] text-center font-heading text-16 font-extrabold leading-[normal] text-pw-ink max-lg:text-[16px]"
              >
                {qty}
              </p>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={qty >= MAX_ITEM_QTY}
                onClick={() => setQty((q) => Math.min(MAX_ITEM_QTY, q + 1))}
                className={`${stepBtn} bg-pw-green-700 text-white`}
              >
                +
              </button>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2 whitespace-nowrap leading-[normal] max-sm:items-end">
              <p className="font-body text-12 font-normal uppercase text-pw-muted max-lg:text-[12px]">Subtotal</p>
              <p
                aria-live="polite"
                className="font-heading text-28 font-black text-pw-green-700 max-lg:text-[26px]"
              >
                {money(subtotal)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-pill bg-pw-red-600 px-36 py-18 font-heading text-16 font-extrabold uppercase leading-[normal] text-white transition-colors hover:bg-[#c40c01] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-red-600 max-lg:min-h-[52px] max-lg:px-[28px] max-lg:py-[14px] max-lg:text-[15px] max-sm:w-full max-sm:basis-full"
            >
              <span aria-live="polite">{added ? "Added ✓" : `Add to Basket — ${money(subtotal)}`}</span>
            </button>
          </div>

          {hasAdded && (
            <Link
              href="/cart"
              className="font-body text-14 font-bold text-pw-green-700 underline underline-offset-4 hover:text-pw-green-900 max-lg:inline-flex max-lg:min-h-[44px] max-lg:items-center max-lg:text-[14px] max-sm:self-center"
            >
              View basket
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
