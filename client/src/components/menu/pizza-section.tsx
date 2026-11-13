"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { useCartStore } from "@/store/cart-store";
import { DUR, EASE_OUT, RISE, SPRING_SNAPPY, SPRING_SOFT, STAGGER, VIEWPORT_ONCE } from "@/components/motion/tokens";

import type { Pizza, PizzaSize, PizzaTag } from "./pizza-data";
import { PIZZA_SIZES, pizzaPrice, pizzas } from "./pizza-data";

// Re-exported so existing imports from "./pizza-section" keep working (client components only).
export { PIZZA_SIZES, pizzaPrice, pizzas };
export type { Pizza, PizzaSize, PizzaTag };

const MotionImage = motion.create(Image);

/** Card hover: lift + soft shadow layer + photo turn (variants propagate from the article). */
const cardHover = { rest: { y: 0 }, hover: { y: -6 } };
const shadowHover = { rest: { opacity: 0 }, hover: { opacity: 1 } };
const photoHover = { rest: { scale: 1, rotate: 0 }, hover: { scale: 1.06, rotate: 3 } };

/** "+1" chip that rises 24px and fades out once; the parent removes it when done. */
export function PlusOneChip({ onDone, className }: { onDone: () => void; className: string }) {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ opacity: 0, y: 0, scale: 0.9 }}
      animate={{ opacity: [0, 1, 1, 0], y: -24, scale: 1 }}
      transition={{ duration: DUR.slow, ease: EASE_OUT, opacity: { duration: DUR.slow, times: [0, 0.15, 0.6, 1] } }}
      onAnimationComplete={onDone}
      className={className}
    >
      +1
    </motion.span>
  );
}

/** Label that cross-fades between the idle text and "Added ✓" (with a tiny pop on the check). */
export function AddedLabel({ added, idle }: { added: boolean; idle: string }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {added ? (
        <motion.span
          key="added"
          className="inline-flex items-center"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
        >
          Added&nbsp;
          <motion.span
            className="inline-block"
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            transition={{ ...SPRING_SNAPPY, delay: 0.05 }}
          >
            ✓
          </motion.span>
        </motion.span>
      ) : (
        <motion.span
          key="idle"
          className="inline-block"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
        >
          {idle}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function PizzaCard({ pizza }: { pizza: Pizza }) {
  const [size, setSize] = useState<PizzaSize>('12"');
  const addToCart = useCartStore((st) => st.add);
  const [added, setAdded] = useState(false);
  const [bursts, setBursts] = useState<number[]>([]);
  const burstId = useRef(0);
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
    burstId.current += 1;
    const id = burstId.current;
    setBursts((b) => [...b, id]);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  }

  return (
    <motion.article
      variants={cardHover}
      initial="rest"
      animate="rest"
      whileHover="hover"
      transition={SPRING_SOFT}
      className="relative flex items-center gap-24 rounded-32 border-[1.5px] border-pw-line bg-pw-surface p-32 max-lg:flex-col max-lg:items-stretch max-lg:gap-[20px] max-lg:p-[24px] max-sm:gap-[16px] max-sm:rounded-[24px] max-sm:p-[20px]"
    >
      <motion.span
        aria-hidden="true"
        variants={shadowHover}
        transition={{ duration: DUR.fast, ease: EASE_OUT }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[0_18px_40px_-18px_rgba(2,77,26,0.35)]"
      />
      <Link href={`/menu/${pizza.id}`} aria-label={`View ${pizza.name}`} className="relative block size-200 shrink-0 overflow-hidden rounded-pill max-lg:aspect-square max-lg:h-auto max-lg:w-[min(180px,60%)] max-lg:self-center max-sm:w-[min(200px,70%)]">
        <MotionImage
          src={pizza.image}
          alt={pizza.name}
          width={200}
          height={200}
          sizes="(max-width: 640px) 200px, (max-width: 1023px) 180px, 14vw"
          variants={photoHover}
          transition={SPRING_SOFT}
          className="block size-full object-cover"
        />
      </Link>
      <div className="relative flex min-w-0 flex-[1_0_0] flex-col items-start gap-16 max-lg:flex-auto max-lg:gap-[12px]">
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
              <motion.button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => setSize(s)}
                whileTap={{ scale: 0.94 }}
                transition={SPRING_SNAPPY}
                className={`relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-pill border border-solid px-16 py-8 font-heading text-12 font-extrabold leading-[normal] max-lg:min-h-[44px] max-lg:min-w-[52px] max-lg:px-[14px] max-lg:py-[8px] max-lg:text-[13px] ${
                  active
                    ? "border-pw-green-700 bg-white text-white"
                    : "border-pw-line bg-white text-pw-muted"
                }`}
              >
                {active && (
                  <motion.span
                    aria-hidden="true"
                    layoutId={`size-${pizza.id}`}
                    transition={SPRING_SNAPPY}
                    className="absolute -inset-px rounded-pill bg-pw-green-700"
                  />
                )}
                <span className="relative">{s}</span>
              </motion.button>
            );
          })}
        </div>
        <div className="flex w-full items-start">
          <motion.button
            type="button"
            aria-label={`Add ${size} ${pizza.name} to basket`}
            onClick={handleAdd}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_SNAPPY}
            className="relative flex min-w-0 flex-[1_0_0] cursor-pointer items-center justify-center whitespace-nowrap rounded-pill bg-pw-green-700 px-24 py-12 font-heading text-14 font-extrabold uppercase leading-[normal] text-white max-lg:min-h-[48px] max-lg:px-[24px] max-lg:py-[12px] max-lg:text-[14px]"
          >
            <AddedLabel added={added} idle="Add to Basket" />
            {bursts.map((id) => (
              <PlusOneChip
                key={id}
                onDone={() => setBursts((b) => b.filter((x) => x !== id))}
                className="pointer-events-none absolute -top-[14px] right-[24px] rounded-pill bg-pw-red-600 px-[10px] py-[4px] font-heading text-[12px] font-extrabold leading-[normal] text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.35)]"
              />
            ))}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

