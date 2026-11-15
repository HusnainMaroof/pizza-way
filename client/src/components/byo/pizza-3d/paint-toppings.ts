/**
 * Topping textures, painted per pixel: analytic shape fields (distance to rims, locules, veins...) plus
 * Float32 noise, then colour derived from those fields. Worker-safe: OffscreenCanvas + ImageData only
 * (no DOM, no ctx.filter, no three.js).
 *
 * Every painter takes `scale` (1/2/4): output = base size × scale pixels. Smooth noise lives on small
 * fixed grids and is sampled bilinearly, so the cost only grows with the cheap per-pixel shading.
 *
 * UV conventions (see pizza-toppings.ts):
 * - disc textures (pepperoni, tomato, jalapeño, olive, chilli): planar top-down, texture centre = piece centre,
 *   texture edge = piece rim.
 * - strip textures (green pepper, red onion): u along the arc, v across it (v = 0 inner edge, 1 outer edge).
 *   Canvas row 0 is v = 1 (the texture is flipped for WebGL).
 */
import { canvas } from "./paint-util";
import type { AnyCanvas } from "./paint-util";
import { field, fill, hex, smoothstep } from "./pizza-noise";
import type { RGB } from "./pizza-noise";
import { mulberry32 } from "./pizza-random";

const TAU = Math.PI * 2;

// ---------- tiny per-pixel toolkit ----------

type Col = [number, number, number];

function pixels(W: number, H = W) {
  const [c, x] = canvas(W, H);
  const img = x.createImageData(W, H);
  return {
    d: img.data,
    done: (): AnyCanvas => {
      x.putImageData(img, 0, 0);
      return c;
    },
  };
}

/** Noise evaluated once on a small n×m grid over [0,1)², then sampled bilinearly (clamped). */
function grid(n: number, fn: (u: number, v: number) => number, m = n) {
  const { w, h, data } = fill(field(n, m), fn);
  return (u: number, v: number) => {
    const x = Math.min(w - 1.001, Math.max(0, u * w)), y = Math.min(h - 1.001, Math.max(0, v * h));
    const xi = x | 0, yi = y | 0, fx = x - xi, fy = y - yi, i = yi * w + xi;
    const a = data[i] + (data[i + 1] - data[i]) * fx;
    const b = data[i + w] + (data[i + w + 1] - data[i + w]) * fx;
    return a + (b - a) * fy;
  };
}

/** Several noise channels on one n×m grid: one bilinear lookup per pixel fills out[0..k-1]. */
function grids(n: number, m: number, fns: ((u: number, v: number) => number)[]) {
  const k = fns.length, data = new Float32Array(n * m * k);
  for (let y = 0; y < m; y++) for (let x = 0; x < n; x++) for (let c = 0; c < k; c++) data[(y * n + x) * k + c] = fns[c](x / n, y / m);
  const out = new Float32Array(k);
  return (u: number, v: number) => {
    const x = Math.min(n - 1.001, Math.max(0, u * n)), y = Math.min(m - 1.001, Math.max(0, v * m));
    const xi = x | 0, yi = y | 0, fx = x - xi, fy = y - yi;
    const i0 = (yi * n + xi) * k, i1 = i0 + n * k;
    const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
    for (let c = 0; c < k; c++) out[c] = data[i0 + c] * w00 + data[i0 + k + c] * w10 + data[i1 + c] * w01 + data[i1 + k + c] * w11;
    return out;
  };
}

const set = (o: Col, c: RGB) => {
  o[0] = c[0];
  o[1] = c[1];
  o[2] = c[2];
};
const lerp = (o: Col, c: RGB | Col, t: number) => {
  if (t <= 0) return;
  if (t > 1) t = 1;
  o[0] += (c[0] - o[0]) * t;
  o[1] += (c[1] - o[1]) * t;
  o[2] += (c[2] - o[2]) * t;
};
const mul = (o: Col, k: number) => {
  o[0] *= k;
  o[1] *= k;
  o[2] *= k;
};
/** Uint8ClampedArray rounds + clamps for us. */
const write = (d: Uint8ClampedArray, i: number, o: Col, a = 255) => {
  d[i] = o[0];
  d[i + 1] = o[1];
  d[i + 2] = o[2];
  d[i + 3] = a;
};
/** Big textures stop at 3x detail: plenty for their on-screen size, keeps the ultra job fast. */
const BIG_MAX = 3;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const hyp = (a: number, b: number) => Math.sqrt(a * a + b * b); // Math.hypot is slow in hot loops

/**
 * Table-based Perlin noise (~[-1, 1]): same look as pizza-noise `gradient`/`fbm`, but no per-call closures,
 * so filling the small noise grids stays cheap even on the main-thread fallback.
 */
