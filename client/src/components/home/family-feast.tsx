"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { DUR, EASE_OUT, RISE, STAGGER, VIEWPORT_ONCE } from "@/components/motion/tokens";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";

const FEATURES = [
  "3 Pizzas (Any selection, any standard size up to 12”)",
  "3 Cold Soft Drinks (Custom selections)",
  "6 Pieces of Premium Hand-battered Garlic Bread",
  "Precision guaranteed real-time GPS courier delivery",
];

const PRICE = 38;
const formatPrice = (n: number) => `£${n.toFixed(2)}`;

// Framer variants: text column children rise in one by one; check rows slide 12px in from the left.
const COLUMN = { hidden: {}, show: { transition: { staggerChildren: STAGGER } } };
const RISE_ITEM = {
  hidden: { opacity: 0, y: RISE },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE_OUT } },
};
const ROW = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: DUR.base, ease: EASE_OUT } },
};
// Motion only (no sizing). CSS `translate`/`scale` compose with framer's reveal `transform`.
const BUTTON_MOTION =
  "transition-[translate,scale] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-[2px] motion-safe:active:scale-[0.97]";

export function FamilyFeast() {
  const scope = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLSpanElement>(null);

  // GSAP, motion-OK only: photo clip-path wipe + scale settle, and the price count-up.
  // Reduced motion (or no JS) = the static final state rendered by the server.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const frame = frameRef.current;
        const photo = photoRef.current;
        const price = priceRef.current;
        if (!frame || !photo || !price) return;

        gsap
          .timeline({ scrollTrigger: { trigger: frame, start: "top 85%", once: true } })
          .fromTo(
            frame,
            { clipPath: "inset(0% 100% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: DUR.slow, ease: "power3.out", clearProps: "clipPath" },
          )
          .fromTo(photo, { scale: 1.06 }, { scale: 1, duration: 1, ease: "power3.out", clearProps: "transform" }, 0);

        // Count £0.00 -> £38.00 once in view. The counter is an absolute overlay over an
        // invisible copy of the final value, so its changing width never moves layout.
        const counter = { value: 0 };
        // tabular-nums only while counting (steady digits); the final value keeps the design's proportional figures.
        price.classList.add("tabular-nums");
        price.textContent = formatPrice(0);
        gsap.to(counter, {
          value: PRICE,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: price, start: "top 92%", once: true },
          onUpdate: () => {
            price.textContent = formatPrice(counter.value);
          },
          onComplete: () => {
            price.textContent = formatPrice(PRICE);
            price.classList.remove("tabular-nums");
          },
        });

        return () => {
          price.textContent = formatPrice(PRICE);
          price.classList.remove("tabular-nums");
        };
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      className="w-full bg-white px-80 py-96 max-lg:px-[40px] max-lg:py-[64px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="family-feast-title"
    >
      <div className="mx-auto flex items-center justify-center gap-80 max-lg:max-w-[720px] max-lg:flex-col max-lg:items-stretch max-lg:gap-[40px] max-sm:gap-[28px]">
        <div
          ref={frameRef}
          className="relative h-480 w-600 shrink-0 overflow-hidden rounded-32 max-lg:aspect-[5/4] max-lg:h-auto max-lg:w-full max-lg:shrink max-lg:rounded-[24px] max-sm:aspect-[4/3] max-sm:rounded-[20px]"
        >
          <div ref={photoRef} className="absolute inset-0">
            <Image
              src="/brand/images/family-feast-1.png"
              alt="Family sharing several pizzas and garlic bread at a wooden table"
              fill
              sizes="(max-width: 1023px) 100vw, 42vw"
              className="object-cover"
            />
          </div>
        </div>

        <motion.div
          variants={COLUMN}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          className="flex w-580 shrink-0 flex-col items-start gap-40 max-lg:w-full max-lg:shrink max-lg:gap-[32px] max-sm:gap-[28px]"
        >
          <div className="flex w-full flex-col items-start gap-20 max-lg:gap-[16px]">
            <motion.span
              variants={RISE_ITEM}
              className="inline-flex whitespace-nowrap rounded-pill bg-pw-green-100 px-16 py-8 font-heading text-12 leading-[normal] font-extrabold text-pw-green-700 uppercase max-lg:px-[16px] max-lg:py-[8px] max-sm:whitespace-normal"
            >
              Best value combo
            </motion.span>
            <motion.h2
              variants={RISE_ITEM}
              id="family-feast-title"
              className="font-heading text-48 leading-[normal] font-black text-pw-ink max-lg:text-[length:clamp(28px,6vw,44px)] max-lg:leading-[1.1] max-lg:wrap-break-word max-sm:text-[length:clamp(26px,8vw,34px)]"
            >
              FEED THE WHOLE CREW.
            </motion.h2>
            <motion.p
              variants={RISE_ITEM}
              className="font-body text-16 leading-26 font-normal text-pw-muted max-lg:text-[16px] max-lg:leading-[1.6] max-sm:text-[15px]"
            >
              The ultimate dining configuration. Hand-stretched sourdough, freshly fired for the
              perfect family evening or major workspace milestone.
            </motion.p>
          </div>

          <motion.ul variants={COLUMN} className="flex w-full flex-col gap-16 max-lg:gap-[14px]">
            {FEATURES.map((text) => (
              <motion.li
                key={text}
                variants={ROW}
                className="flex items-center gap-12 max-lg:items-start max-lg:gap-[12px]"
              >
                <span className="flex size-24 shrink-0 items-center justify-center rounded-12 bg-pw-green-700 max-lg:size-[24px] max-lg:rounded-[12px]">
                  <img src="/brand/icons/family-feast-icon.svg" alt="" width={12} height={12} />
                </span>
                <span className="min-w-1 flex-[1_0_0] font-body text-15 leading-[normal] font-medium text-pw-ink max-lg:min-w-0 max-lg:text-[15px] max-lg:leading-[1.5]">
                  {text}
                </span>
              </motion.li>
            ))}
          </motion.ul>

          <motion.div
            variants={RISE_ITEM}
            className="flex items-center gap-40 max-lg:w-full max-lg:flex-wrap max-lg:gap-x-[32px] max-lg:gap-y-[20px]"
          >
            <div className="flex flex-col items-start gap-4 leading-[normal] whitespace-nowrap max-sm:whitespace-normal">
              <span className="font-body text-13 font-normal text-pw-muted uppercase max-lg:text-[13px]">
                The Family Feast System
              </span>
              <span className="relative font-heading text-48 font-black text-pw-green-700 max-lg:text-[length:clamp(32px,6vw,44px)]">
                {/* Invisible final value holds the size; the visible counter is an overlay. */}
                <span className="invisible" aria-hidden="true">
                  {formatPrice(PRICE)}
                </span>
                <span ref={priceRef} className="absolute top-0 left-0 whitespace-nowrap">
                  {formatPrice(PRICE)}
                </span>
              </span>
            </div>
            <Link
              href="/deals"
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-pill bg-pw-red-600 px-36 py-18 font-heading text-16 leading-[normal] font-extrabold text-white uppercase no-underline max-lg:min-h-[48px] max-lg:px-[32px] max-lg:py-[14px] max-lg:text-[16px] max-sm:w-full max-sm:text-center max-sm:whitespace-normal ${BUTTON_MOTION}`}
            >
              Order Family Feast
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
