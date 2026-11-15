/**
 * Float32 noise + field toolkit for the texture worker (no DOM, no three.js).
 * Height-first workflow: build a Float32 height field, then derive colour (gradient maps),
 * roughness, AO and normal maps from it.
 *
 * All noises are periodic when `period` (in lattice cells) is given, so textures can tile
 * (e.g. the crust strip wraps around the pizza in X).
 */
import { mulberry32 } from "./pizza-random";

// ---------- hashing ----------

/** Integer hash -> [0, 1). */
function h2(x: number, y: number, seed: number) {
  let n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}

const wrap = (i: number, p: number) => (p > 0 ? ((i % p) + p) % p : i);
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

// ---------- gradient (Perlin-style) noise, ~[-1, 1] ----------

/** 256 unit gradient directions, precomputed once. */
const GX = new Float32Array(256), GY = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  GX[i] = Math.cos((i / 256) * Math.PI * 2);
  GY[i] = Math.sin((i / 256) * Math.PI * 2);
}

export function gradient(x: number, y: number, seed = 0, px = 0, py = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const g = (ix: number, iy: number, dx: number, dy: number) => {
    const k = (h2(wrap(ix, px), wrap(iy, py), seed) * 256) | 0; // lookup table: no cos/sin per corner (~10x faster)
    return GX[k] * dx + GY[k] * dy;
  };
  const u = fade(xf), v = fade(yf);
  const n00 = g(xi, yi, xf, yf), n10 = g(xi + 1, yi, xf - 1, yf);
  const n01 = g(xi, yi + 1, xf, yf - 1), n11 = g(xi + 1, yi + 1, xf - 1, yf - 1);
  return 1.41 * ((n00 + (n10 - n00) * u) + ((n01 + (n11 - n01) * u) - (n00 + (n10 - n00) * u)) * v);
}

/** Fractal sum of gradient noise, ~[-1, 1]. Period doubles with each octave so tiling is kept. */
export function fbm(x: number, y: number, o: { octaves?: number; gain?: number; seed?: number; px?: number; py?: number } = {}) {
  const oct = o.octaves ?? 5, gain = o.gain ?? 0.5;
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * gradient(x * freq, y * freq, (o.seed ?? 0) + i * 17, (o.px ?? 0) * freq, (o.py ?? 0) * freq);
    norm += amp;
    amp *= gain;
    freq *= 2;
  }
  return sum / norm;
}

/** Ridged fbm in [0, 1] (sharp creases: cracks, veins). */
export function ridged(x: number, y: number, o: { octaves?: number; seed?: number; px?: number; py?: number } = {}) {
  return 1 - Math.abs(fbm(x, y, o));
}

/** iq-style domain warp: fbm(p + k * fbm(p + offsets)). Returns ~[-1, 1]. */
export function warped(x: number, y: number, o: { k?: number; seed?: number; octaves?: number; px?: number; py?: number } = {}) {
  const k = o.k ?? 1.5, s = o.seed ?? 0;
  const base = { octaves: o.octaves ?? 4, px: o.px, py: o.py };
  const qx = fbm(x, y, { ...base, seed: s + 1 });
  const qy = fbm(x + 5.2, y + 1.3, { ...base, seed: s + 2 });
  return fbm(x + k * qx, y + k * qy, { ...base, seed: s + 3 });
}

// ---------- cellular (Worley) noise ----------

/** Worley F1/F2 distances (in cell units) and the id of the nearest cell. Periodic with px/py. */
export function worley(x: number, y: number, seed = 0, px = 0, py = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  let f1 = 9, f2 = 9, id = 0;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const cx = xi + i, cy = yi + j;
      const wx = wrap(cx, px), wy = wrap(cy, py);
      const fx = cx + h2(wx, wy, seed), fy = cy + h2(wx, wy, seed + 7);
      const d = Math.hypot(fx - x, fy - y);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        id = h2(wx, wy, seed + 13);
      } else if (d < f2) f2 = d;
    }
  }
  return { f1, f2, id };
}

// ---------- field helpers ----------

export type Field = { w: number; h: number; data: Float32Array };

export const field = (w: number, h = w): Field => ({ w, h, data: new Float32Array(w * h) });

/** Fill a field by evaluating fn(u, v) with u, v in [0, 1). */
export function fill(f: Field, fn: (u: number, v: number, x: number, y: number) => number) {
  const { w, h, data } = f;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data[y * w + x] = fn(x / w, y / h, x, y);
  return f;
}

