/**
 * Procedural 3D pizza recipes: crust profiles, sauce colours, topping geometries and seeded placement.
 * Units: pizza radius = 1, +Y up. No downloaded models: everything is built here, so it stays tiny.
 */
import * as THREE from "three";
import type { CrustId, SauceId, SizeId } from "@/lib/byo-data";

// ---------- seeded random ----------

import { hash, mulberry32 } from "./pizza-random";
export { hash, mulberry32 };

// ---------- crust ----------

/** Lathe profile points (x = radius, y = height), bottom centre -> rim -> top centre. Same count for every crust so they morph. */
export const PROFILE_POINTS = 14;

export const CRUSTS_3D: Record<CrustId, { pts: [number, number][]; rimAmp: number }> = {
  thin: {
    rimAmp: 0.05,
    pts: [
      [0.001, 0], [0.5, 0], [0.9, 0], [0.97, 0.004], [1, 0.02], [1, 0.045], [0.985, 0.068],
      [0.96, 0.078], [0.93, 0.075], [0.91, 0.062], [0.89, 0.045], [0.6, 0.045], [0.3, 0.045], [0.001, 0.045],
    ],
  },
  "deep-pan": {
    rimAmp: 0.08,
    pts: [
      [0.001, 0], [0.5, 0], [0.92, 0], [0.98, 0.02], [1, 0.08], [1, 0.17], [0.98, 0.23],
      [0.94, 0.26], [0.89, 0.25], [0.86, 0.21], [0.85, 0.145], [0.6, 0.145], [0.3, 0.145], [0.001, 0.145],
    ],
  },
  "stone-baked": {
    rimAmp: 0.2,
    pts: [
      [0.001, 0], [0.5, 0], [0.86, 0], [0.95, 0.015], [0.995, 0.06], [1, 0.12], [0.975, 0.175],
      [0.92, 0.2], [0.86, 0.185], [0.82, 0.12], [0.8, 0.035], [0.6, 0.035], [0.3, 0.035], [0.001, 0.035],
    ],
  },
};

/**
 * Smooth the 14-point profile into `n` points (Catmull-Rom), so the rim is a round, puffy shell.
 * Returns x, y and t (position in original point units 0..13, used for UVs and rim weighting).
 */
export function resampleProfile(prof: Float32Array, n: number, out: Float32Array = new Float32Array(n * 3)) {
  const last = PROFILE_POINTS - 1;
  const px = (j: number) => prof[Math.min(last, Math.max(0, j)) * 2];
  const py = (j: number) => prof[Math.min(last, Math.max(0, j)) * 2 + 1];
  for (let k = 0; k < n; k++) {
    const t = (k / (n - 1)) * last;
    const j = Math.min(last - 1, Math.floor(t));
    const f = t - j;
    const cr = (a: number, b: number, c: number, d: number) =>
      0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
    out[k * 3] = Math.max(0.001, cr(px(j - 1), px(j), px(j + 1), px(j + 2)));
    out[k * 3 + 1] = cr(py(j - 1), py(j), py(j + 1), py(j + 2));
    out[k * 3 + 2] = t;
  }
  return out;
}

/** Rim profile points that get the uneven "cornicione" noise. */
export const RIM_FIRST = 4;
export const RIM_LAST = 10;

/** Per-segment out-of-round factor (hand-stretched dough is never a perfect circle). */
export function roundNoise(segments: number) {
  const r = mulberry32(77);
  const a = r() * 6.28, b = r() * 6.28;
  const out = new Float32Array(segments + 1);
  for (let i = 0; i <= segments; i++) {
    const p = (i / segments) * Math.PI * 2;
    out[i] = 1 + 0.018 * Math.sin(2 * p + a) + 0.01 * Math.sin(5 * p + b);
  }
  return out;
}

/** Per-segment rim noise in [-1, 1]; integer frequencies so the seam lines up. */
export function rimNoise(segments: number) {
  const r = mulberry32(42);
  const a = r() * 6.28, b = r() * 6.28, c = r() * 6.28;
  const out = new Float32Array(segments + 1);
  for (let i = 0; i <= segments; i++) {
    const p = (i / segments) * Math.PI * 2;
    out[i] = 0.45 * Math.sin(3 * p + a) + 0.25 * Math.sin(7 * p + b) + 0.18 * Math.sin(13 * p + c) + 0.12 * Math.sin(29 * p + a * 2);
  }
  return out;
}

// ---------- sauce ----------