const PERM = new Uint8Array(512), GX = new Float32Array(256), GY = new Float32Array(256);
{
  const r = mulberry32(1234);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
  for (let i = 0; i < 256; i++) {
    const a = r() * TAU;
    GX[i] = Math.cos(a);
    GY[i] = Math.sin(a);
  }
}
function pn(x: number, y: number, seed: number) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const xi = (x0 + seed * 31) & 255, yi = (y0 + seed * 17) & 255;
  const a = PERM[PERM[xi] + yi], b = PERM[PERM[xi + 1] + yi], c = PERM[PERM[xi] + yi + 1], d = PERM[PERM[xi + 1] + yi + 1];
  const n00 = GX[a] * fx + GY[a] * fy, n10 = GX[b] * (fx - 1) + GY[b] * fy;
  const n01 = GX[c] * fx + GY[c] * (fy - 1), n11 = GX[d] * (fx - 1) + GY[d] * (fy - 1);
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10), v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const a0 = n00 + (n10 - n00) * u, a1 = n01 + (n11 - n01) * u;
  return 1.41 * (a0 + (a1 - a0) * v);
}
/** Fractal Perlin, ~[-1, 1]. */
function nf(x: number, y: number, octaves: number, seed: number) {
  let amp = 1, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * pn(x * f, y * f, seed + i * 7);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}
/** Ridged fractal in [0, 1] (sharp creases). */
const rid = (x: number, y: number, octaves: number, seed: number) => 1 - Math.abs(nf(x, y, octaves, seed));

type Cell = { f1: number; f2: number; id: number };
const cell = (): Cell => ({ f1: 0, f2: 0, id: 0 });
function h2(x: number, y: number, s: number) {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
/** Allocation-free Worley F1/F2 + nearest-cell id, written into `out` (same idea as pizza-noise worley). */
function wor(x: number, y: number, seed: number, out: Cell) {
  const xi = Math.floor(x), yi = Math.floor(y);
  let d1 = 9, d2 = 9, bx = 0, by = 0;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const cx = xi + i, cy = yi + j;
      const dx = cx + h2(cx, cy, seed) - x, dy = cy + h2(cx, cy, seed + 7) - y;
      const d = dx * dx + dy * dy;
      if (d < d1) {
        d2 = d1;
        d1 = d;
        bx = cx;
        by = cy;
      } else if (d < d2) d2 = d;
    }
  }
  out.f1 = Math.sqrt(d1);
  out.f2 = Math.sqrt(d2);
  out.id = h2(bx, by, seed + 13);
  return out;
}

// ---------- pepperoni (cupped, charred rim, fat cells, pepper, oil pool) ----------

export function pepperoniTexture(scale = 1) {
  const W = 128 * scale;
  const { d, done } = pixels(W);
  const noise = grids(64, 64, [
    (u, v) => nf(u * 7, v * 7, 4, 501), // mottling
    (u, v) => nf(u * 5 + 3.1, v * 5, 3, 502), // warp x
    (u, v) => nf(u * 5, v * 5 + 7.7, 3, 503), // warp y
    (u, v) => nf(u * 10, v * 10, 3, 504), // rim irregularity
  ]);
  const C0 = hex("#b5321f"), C1 = hex("#8f1f12"), RIM = hex("#5a120a"), CHAR = hex("#2b0c07");
  const FAT = hex("#e9a28e"), FAT_RIM = hex("#7a2416"), PEP = hex("#1c0f0a"), OIL = hex("#e2662a");
  const o: Col = [0, 0, 0], c1 = cell(), c2 = cell();
  for (let y = 0; y < W; y++) {
    const v = (y + 0.5) / W;
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W;
      const rho = 2 * hyp(u - 0.5, v - 0.5); // 1 = rim of the slice
      const N = noise(u, v), n = N[0], e = N[3];
      const rr = rho + 0.04 * e; // irregular, hand-cut / shrunk rim
      set(o, C0);
      lerp(o, C1, smoothstep(0.1, 0.8, rr) * 0.9 + 0.3 * n);
      // Fat cells: warped Worley F1. ~40 mm slice / 15 cells -> 2.7 mm cells, specks 1–3 mm.
      const cw = wor(u * 15 + 0.8 * N[1], v * 15 + 0.8 * N[2], 507, c1);
      if (cw.id > 0.22) {
        const k = (cw.id - 0.22) / 0.78;
        const fr = 0.18 + 0.3 * k;
        const keep = 1 - smoothstep(0.7, 0.95, rr); // fat renders out / browns near the rim
        const ring = smoothstep(fr * 0.8, fr, cw.f1) * (1 - smoothstep(fr, fr * 1.35, cw.f1));
        lerp(o, FAT_RIM, ring * 0.35 * keep);
        lerp(o, FAT, (1 - smoothstep(fr * 0.6, fr, cw.f1)) * (0.55 + 0.35 * k) * keep);
      }
      // Black pepper: 26 cells -> 1.5 mm cells, specks 0.3–0.6 mm.
      const pw = wor(u * 26, v * 26, 509, c2);
      if (pw.id < 0.28) {
        const pr = 0.1 + 0.3 * pw.id;
        lerp(o, PEP, (1 - smoothstep(pr * 0.7, pr, pw.f1)) * 0.85);
      }
      // Orange oil pooled in the cup.
      lerp(o, OIL, (1 - smoothstep(0.12, 0.6, rho + 0.18 * n)) * 0.32);
      // Curled rim, then char at the very edge (varies around the slice).
      lerp(o, RIM, smoothstep(0.8, 0.92, rr));
      lerp(o, CHAR, smoothstep(0.91, 1.0, rr) * (0.7 + 0.3 * e));
      mul(o, 1 + 0.07 * n);
      write(d, (y * W + x) * 4, o);
    }
  }
  return done();
}

