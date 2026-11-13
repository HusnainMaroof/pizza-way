"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { OrderItem } from "@/schemas/order";
import { MAX_ITEM_QTY, useCartStore } from "@/store/cart-store";

export const money = (n: number) => `£${n.toFixed(2)}`;

/** True once the persisted basket has been loaded from localStorage (false on the server). */
export function useCartHydrated() {
  return useSyncExternalStore(
    (cb) => useCartStore.persist.onFinishHydration(cb),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );
}

const stepBtn =
  "flex size-24 shrink-0 cursor-pointer items-center justify-center rounded-12 font-heading text-14 leading-[normal] font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 disabled:cursor-not-allowed disabled:opacity-30 max-lg:size-[44px] max-lg:rounded-pill max-lg:text-[18px]";

const actionLink =
  "cursor-pointer font-heading text-13 leading-[normal] font-bold underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pw-green-700 max-lg:flex max-lg:min-h-[44px] max-lg:items-center max-lg:text-[14px]";

function CartLine({ item }: { item: OrderItem }) {
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const editHref = item.id.startsWith("byo-") ? "/build-your-pizza" : "/menu";

  return (
    <li className="flex w-full items-center gap-24 rounded-24 border border-solid border-pw-line bg-pw-surface p-24 max-lg:gap-[16px] max-lg:rounded-[20px] max-lg:p-[20px] max-sm:flex-wrap max-sm:gap-x-[14px] max-sm:gap-y-[12px] max-sm:rounded-[16px] max-sm:p-[16px]">
      <div className="relative size-100 shrink-0 overflow-hidden rounded-12 max-lg:size-[88px] max-sm:size-[72px] max-sm:self-start">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 72px, (max-width: 1023px) 88px, 7vw"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-pw-green-100">
            <Image
              src="/brand/icons/pizza.svg"
              alt=""
              width={40}
              height={40}
              className="block size-40 max-lg:size-[36px] max-sm:size-[30px]"
            />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-[1_0_0] flex-col items-start gap-8 leading-[normal] max-lg:gap-[4px]">
        <h3 className="font-heading text-18 leading-[normal] font-extrabold wrap-break-word text-pw-ink max-lg:text-[17px] max-sm:text-[16px]">
          {item.name}
        </h3>
        {item.meta ? (
          <p className="font-body text-14 leading-[normal] font-normal wrap-break-word text-pw-muted max-lg:text-[14px] max-lg:leading-[1.4]">
            {item.meta}
          </p>
        ) : null}
        <p className="font-body text-13 leading-[normal] font-bold text-pw-green-700 max-lg:text-[13px]">
          {money(item.price)} each
        </p>
        <div className="flex items-start gap-16 max-lg:gap-[20px]">
          <Link href={editHref} className={`${actionLink} text-pw-green-700`}>
            Edit<span className="sr-only"> {item.name}</span>
          </Link>
          <button
            type="button"
            onClick={() => remove(item.id)}
            aria-label={`Remove ${item.name} from basket`}
            className={`${actionLink} text-pw-red-600`}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-32 max-lg:gap-[20px] max-sm:w-full max-sm:justify-between">
        <div
          role="group"
          aria-label={`Quantity of ${item.name}`}
          className="flex items-center gap-12 rounded-pill border border-solid border-pw-line bg-white p-8 max-lg:gap-[8px] max-lg:p-[2px]"
        >
          <button
            type="button"
            aria-label={`Decrease quantity of ${item.name}`}
            onClick={() => setQty(item.id, item.qty - 1)}
            className={`${stepBtn} bg-pw-surface text-pw-ink hover:bg-pw-line`}
          >
            <span aria-hidden="true">-</span>
          </button>
          <p
            aria-live="polite"
            className="min-w-[2ch] text-center font-heading text-14 leading-[normal] font-extrabold text-pw-ink max-lg:text-[16px]"
          >
            {item.qty}
          </p>
          <button
            type="button"
            aria-label={`Increase quantity of ${item.name}`}
            disabled={item.qty >= MAX_ITEM_QTY}
            onClick={() => setQty(item.id, item.qty + 1)}
            className={`${stepBtn} bg-pw-green-700 text-white hover:bg-pw-green-600`}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
        <p className="min-w-80 text-right font-heading text-20 leading-[normal] font-black whitespace-nowrap text-pw-ink max-lg:min-w-[72px] max-lg:text-[19px]">
          <span className="sr-only">Line total </span>
          {money(item.price * item.qty)}
        </p>
      </div>
    </li>
  );
}

export function CartItems() {
  const items = useCartStore((s) => s.items);

  return (
    <div className="flex w-full flex-col items-start gap-24 max-lg:gap-[16px]">
      <h2 className="sr-only">Basket items</h2>
      <ul className="flex w-full flex-col items-start gap-24 max-lg:gap-[16px]">
        {items.map((item) => (
          <CartLine key={item.id} item={item} />
        ))}
      </ul>

      <div className="flex w-full items-center justify-between gap-24 rounded-28 bg-pw-green-700 p-32 max-lg:rounded-[24px] max-lg:p-[24px] max-sm:flex-col max-sm:items-start max-sm:gap-[16px] max-sm:rounded-[20px] max-sm:p-[20px]">
        <div className="flex w-450 max-w-full min-w-0 flex-col items-start gap-8 leading-[normal] max-lg:w-auto max-lg:flex-1 max-lg:gap-[6px]">
          <p className="font-heading text-24 leading-[normal] font-black text-white max-lg:text-[length:clamp(19px,3vw,24px)]">
            ADD A DEAL AND SAVE!
          </p>
          <p className="font-body text-14 leading-[normal] font-normal text-pw-green-100 max-lg:text-[14px] max-lg:leading-[1.4]">
            Upgrade your custom choice with sides and drinks at a massive discount.
          </p>
        </div>
        <Link
          href="/deals"
          className="flex shrink-0 items-center justify-center rounded-pill bg-pw-green-900 px-24 py-12 font-heading text-14 leading-[normal] font-extrabold whitespace-nowrap text-white transition-colors hover:bg-pw-green-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white max-lg:min-h-[44px] max-lg:px-[20px] max-lg:text-[14px] max-sm:w-full"
        >
          Solo Saver Upgrade (+£2.50)
        </Link>
      </div>
    </div>
  );
}