type PizzaSectionProps = {
  /** Only show pizzas with this tag. Omit to show all. */
  tag?: PizzaTag;
};

export function PizzaSection({ tag }: PizzaSectionProps) {
  const list = tag ? pizzas.filter((p) => p.tags.includes(tag)) : pizzas;
  const gridRef = useRef<HTMLDivElement>(null);
  // First view: cards stagger in once. Later filter changes: AnimatePresence + layout below.
  const revealed = useInView(gridRef, VIEWPORT_ONCE);

  return (
    <section
      className="flex w-full flex-col items-start gap-48 bg-white px-80 pb-96 pt-80 max-lg:gap-[32px] max-lg:px-[40px] max-lg:pb-[64px] max-lg:pt-[56px] max-sm:gap-[24px] max-sm:px-[20px] max-sm:pb-[48px] max-sm:pt-[40px]"
      aria-labelledby="pizza-section-title"
    >
      <motion.div
        initial={{ opacity: 0, y: RISE }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT_ONCE}
        transition={{ duration: DUR.base, ease: EASE_OUT }}
        className="flex flex-col items-start gap-8 leading-[normal] max-lg:gap-[8px]"
      >
        <p className="font-heading text-16 font-extrabold uppercase text-pw-green-700 max-sm:text-[13px]">
          SIGNATURE PIES
        </p>
        <h2
          id="pizza-section-title"
          className="font-heading text-40 font-black leading-[normal] text-pw-ink max-lg:text-[length:clamp(28px,4.5vw,40px)] max-lg:leading-[1.15] max-sm:text-[length:clamp(26px,7.5vw,34px)]"
        >
          Fired by hand. Crafted to order.
        </h2>
      </motion.div>

      <div
        ref={gridRef}
        className="relative grid w-full grid-cols-2 items-start gap-32 max-lg:gap-[20px] max-sm:grid-cols-1 max-sm:gap-[16px]"
      >
        <AnimatePresence mode="popLayout">
          {list.map((pizza, i) => (
            <motion.div
              key={pizza.id}
              layout
              // Mounted before the first reveal: rise RISE px with the stagger; mounted by a filter change: shorter rise after the exits.
              initial={{ opacity: 0, y: revealed ? 16 : RISE }}
              animate={revealed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: RISE }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2, ease: EASE_OUT } }}
              transition={{
                duration: DUR.base,
                ease: EASE_OUT,
                delay: revealed ? 0.1 + Math.min(i, 5) * 0.04 : Math.min(i, 8) * STAGGER,
                layout: { ...SPRING_SOFT, delay: 0 },
              }}
            >
              <PizzaCard pizza={pizza} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