export const SAUCE_COLORS: Record<SauceId, THREE.Color> = {
  tomato: new THREE.Color("#B8321F"),
  bbq: new THREE.Color("#5E2A16"),
};

// ---------- size ----------

/** Visual scale of the whole pizza: 7" small, 15" fills the view. */
export const sizeScale = (s: SizeId) => 0.5 + (0.4 * (Number(s) - 7)) / 8;
/** Instance count for a topping at this size. */
export const toppingCount = (n12: number, s: SizeId) => Math.max(3, Math.round(n12 * (Number(s) / 12) ** 2));
/** Pieces look a bit bigger on small pizzas. */
export const toppingScale = (s: SizeId) => (12 / Number(s)) ** 0.5;

// ---------- toppings ----------

export type ToppingSpec = {
  /** Builds the base geometry (lying flat, centred, bottom near y = 0). */
  geo: () => THREE.BufferGeometry;
  colors: string[];
  /** Instances on a 12" pizza. */
  n12: number;
  roughness?: number;
  flat?: boolean;
  /** Half height, so the piece sits on the cheese. */
  h: number;
  /** Footprint radius (normalized), keeps pieces inside the sauce. */
  r: number;
  /** Painted texture key (made in the texture worker; instance colours then only tint it). Vertex colours are used automatically if the geometry has them. */
  tex?: "mushroom" | "tomatoSlice" | "jalapeno" | "ham" | "pepperoni" | "olive" | "greenPepper" | "redOnion" | "chilli";
  /** Extra per-instance scale (x, y, z). */
  stretch?: [number, number, number];
  /** Random tilt amount (rad). */
  tilt?: number;
  /** Instances placed in small clusters of this size. */
  cluster?: number;
};

export type Placement = { x: Float32Array; z: Float32Array; rot: Float32Array; tiltX: Float32Array; tiltZ: Float32Array; scale: Float32Array; color: THREE.Color[] };

/**
 * Deterministic placement for one topping, generated for the 15" count.
 * Smaller sizes show a prefix, so changing size only adds or removes pieces, and
 * toggling another topping never moves this one (seed = topping id).
 */
export function placeTopping(id: string, spec: ToppingSpec): Placement {
  const n = toppingCount(spec.n12, "15");
  const rand = mulberry32(hash(id));
  const R = Math.max(0.2, 1 - spec.r - 0.04);
  const cluster = spec.cluster ?? 1;
  const groups = Math.ceil(n / cluster);
  const gx: number[] = [], gz: number[] = [];
  const spacing = R / Math.sqrt(groups);
  for (let i = 0; i < groups; i++) {
    const r = Math.min(R, R * Math.sqrt((i + 0.5) / groups) + (rand() - 0.5) * 0.7 * spacing);
    const t = i * 2.39996 + (rand() - 0.5) * 0.7 * (spacing / Math.max(r, 0.1));
    gx.push(Math.max(0, r) * Math.cos(t));
    gz.push(Math.max(0, r) * Math.sin(t));
  }
  // Seeded shuffle so the first k groups are spread over the whole pizza.
  for (let i = groups - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [gx[i], gx[j]] = [gx[j], gx[i]];
    [gz[i], gz[j]] = [gz[j], gz[i]];
  }
  const p: Placement = {
    x: new Float32Array(n), z: new Float32Array(n), rot: new Float32Array(n),
    tiltX: new Float32Array(n), tiltZ: new Float32Array(n), scale: new Float32Array(n), color: [],
  };
  const cols = spec.colors.map((c) => new THREE.Color(c));
  const tilt = spec.tilt ?? 0.08;
  for (let i = 0; i < n; i++) {
    const g = Math.floor(i / cluster);
    const off = cluster > 1 ? 0.04 : 0;
    let x = gx[g] + (rand() - 0.5) * 2 * off;
    let z = gz[g] + (rand() - 0.5) * 2 * off;
    const d = Math.hypot(x, z);
    if (d > R) { x *= R / d; z *= R / d; }
    p.x[i] = x;
    p.z[i] = z;
    p.rot[i] = rand() * Math.PI * 2;
    p.tiltX[i] = (rand() - 0.5) * 2 * tilt;
    p.tiltZ[i] = (rand() - 0.5) * 2 * tilt;
    p.scale[i] = 0.85 + rand() * 0.3;
    const c = cols[Math.floor(rand() * cols.length)].clone();
    c.offsetHSL(0, 0, (rand() - 0.5) * 0.08);
    p.color.push(c);
  }
  return p;
}
