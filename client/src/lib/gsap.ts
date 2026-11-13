"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/** Register plugins once (safe to import from any client component). */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  gsap.defaults({ ease: "power3.out", duration: 0.7 });
}

export { gsap, ScrollTrigger, useGSAP };

/** Media queries to pass to gsap.matchMedia(): run motion only when the visitor has not asked to reduce it. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const DESKTOP = "(min-width: 1024px)";
