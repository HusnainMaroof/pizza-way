/**
 * Crust strip painter, height-first (Substance-style):
 * 1. build a Float32 height H (warped lumps + clustered Worley blisters + a few big bubbles),
 * 2. derive a bake factor from the profile, convexity and the leopard cluster mask,
 * 3. gradient-map it to albedo, and derive roughness, AO and a tangent normal from H.
 *
 * Strip layout: u (x) = around the pizza, tiles seamlessly in X (all noise is periodic);
 * row y <-> profile v = 1 - y/h (0 bottom centre, ~0.54 crest of the rim, 1 top centre under the sauce).
 * Worker-safe: pixel loops + putImageData only.
 */
import type { CrustId } from "@/lib/byo-data";
import { canvas } from "./paint-util";
import type { Rand } from "./paint-util";
import { blur, clamp01, field, hex, ramp, smoothstep } from "./pizza-noise";
import type { Field } from "./pizza-noise";
import { mulberry32 } from "./pizza-random";

/** Circumference of a 30 cm pizza (mm): the strip width. */
const CIRC_MM = 940;
/** Strip texels are ~2x denser along v than around: features are stretched by SY so they read round. */
const SY = 2;
/** Profile point 7 of 13: top of the rim. */
const CREST_V = 0.54;
/** One height unit pushes the scene geometry by 0.03 radius (~4.5 mm on a 30 cm pizza). */
const MM_PER_HEIGHT = 4.5;

type Look = {
  /** Bake t along the profile (gradient-map position, 0 floury .. 0.8 dark brown). */
  under: number; lowWall: number; wall: number; crest: number; inner: number; top: number;
  /** Shift of the leopard cluster threshold (+ = more clusters). */
  cluster: number;
  /** Browning blush inside clusters. */
  brown: number;
  /** Browning from convexity (blister tops). */
  conv: number;
  /** Char probability on blister tops inside clusters (0 = never black). */
  char: number;
  /** Blister amplitude/density. */
  blister: number;
  /** Big bubbles: count and max diameter (mm), chance a bubble top is charred. */
  bubbles: number; bubbleMm: number; bubbleChar: number;
  /** Warped lump amplitude (height units). */
  lumps: number;
  flour: number;
  /** Oven-floor char dots on the underside. */
  floorChar: number;
  /** Roughness of the underside / lower wall. */
  underRough: number;
};

const LOOK: Record<CrustId, Look> = {
  thin: {
    under: 0.36, lowWall: 0.32, wall: 0.4, crest: 0.47, inner: 0.45, top: 0.42,
    cluster: -0.03, brown: 0.7, conv: 0.5, char: 0.45, blister: 0.75,
    bubbles: 4, bubbleMm: 18, bubbleChar: 0.3, lumps: 0.06, flour: 0.8, floorChar: 14, underRough: 0.92,
  },
  "deep-pan": {
    under: 0.6, lowWall: 0.58, wall: 0.5, crest: 0.5, inner: 0.46, top: 0.43,
    cluster: -0.14, brown: 0.25, conv: 0.18, char: 0, blister: 0.4,
    bubbles: 2, bubbleMm: 20, bubbleChar: 0, lumps: 0.09, flour: 0.1, floorChar: 0, underRough: 0.8,
  },
  "stone-baked": {
    under: 0.3, lowWall: 0.22, wall: 0.27, crest: 0.33, inner: 0.42, top: 0.42,
    cluster: 0.06, brown: 1, conv: 0.6, char: 1, blister: 1,
    bubbles: 9, bubbleMm: 30, bubbleChar: 0.55, lumps: 0.07, flour: 1, floorChar: 26, underRough: 0.93,
  },
};

/** Measured-ish crust gradient map: floury -> golden -> brown -> char. */
const CRUST_RAMP = lut(ramp([
  [0, hex("#d9c3a5")], [0.2, hex("#c9a878")], [0.42, hex("#b98e5a")],
  [0.6, hex("#ab7949")], [0.8, hex("#855a39")], [1, hex("#3e322c")],
]));
const FLOUR = hex("#e6dccb");

