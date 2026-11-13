/** Shared motion language for the site. Calm, fast, transform/opacity only. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const; // smooth decelerate (entrances)
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const; // moves between two states
export const SPRING_SOFT = { type: "spring", stiffness: 260, damping: 26, mass: 0.9 } as const; // hover/tap, layout moves
export const SPRING_SNAPPY = { type: "spring", stiffness: 420, damping: 30 } as const; // small controls (pills, toggles)

export const DUR = { fast: 0.25, base: 0.55, slow: 0.8 } as const;
export const STAGGER = 0.08; // seconds between siblings
export const RISE = 24; // px a revealed element travels (design px, no more than this)

/** Viewport option for scroll reveals: fire once, a bit before the element is fully visible. */
export const VIEWPORT_ONCE = { once: true, margin: "0px 0px -12% 0px" } as const;
