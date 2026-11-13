"use client";

import { useRef, type ReactNode } from "react";
import { DESKTOP, gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/**
 * Fills its (positioned, overflow-hidden) parent and drifts the photo inside it while the section scrolls.
 * The parent is rotated -90deg, so local x maps to screen y: x 16 -> -16 = screen y -16px -> +16px.
 * Desktop + no reduced motion only; slight scale keeps the edges covered.
 */
export function BuildPreviewParallax({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      const section = el?.closest("section");
      if (!el || !section) return;
      const mm = gsap.matchMedia();
      mm.add(`${DESKTOP} and ${MOTION_OK}`, () => {
        gsap.fromTo(
          el,
          { x: 16, scale: 1.1 },
          {
            x: -16,
            scale: 1.1,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.6 },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="absolute inset-0 lg:will-change-transform">
      {children}
    </div>
  );
}
