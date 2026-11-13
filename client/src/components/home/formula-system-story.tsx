"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP, MOTION_OK, DESKTOP } from "@/lib/gsap";
import { DUR, RISE, STAGGER } from "@/components/motion/tokens";

const PILLARS = [
  {
    title: "HOT.",
    icon: "/brand/icons/why-pillar-1.svg",
    text: "Our patented hotbox containment guarantees thermal optimization from the high-temp stone oven straight to your domestic threshold.",
  },
  {
    title: "FRESH.",
    icon: "/brand/icons/why-pillar-3.svg",
    text: "No frozen elements. Organic flour milled weekly, UK grown vegetables and selected cheeses prepared by our chefs every morning.",
  },
  {
    title: "DELICIOUS.",
    icon: "/brand/icons/why-pillar-2.svg",
    text: "Big bold flavor ratios with generous topping measurements optimized over thousands of customer reviews and tests.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "CHOOSE IT.",
    text: "Select from our signature formulas or initiate custom pizza customisation with transparent pricing.",
  },
  {
    num: "02",
    title: "MAKE IT YOURS.",
    text: "Add premium modifiers, custom toppings, dipping sauces, and selected sides to complete your formula.",
  },
  {
    num: "03",
    title: "WE DELIVER.",
    text: "Watch live-tracking telemetry from hand-stretched prep inside the kitchen directly to your doorstep.",
  },
];

/** Total scroll distance (px) the story stays pinned on desktop (the scrubbed timeline is stretched across it). */
const PIN_DISTANCE = 5000;

// Hover motion only (CSS `translate`/`rotate`/`scale` compose with GSAP's `transform`).
const CARD_HOVER =
  "transition-[translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-[6px]";
const ICON_HOVER =
  "transition-[rotate,scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:rotate-[-6deg] motion-safe:group-hover:scale-[1.08]";

/*
 * ONE scroll story made of the two homepage sections: "The Core Formula" (green) and "The System" (red).
 *
 * Desktop (>= 1024px) with motion allowed:
 *   both sections share one grid cell (the stage) and the stage pins for PIN_DISTANCE px while ONE scrubbed
 *   timeline plays:
 *   0. Arrival: the section above (Family Feast, passed as `before`) is the bottom layer of the stage; the green
 *      Core Formula wipes up over it, its title rises in and the 3 pillar cards come up. (No blank stage.)
 *   1. Core Formula: exactly one pillar card is active at a time: it scales up, the other two shrink and dim.
 *   2. Hand-over: the core content fades up and the red System layer wipes in from the bottom (clip-path).
 *   3. System: the title text rises in, the 3 step cards come up (card 1 active), then the focus moves card by card.
 *   Only transform, opacity and clip-path are animated (no layout properties).
 * Tablet / phone / reduced motion: no pin and no overlay; the two sections stack normally (a simple reveal runs
 * on tablet/phone when motion is allowed, nothing moves for reduced motion).
 *
 * Tablet sub-ranges (exclusive, so no variant-order conflicts):
 * sm:max-[900px]     = 641-899px (1 column, icon / number beside the text)
 * min-[900px]:max-lg = 900-1023px (3 columns)
 */
/** Space (px) kept free above/below the content in the pinned stage so it never touches the screen edges / header. */
const FIT_MARGIN = 120;