// ---------- basil (baked leaf, alpha cut-out) ----------

export function basilTexture(detail = 1) {
  const scale = Math.min(detail, BIG_MAX);
  const BW = 256, BH = 128, W = BW * scale, H = BH * scale;
  const { d, done } = pixels(W, H);
  const n1 = grid(96, (u, v) => nf(u * 10, v * 5, 4, 901), 48);
  const marg = new Float32Array(258);
  for (let i = 0; i < marg.length; i++) marg[i] = nf((i / 256) * 14, 0.5, 3, 902);
  const X0 = 10, L = 240;
  const VEINS = [0.07, 0.19, 0.31, 0.43, 0.55, 0.67, 0.79];
  const BASE = hex("#2f6b1f"), HI = hex("#4c8a2e"), VEIN = hex("#5f9440"), WILT = hex("#1d3b12"), CHAR = hex("#2a2a12");
  // Per-column leaf shape: ovate blade (widest ~40% from the stalk, pointed tip), slightly wavy margin.
  const colW = new Float32Array(W), colY = new Float32Array(W);
  for (let px = 0; px < W; px++) {
    const t = ((px + 0.5) / scale - X0) / L, tc = clamp01(t);
    colY[px] = BH / 2 + 3 * Math.sin(Math.PI * tc);
    colW[px] = t <= 0 || t >= 1 ? 0 : 54 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.78)), 0.85) * (1 + 0.04 * marg[(tc * 256) | 0]);
  }
  const o: Col = [0, 0, 0], c1 = cell(), c2 = cell();
  for (let py = 0; py < H; py++) {
    const Y = (py + 0.5) / scale;
    for (let px = 0; px < W; px++) {
      const X = (px + 0.5) / scale;
      const i = (py * W + px) * 4;
      const t = (X - X0) / L;
      const tc = clamp01(t);
      const dy = Math.abs(Y - colY[px]);
      const w = colW[px];
      const pet = t > -0.035 && t < 0.03 ? 2.2 : 0; // short stalk
      const inside = Math.max(w - dy, pet - dy); // base px, + inside
      const a = clamp01(inside * scale + 0.5);
      if (a <= 0) {
        set(o, WILT);
        write(d, i, o, 0);
        continue;
      }
      const u = X / BW, v = Y / BH;
      const n = n1(u, v);
      const s = w > 0 ? Math.min(1, dy / w) : 1; // 0 = midrib, 1 = margin
      // Secondary veins: leave the midrib at ~65° and curve toward the tip (distance to each curve).
      const sp = 0.45 * s + 0.55 * s * s;
      let dsec = 99;
      for (const tk of VEINS) {
        const dd = Math.abs(t - (tk + 0.21 * sp)) * L * 0.75;
        if (dd < dsec) dsec = dd;
      }
      const wm = 1.3 + 1.4 * (1 - tc), ws = 0.7 + 0.5 * (1 - s);
      const mid = 1 - smoothstep(wm * 0.5, wm, dy);
      const sec = (1 - smoothstep(ws * 0.5, ws, dsec)) * (1 - smoothstep(0.82, 0.96, s));
      // Tertiary net: Worley F2-F1 cell edges.
      const cw = wor(X / 6.5, Y / 6.5, 903, c1);
      const ter = (1 - smoothstep(0.04, 0.11, cw.f2 - cw.f1)) * (1 - mid) * (1 - sec);
      // Puckered blade between veins catches the light.
      const bulge = smoothstep(0, 7, Math.min(dsec, dy)) * (1 - 0.5 * ter);
      set(o, BASE);
      lerp(o, HI, 0.55 * bulge * (1 - 0.5 * s) + 0.2 * n);
      lerp(o, VEIN, 0.75 * mid);
      lerp(o, VEIN, 0.5 * sec);
      lerp(o, VEIN, 0.22 * ter);
      // Baked: wilted dark margin + tip, a few charred tips/spots.
      lerp(o, WILT, smoothstep(0.7, 1.0, s + 0.12 * n) * 0.8 + smoothstep(0.8, 1, tc) * 0.4);
      let ch = smoothstep(0.9, 0.98, tc + 0.03 * n);
      const sw = s > 0.55 ? wor(X / 28, Y / 28, 905, c2) : null;
      if (sw && sw.id < 0.18) ch = Math.max(ch, (1 - smoothstep(0.2, 0.42, sw.f1)) * smoothstep(0.55, 0.9, s));
      lerp(o, CHAR, ch * 0.85);
      mul(o, 0.96);
      write(d, i, o, a >= 0.5 ? 255 : 0); // clean mask for alphaTest 0.5
    }
  }
  return done();
}

