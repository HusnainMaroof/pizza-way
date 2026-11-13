"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DUR, EASE_OUT, SPRING_SNAPPY } from "@/components/motion/tokens";
import { PizzaSection, type PizzaTag } from "./pizza-section";
import { SidesSection } from "./sides-section";

type FilterId = "all" | PizzaTag | "sides" | "drinks";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "classic", label: "Classic" },
  { id: "meat", label: "Meat" },
  { id: "chicken", label: "Chicken" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "spicy", label: "Spicy" },
  { id: "sides", label: "Sides" },
  { id: "drinks", label: "Drinks" },
];

const FADE = { duration: DUR.fast, ease: EASE_OUT };

/** True once the sticky filter bar is pinned under the header (sentinel scrolled past the bar's `top`). */
function useStuck(barRef: RefObject<HTMLElement | null>, sentinelRef: RefObject<HTMLElement | null>) {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const bar = barRef.current;
    const sentinel = sentinelRef.current;
    if (!bar || !sentinel) return;
    let io: IntersectionObserver | null = null;
    const observe = () => {
      io?.disconnect();
      const top = Math.round(parseFloat(getComputedStyle(bar).top) || 0);
      io = new IntersectionObserver(
        ([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < top + 1),
        { rootMargin: `-${top}px 0px 0px 0px`, threshold: 0 },
      );
      io.observe(sentinel);
    };
    observe();
    window.addEventListener("resize", observe);
    return () => {
      window.removeEventListener("resize", observe);
      io?.disconnect();
    };
  }, [barRef, sentinelRef]);
  return stuck;
}

export function MenuBrowser() {
  const [filter, setFilter] = useState<FilterId>("all");
  // Content transitions only run after the visitor changes the filter (first paint = SSR markup, no fade).
  const [interacted, setInteracted] = useState(false);
  const barRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const stuck = useStuck(barRef, sentinelRef);

  const showSides = filter === "all" || filter === "sides";
  const showPizzas = filter !== "sides" && filter !== "drinks";
  const pizzaTag = filter === "all" || !showPizzas ? undefined : (filter as PizzaTag);
  // One key for every pizza filter so the pizza grid stays mounted and its cards glide between filters.
  const view = showPizzas ? "pizzas" : filter;
  const enter = interacted ? { opacity: 0 } : false;

  return (
    <>
      {/* 1px sentinel (net zero height) that tells us when the bar below is stuck. */}
      <div ref={sentinelRef} aria-hidden="true" className="pointer-events-none -mb-px h-px" />
      <nav
        ref={barRef}
        aria-label="Menu filters"
        className="sticky top-[calc(100*var(--u))] z-40 transition-[translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none in-data-[header-hidden=true]:-translate-y-[calc(100*var(--u))] max-lg:in-data-[header-hidden=true]:-translate-y-[72px] max-sm:in-data-[header-hidden=true]:-translate-y-[64px] flex w-full items-start border-b-[1.5px] border-solid border-pw-line px-80 py-24 max-lg:top-[72px] max-lg:px-[40px] max-lg:py-[16px] max-sm:top-[64px] max-sm:px-0 max-sm:py-[12px]"
      >
        {/* Background layers: solid white at rest; translucent blur + soft shadow once stuck (opacity only). */}
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ opacity: stuck ? 1 : 0 }}
          transition={FADE}
          className="pointer-events-none absolute inset-0 shadow-[0_10px_24px_-14px_rgba(19,28,19,0.28)]"
        />
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ opacity: stuck ? 0 : 1 }}
          transition={FADE}
          className="pointer-events-none absolute inset-0 bg-white"
        />
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ opacity: stuck ? 1 : 0 }}
          transition={FADE}
          className="pointer-events-none absolute inset-0 bg-white/80 backdrop-blur-md"
        />
        <motion.div
          layoutScroll
          className="relative flex min-w-0 flex-[1_0_0] flex-wrap content-start items-start gap-12 max-lg:gap-[10px] max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:px-[20px] max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden"
        >
          {FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <motion.button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setInteracted(true);
                  setFilter(f.id);
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={SPRING_SNAPPY}
                className={`relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-pill border border-solid bg-pw-surface px-24 py-11 font-heading text-14 font-extrabold leading-[normal] max-lg:min-h-[44px] max-lg:px-[20px] max-lg:py-[10px] max-lg:text-[14px] ${
                  active ? "border-pw-green-700 text-white" : "border-pw-line text-pw-ink"
                }`}
              >
                {active && (
                  <motion.span
                    aria-hidden="true"
                    layoutId="menu-filter-pill"
                    transition={SPRING_SNAPPY}
                    className="absolute -inset-px rounded-pill bg-pw-green-700"
                  />
                )}
                <span className="relative">{f.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={enter}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
          transition={FADE}
        >
          {showPizzas && <PizzaSection tag={pizzaTag} />}

          <AnimatePresence>
            {showSides && (
              <motion.div
                key="sides"
                initial={enter}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
                transition={FADE}
              >
                <SidesSection />
              </motion.div>
            )}
          </AnimatePresence>

          {filter === "drinks" && (
            <section className="flex w-full flex-col items-center gap-12 bg-white px-80 py-120 text-center max-lg:gap-[10px] max-lg:px-[40px] max-lg:py-[72px] max-sm:px-[20px] max-sm:py-[56px]">
              <h2 className="font-heading text-32 font-black leading-[normal] text-pw-ink max-lg:text-[26px]">
                Drinks are coming soon
              </h2>
              <p className="font-body text-16 font-normal leading-[1.6] text-pw-muted max-lg:text-[16px]">
                We are still filling the fridge. Check back shortly.
              </p>
            </section>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