// ---------- profile weights (v along the lathe profile) ----------

/** Outer wall + crest + upper inner slope: where blisters and clusters live. */
const rimW = (v: number) => smoothstep(0.25, 0.36, v) * (1 - smoothstep(0.68, 0.8, v));
const crestW = (v: number) => Math.exp(-(((v - CREST_V) / 0.1) ** 2));
/** Underside + lower wall (floury, rough). */
const underW = (v: number) => 1 - smoothstep(0.24, 0.34, v);

function profileT(L: Look, v: number) {
  const pts: [number, number][] = [
    [0, L.under], [0.2, L.under], [0.27, L.lowWall], [0.38, L.wall], [CREST_V, L.crest],
    [0.66, (L.crest + L.inner) / 2], [0.76, L.inner], [0.86, L.top], [1, L.top],
  ];
  for (let i = 1; i < pts.length; i++) {
    if (v <= pts[i][0]) {
      const k = (v - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
      return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * smoothstep(0, 1, k);
    }
  }
  return L.top;
}

// ---------- painter ----------

export function paintCrust(crust: CrustId, w: number) {
  const L = LOOK[crust];
  const h = Math.max(4, Math.round(w / 4));
  const N = w * h;
  const r = mulberry32(101 + crust.length * 31);
  const mmX = CIRC_MM / w; // mm per texel around
  const mmY = mmX / SY; // mm per texel along the profile
  const pxPerMm = 1 / mmX;
  /** 0 at low res (sub-texel pores/flour would alias) -> 1 at >= ~1.6 texels per mm. */
  const fine = smoothstep(0.5, 1.6, pxPerMm);
  // Noise coordinates for a feature size: P cells around (integer -> tiles in X), same physical cell size in Y.
  const cellsFor = (mm: number) => Math.max(1, Math.round(CIRC_MM / mm));
  const nx = (xc: number, P: number) => (xc / w) * P;
  const ny = (yc: number, P: number) => (yc * P) / (w * SY);
  const vOf = (yc: number) => 1 - yc / h;

  // Per-row profile terms.
  const rowV = new Float32Array(h), rowT = new Float32Array(h), rowRim = new Float32Array(h);
  const rowUnder = new Float32Array(h), rowCrest = new Float32Array(h);
  for (let y = 0; y < h; y++) {
    const v = vOf(y + 0.5);
    rowV[y] = v;
    rowT[y] = profileT(L, v);
    rowRim[y] = rimW(v);
    rowUnder[y] = underW(v);
    rowCrest[y] = crestW(v);
  }

  // Low-frequency fields at half resolution: big lumps (~5 cm) and the leopard cluster mask (~4 cm patches).
  const PL = cellsFor(50), PC = cellsFor(40);
  const lumps = lowRes(w, h, (xc, yc) => warp2(nx(xc, PL), ny(yc, PL), 1.2, 11, 4, PL));
  const cluster = lowRes(w, h, (xc, yc) => {
    const m = 0.5 + 0.5 * Math.max(-1, Math.min(1, 1.8 * warp2(nx(xc, PC), ny(yc, PC), 1.6, 23, 3, PC)));
    const v = vOf(yc);
    return smoothstep(0.44, 0.7, m + L.cluster + 0.1 * crestW(v) - 0.45 * (1 - rimW(v)));
  });

  // Blister cells: small (~6.5 mm cells) dense inside clusters, medium (~14 mm) sparser.
  const blisterW = (v: number) => smoothstep(0.26, 0.36, v) * (1 - smoothstep(0.7, 0.8, v));
  const mkLayer = (mm: number, base: number, inC: number, amp: number, rad0: number, radK: number, charIn: number) => {
    const P = cellsFor(mm);
    return cellLayer(P, ny(h, P), r, (fx, fy) => {
      const xc = (fx / P) * w, yc = (fy * w * SY) / P;
      if (yc < 0 || yc >= h) return null;
      const v = vOf(yc), c = sampleLow(cluster, xc, yc);
      const p = (base + inC * c) * blisterW(v) * Math.min(1, L.blister + 0.15);
      const a = r(), b = r(), t0 = r(), t1 = r();
      if (a >= p) return null;
      const chance = L.char * (0.03 + charIn * c);
      return { amp: amp * (0.6 + 0.4 * b) * (0.55 + 0.45 * L.blister), rad: rad0 + radK * r(), tag: t0 < chance ? 0.3 + 0.7 * t1 ** 1.5 : 0 }; // char strength varies: many spots stay brown
    });
  };
  const small = mkLayer(6.5, 0.07, 0.8, 0.17, 0.22, 0.24, 0.8);
  const medium = mkLayer(14, 0.08, 0.45, 0.26, 0.26, 0.18, 0.5);

  const PG = cellsFor(3), PP = cellsFor(1.2);
  const poreRand = mulberry32(37);
  const pores = cellLayer(PP, ny(h, PP), mulberry32(31), () => ({ amp: 1, rad: 1, tag: poreRand() })); // tag = cell id
  const H = new Float32Array(N); // base height (lumps + grain), then + domes
  const D = new Float32Array(N); // dome height
  const charTop = new Float32Array(N); // char amount from blister / bubble tops + oven-floor dots
  const pore = new Float32Array(N);
  const flour = new Float32Array(N);
  const grainF = new Float32Array(N);

  // ---- pass 1: height + pores / flour specks ----
  for (let y = 0; y < h; y++) {
    const yc = y + 0.5, v = rowV[y], rim = rowRim[y], und = rowUnder[y];
    const lumpK = L.lumps * (0.35 + 0.65 * smoothstep(0.2, 0.4, v));
    const flourM = und * L.flour;
    const Yg = ny(yc, PG), Ys = ny(yc, small.P), Ym = ny(yc, medium.P), Yp = ny(yc, PP);
    for (let x = 0; x < w; x++) {
      const xc = x + 0.5, i = y * w + x;
      const lump = sampleLow(lumps, xc, yc);
      const grain = fbm2(nx(xc, PG), Yg, 2, 5, PG);
      grainF[i] = grain;
      H[i] = 0.5 + lumpK * lump + 0.012 * grain;
      if (rim > 0) {
        // Domes, slightly irregular (grain-perturbed lookup).
        const j = 0.2 * grain;
        const ds = domes(small, nx(xc, small.P) + j, Ys - j);
        const ss = hitShape, ts = hitTag;
        const dm = domes(medium, nx(xc, medium.P) - j, Ym + j);
        if (dm > ds) {
          D[i] = dm;
          charTop[i] = hitTag * smoothstep(0.55, 0.9, hitShape);
        } else if (ds > 0) {
          D[i] = ds;
          charTop[i] = ts * smoothstep(0.5, 0.88, ss);
        }
      }
      // Pores (0.5-1.5 mm) everywhere, flour specks (0.5-2 mm) on the underside.
      const f1 = nearest(pores, nx(xc, PP), Yp), id = hitId;
      if (id < 0.4) {
        const pr = 0.16 + 0.2 * ((id * 13.7) % 1);
        pore[i] = (1 - smoothstep(pr * 0.5, pr, f1)) * fine;
      } else if (flourM > 0 && id > 0.8) {
        const fr = 0.2 + 0.4 * ((id * 7.3) % 1);
        const patch = 0.45 + 0.55 * smoothstep(-0.3, 0.4, lump);
        flour[i] = (1 - smoothstep(fr * 0.45, fr, f1)) * flourM * patch * (0.3 + 0.45 * fine);
      }
    }
  }

  // ---- a few big bubbles (real relief, pushed into the geometry) ----
  for (let b = 0; b < L.bubbles; b++) {
    const v = 0.36 + 0.3 * r();
    const cx = r() * w, cy = (1 - v) * h;
    const rad = (L.bubbleMm / 2) * (0.5 + 0.5 * r());
    const rx = rad / mmX * (0.85 + 0.3 * r()), ry = rad / mmY * (0.85 + 0.3 * r());
    const amp = 0.3 + 0.15 * r();
    const tag = r() < L.bubbleChar ? 0.3 + 0.4 * r() : 0;
    stamp(w, h, cx, cy, rx, ry, (i, q2) => {
      const s = 1 - q2;
      const shape = Math.sqrt(s) * smoothstep(0, 0.3, s);
      const d = amp * shape;
      if (d > D[i]) {
        D[i] = d;
        charTop[i] = Math.max(charTop[i] * 0.5, tag * smoothstep(0.7, 1, shape));
      }
    });
  }

  // ---- oven-floor char dots on the underside / bottom edge ----
  for (let k = 0; k < L.floorChar; k++) {
    const v = 0.04 + 0.24 * Math.sqrt(r());
    const cx = r() * w, cy = (1 - v) * h;
    const n = 1 + Math.floor(r() * 4), s = 0.5 + 0.5 * r();
    for (let j = 0; j < n; j++) {
      const rad = 0.8 + 2.2 * r() ** 2;
      const ox = (r() - 0.5) * 6 / mmX, oy = (r() - 0.5) * 6 / mmY;
      stamp(w, h, cx + ox, cy + oy, rad / mmX, rad / mmY, (i, q2) => {
        charTop[i] = Math.max(charTop[i], s * smoothstep(0, 0.6, 1 - q2));
      });
    }
  }

  for (let i = 0; i < N; i++) H[i] = clamp01(H[i] + D[i]);

  // ---- derived fields ----
  const rS = Math.max(1, Math.round(2.5 * pxPerMm)), rL = Math.max(2, Math.round(7 * pxPerMm));
  const Hf: Field = { w, h, data: H };
  const bS = blur(Hf, rS, true).data, bL = blur(Hf, rL, true).data;
  const halo = blur({ w, h, data: charTop }, Math.max(1, Math.round(1.6 * pxPerMm)), true).data;

  const [mapC, mapX] = canvas(w, h);
  const [nrmC, nrmX] = canvas(w, h);
  const [ormC, ormX] = canvas(w, h);
  const mapI = mapX.createImageData(w, h), ormI = ormX.createImageData(w, h), nrmI = nrmX.createImageData(w, h);
  const M = mapI.data, O = ormI.data;

  // ---- pass 2: colour, roughness, AO ----
  const PB = cellsFor(1.5);
  for (let y = 0; y < h; y++) {
    const yc = y + 0.5, rim = rowRim[y], und = rowUnder[y], prof = rowT[y];
    const haze = und * L.flour * (0.1 + 0.15 * (1 - fine));
    const convK = L.conv * (0.35 + 0.65 * rim);
    for (let x = 0; x < w; x++) {
      const xc = x + 0.5, i = y * w + x;
      const hv = H[i];
      const conv = clamp01((hv - bL[i]) * 6); // tops of blisters / bubbles vs their surroundings
      const cavS = clamp01((bS[i] - hv) * 10), cavL = clamp01((bL[i] - hv) * 5);
      const cl = rim > 0 ? sampleLow(cluster, xc, yc) : 0;
      const lump = sampleLow(lumps, xc, yc);
      // Bake factor: profile + local relief + cluster browning, capped below char.
      let t = prof + 0.08 * lump + 0.03 * grainF[i] + convK * conv + L.brown * 0.17 * cl * rim + 0.35 * L.char * halo[i];
      t = Math.min(0.8, Math.max(0, t));
      // Char: break the round blister tops up with fine noise so spots are irregular.
      let ch = 0;
      if (charTop[i] > 0) ch = clamp01((charTop[i] + 0.4 * noise2(nx(xc, PB), ny(yc, PB), 77, PB) - 0.08) * 1.3);
      t += (0.97 - t) * ch;
      const ci = Math.round(t * 255) * 3;
      let R = CRUST_RAMP[ci], G = CRUST_RAMP[ci + 1], B = CRUST_RAMP[ci + 2];
      // Pores slightly darker, flour dust on top.
      const pd = 1 - 0.1 * pore[i];
      const fl = clamp01(flour[i] * 0.75 + haze * (1 - ch));
      R = R * pd + (FLOUR[0] - R * pd) * fl;
      G = G * pd + (FLOUR[1] - G * pd) * fl;
      B = B * pd + (FLOUR[2] - B * pd) * fl;
      const p = i * 4;
      M[p] = R;
      M[p + 1] = G;
      M[p + 2] = B;
      M[p + 3] = 255;
      // Roughness: baked = a bit glossier, underside floury and dry, char matte, flour chalky.
      let rough = 0.72 + 0.15 * (1 - Math.min(1, t));
      rough += (L.underRough - rough) * und;
      rough += (0.9 - rough) * ch;
      rough += (0.95 - rough) * clamp01(fl * 1.4);
      rough = clamp01(rough + 0.05 * pore[i]);
      const ao = Math.max(0.35, 1 - 0.55 * cavS - 0.45 * cavL);
      O[p] = ao * 255;
      O[p + 1] = rough * 255;
      O[p + 2] = 0;
      O[p + 3] = 255;
    }
  }

  // Tangent normal from H (pores excluded): physical slope scaled down a little so it reads but isn't plastic.
  const sx = (MM_PER_HEIGHT / (8 * mmX)) * 0.75;
  normalAniso(Hf, sx, sx * SY, nrmI.data);

  mapX.putImageData(mapI, 0, 0);
  ormX.putImageData(ormI, 0, 0);
  nrmX.putImageData(nrmI, 0, 0);
  return { map: mapC, normal: nrmC, orm: ormC, height: { w, h, data: H } };
}

// ---------- fast noise (LUT gradients, no trig / allocation per sample) ----------
// Same idea as pizza-noise gradient/fbm/warped but ~5x faster; periodic in X with px cells.

const GN = 32;
const GX = new Float32Array(GN), GY = new Float32Array(GN);
for (let i = 0; i < GN; i++) {
  GX[i] = Math.cos(((i + 0.37) / GN) * Math.PI * 2);
  GY[i] = Math.sin(((i + 0.37) / GN) * Math.PI * 2);
}
const ghash = (x: number, y: number, seed: number) => {
  let n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) & (GN - 1);
};