// ---------- mushroom slice (cooked) ----------

export const MUSH_E = 0.1; // UV extent of the mushroom slice

export const CAP_R = 0.085;

/** Signed distance (world units, + inside) to the mushroom slice outline built in pizza-toppings.ts. */
function mushSD(X: number, Y: number) {
  const cap = Math.min(CAP_R - hyp(X, Y), Y);
  const t = clamp01(-Y / 0.075);
  const w = 0.016 + 0.014 * Math.pow(1 - t, 1.4);
  const k = X / 0.016;
  const bottom = Y + 0.075 + 0.0035 * Math.max(0, 1 - k * k);
  const stem = Math.min(w - Math.abs(X), bottom, 0.01 - Y);
  return Math.max(cap, stem);
}

export function mushroomTex(scale = 1) {
  const S = 192, W = S * Math.min(scale, BIG_MAX);
  const { d, done } = pixels(W);
  const noise = grids(64, 64, [(u, v) => nf(u * 8, v * 8, 4, 311), (u, v) => nf(u * 10, v * 10, 3, 313)]);
  const fib = grid(160, (u, v) => nf(u * 45, v * 6, 3, 312));
  const FLESH = hex("#d9c7a8"), COOK = hex("#b89a74"), SKIN = hex("#6b4a32"), SKIN_E = hex("#8a6a4f");
  const GILL = hex("#5a4636"), GILL_L = hex("#806a54"), MOIST = hex("#8c6a48");
  const o: Col = [0, 0, 0], tmp: Col = [0, 0, 0];
  for (let y = 0; y < W; y++) {
    const v = (y + 0.5) / W;
    const Y = (0.5 - v) * 2 * MUSH_E;
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W;
      const X = (u - 0.5) * 2 * MUSH_E, ax = Math.abs(X);
      const N = noise(u, v), n = N[0];
      const sd = mushSD(X, Y);
      const edge = 1 - smoothstep(0, 0.007, sd + 0.0015 * n); // cooked, moist rim band
      set(o, FLESH);
      lerp(o, COOK, 0.45 + 0.45 * edge + 0.25 * n);
      // Fibres run along the stem.
      mul(o, 1 - 0.07 * (Y < 0 && ax < 0.032 ? 1 : 0.4) * fib(u, v));
      // Gills: a crescent band under the cap, fine lines fanning out from above the stem.
      if (Y > -0.002 && ax > 0.026 && ax < CAP_R) {
        const q = clamp01((ax - 0.03) / (CAP_R - 0.03));
        const wb = N[1];
        const g = 0.0035 + 0.015 * Math.pow(Math.sin(Math.PI * Math.pow(q, 0.8)), 0.7) + 0.0015 * wb;
        const band = (1 - smoothstep(g - 0.003, g, Y)) * smoothstep(0.026, 0.033, ax);
        if (band > 0) {
          const s = 0.5 + 0.5 * Math.sin(Math.atan2(0.06 - Y, ax) * 180 + 2.2 * wb);
          set(tmp, GILL_L);
          lerp(tmp, GILL, smoothstep(0.25, 0.85, s));
          lerp(o, tmp, band * 0.92);
        }
      }
      // Brown skin over the dome, lighter toward the cap margin.
      if (Y > -0.003) {
        const sw = 0.0045 + 0.0012 * n;
        const k = smoothstep(CAP_R - sw, CAP_R - sw * 0.5, hyp(X, Y)) * smoothstep(-0.002, 0.002, Y);
        if (k > 0) {
          set(tmp, SKIN);
          lerp(tmp, SKIN_E, 1 - smoothstep(0.004, 0.035, Y) + 0.25 * n);
          lerp(o, tmp, k);
        }
      }
      // Moist, darker cut edges.
      lerp(o, MOIST, edge * 0.3);
      mul(o, 1 - 0.1 * edge);
      write(d, (y * W + x) * 4, o);
    }
  }
  return done();
}

