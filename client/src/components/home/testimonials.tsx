"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "framer-motion";
import { Reveal } from "@/components/motion/reveal";
import { SPRING_SNAPPY, SPRING_SOFT } from "@/components/motion/tokens";

const TESTIMONIALS = [
  {
    quote:
      "Pizzaway has completely changed weekend meals for us. The sourdough is incredibly light and charred perfectly. You can literally taste the fresh quality ingredients.",
    name: "Danielle Vance",
    location: "Manchester",
  },
  {
    quote:
      "Absolute fintech-level clarity! I built my own custom sourdough pie with precise live price updates, ordered on mobile, and it was hot on my table in 22 minutes.",
    name: "Marcus Sterling",
    location: "London Soho",
  },
  {
    quote:
      "The Family Feast combo is the best value in the UK food delivery space. Incredible sourdough standard and the warm garlic dough-bread is simply unmatched.",
    name: "Evelyn Porter",
    location: "Leeds",
  },
  // placeholder reviews, not in Figma (added so the carousel has more than one desktop page)
  {
    quote:
      "Ordered for the whole office on a Friday. Every pizza arrived hot, perfectly sliced and exactly as configured. The live tracking made the wait feel like nothing.",
    name: "Priya Nair",
    location: "Birmingham",
  },
  {
    quote:
      "That blistered sourdough crust is the real deal. Generous toppings, honest pricing and the garlic bread disappears in seconds every single time we order.",
    name: "Tom Hargreaves",
    location: "Bristol",
  },
  {
    quote:
      "Collection was ready to the minute and the team were brilliant. The Large Bite deal is our go-to after football practice now. Kids genuinely ask for it.",
    name: "Sophie Clarke",
    location: "Glasgow",
  },
];

const AUTOPLAY_MS = 5000;