/** Gradient noise ~[-1, 1], periodic in X with px cells (px = 0: no wrap). */
export function noise2(x: number, y: number, seed: number, px = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  let x0 = xi, x1 = xi + 1;
  if (px > 0) {
    x0 = ((xi % px) + px) % px;
    x1 = x0 + 1 === px ? 0 : x0 + 1;
  }
  const a = ghash(x0, yi, seed), b = ghash(x1, yi, seed), c = ghash(x0, yi + 1, seed), d = ghash(x1, yi + 1, seed);
  const n00 = GX[a] * xf + GY[a] * yf, n10 = GX[b] * (xf - 1) + GY[b] * yf;
  const n01 = GX[c] * xf + GY[c] * (yf - 1), n11 = GX[d] * (xf - 1) + GY[d] * (yf - 1);
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
  const top = n00 + (n10 - n00) * u, bot = n01 + (n11 - n01) * u;
  return 1.41 * (top + (bot - top) * v);
}

/** fbm of noise2 (gain 0.5), ~[-1, 1]; the period doubles per octave so tiling is kept. */
export function fbm2(x: number, y: number, octaves: number, seed: number, px = 0) {
  let amp = 1, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(x * f, y * f, seed + i * 17, px * f);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

/** iq domain warp fbm(p + k * fbm(p + offsets)), ~[-1, 1], periodic in X. */
export function warp2(x: number, y: number, k: number, seed: number, octaves: number, px = 0) {
  const qx = fbm2(x, y, octaves, seed + 1, px), qy = fbm2(x + 5.2, y + 1.3, octaves, seed + 2, px);
  return fbm2(x + k * qx, y + k * qy, octaves, seed + 3, px);
}

// ---------- helpers ----------

/** 256-entry RGB lookup of a gradient map. */
function lut(fn: (t: number) => [number, number, number]) {
  const out = new Float32Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const c = fn(i / 255);
    out[i * 3] = c[0];
    out[i * 3 + 1] = c[1];
    out[i * 3 + 2] = c[2];
  }
  return out;
}