export function FormulaSystemStory({ before }: { before?: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      const stageEl = stage.current;
      if (!root || !stageEl) return;
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: `${DESKTOP} and ${MOTION_OK}`,
          compact: `(max-width: 1023.98px) and ${MOTION_OK}`,
        },
        (ctx) => {
          const q = gsap.utils.selector(root);
          const coreHeader = q("[data-core-header]");
          const coreCards = q("[data-core-card]");
          const coreRings = q("[data-core-ring]");
          const coreBar = q("[data-core-bar]");
          const coreFill = q("[data-core-fill]");
          const coreContent = q("[data-core-content]");
          const core = q("[data-core]");
          const system = q("[data-system]");
          const sysHeader = q("[data-hiw-header]");
          const sysCards = q("[data-hiw-card]");
          const sysRings = q("[data-hiw-ring]");
          const sysBar = q("[data-hiw-bar]");
          const sysFill = q("[data-hiw-fill]");

          // ---- Tablet / phone: simple one-time reveals, no pin. ----
          if (!ctx.conditions?.desktop) {
            [
              [coreHeader, coreCards],
              [sysHeader, sysCards],
            ].forEach(([header, cards]) => {
              gsap.from(header, {
                opacity: 0,
                y: RISE,
                duration: DUR.base,
                scrollTrigger: { trigger: header[0], start: "top 85%", once: true },
              });
              gsap.from(cards, {
                opacity: 0,
                y: RISE,
                duration: DUR.base,
                stagger: STAGGER,
                scrollTrigger: { trigger: cards[0], start: "top 88%", once: true },
              });
            });
            return;
          }

          // ---- Desktop: one pinned, scrubbed story. ----
          // Exactly ONE card is "active" at any time: it grows a lot (ACTIVE scale), the other two clearly shrink and dim.
          const ACTIVE = { scale: 1.3, opacity: 1, y: -6 };
          const IDLE = { scale: 0.58, opacity: 0.45, y: 0 };
          const focus = (i: number) => ({
            scale: (j: number) => (j === i ? ACTIVE.scale : IDLE.scale),
            opacity: (j: number) => (j === i ? ACTIVE.opacity : IDLE.opacity),
            y: (j: number) => (j === i ? ACTIVE.y : IDLE.y),
            duration: 0.6,
            ease: "power2.out",
          });
          const ring = (i: number) => ({ opacity: (j: number) => (j === i ? 1 : 0), duration: 0.5 });

          // Start states: the stage is white (continues the white section above). The green Core Formula layer, its
          // title and cards, and the red System layer are all hidden until their turn.
          gsap.set(core, { clipPath: "inset(100% 0% 0% 0%)" });
          gsap.set(coreHeader, { opacity: 0, y: 36 });
          gsap.set(coreCards, { opacity: 0, y: 48, scale: IDLE.scale });
          gsap.set(coreRings, { opacity: 0 });
          gsap.set(coreFill, { scaleX: 1 / PILLARS.length });
          gsap.set(coreBar, { opacity: 0 });
          gsap.set(system, { clipPath: "inset(100% 0% 0% 0%)" });
          gsap.set(sysHeader, { opacity: 0, y: 36 });
          gsap.set(sysCards, { opacity: 0, y: 48, scale: IDLE.scale });
          gsap.set(sysRings, { opacity: 0 });

          // Responsive fit: the stage is exactly one screen tall; every layer's content is scaled down (never up)
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
            defaults: { ease: "power2.out", duration: 0.5 },
            scrollTrigger: {
              trigger: stageEl,
              start: "top top",
              end: `+=${PIN_DISTANCE}`,
              pin: true,
              pinSpacing: true,
              scrub: 0.5,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          const STEP = 1.4; // timeline units per card

          // 0) Arrival: the green Core Formula layer wipes up over the white stage, its title rises in, then the
          //    three cards come up already in the "card 1 active" state.
          tl.to(core, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "power2.inOut" }, 0)
            .to(coreHeader, { opacity: 1, y: 0, duration: 0.8 }, 0.9)
            .to(coreCards, { ...focus(0), duration: 0.8, stagger: 0.18 }, 1.5)
            .to(coreRings, ring(0), 2.1)
            .to(coreBar, { opacity: 1, duration: 0.3 }, 2.1);

          // 1) Core Formula: move the focus to card 2, then card 3 (one at a time).
          const CORE_LIGHT = 3.2;
          PILLARS.forEach((_, i) => {
            if (i === 0) return;
            const at = CORE_LIGHT + (i - 1) * STEP;
            tl.to(coreCards, focus(i), at)
              .to(coreRings, ring(i), at)
              .to(coreFill, { scaleX: (i + 1) / PILLARS.length, duration: 1, ease: "none" }, at);
          });

          // 2) Hand-over: the last pillar stays active while the core content fades up and the red System layer
          //    wipes in from the bottom.
          const HAND = CORE_LIGHT + (PILLARS.length - 2) * STEP + 1.4;
          tl.to(coreBar, { opacity: 0, duration: 0.3 }, HAND)
            .to(coreContent, { opacity: 0, y: -40, duration: 0.9, ease: "power2.in" }, HAND + 0.4)
            .to(system, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "power2.inOut" }, HAND + 0.3);

          // 3) System: the title rises in, then the cards come up already in the "card 1 active" state.
          const SYS = HAND + 1.7;
          tl.to(sysHeader, { opacity: 1, y: 0, duration: 0.8 }, SYS)
            .to(sysCards, { ...focus(0), duration: 0.8, stagger: 0.18 }, SYS + 0.6)
            .to(sysRings, ring(0), SYS + 1.2)
            .to(sysBar, { opacity: 1, duration: 0.3 }, SYS + 1.2)
            .to(sysFill, { scaleX: 1 / STEPS.length, duration: 0.6, ease: "none" }, SYS + 1.2);

          // 4) System: move the focus to card 2, then card 3 (one at a time), then a short hold.
          const LIGHT = SYS + 2.6;
          STEPS.forEach((_, i) => {
            if (i === 0) return;
            const at = LIGHT + (i - 1) * STEP;
            tl.to(sysCards, focus(i), at)
              .to(sysRings, ring(i), at)
              .to(sysFill, { scaleX: (i + 1) / STEPS.length, duration: 1, ease: "none" }, at);
          });
          tl.to({}, { duration: 1 }, LIGHT + (STEPS.length - 1) * STEP);

          return () => ScrollTrigger.removeEventListener("refreshInit", applyFit);
        },
      );

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className="w-full">
      {/* Stage: stacked sections normally; on desktop with motion they share one cell and fill the viewport. */}
      <div
        ref={stage}
        className="relative w-full bg-white motion-safe:lg:grid motion-safe:lg:h-svh motion-safe:lg:grid-rows-[minmax(0,1fr)] motion-safe:lg:overflow-hidden"
      >
        {/* ================= PREVIOUS SECTION (bottom layer on desktop; the Core Formula wipes up over it) ================= */}
        <div className="w-full motion-safe:lg:flex motion-safe:lg:min-h-0 motion-safe:lg:items-center motion-safe:lg:[grid-area:1/1]">
          <div data-fit className="w-full">
            {before}
          </div>
        </div>

        {/* ================= THE CORE FORMULA ================= */}
        <section
          data-core
          className="w-full bg-pw-green-900 px-80 py-120 max-lg:px-[40px] max-lg:py-[72px] max-sm:px-[20px] max-sm:py-[56px] motion-safe:lg:flex motion-safe:lg:min-h-0 motion-safe:lg:items-center motion-safe:lg:py-0 motion-safe:lg:[grid-area:1/1] motion-safe:lg:[clip-path:inset(100%_0%_0%_0%)]"
          aria-labelledby="why-pizzaway-title"
        >
          <div
            data-core-content
            data-fit
            className="mx-auto flex w-full flex-col gap-80 max-lg:gap-[40px] max-sm:gap-[32px]"
          >
            <header
              data-core-header
              className="relative flex flex-col items-center gap-16 text-center leading-[normal] max-lg:gap-[12px]"
            >
              <p className="font-heading text-16 leading-[normal] font-extrabold text-pw-green-500 uppercase max-lg:text-[14px]">
                The core formula
              </p>
              <h2
                id="why-pizzaway-title"
                className="font-heading text-48 leading-[normal] font-black text-white max-lg:text-[length:clamp(26px,6vw,42px)] max-lg:leading-[1.15] max-lg:wrap-break-word max-sm:text-[length:clamp(24px,7.5vw,32px)]"
              >
                Uncompromising Quality Controls
              </h2>
              {/* Desktop pin progress: absolutely placed in the gap under the header (no layout). */}
              <span
                data-core-bar
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 -bottom-42 h-4 overflow-hidden rounded-pill bg-white/20 opacity-0 max-lg:hidden"
              >
                <span data-core-fill className="block size-full origin-left scale-x-0 rounded-pill bg-pw-green-500" />
              </span>
            </header>

            <div className="flex items-start gap-40 max-lg:grid max-lg:items-stretch max-lg:gap-[20px] max-[900px]:grid-cols-1 min-[900px]:max-lg:grid-cols-3 sm:max-[900px]:mx-auto sm:max-[900px]:w-full sm:max-[900px]:max-w-[640px] max-sm:gap-[16px]">
              {PILLARS.map((p) => (
                <article
                  key={p.title}
                  data-core-card
                  className={`group relative flex min-w-1 flex-[1_0_0] flex-col items-start gap-28 rounded-32 bg-pw-green-700 p-48 max-lg:min-w-0 max-lg:gap-[20px] max-lg:rounded-[24px] sm:max-[900px]:flex-row sm:max-[900px]:items-start sm:max-[900px]:p-[28px] min-[900px]:max-lg:p-[24px] max-sm:gap-[16px] max-sm:rounded-[20px] max-sm:px-[20px] max-sm:py-[24px] ${CARD_HOVER}`}
                >
                  {/* Active-card ring (opacity only), lit by the desktop pinned timeline. */}
                  <span
                    data-core-ring
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 ring-2 ring-pw-green-500 ring-inset"
                  />
                  <span
                    className={`flex size-64 shrink-0 items-center justify-center rounded-16 bg-pw-green-900 max-lg:size-[56px] max-lg:rounded-[14px] max-sm:size-[52px] ${ICON_HOVER}`}
                  >
                    <img src={p.icon} alt="" width={32} height={32} />
                  </span>
                  <div className="flex w-full flex-col gap-12 max-lg:gap-[8px]">
                    <h3 className="font-heading text-40 leading-[normal] font-black text-white max-lg:text-[length:clamp(24px,3.4vw,30px)] max-lg:leading-[1.15] max-sm:text-[26px]">
                      {p.title}
                    </h3>
                    <p className="font-body text-15 leading-24 font-normal text-pw-green-100 max-lg:text-[15px] max-lg:leading-[1.6]">
                      {p.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================= THE SYSTEM ================= */}
        <section
          data-system
          className="w-full bg-pw-red-600 px-80 py-120 [word-break:break-word] max-lg:px-[40px] max-lg:py-[72px] max-sm:px-[20px] max-sm:py-[56px] motion-safe:lg:flex motion-safe:lg:min-h-0 motion-safe:lg:items-center motion-safe:lg:py-0 motion-safe:lg:[grid-area:1/1] motion-safe:lg:[clip-path:inset(100%_0%_0%_0%)]"
          aria-labelledby="how-it-works-title"
        >
          <div data-fit className="mx-auto flex w-full flex-col items-center gap-80 max-lg:gap-[40px] max-sm:gap-[32px]">
            <header
              data-hiw-header
              className="relative flex w-full flex-col items-center gap-16 text-center leading-[normal] text-pw-surface max-lg:gap-[12px]"
            >
              <p className="font-heading text-16 leading-[normal] font-extrabold uppercase max-lg:text-[14px]">
                The system
              </p>
              <h2
                id="how-it-works-title"
                className="font-heading text-48 leading-[normal] font-black max-lg:text-[length:clamp(26px,6vw,42px)] max-lg:leading-[1.15] max-sm:text-[length:clamp(24px,7.5vw,32px)]"
              >
                Zero Friction. Absolute Clarity.
              </h2>
              {/* Desktop pin progress: absolutely placed in the gap under the header (no layout). */}
              <span
                data-hiw-bar
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 -bottom-42 h-4 overflow-hidden rounded-pill bg-white/25 opacity-0 max-lg:hidden"
              >
                <span data-hiw-fill className="block size-full origin-left scale-x-0 rounded-pill bg-white" />
              </span>
            </header>

            <ol className="flex w-full items-start gap-32 max-lg:grid max-lg:items-stretch max-lg:gap-[16px] max-[900px]:max-w-[640px] max-[900px]:grid-cols-1 min-[900px]:max-lg:grid-cols-3">
              {STEPS.map((s) => (
                <li
                  key={s.num}
                  data-hiw-card
                  className="relative flex min-w-1 flex-[1_0_0] flex-col items-start gap-24 rounded-24 border border-pw-line bg-pw-surface p-40 max-lg:min-w-0 max-lg:rounded-[20px] max-[900px]:flex-row sm:max-[900px]:gap-[20px] sm:max-[900px]:p-[28px] min-[900px]:max-lg:gap-[16px] min-[900px]:max-lg:p-[24px] max-sm:gap-[16px] max-sm:px-[20px] max-sm:py-[22px]"
                >
                  {/* Active-step ring (opacity only), lit by the desktop pinned timeline. */}
                  <span
                    data-hiw-ring
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 ring-2 ring-pw-red-600 ring-inset"
                  />
                  <span
                    className="font-heading text-56 leading-[normal] font-black whitespace-nowrap text-pw-red-600 max-lg:shrink-0 max-lg:text-[44px] max-lg:leading-none max-sm:text-[36px]"
                    aria-hidden="true"
                  >
                    {s.num}
                  </span>
                  <div className="flex w-full flex-col gap-12 max-lg:min-w-0 max-lg:gap-[8px]">
                    <h3 className="font-heading text-20 leading-[normal] font-extrabold text-pw-red-600 max-lg:text-[20px] max-sm:text-[18px]">
                      {s.title}
                    </h3>
                    <p className="font-body text-15 leading-24 font-normal text-pw-muted max-lg:text-[15px] max-lg:leading-[1.6]">
                      {s.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