// ---------- tomato slice (roasted) ----------

export function tomatoTex(scale = 1) {
  const S = 192, W = S * Math.min(scale, BIG_MAX);
  const { d, done } = pixels(W);
  const r = mulberry32(41);
  type Seed = { x: number; y: number; c: number; s: number; rx: number; ry: number };
  // Locules: wedge-shaped gel chambers between radial septa (polar ellipses: radius x angle).
  const loc = Array.from({ length: 4 }, (_, i) => {
    const a = (i / 4) * TAU + 0.35 + (r() - 0.5) * 0.3;
    const rc = 0.5 + (r() - 0.5) * 0.05, ar = 0.3 + r() * 0.04, ha = 0.66 + r() * 0.08;
    const seeds: Seed[] = [];
    for (let k = 0; seeds.length < 9 && k < 80; k++) {
      const lr = (r() * 1.4 - 0.75) * ar, la = (r() * 1.6 - 0.8) * ha;
      if ((lr / ar) ** 2 + (la / ha) ** 2 > 0.5) continue;
      const sa = a + la, o = sa + Math.PI / 2 + (r() - 0.5) * 0.9;
      seeds.push({ x: (rc + lr) * Math.cos(sa), y: (rc + lr) * Math.sin(sa), c: Math.cos(o), s: Math.sin(o), rx: 0.036 + 0.01 * r(), ry: 0.022 });
    }
    return { a, rc, ar, ha, seeds };
  });
  const noise = grids(64, 64, [
    (u, v) => nf(u * 6, v * 6, 4, 411),
    (u, v) => nf(u * 9 + 4, v * 9, 3, 412),
    (u, v) => nf(u * 4, v * 4, 3, 413), // locule warp x
    (u, v) => nf(u * 4 + 9, v * 4, 3, 414), // locule warp y
  ]);
  const FLESH = hex("#d8432a"), FLESH_L = hex("#e0583a"), CORE = hex("#e8745a"), GEL = hex("#e88a5a"), GEL_C = hex("#f0a066");
  const MEMB = hex("#c23a22"), SEED = hex("#e8c46a"), HALO = hex("#f2b072"), SKIN = hex("#b8200f"), ROAST = hex("#8a1c0e"), ROAST2 = hex("#6e140a");
  const o: Col = [0, 0, 0], tmp: Col = [0, 0, 0];
  for (let y = 0; y < W; y++) {
    const v = (y + 0.5) / W;
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W;
      const px = (u - 0.5) * 2, py = (v - 0.5) * 2, rho = hyp(px, py);
      const N = noise(u, v), n = N[0], m = N[1];
      set(o, FLESH);
      lerp(o, FLESH_L, 0.3 + 0.3 * n);
      lerp(o, CORE, (1 - smoothstep(0.05, 0.17, rho + 0.04 * n)) * 0.5); // pale columella
      // Locules (domain-warped so no two chambers look alike), gel + seeds.
      const qx = px + 0.06 * N[2], qy = py + 0.06 * N[3];
      const qr = hyp(qx, qy), th = Math.atan2(qy, qx);
      let q = 9, li = 0;
      for (let k = 0; k < 4; k++) {
        const L = loc[k];
        let da = th - L.a;
        da -= TAU * Math.round(da / TAU);
        const lr = qr - L.rc;
        const ar = lr < 0 ? L.ar * 0.85 : L.ar;
        const qq = (lr / ar) ** 2 + (da / L.ha) ** 2;
        if (qq < q) {
          q = qq;
          li = k;
        }
      }
      if (q < 1.15) {
        const g = 1 - smoothstep(0.82, 1.0, q);
        lerp(o, MEMB, smoothstep(0.75, 0.98, q) * (1 - smoothstep(1.0, 1.15, q)) * 0.3);
        set(tmp, GEL);
        lerp(tmp, GEL_C, (1 - q) * 0.45);
        lerp(tmp, FLESH, 0.22 + 0.1 * n); // gel is translucent: a little flesh shows through
        lerp(o, tmp, g);
        for (const sd of loc[li].seeds) {
          const dx = qx - sd.x, dy = qy - sd.y;
          const sx = (dx * sd.c + dy * sd.s) / sd.rx, sy = (-dx * sd.s + dy * sd.c) / sd.ry;
          const sq = sx * sx + sy * sy;
          if (sq > 2.6) continue;
          lerp(o, HALO, (1 - smoothstep(1.4, 2.6, sq)) * 0.5 * g);
          lerp(o, SEED, (1 - smoothstep(0.7, 1.0, sq)) * g);
        }
      }
      // Roasted darker edge, caramel blotches, then the skin.
      const rr = rho + 0.025 * m;
      lerp(o, ROAST, smoothstep(0.82, 0.96, rr) * 0.5 + 0.25 * Math.max(0, m - 0.3));
      lerp(o, SKIN, smoothstep(0.945, 0.965, rr));
      lerp(o, ROAST2, smoothstep(0.965, 1, rr) * 0.5);
      write(d, (y * W + x) * 4, o);
    }
  }
  return done();
}