/** Evaluate fn at half resolution (fn gets full-res continuous coords; pixel centres at +0.5). */
function lowRes(w: number, h: number, fn: (xc: number, yc: number) => number): Field {
  const lw = Math.max(1, w >> 1), lh = Math.max(1, h >> 1);
  const f = field(lw, lh);
  for (let y = 0; y < lh; y++) {
    const yc = 2 * y + 1;
    for (let x = 0; x < lw; x++) f.data[y * lw + x] = fn(2 * x + 1, yc);
  }
  return f;
}

/** Bilinear lookup of a half-res field at full-res continuous coords (wraps in X, clamps in Y). */
function sampleLow(f: Field, xc: number, yc: number) {
  const fx = xc / 2 - 0.5;
  let fy = yc / 2 - 0.5;
  if (fy < 0) fy = 0;
  else if (fy > f.h - 1) fy = f.h - 1;
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const tx = fx - x0, ty = fy - y0;
  const xa = (((x0 % f.w) + f.w) % f.w), xb = (xa + 1) % f.w;
  const ra = y0 * f.w, rb = Math.min(f.h - 1, y0 + 1) * f.w, d = f.data;
  const a = d[ra + xa] + (d[ra + xb] - d[ra + xa]) * tx;
  const b = d[rb + xa] + (d[rb + xb] - d[rb + xa]) * tx;
  return a + (b - a) * ty;
}

