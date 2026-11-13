"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, ScrollTrigger, useGSAP, MOTION_OK, DESKTOP } from "@/lib/gsap";
import { DUR, RISE, STAGGER } from "@/components/motion/tokens";

const pizzas = [
  {
    name: "Margherita",
    price: "From £3.50",
    description:
      "San Marzano DOP tomatoes, fresh fior di latte, extra virgin olive oil, sweet wild basil.",
    image: "/brand/images/featured-margherita.png",
  },
  {
    name: "Pepperoni Plus",
    price: "From £4.50",
    description:
      "Double pepperoni, spicy nduja paste, hot honey drizzle, aged parmesan crust dusting.",
    image: "/brand/images/featured-pepperoni-plus.png",
  },
  {
    name: "Meat Feast",
    price: "From £4.50",
    description:
      "Smoked oak brisket, house-made fennel sausage, dynamic shredded chicken, smoked ham.",
    image: "/brand/images/featured-meat-feast.png",
  },
  {
    name: "American Hot",
    price: "From £4.50",
    description:
      "Spicy jalapeño slices, dynamic red onion slivers, premium pepperoni, hot roito chilli sauce.",
    image: "/brand/images/featured-american-hot.png",
  },
];

/**
 * "Round table" entrance (desktop): every card sits on an orbit around the middle of the grid. Each card starts at
 * `from` degrees on a wider orbit (`reach` x its resting distance) and sweeps round to its resting spot (angle in
 * screen degrees: 0 = right, 90 = down, 180 = left, 270 = up).
 *   1. Margherita (top-left)      comes in from the LEFT
 *   2. Pepperoni Plus (top-right) comes up from the BOTTOM
 *   3. Meat Feast (bottom-left)   comes up from the BOTTOM-LEFT
 *   4. American Hot (bottom-right) comes in from the RIGHT
 */
const ORBIT = [
  { from: 165, reach: 2.4, tilt: -10 },
  { from: 105, reach: 2.2, tilt: 8 },
  { from: 75, reach: 2.2, tilt: -8 },
  { from: -15, reach: 2.4, tilt: 10 },
];

/** Scroll distance (px) the section stays pinned while the 4 cards orbit in. */
const PIN_DISTANCE = 3800;
/** Timeline units: each card's orbit lasts CARD_LEN and the next one starts CARD_GAP after the previous. */
const CARD_LEN = 1.5;
const CARD_GAP = 1.3;
/** Timeline units before the first card starts (the green wipe + heading arrival). */
const ARRIVE = 1.9;

// Motion-only classes (no sizing). CSS `translate`/`scale`/`rotate` compose with GSAP's `transform`.
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const BUTTON_MOTION = `transition-[translate,scale] duration-250 ${EASE} motion-safe:hover:-translate-y-[2px] motion-safe:active:scale-[0.97]`;

const rad = (deg: number) => (deg * Math.PI) / 180;

/*
 * Desktop (>= 1024px) with motion allowed: a one-screen-tall stage pins. Quick Order (the `before` layer) sits at the
 * bottom and ONE scrubbed timeline plays: the green section wipes up over it (same transition as Core Formula ->
 * System), the heading rises in, then the four cards orbit in one by one. Content keeps the Figma spacing and is
 * scaled down only when the screen is too short. Only transform, opacity and clip-path are animated.
 * Tablet / phone: no pin, a staggered reveal. Reduced motion: nothing moves.
 */
/** Space (px) kept free above/below the content in the pinned stage so it never touches the screen edges / header. */
const FIT_MARGIN = 120;

