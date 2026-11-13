"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/** Respects the visitor's "reduce motion" setting for every Framer Motion animation (transforms are skipped, fades kept). */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