type Cells = { P: number; R: number; fx: Float32Array; fy: Float32Array; rad2: Float32Array; amp: Float32Array; tag: Float32Array };

/**
 * Jittered-grid cell table (one feature point per cell), periodic in X with P cells, rows -1..ceil(rows).
 * place(fx, fy) gets the feature point in noise coords and returns its dome (or null = no blister).
 */
function cellLayer(P: number, rows: number, r: Rand, place: (fx: number, fy: number) => { amp: number; rad: number; tag: number } | null): Cells {
  const R = Math.ceil(rows) + 2, n = P * R;
  const c: Cells = { P, R, fx: new Float32Array(n), fy: new Float32Array(n), rad2: new Float32Array(n), amp: new Float32Array(n), tag: new Float32Array(n) };
  for (let row = 0; row < R; row++) {
    for (let i = 0; i < P; i++) {
      const k = row * P + i;
      c.fx[k] = r();
      c.fy[k] = r();
      const d = place(i + c.fx[k], row - 1 + c.fy[k]);
      if (!d) continue;
      c.amp[k] = d.amp;
      c.rad2[k] = d.rad * d.rad;
      c.tag[k] = d.tag;
    }
  }
  return c;
}

/** Id (0..1) of the nearest cell in the last nearest() call. */
let hitId = 0;