// ---------- jalapeño slice (skin, wall, pith, septa, seeds) ----------

export function jalapenoTex(scale = 1) {
  const S = 128, W = S * scale;
  const { d, done } = pixels(W);
  const r = mulberry32(51);
  const sept = [0.4, 0.4 + TAU / 3 + 0.2, 0.4 + (2 * TAU) / 3 - 0.15];
  const sdir = sept.map((a) => [Math.cos(a), Math.sin(a)]);
  const seeds = Array.from({ length: 13 }, (_, k) => {
    const a = sept[k % 3] + (r() - 0.5) * 0.7 + (k > 8 ? Math.PI / 3 : 0), rad = 0.08 + r() * 0.36;
    const o = a + (r() - 0.5) * 0.6;
    return { x: Math.cos(a) * rad, y: Math.sin(a) * rad, c: Math.cos(o), s: Math.sin(o) };
  });
  const noise = grids(48, 48, [(u, v) => nf(u * 6, v * 6, 4, 511), (u, v) => nf(u * 12, v * 12, 3, 512)]);
  const PITH = hex("#e4e2bf"), PITH2 = hex("#cfd2a0"), SEPT = hex("#f1eed2"), PLAC = hex("#ece6c2"), SEED = hex("#f1e4b8"), SRIM = hex("#b9a66c");
  const WALL_IN = hex("#6f9a3c"), WALL = hex("#3f6f24"), SKIN = hex("#1f4214"), BLIS = hex("#4d5626");
  const o: Col = [0, 0, 0];
  for (let y = 0; y < W; y++) {
    const v = (y + 0.5) / W;
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W;
      const px = (u - 0.5) * 2, py = (v - 0.5) * 2, rho = hyp(px, py);
      const N = noise(u, v), n = N[0], rr = rho + 0.03 * n;
      set(o, PITH);
      lerp(o, PITH2, 0.5 + 0.5 * n);
      if (rho < 0.62) {
        for (const [cs, ss] of sdir) {
          if (px * cs + py * ss > 0) lerp(o, SEPT, (1 - smoothstep(0.025, 0.055, Math.abs(py * cs - px * ss))) * 0.45);
        }
      }
      lerp(o, PLAC, 1 - smoothstep(0.16, 0.26, rho + 0.03 * n));
      if (rho < 0.6) {
        for (const sd of seeds) {
          const dx = px - sd.x, dy = py - sd.y;
          const sx = (dx * sd.c + dy * sd.s) / 0.075, sy = (-dx * sd.s + dy * sd.c) / 0.05;
          const sq = sx * sx + sy * sy;
          if (sq > 1.3) continue;
          lerp(o, SEED, 1 - smoothstep(0.6, 1, sq));
          lerp(o, SRIM, smoothstep(0.8, 1, sq) * (1 - smoothstep(1, 1.25, sq)) * 0.5);
        }
      }
      lerp(o, WALL_IN, smoothstep(0.56, 0.6, rr) * 0.8 + smoothstep(0.45, 0.6, rr) * 0.2);
      lerp(o, WALL, smoothstep(0.62, 0.8, rr));
      const sk = smoothstep(0.86, 0.9, rr);
      lerp(o, SKIN, sk);
      lerp(o, BLIS, Math.max(0, N[1]) * 0.5 * sk); // a few blistered spots
      write(d, (y * W + x) * 4, o);
    }
  }
  return done();
}

// ---------- turkey ham (pink, marbled, darker cooked edges) ----------

