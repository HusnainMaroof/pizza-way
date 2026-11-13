"use client";

import { useRef, type ReactNode } from "react";
import { DESKTOP, gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";

/**
 * Renders the hero <section> and runs its motion on the `data-hero` children:
 * - "line": headline lines rise with a clip reveal; "lead" / "cta": fade up; "pizza": scale 0.94 -> 1 + fade, then a gentle float
 * - "pizza-wrap": scroll parallax as the hero leaves (desktop only)
 * Elements that animate in carry `motion-safe:opacity-0` in the markup (no flash before hydration); with reduced motion nothing hides or moves.
 */
export function HeroMotion({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = ref.current;
      if (!section) return;
      const q = gsap.utils.selector(section);
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const pizza = q('[data-hero="pizza"]');

        // Entrance: everything settled by ~0.9s.
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(
          q('[data-hero="line"]'),
          { opacity: 0, y: 24, clipPath: "inset(-20% -5% 100% -5%)" },
          { opacity: 1, y: 0, clipPath: "inset(-20% -5% -20% -5%)", duration: 0.7, stagger: 0.08, clearProps: "clipPath" },
          0,
        )
          .fromTo(q('[data-hero="lead"]'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, 0.2)
          .fromTo(q('[data-hero="cta"]'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.1 }, 0.3)
          .fromTo(pizza, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.8 }, 0.1);

        // Gentle float (y +-6px, rotate +-1.5deg), only while the hero is on screen.
        const float = gsap
          .timeline({ paused: true })
          .to(pizza, { y: -6, rotation: -1.5, duration: 2.5, ease: "sine.inOut" })
          .to(pizza, { y: 6, rotation: 1.5, duration: 5, ease: "sine.inOut", yoyo: true, repeat: -1 });
        let visible = true;
        let entered = false;
        tl.eventCallback("onComplete", () => {
          entered = true;
          if (visible) float.play();
        });
        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            visible = self.isActive;
            if (visible && entered) float.play();
            else float.pause();
          },
        });
      });

      // Parallax: the pizza drifts up and turns slightly as the hero scrolls out.
      mm.add(`${DESKTOP} and ${MOTION_OK}`, () => {
        gsap.to(q('[data-hero="pizza-wrap"]'), {
          y: -40,
          rotation: 4,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: 0.6 },
        });
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className={className}>
      {children}
    </section>
  );
}
