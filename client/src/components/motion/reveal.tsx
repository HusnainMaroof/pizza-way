"use client";

import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { DUR, EASE_OUT, RISE, STAGGER, VIEWPORT_ONCE } from "./tokens";

type RevealProps = Omit<HTMLMotionProps<"div">, "initial" | "whileInView" | "animate" | "viewport" | "transition"> & {
  children: ReactNode;
  /** Seconds to wait once in view. */
  delay?: number;
  /** Distance to rise from, in px (0 = fade only). Defaults to the shared RISE. */
  y?: number;
  /** Direction instead of vertical rise. */
  x?: number;
  duration?: number;
};

/** Fades + rises into place once when scrolled into view. Wrap any block. */
export function Reveal({ children, delay = 0, y = RISE, x = 0, duration = DUR.base, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={VIEWPORT_ONCE}
      transition={{ duration, delay, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

const containerVariants = (stagger: number, delayChildren: number) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

const itemVariants = (y: number, duration: number) => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: { duration, ease: EASE_OUT } },
});

type StaggerProps = Omit<HTMLMotionProps<"div">, "initial" | "whileInView" | "animate" | "viewport" | "variants"> & {
  children: ReactNode;
  stagger?: number;
  delayChildren?: number;
};

/** Parent that reveals its <StaggerItem> children one after another when scrolled into view. */
export function Stagger({ children, stagger = STAGGER, delayChildren = 0, ...rest }: StaggerProps) {
  return (
    <motion.div
      variants={containerVariants(stagger, delayChildren)}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT_ONCE}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = Omit<HTMLMotionProps<"div">, "variants"> & { children: ReactNode; y?: number; duration?: number };

export function StaggerItem({ children, y = RISE, duration = DUR.base, ...rest }: StaggerItemProps) {
  return (
    <motion.div variants={itemVariants(y, duration)} {...rest}>
      {children}
    </motion.div>
  );
}