export function hamTex(scale = 1) {
  const S = 128, W = S * scale;
  const { d, done } = pixels(W);
  const noise = grids(48, 48, [(u, v) => nf(u * 5, v * 5, 4, 611), (u, v) => nf(u * 7 + 2, v * 7, 3, 612)]);
  const fib = grid(64, (u, v) => nf(u * 3, v * 28, 3, 613), 160);
  const marb = grid(128, (u, v) => rid(u * 4 + 0.5 * nf(u * 2, v * 2, 3, 615), v * 4, 3, 614));
  const BASE = hex("#e8938b"), DEEP = hex("#d77a74"), FAT = hex("#f7cdc4"), EDGE = hex("#b8605a"), BROWN = hex("#a8584a");
  const o: Col = [0, 0, 0];
  for (let y = 0; y < W; y++) {
    const v = (y + 0.5) / W;
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W;
      const N = noise(u, v), n = N[0];
      const e = Math.min(u, 1 - u, v, 1 - v) + 0.02 * n;
      set(o, BASE);
      lerp(o, DEEP, 0.4 + 0.4 * n);
      mul(o, 1 + 0.04 * fib(u, v));
      lerp(o, FAT, smoothstep(0.95, 0.995, marb(u, v)) * 0.22);
      lerp(o, BROWN, smoothstep(0.45, 0.75, N[1]) * 0.35);
      lerp(o, EDGE, (1 - smoothstep(0, 0.08, e)) * 0.7);
      write(d, (y * W + x) * 4, o);
    }
  }
  return done();
}

// ---------- black olive ring (wrinkled glossy skin, lighter cut face, dark pit hole) ----------

export const OLIVE_E = 0.045; // UV half-extent (outer radius 0.04 + bevel 0.005)

export function oliveTex(scale = 1) {
  const S = 64, W = S * scale;
  const { d, done } = pixels(W);
  const n1 = grid(48, (u, v) => nf(u * 5, v * 5, 3, 711));
  const wr = grid(64, (u, v) => rid(u * 6, v * 6, 3, 712));
  const fb = grid(64, (u, v) => nf(u * 14, v * 14, 2, 713));
  const CUT = hex("#3a2a2e"), CUT_D = hex("#2a1d22"), SKIN_A = hex("#1e1519"), SKIN_B = hex("#2b1f26"), SHEEN = hex("#3a2634"), PIT = hex("#150e11");
  const o: Col = [0, 0, 0], tmp: Col = [0, 0, 0];
  for (let y = 0; y < W; y++) {
    const v = (y + 0.5) / W;
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W;
      const R = 2 * hyp(u - 0.5, v - 0.5) * OLIVE_E;
      const n = n1(u, v);
      set(o, CUT);
      lerp(o, CUT_D, smoothstep(0.03, 0.038, R) * 0.6 + 0.2 * fb(u, v));
      set(tmp, SKIN_A);
      lerp(tmp, SKIN_B, wr(u, v));
      lerp(tmp, SHEEN, Math.max(0, n) * 0.4);
      lerp(o, tmp, smoothstep(0.0375, 0.0395, R));
      lerp(o, PIT, 1 - smoothstep(0.0185, 0.0205, R));
      write(d, (y * W + x) * 4, o);
    }
  }
  return done();
}

// ---------- green chilli ring ----------

export const CHILLI_E = 0.034;

export function chilliTex(scale = 1) {
  const S = 64, W = S * scale;
  const { d, done } = pixels(W);
  const n1 = grid(32, (u, v) => nf(u * 6, v * 6, 3, 811));
  const SEEDS = [0.3, 1.5, 2.6, 3.9, 5.1].map((a) => [Math.cos(a) * 0.0225, Math.sin(a) * 0.0225]);
  const SKIN = hex("#2f8a24"), SKIN_D = hex("#24701c"), WALL = hex("#72b04c"), WALL_IN = hex("#a9cf7c"), MEMB = hex("#d4e8a8"), SEED = hex("#efe8c4");
  const o: Col = [0, 0, 0];
  for (let y = 0; y < W; y++) {
    const v = (y + 0.5) / W;
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W;
      const X = (u - 0.5) * 2 * CHILLI_E, Y = (v - 0.5) * 2 * CHILLI_E, R = hyp(X, Y);
      const n = n1(u, v);
      set(o, WALL_IN);
      lerp(o, WALL, smoothstep(0.021, 0.028, R));
      lerp(o, MEMB, 1 - smoothstep(0.0195, 0.021, R));
      if (R > 0.019 && R < 0.026) for (const [sx, sy] of SEEDS) lerp(o, SEED, 1 - smoothstep(0.0022, 0.003, hyp(X - sx, Y - sy)));
      const sk = smoothstep(0.0293, 0.0313, R + 0.0006 * n);
      lerp(o, SKIN, sk);
      lerp(o, SKIN_D, sk * (0.4 + 0.4 * n));
      write(d, (y * W + x) * 4, o);
    }
  }
  return done();
}