export function FeaturedPizzas({ before }: { before?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const sectionEl = section.current;
      const gridEl = grid.current;
      if (!root.current || !sectionEl || !gridEl) return;
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: `${DESKTOP} and ${MOTION_OK}`,
          compact: `(max-width: 1023.98px) and ${MOTION_OK}`,
        },
        (ctx) => {
          const q = gsap.utils.selector(root.current);
          const head = q("[data-fp-head]");
          const cards = q("[data-fp-card]") as HTMLElement[];

          // ---- Tablet / phone: staggered reveal, no pin. ----
          if (!ctx.conditions?.desktop) {
            gsap.from(head, {
              opacity: 0,
              y: RISE,
              duration: DUR.base,
              scrollTrigger: { trigger: head[0], start: "top 85%", once: true },
            });
            gsap.from(cards, {
              opacity: 0,
              y: RISE,
              duration: DUR.base,
              stagger: STAGGER,
              scrollTrigger: { trigger: cards[0], start: "top 88%", once: true },
            });
            return;
          }

          // ---- Desktop: pinned "round table" sequence. ----
          // Resting offset of each card from the centre of the grid (layout values, unaffected by transforms).
          type Geo = { vx: number; vy: number; len: number; angle: number };
          let geo: Geo[] = [];
          const measure = () => {
            const cx = gridEl.clientWidth / 2;
            const cy = gridEl.clientHeight / 2;
            geo = cards.map((card) => {
              const vx = card.offsetLeft + card.offsetWidth / 2 - cx;
              const vy = card.offsetTop + card.offsetHeight / 2 - cy;
              return { vx, vy, len: Math.hypot(vx, vy), angle: Math.atan2(vy, vx) };
            });
          };
          measure();

          // Place a card at orbit progress p (0 = start, 1 = resting place).
          const place = (i: number, p: number) => {
            const g = geo[i];
            const o = ORBIT[i];
            const a = rad(o.from) + (g.angle - rad(o.from)) * p;
            const reach = o.reach + (1 - o.reach) * p;
            gsap.set(cards[i], {
              x: Math.cos(a) * g.len * reach - g.vx,
              y: Math.sin(a) * g.len * reach - g.vy,
              rotation: o.tilt * (1 - p),
              scale: 0.82 + 0.18 * p,
              opacity: Math.min(1, p * 2.4),
            });
          };

          cards.forEach((_, i) => place(i, 0));

          // Quick Order (the `before` layer) is the bottom layer of the stage; the green section wipes up over it.
          gsap.set(sectionEl, { clipPath: "inset(100% 0% 0% 0%)" });
          gsap.set(head, { opacity: 0, y: 36 });

          // Responsive fit: the stage is exactly one screen tall; each layer's content is scaled down (never up)
          // so it fits the screen height (wide-but-short screens, e.g. 1920x1080 or 1366x768).
          const fitEls = q("[data-fit]") as HTMLElement[];
          const applyFit = () =>
            fitEls.forEach((el) => {
              const h = el.offsetHeight; // layout height, unaffected by transforms
              gsap.set(el, { scale: Math.min(1, (window.innerHeight - FIT_MARGIN) / h), transformOrigin: "50% 50%" });
            });
          applyFit();
          ScrollTrigger.addEventListener("refreshInit", applyFit);

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: `+=${PIN_DISTANCE}`,
              pin: true,
              pinSpacing: true,
              scrub: 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onRefresh: () => {
                measure();
                cards.forEach((_, i) => place(i, tl.progress() === 0 ? 0 : orbit[i].p));
              },
            },
          });

          const orbit = cards.map(() => ({ p: 0 }));
          // Arrival: green wipes up over the white stage, then the heading rises in.
          tl.to(sectionEl, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "power2.inOut" }, 0)
            .to(head, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 0.9);
          // Then the cards orbit in one by one.
          cards.forEach((_, i) => {
            tl.to(
              orbit[i],
              { p: 1, duration: CARD_LEN, ease: "power2.out", onUpdate: () => place(i, orbit[i].p) },
              ARRIVE + i * CARD_GAP,
            );
          });
          // Short hold with all four cards in place before the pin releases.
          tl.to({}, { duration: 0.8 });

          return () => ScrollTrigger.removeEventListener("refreshInit", applyFit);
        },
      );

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    // Stage (pinned on desktop, exactly one screen tall): the previous section (Quick Order, passed as `before`) is
    // the bottom layer and the green section wipes up over it when you scroll in. No blank stage.
    <div ref={root} className="w-full motion-safe:lg:grid motion-safe:lg:h-svh motion-safe:lg:grid-rows-[minmax(0,1fr)] motion-safe:lg:overflow-hidden">
      <div className="w-full bg-white motion-safe:lg:flex motion-safe:lg:min-h-0 motion-safe:lg:items-center motion-safe:lg:[grid-area:1/1]">
        <div data-fit className="w-full">
          {before}
        </div>
      </div>
      <section
        ref={section}
        className="w-full bg-pw-green-700 px-80 py-120 max-lg:px-[40px] max-lg:py-[72px] max-sm:px-[20px] max-sm:py-[56px] motion-safe:lg:flex motion-safe:lg:min-h-0 motion-safe:lg:items-center motion-safe:lg:py-0 motion-safe:lg:[grid-area:1/1] motion-safe:lg:[clip-path:inset(100%_0%_0%_0%)]"
        aria-labelledby="featured-pizzas-title"
      >
        <div data-fit className="mx-auto flex w-full flex-col gap-80 max-lg:gap-[40px] max-sm:gap-[32px]">
          <div
            data-fp-head
            className="flex items-end justify-between gap-32 max-lg:flex-wrap max-lg:gap-[20px] max-sm:flex-col max-sm:items-start"
          >
            <div className="flex w-600 max-w-full flex-col gap-16 leading-[normal] max-lg:w-auto max-lg:flex-[1_1_360px] max-lg:gap-[10px] max-sm:w-full max-sm:flex-none">
              <p className="font-heading text-14 font-extrabold uppercase text-pw-green-500 max-sm:text-[12px]">
                THE SIGNATURE COLLECTION
              </p>
              <h2
                id="featured-pizzas-title"
                className="font-heading text-56 font-black leading-[normal] text-white max-lg:text-[length:clamp(32px,5vw,46px)] max-lg:leading-[1.1] max-sm:text-[length:clamp(28px,8.5vw,40px)]"
              >
                Crafted without compromise
              </h2>
            </div>
            <Link
              href="/menu"
              className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-pill bg-white px-28 py-14 font-heading text-14 font-extrabold uppercase leading-[normal] text-pw-ink no-underline max-lg:min-h-[44px] max-lg:px-[28px] max-lg:py-[12px] max-lg:text-[14px] ${BUTTON_MOTION}`}
            >
              View Full Menu
            </Link>
          </div>

          <div
            ref={grid}
            className="grid grid-cols-2 gap-x-32 gap-y-48 max-lg:gap-x-[20px] max-lg:gap-y-[20px] max-sm:grid-cols-1 max-sm:gap-y-[16px]"
          >
            {pizzas.map((pizza) => (
              <article
                key={pizza.name}
                data-fp-card
                className={`group flex items-center gap-24 rounded-32 bg-pw-green-900 p-32 max-lg:flex-col max-lg:items-stretch max-lg:gap-[20px] max-lg:p-[24px] max-sm:gap-[16px] max-sm:rounded-[24px] max-sm:p-[20px] transition-[translate] duration-300 ${EASE} motion-safe:hover:-translate-y-[6px]`}
              >
                <div className="size-200 shrink-0 overflow-hidden rounded-pill max-lg:aspect-square max-lg:h-auto max-lg:w-[min(180px,60%)] max-lg:self-center max-sm:w-[min(200px,70%)]">
                  <Image
                    src={pizza.image}
                    alt={pizza.name}
                    width={200}
                    height={200}
                    sizes="(max-width: 640px) 200px, (max-width: 1023px) 180px, 14vw"
                    className={`block size-full object-cover transition-[rotate,scale] duration-500 ${EASE} motion-safe:group-hover:rotate-[4deg] motion-safe:group-hover:scale-[1.05]`}
                  />
                </div>
                <div className="flex min-w-0 flex-[1_0_0] flex-col items-start gap-16 max-lg:flex-auto max-lg:gap-[12px]">
                  <div className="flex w-full items-center justify-between gap-12 whitespace-nowrap leading-[normal] max-lg:flex-wrap max-lg:gap-y-[4px] max-lg:whitespace-normal">
                    <h3 className="font-heading text-28 font-extrabold leading-[normal] text-white max-lg:text-[22px] max-lg:leading-[1.2]">
                      {pizza.name}
                    </h3>
                    <p className="font-heading text-22 font-black text-pw-green-500 max-lg:whitespace-nowrap max-lg:text-[18px]">
                      {pizza.price}
                    </p>
                  </div>
                  <p className="font-body text-14 font-normal leading-22 text-pw-green-100 max-lg:text-[14px] max-lg:leading-[22px]">
                    {pizza.description}
                  </p>
                  <Link
                    href="/menu"
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-white px-20 py-10 font-heading text-13 font-extrabold uppercase leading-[normal] text-pw-ink no-underline max-lg:mt-auto max-lg:min-h-[44px] max-lg:px-[22px] max-lg:py-[10px] max-lg:text-[13px] max-sm:w-full ${BUTTON_MOTION}`}
                  >
                    Add to Order
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