/** Worley F1 (cell units) over a cell table; sets hitId. */
function nearest(c: Cells, X: number, Y: number) {
  const xi = Math.floor(X), yi = Math.floor(Y);
  let best = 9;
  for (let j = -1; j <= 1; j++) {
    const row = yi + j + 1;
    if (row < 0 || row >= c.R) continue;
    for (let i = -1; i <= 1; i++) {
      const cx = xi + i;
      const k = row * c.P + (((cx % c.P) + c.P) % c.P);
      const dx = X - cx - c.fx[k], dy = Y - yi - j - c.fy[k];
      const d2 = dx * dx + dy * dy;
      if (d2 < best) {
        best = d2;
        hitId = c.tag[k];
      }
    }
  }
  return Math.sqrt(best);
}

/** Shape (0..1) and tag of the dome that won the last domes() call. */
let hitShape = 0, hitTag = 0;

/** Max over the 3x3 neighbourhood of dome heights amp * sqrt(1 - q^2) (soft foot). Radii must be < 1 cell. */
function domes(c: Cells, X: number, Y: number) {
  const xi = Math.floor(X), yi = Math.floor(Y);
  let best = 0;
  hitShape = 0;
  hitTag = 0;
  for (let j = -1; j <= 1; j++) {
    const row = yi + j + 1;
    if (row < 0 || row >= c.R) continue;
    const cy = yi + j;
    for (let i = -1; i <= 1; i++) {
      const cx = xi + i;
      const k = row * c.P + (((cx % c.P) + c.P) % c.P);
      const a = c.amp[k];
      if (a <= 0) continue;
      const dx = X - cx - c.fx[k], dy = Y - cy - c.fy[k];
      const q2 = (dx * dx + dy * dy) / c.rad2[k];
      if (q2 >= 1) continue;
      const s = 1 - q2;
      const shape = Math.sqrt(s) * (s < 0.3 ? smoothstep(0, 0.3, s) : 1);
      const d = a * shape;
      if (d > best) {
        best = d;
        hitShape = shape;
        hitTag = c.tag[k];
      }
    }
  }
  return best;
}