/** Normalise to [0, 1]. */
export function normalize(f: Field) {
  let lo = Infinity, hi = -Infinity;
  for (const v of f.data) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const k = hi > lo ? 1 / (hi - lo) : 0;
  for (let i = 0; i < f.data.length; i++) f.data[i] = (f.data[i] - lo) * k;
  return f;
}

/** Separable box blur (radius in px), optional wrap in X. Two passes ~ Gaussian-ish. */
export function blur(f: Field, r: number, wrapX = false): Field {
  const { w, h } = f;
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  const n = 2 * r + 1;
  const ix = (x: number) => (wrapX ? ((x % w) + w) % w : Math.min(w - 1, Math.max(0, x)));
  for (let y = 0; y < h; y++) {
    let s = 0;
    for (let k = -r; k <= r; k++) s += f.data[y * w + ix(k)];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = s / n;
      s += f.data[y * w + ix(x + r + 1)] - f.data[y * w + ix(x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let k = -r; k <= r; k++) s += tmp[Math.min(h - 1, Math.max(0, k)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = s / n;
      s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.min(h - 1, Math.max(0, y - r)) * w + x];
    }
  }
  return { w, h, data: out };
}

/** Cavity / AO-ish term: how much lower a pixel is than its blurred neighbourhood (0 = open, 1 = deep). */
export function cavity(f: Field, r: number, strength = 4, wrapX = false): Field {
  const b = blur(f, r, wrapX);
  const out = field(f.w, f.h);
  for (let i = 0; i < f.data.length; i++) out.data[i] = Math.min(1, Math.max(0, (b.data[i] - f.data[i]) * strength));
  return out;
}

/** Convexity: how much higher a pixel is than its neighbourhood (bubble tops, ridges) in [0, 1]. */
export function convexity(f: Field, r: number, strength = 4, wrapX = false): Field {
  const b = blur(f, r, wrapX);
  const out = field(f.w, f.h);
  for (let i = 0; i < f.data.length; i++) out.data[i] = Math.min(1, Math.max(0, (f.data[i] - b.data[i]) * strength));
  return out;
}

/**
 * Tangent-space normal map (RGBA8, OpenGL convention: +Y = up in the texture, as three.js expects)
 * from a height field via a Sobel filter. `strength` = height units per pixel.
 * Rows are stored top-down (canvas order); the texture pipeline flips for WebGL.
 */
export function normalMap(f: Field, strength: number, wrapX = false): Uint8ClampedArray {
  const { w, h, data } = f;
  const out = new Uint8ClampedArray(w * h * 4);
  const at = (x: number, y: number) => {
    const xx = wrapX ? ((x % w) + w) % w : Math.min(w - 1, Math.max(0, x));
    const yy = Math.min(h - 1, Math.max(0, y));
    return data[yy * w + xx];
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = at(x - 1, y - 1), t = at(x, y - 1), tr = at(x + 1, y - 1);
      const l = at(x - 1, y), r = at(x + 1, y);
      const bl = at(x - 1, y + 1), b = at(x, y + 1), br = at(x + 1, y + 1);
      const dx = (tr + 2 * r + br - tl - 2 * l - bl) * strength;
      const dy = (bl + 2 * b + br - tl - 2 * t - tr) * strength; // canvas y grows down; flip to +Y up
      let nx = -dx, ny = dy, nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * w + x) * 4;
      out[i] = (nx * 0.5 + 0.5) * 255;
      out[i + 1] = (ny * 0.5 + 0.5) * 255;
      out[i + 2] = (nz * 0.5 + 0.5) * 255;
      out[i + 3] = 255;
    }
  }
  return out;
}

// ---------- colour helpers ----------

export type RGB = [number, number, number];

export const hex = (h: string): RGB => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Gradient map: t in [0, 1] -> colour from evenly spaced or explicit stops. */
export function ramp(stops: [number, RGB][]) {
  return (t: number): RGB => {
    if (t <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
      const [p1, c1] = stops[i];
      if (t <= p1) {
        const [p0, c0] = stops[i - 1];
        const k = (t - p0) / (p1 - p0 || 1);
        return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k];
      }
    }
    return stops[stops.length - 1][1];
  };
}

export const mix3 = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Write RGB float data (0..255) into an RGBA8 buffer. */
export function rgba(w: number, h: number) {
  return new Uint8ClampedArray(w * h * 4).fill(255);
}

/** A seeded RNG, re-exported for painters that also scatter discrete items. */
export const rng = mulberry32;
