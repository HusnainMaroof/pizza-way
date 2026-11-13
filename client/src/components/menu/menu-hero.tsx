"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { DESKTOP, MOTION_OK, gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE_OUT } from "@/components/motion/tokens";

export function MenuHero() {
  const scope = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

  // Very subtle parallax: the text drifts down (max 30px) while the hero scrolls away.
  // Uses the CSS `translate` property so it composes with framer-motion's entrance `transform`.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${DESKTOP} and ${MOTION_OK}`, () => {
        const title = titleRef.current;
        const sub = subRef.current;
        if (!scope.current || !title || !sub) return;
        const state = { p: 0 };
        gsap.to(state, {
          p: 1,
          ease: "none",
          scrollTrigger: { trigger: scope.current, start: 0, end: "bottom top", scrub: 0.5 },
          onUpdate: () => {
            title.style.translate = `0 ${state.p * 30}px`;
            sub.style.translate = `0 ${state.p * 18}px`;
          },
        });
        return () => {
          title.style.translate = "";
          sub.style.translate = "";
        };
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      className="flex w-full flex-col items-start gap-24 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,#03872d_0%,#036a24_50%,#024d1a_100%)] px-80 py-96 max-lg:gap-[16px] max-lg:px-[40px] max-lg:py-[64px] max-sm:gap-[12px] max-sm:px-[20px] max-sm:py-[48px]"
      aria-labelledby="menu-hero-title"
    >
      <motion.h1
        ref={titleRef}
        id="menu-hero-title"
        initial={{ y: 24, clipPath: "inset(100% -5% 0% -5%)" }}
        animate={{ y: 0, clipPath: "inset(-20% -5% -20% -5%)", transitionEnd: { clipPath: "none" } }}
        transition={{ duration: DUR.slow, ease: EASE_OUT }}
        className="w-full font-heading text-110 font-black leading-90 text-white max-lg:text-[length:clamp(48px,11vw,88px)] max-lg:leading-[0.9] max-sm:text-[length:clamp(44px,14vw,64px)]"
      >
        THE MENU
      </motion.h1>
      <motion.p
        ref={subRef}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.base, delay: 0.12, ease: EASE_OUT }}
        className="w-full font-body text-20 font-normal leading-32 text-pw-green-100 max-lg:max-w-[600px] max-lg:text-[18px] max-lg:leading-[1.6] max-sm:text-[16px]"
      >
        Fresh ingredients. Great taste. Engineered sourdough fired daily to blistered perfection.
      </motion.p>
    </section>
  );
}