// ---------- green pepper strip (skin up, blisters, lighter cut edges) ----------

export function greenPepperTex(scale = 1) {
  const BW = 256, BH = 32, W = BW * scale, H = BH * scale;
  const { d, done } = pixels(W, H);
  const n1 = grid(128, (u, v) => nf(u * 20, v * 3, 3, 911), 16);
  const st = grid(256, (u, v) => nf(u * 60, v * 2, 2, 912), 8);
  const DARK = hex("#2f5a1a"), LIGHT = hex("#4f7a2a"), BLIS = hex("#6d7f3a"), CHAR = hex("#2a2414"), CUT = hex("#9fbf6a");
  const o: Col = [0, 0, 0], c1 = cell();
  for (let py = 0; py < H; py++) {
    const v = 1 - (py + 0.5) / H; // 0 inner edge, 1 outer edge
    const arch = Math.pow(Math.sin(Math.PI * v), 0.8) * 0.8;
    for (let px = 0; px < W; px++) {
      const u = (px + 0.5) / W;
      const n = n1(u, v);
      set(o, DARK);
      lerp(o, LIGHT, arch + 0.2 * n); // rounded strip catches light mid-width
      mul(o, 1 + 0.06 * st(u, v)); // fine lengthwise wrinkles
      // Blistered patches (isotropic: strip ≈ 6.7 widths long), some with a charred core.
      const bw = wor(u * 6.7 * 2.2, v * 2.2 + 3, 721, c1);
      if (bw.id < 0.35) {
        lerp(o, BLIS, (1 - smoothstep(0.2, 0.36, bw.f1 + 0.08 * n)) * 0.55);
        if (bw.id < 0.2) lerp(o, CHAR, (1 - smoothstep(0.08, 0.22, bw.f1 + 0.05 * n)) * 0.85);
      }
      // Cut edges (extrusion sides + bevel map onto the outermost texels).
      const ce = Math.max(1 - smoothstep(0, 0.05, v), 1 - smoothstep(0, 0.05, 1 - v), 1 - smoothstep(0, 0.015, u), 1 - smoothstep(0, 0.015, 1 - u));
      lerp(o, CUT, ce);
      write(d, (py * W + px) * 4, o);
    }
  }
  return done();
}

// ---------- red onion strip (two layers, purple skin bands, caramelised edges) ----------

export function redOnionTex(scale = 1) {
  const BW = 256, BH = 32, W = BW * scale, H = BH * scale;
  const { d, done } = pixels(W, H);
  const noise = grids(128, 16, [(u, v) => nf(u * 24, v * 3, 3, 931), (u, v) => nf(u * 14 + 5, v * 2, 3, 932)]);
  const FLESH = hex("#e6d9c0"), COOKED = hex("#d9c8a8"), PINK = hex("#c98fb0"), PURPLE = hex("#7a2a52"), GAP = hex("#cdb8b0"), CARA = hex("#c9a46a"), BROWN = hex("#a87a44");
  const o: Col = [0, 0, 0];
  for (let py = 0; py < H; py++) {
    const v = 1 - (py + 0.5) / H; // 0 inner, 1 outer
    for (let px = 0; px < W; px++) {
      const u = (px + 0.5) / W;
      const N = noise(u, v), n = N[0], m = N[1];
      const vv = v + 0.025 * n;
      // Layer A: v 0–0.42, membrane gap 0.42–0.5, layer B: 0.5–1 (each purple on its outer face).
      const lv = vv < 0.46 ? vv / 0.42 : (vv - 0.5) / 0.5;
      set(o, FLESH);
      lerp(o, COOKED, 0.3 + 0.3 * n);
      lerp(o, PINK, smoothstep(0.45, 0.8, lv) * 0.6);
      lerp(o, PURPLE, smoothstep(0.72, 0.9, lv));
      lerp(o, GAP, smoothstep(0.4, 0.43, vv) * (1 - smoothstep(0.49, 0.52, vv)) * 0.8);
      // Caramelised: cut ends, both long edges (lightly), random patches.
      const ends = Math.max(1 - smoothstep(0, 0.04, u), 1 - smoothstep(0, 0.04, 1 - u));
      const sides = Math.max(1 - smoothstep(0, 0.12, v), 1 - smoothstep(0, 0.08, 1 - v));
      lerp(o, CARA, Math.max(ends * 0.75, sides * 0.35, smoothstep(0.3, 0.7, m) * 0.45));
      lerp(o, BROWN, smoothstep(0.55, 0.8, m) * 0.4);
      write(d, (py * W + px) * 4, o);
    }
  }
  return done();
}