/** Visit pixels inside an ellipse (wraps in X); fn gets the index and q^2 = normalised squared distance. */
function stamp(w: number, h: number, cx: number, cy: number, rx: number, ry: number, fn: (i: number, q2: number) => void) {
  const y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(h - 1, Math.ceil(cy + ry));
  const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx);
  for (let y = y0; y <= y1; y++) {
    const dy = (y + 0.5 - cy) / ry;
    for (let x = x0; x <= x1; x++) {
      const dx = (x + 0.5 - cx) / rx;
      const q2 = dx * dx + dy * dy;
      if (q2 >= 1) continue;
      fn(y * w + (((x % w) + w) % w), q2);
    }
  }
}

/**
 * Sobel tangent normal (same convention as pizza-noise normalMap: OpenGL +Y, canvas rows top-down, wraps in X)
 * with separate strengths per axis, because strip texels are SY times denser along v. Also used by the board.
 */
export function normalAniso(f: Field, sx: number, sy: number, out: Uint8ClampedArray) {
  const { w, h, data } = f;
  for (let y = 0; y < h; y++) {
    const ru = Math.max(0, y - 1) * w, rc = y * w, rd = Math.min(h - 1, y + 1) * w;
    for (let x = 0; x < w; x++) {
      const xl = x === 0 ? w - 1 : x - 1, xr = x === w - 1 ? 0 : x + 1;
      const tl = data[ru + xl], t = data[ru + x], tr = data[ru + xr];
      const l = data[rc + xl], r = data[rc + xr];
      const bl = data[rd + xl], b = data[rd + x], br = data[rd + xr];
      const dx = (tr + 2 * r + br - tl - 2 * l - bl) * sx;
      const dy = (bl + 2 * b + br - tl - 2 * t - tr) * sy;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const p = (rc + x) * 4;
      out[p] = (-dx * inv * 0.5 + 0.5) * 255;
      out[p + 1] = (dy * inv * 0.5 + 0.5) * 255;
      out[p + 2] = (inv * 0.5 + 0.5) * 255;
      out[p + 3] = 255;
    }
  }
}
