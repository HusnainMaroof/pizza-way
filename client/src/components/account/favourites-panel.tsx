"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { money } from "@/components/cart/cart-items";
import { useOrderHydrated } from "@/components/confirmation/confirmation-hero";
import type { OrderItem } from "@/schemas/order";
import { useCartStore } from "@/store/cart-store";
import { useOrderStore, type PlacedOrder } from "@/store/order-store";

type Favourite = { key: string; item: Omit<OrderItem, "qty">; count: number };

const SECTION = "flex w-full min-w-0 flex-col items-start gap-32 max-lg:gap-[24px]";
const HEADING =
  "font-heading text-32 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(24px,4vw,30px)]";
const CARD =
  "flex w-full min-w-0 flex-col gap-20 rounded-20 border-[1.5px] border-solid border-pw-line bg-white p-24 max-lg:gap-[16px] max-lg:rounded-[20px] max-lg:p-[20px] max-sm:p-[16px]";
const PILL =
  "inline-flex items-center justify-center rounded-pill bg-pw-green-700 px-24 py-12 font-heading text-13 leading-[normal] font-extrabold whitespace-nowrap text-white uppercase transition-colors hover:bg-pw-green-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:min-h-[44px] max-lg:px-[24px] max-lg:text-[14px]";

const ADDED_MS = 1600;

/** Top 6 items by total quantity across the history. Item data comes from the most recent occurrence. */
function deriveFavourites(history: PlacedOrder[]): Favourite[] {
  const map = new Map<string, Favourite>();
  for (const order of history) {
    for (const it of order.items ?? []) {
      const key = it.name?.trim().toLowerCase();
      if (!key) continue;
      const qty = Number.isFinite(it.qty) && it.qty > 0 ? it.qty : 1;
      const found = map.get(key);
      if (found) found.count += qty;
      else
        map.set(key, {
          key,
          count: qty,
          item: { id: it.id, name: it.name, price: it.price, meta: it.meta, image: it.image },
        });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 6);
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your favourites" className="grid w-full grid-cols-2 gap-16 max-lg:grid-cols-1 max-lg:gap-[16px]">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-150 w-full animate-pulse rounded-20 bg-pw-line motion-reduce:animate-none max-lg:h-[140px] max-lg:rounded-[20px]" />
      ))}
    </div>
  );
}

/** Account "My Favourites" tab: most-ordered items with a one-tap "Order again". */
export function FavouritesPanel() {
  const hydrated = useOrderHydrated();
  const history = useOrderStore((s) => s.history);
  const favourites = useMemo(() => deriveFavourites(history ?? []), [history]);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach(clearTimeout);
      map.clear();
    };
  }, []);

  function orderAgain(fav: Favourite) {
    useCartStore.getState().add(fav.item, 1);
    setAdded((a) => ({ ...a, [fav.key]: true }));
    const prev = timers.current.get(fav.key);
    if (prev) clearTimeout(prev);
    timers.current.set(
      fav.key,
      setTimeout(() => {
        timers.current.delete(fav.key);
        setAdded((a) => ({ ...a, [fav.key]: false }));
      }, ADDED_MS),
    );
  }

  return (
    <section aria-labelledby="account-favourites-heading" className={SECTION}>
      <h2 id="account-favourites-heading" className={HEADING}>
        My Favourites
      </h2>

      {!hydrated ? (
        <Skeleton />
      ) : favourites.length === 0 ? (
        <div className={`${CARD} items-start`}>
          <p className="font-body text-15 leading-[1.5] font-normal text-pw-muted max-lg:text-[15px]">
            No favourites yet. The pizzas and sides you order most will appear here.
          </p>
          <Link href="/menu" className={`${PILL} max-sm:w-full`}>
            Browse the menu
          </Link>
        </div>
      ) : (
        <ul className="m-0 grid w-full list-none grid-cols-2 gap-16 p-0 max-lg:grid-cols-1 max-lg:gap-[16px]">
          {favourites.map((fav) => {
            const { item, count } = fav;
            const isAdded = !!added[fav.key];
            const img = item.image?.startsWith("/") ? item.image : "/brand/icons/pizza.svg";
            const isPhoto = img !== "/brand/icons/pizza.svg";
            return (
              <li key={fav.key} className={CARD}>
                <div className="flex min-w-0 items-start gap-16 max-lg:gap-[14px]">
                  <div className="flex size-64 shrink-0 items-center justify-center overflow-hidden rounded-16 bg-pw-green-100 max-lg:size-[60px] max-lg:rounded-[14px]">
                    <Image
                      src={img}
                      alt=""
                      width={isPhoto ? 64 : 28}
                      height={isPhoto ? 64 : 28}
                      className={isPhoto ? "block size-full object-cover" : "block size-28 max-lg:size-[26px]"}
                    />
                  </div>
                  <div className="flex min-w-0 flex-col gap-6 leading-[normal] wrap-break-word max-lg:gap-[6px]">
                    <h3 className="font-heading text-18 leading-[normal] font-extrabold text-pw-ink max-lg:text-[17px]">{item.name}</h3>
                    {item.meta ? (
                      <p className="line-clamp-2 font-body text-14 leading-[normal] font-normal text-pw-muted max-lg:text-[14px]">
                        {item.meta}
                      </p>
                    ) : null}
                    <p className="font-body text-13 leading-[normal] font-bold text-pw-green-700 max-lg:text-[13px]">
                      Ordered {count} {count === 1 ? "time" : "times"}
                    </p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-16 max-lg:gap-[12px]">
                  <p className="font-heading text-22 leading-[normal] font-black whitespace-nowrap text-pw-ink max-lg:text-[20px]">
                    {money(item.price)}
                  </p>
                  <button
                    type="button"
                    onClick={() => orderAgain(fav)}
                    aria-label={isAdded ? `${item.name} added to basket` : `Order ${item.name} again`}
                    className={`${PILL} cursor-pointer border-0`}
                  >
                    {isAdded ? "Added ✓" : "Order again"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p aria-live="polite" className="sr-only">
        {Object.entries(added)
          .filter(([, v]) => v)
          .map(([k]) => `${favourites.find((f) => f.key === k)?.item.name ?? "Item"} added to basket.`)
          .join(" ")}
      </p>
    </section>
  );
}