/** Section 10: Testimonials (Figma 97:304). Carousel: 3 cards per view on desktop, 2 on tablet, 1 on phone. */
export function Testimonials() {
  const regionRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Measured by ResizeObserver only (never during animation frames). Defaults = desktop SSR layout.
  const [perView, setPerView] = useState(3);
  const [step, setStep] = useState(0); // px per page = viewport width + gap
  const [page, setPage] = useState(0);

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [offscreen, setOffscreen] = useState(true);
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const pages = Math.max(1, Math.ceil(TESTIMONIALS.length / perView));
  const autoplay = !reduceMotion && !hovered && !focused && !tabHidden && !offscreen && pages > 1;

  // Measure: container width, gap and card width -> cards per view and page step.
  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const measure = () => {
      const width = viewport.clientWidth;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const card = (track.firstElementChild as HTMLElement | null)?.offsetWidth ?? width;
      const visible = Math.max(1, Math.round((width + gap) / (card + gap)));
      setPerView(visible);
      setStep(width + gap);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    measure();
    return () => ro.disconnect();
  }, []);

  // Keep the page valid when the number of pages changes.
  useEffect(() => {
    setPage((p) => Math.min(p, pages - 1));
  }, [pages]);

  // Move the track. A resize jumps; a page change springs (or jumps with reduced motion).
  const lastStep = useRef(step);
  useEffect(() => {
    const target = -page * step;
    if (reduceMotion || lastStep.current !== step) {
      lastStep.current = step;
      x.jump(target);
      return;
    }
    const controls = animate(x, target, SPRING_SOFT);
    return () => controls.stop();
  }, [page, step, reduceMotion, x]);

  const go = useCallback((dir: 1 | -1) => setPage((p) => (p + dir + pages) % pages), [pages]);

  // Autoplay: restarts after every page change; paused by hover, focus, hidden tab, off-screen, reduced motion.
  useEffect(() => {
    if (!autoplay) return;
    const id = window.setTimeout(() => go(1), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [autoplay, page, go]);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    const io = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting), { threshold: 0.25 });
    io.observe(region);
    return () => io.disconnect();
  }, []);

  function handleDragEnd(_: unknown, info: PanInfo) {
    const swipe = info.offset.x + info.velocity.x * 0.2;
    const threshold = step * 0.15;
    let next = page;
    if (swipe < -threshold) next = Math.min(page + 1, pages - 1);
    else if (swipe > threshold) next = Math.max(page - 1, 0);
    if (next !== page) {
      setPage(next);
    } else if (reduceMotion) {
      x.jump(-page * step);
    } else {
      animate(x, -page * step, { ...SPRING_SOFT, velocity: info.velocity.x });
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  }

  const firstVisible = page * perView;

  return (
    <section
      className="w-full bg-white py-120 px-80 max-lg:py-[80px] max-lg:px-[40px] max-sm:py-[64px] max-sm:px-[20px]"
      aria-labelledby="testimonials-title"
    >
      <div className="mx-auto flex flex-col items-center gap-64 max-lg:gap-[40px] max-sm:gap-[32px]">
        <Reveal className="w-full flex flex-col items-center gap-16 text-center leading-[normal]">
          <p className="font-heading font-extrabold text-16 uppercase text-pw-green-700 max-lg:text-[14px]">
            The pizza community
          </p>
          <h2
            id="testimonials-title"
            className="font-heading font-black text-48 leading-[normal] text-pw-ink max-lg:text-[length:clamp(32px,5vw,44px)] max-lg:wrap-break-word max-sm:text-[length:clamp(28px,8vw,36px)]"
          >
            Loved by Pizza Lovers.
          </h2>
        </Reveal>

        {/*
          Carousel. Controls sit absolutely in the section's bottom padding, so the section height is unchanged.
          Desktop page 1 = the Figma layout (3 cards, gap 24). Tablet: 2 per view, phone: 1 per view.
        */}
        <Reveal
          y={16}
          className="relative w-full"
        >
          <div
            ref={regionRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Customer reviews"
            tabIndex={0}
            className="w-full rounded-24 outline-none focus-visible:ring-2 focus-visible:ring-pw-green-700 focus-visible:ring-offset-8"
            onKeyDown={handleKeyDown}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
            }}
          >
            {/* x-clip only: cards may lift on hover without being cut at the top. */}
            <div ref={viewportRef} className="w-full overflow-x-clip" aria-live={autoplay ? "off" : "polite"}>
              <motion.div
                ref={trackRef}
                style={{ x }}
                drag={pages > 1 ? "x" : false}
                dragConstraints={{ left: -(pages - 1) * step, right: 0 }}
                dragElastic={0.12}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                className="flex items-start gap-24 cursor-grab active:cursor-grabbing max-lg:items-stretch max-lg:gap-[16px]"
              >
                {TESTIMONIALS.map((t, i) => {
                  const visible = i >= firstVisible && i < firstVisible + perView;
                  return (
                    <motion.figure
                      key={t.name}
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`${i + 1} of ${TESTIMONIALS.length}`}
                      aria-hidden={!visible}
                      whileHover={{ y: -6 }}
                      transition={SPRING_SOFT}
                      className="shrink-0 grow-0 basis-[calc((100%_-_var(--u)_*_48)_/_3)] min-w-0 m-0 flex flex-col items-start gap-24 p-40 bg-pw-surface border border-pw-line rounded-24 select-none max-lg:basis-[calc((100%_-_16px)_/_2)] max-lg:gap-[16px] max-lg:p-[24px] max-[760px]:p-[28px] max-[641px]:basis-full max-sm:py-[24px] max-sm:px-[20px] max-sm:rounded-[20px]"
                    >
                      <div className="flex gap-4" role="img" aria-label="5 out of 5 stars">
                        {Array.from({ length: 5 }, (_, s) => (
                          <Image
                            key={s}
                            src="/brand/icons/testimonial-star.svg"
                            alt=""
                            width={16}
                            height={16}
                            draggable={false}
                            className="block shrink-0"
                          />
                        ))}
                      </div>
                      <blockquote className="m-0 w-full font-body font-normal italic text-15 leading-24 text-pw-ink max-lg:text-[14px] max-lg:leading-[1.6] max-[760px]:text-[15px]">
                        &quot;{t.quote}&quot;
                      </blockquote>
                      <figcaption className="w-full flex flex-col gap-2 leading-[normal]">
                        <span className="font-heading font-extrabold text-16 text-pw-ink max-lg:text-[15px] max-sm:text-[16px]">
                          {t.name}
                        </span>
                        <span className="font-body font-normal text-13 text-pw-muted max-lg:text-[13px] max-sm:text-[14px]">
                          {t.location}
                        </span>
                      </figcaption>
                    </motion.figure>
                  );
                })}
              </motion.div>
            </div>

            {pages > 1 && (
              <div className="absolute inset-x-0 top-full flex items-center justify-center gap-8 pt-20 max-lg:pt-[16px] max-sm:pt-[8px]">
                <ArrowButton direction="prev" onClick={() => go(-1)} />
                <div className="flex items-center">
                  {Array.from({ length: pages }, (_, p) => (
                    <button
                      key={p}
                      type="button"
                      className="flex size-[44px] cursor-pointer items-center justify-center border-0 bg-transparent p-0"
                      aria-label={`Show reviews page ${p + 1} of ${pages}`}
                      aria-current={p === page ? "true" : undefined}
                      onClick={() => setPage(p)}
                    >
                      <motion.span
                        layout
                        transition={SPRING_SNAPPY}
                        className={`block h-[8px] rounded-pill ${p === page ? "w-[24px] bg-pw-green-700" : "w-[8px] bg-pw-line"}`}
                      />
                    </button>
                  ))}
                </div>
                <ArrowButton direction="next" onClick={() => go(1)} />
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ArrowButton({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      aria-label={direction === "prev" ? "Previous reviews" : "Next reviews"}
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={SPRING_SNAPPY}
      className="flex size-[44px] cursor-pointer items-center justify-center rounded-pill border border-pw-line bg-pw-surface p-0 text-pw-ink"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d={direction === "prev" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"}
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
}
