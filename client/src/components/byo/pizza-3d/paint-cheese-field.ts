/**
 * Melted-cheese melt field + cheese micro detail for the unified top surface (height-first, Float32, worker-safe).
 *
 * Field texture (consumed by withCheeseSurface): R = base melt field, G = extra (double-cheese) field,
 * stored as min(255, f * 200); the shader thresholds R + G * extra at CT = 0.13.
 * Detail texture: R = blister height, G = browning breakup (128 = neutral), B = oil beads.
 *
 * Also exports the coarse-grid helpers and `meltFields` so the sauce painter can put its melt halo
 * exactly where the cheese edge is.
 */
import type { Pool } from "./pizza-cheese";
import { canvas } from "./paint-util";
import { mulberry32 } from "./pizza-random";

/** The top disc (diameter = canvas width) is ~300 mm across. */
export const DISC_MM = 300;

// ---------- coarse sample grids (low-frequency fields, bilinearly upsampled) ----------

/** Samples every `div` px (pixel centres), `nch` Float32 channels. */
export type Grid = { S: number; div: number; g: number; ch: Float32Array[] };

export function grid(S: number, div: number, nch: number): Grid {
  const g = Math.floor((S - 1) / div) + 2;
  return { S, div, g, ch: Array.from({ length: nch }, () => new Float32Array(g * g)) };
}

/** Calls fn(X, Y, i) for every grid node; X, Y are disc coords in [-1, 1] (canvas centre = 0). */
export function fillGrid(G: Grid, fn: (X: number, Y: number, i: number) => void) {
  for (let j = 0; j < G.g; j++) {
    const Y = ((j * G.div + 0.5) / G.S) * 2 - 1;
    for (let i = 0; i < G.g; i++) fn(((i * G.div + 0.5) / G.S) * 2 - 1, Y, j * G.g + i);
  }
}

/** Per-axis lookup (index + weight) so per-pixel bilinear reads are cheap. */
export function axis(G: Grid) {
  const i0 = new Int32Array(G.S), t = new Float32Array(G.S);
  for (let x = 0; x < G.S; x++) {
    const f = x / G.div;
    i0[x] = Math.min(G.g - 2, Math.floor(f));
    t[x] = f - i0[x];
  }
  return { i0, t };
}

/** Bilinear read of channel c at grid cell (ix, iy) with weights (tx, ty). */
export function bil(c: Float32Array, g: number, ix: number, iy: number, tx: number, ty: number) {
  const o = iy * g + ix;
  const a = c[o] + (c[o + 1] - c[o]) * tx;
  const b = c[o + g] + (c[o + g + 1] - c[o + g]) * tx;
  return a + (b - a) * ty;
}

/** Bilinear read of a full S x S Float32 field at continuous pixel coords (clamped). */
export function sampleField(f: Float32Array, S: number, x: number, y: number) {
  x = Math.min(S - 1.001, Math.max(0, x));
  y = Math.min(S - 1.001, Math.max(0, y));
  const ix = x | 0, iy = y | 0, tx = x - ix, ty = y - iy, o = iy * S + ix;
  const a = f[o] + (f[o + 1] - f[o]) * tx;
  const b = f[o + S] + (f[o + S + 1] - f[o + S]) * tx;
  return a + (b - a) * ty;
}

/** In place: zero mean, unit standard deviation (so noise amplitudes are predictable). */
export function standardize(d: Float32Array) {
  let m = 0;
  for (let i = 0; i < d.length; i++) m += d[i];
  m /= d.length;
  let v = 0;
  for (let i = 0; i < d.length; i++) v += (d[i] - m) ** 2;
  const k = 1 / Math.sqrt(v / d.length || 1);
  for (let i = 0; i < d.length; i++) d[i] = (d[i] - m) * k;
  return d;
}

const frac = (v: number) => v - Math.floor(v);

/** Hermite smoothstep (works with a > b for falling edges). */
export function smoothstep(a: number, b: number, x: number) {
  let t = (x - a) / (b - a);
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return t * t * (3 - 2 * t);
}

// ---------- fast noise (same ideas as pizza-noise, but table gradients + no per-call allocation) ----------
// pizza-noise's gradient() does cos+sin for each lattice corner (~190 ns/eval); these are ~5-8x faster,
// which is what keeps the big maps inside the time budget.

const GX = new Float32Array(256), GY = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  GX[i] = Math.cos((i / 256) * Math.PI * 2);
  GY[i] = Math.sin((i / 256) * Math.PI * 2);
}

function ihash(x: number, y: number, seed: number) {
  let n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}

/** Gradient noise, ~[-1, 1]. */
export function gnoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h00 = ihash(xi, yi, seed) & 255, h10 = ihash(xi + 1, yi, seed) & 255;
  const h01 = ihash(xi, yi + 1, seed) & 255, h11 = ihash(xi + 1, yi + 1, seed) & 255;
  const n00 = GX[h00] * xf + GY[h00] * yf, n10 = GX[h10] * (xf - 1) + GY[h10] * yf;
  const n01 = GX[h01] * xf + GY[h01] * (yf - 1), n11 = GX[h11] * (xf - 1) + GY[h11] * (yf - 1);
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
  const a = n00 + (n10 - n00) * u, b = n01 + (n11 - n01) * u;
  return 1.41 * (a + (b - a) * v);
}

/** Fractal gradient noise, ~[-1, 1] (standardize the result when exact amplitude matters). */
export function nfbm(x: number, y: number, oct: number, seed: number, gain = 0.5) {
  let amp = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * gnoise(x, y, seed + i * 17);
    norm += amp;
    amp *= gain;
    x *= 2;
    y *= 2;
  }
  return sum / norm;
}

/** Ridged fbm in [0, 1]. */
export const nridged = (x: number, y: number, oct: number, seed: number) => 1 - Math.abs(nfbm(x, y, oct, seed));

/** iq domain warp: fbm(p + k * fbm2(p)). */
export function nwarped(x: number, y: number, k: number, oct: number, seed: number) {
  const qx = nfbm(x, y, oct, seed + 1), qy = nfbm(x + 5.2, y + 1.3, oct, seed + 2);
  return nfbm(x + k * qx, y + k * qy, oct, seed + 3);
}

/** Worley F1/F2 (cell units) + id of the nearest cell in [0, 1), written into CELL (no allocation). */
export const CELL = { f1: 0, f2: 0, id: 0 };
export function cell(x: number, y: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  let best = 9, second = 9, bh = 0;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const cx = xi + i, cy = yi + j, h = ihash(cx, cy, seed);
      const dx = cx + (h & 65535) / 65536 - x, dy = cy + (h >>> 16) / 65536 - y;
      const d = dx * dx + dy * dy;
      if (d < best) {
        second = best;
        best = d;
        bh = h;
      } else if (d < second) second = d;
    }
  }
  CELL.f1 = Math.sqrt(best);
  CELL.f2 = Math.sqrt(second);
  CELL.id = ihash(bh, 7, seed) / 4294967296;
  return CELL;
}

/** Separable box blur with clamped edges (one box pass; call twice for a tent filter). */
export function boxBlur(src: Float32Array, S: number, r: number): Float32Array {
  const tmp = new Float32Array(S * S), out = new Float32Array(S * S), n = 1 / (2 * r + 1);
  for (let y = 0; y < S; y++) {
    const o = y * S;
    let s = src[o] * (r + 1);
    for (let k = 1; k <= r; k++) s += src[o + Math.min(S - 1, k)];
    for (let x = 0; x < S; x++) {
      tmp[o + x] = s * n;
      s += src[o + Math.min(S - 1, x + r + 1)] - src[o + Math.max(0, x - r)];
    }
  }
  // Vertical pass, row-major (cache friendly): running column sums.
  const col = new Float32Array(S);
  for (let x = 0; x < S; x++) col[x] = tmp[x] * (r + 1);
  for (let k = 1; k <= r; k++) {
    const o = Math.min(S - 1, k) * S;
    for (let x = 0; x < S; x++) col[x] += tmp[o + x];
  }
  for (let y = 0; y < S; y++) {
    const o = y * S, add = Math.min(S - 1, y + r + 1) * S, sub = Math.max(0, y - r) * S;
    for (let x = 0; x < S; x++) {
      out[o + x] = col[x] * n;
      col[x] += tmp[add + x] - tmp[sub + x];
    }
  }
  return out;
}

/**
 * Tangent-space normal map (RGBA8, OpenGL +Y, canvas top-down rows) from a height field via Sobel,
 * same convention as pizza-noise normalMap but without per-sample closures. strength = height units per px.
 */
export function sobelNormals(H: Float32Array, S: number, strength: number, out: Uint8ClampedArray) {
  for (let y = 0; y < S; y++) {
    const ym = Math.max(0, y - 1) * S, y0 = y * S, yp = Math.min(S - 1, y + 1) * S;
    for (let x = 0; x < S; x++) {
      const xm = Math.max(0, x - 1), xp = Math.min(S - 1, x + 1);
      const tl = H[ym + xm], t = H[ym + x], tr = H[ym + xp];
      const l = H[y0 + xm], r = H[y0 + xp];
      const bl = H[yp + xm], b = H[yp + x], br = H[yp + xp];
      const nx = -(tr + 2 * r + br - tl - 2 * l - bl) * strength;
      const ny = (bl + 2 * b + br - tl - 2 * t - tr) * strength;
      const k = 1 / Math.sqrt(nx * nx + ny * ny + 1);
      const o = (y0 + x) * 4;
      out[o] = (nx * k * 0.5 + 0.5) * 255;
      out[o + 1] = (ny * k * 0.5 + 0.5) * 255;
      out[o + 2] = (k * 0.5 + 0.5) * 255;
      out[o + 3] = 255;
    }
  }
}

// ---------- melt field ----------

/**
 * Metaball sum of lobed pools with domain-warped (irregular) edges, then a slope blur that smears the
 * edge outward toward the sauce in streaks (melting). Returns [base, extra] fields (S x S, ~0..1.3).
 * Resolution-independent: the same pools give the same shapes at any S (all noise is in disc units).
 */
export function meltFields(S: number, base: Pool[], extra: Pool[]): [Float32Array, Float32Array] {
  // Warp vector (disc units) + slope-blur length + interior thickness variation, on a ~1.2 mm grid.
  const W = grid(S, Math.max(2, Math.round(S / 256)), 4);
  fillGrid(W, (X, Y, i) => {
    W.ch[0][i] = nfbm(X * 4 + 3.1, Y * 4 + 7.7, 3, 51) * 0.16 + nwarped(X * 16, Y * 16, 1.2, 3, 53) * 0.07;
    W.ch[1][i] = nfbm(X * 4 + 9.4, Y * 4 + 1.2, 3, 52) * 0.16 + nwarped(X * 16 + 4.3, Y * 16 + 2.9, 1.2, 3, 57) * 0.07;
    W.ch[2][i] = nfbm(X * 30, Y * 30, 2, 61);
    W.ch[3][i] = nfbm(X * 8, Y * 8, 2, 63);
  });
  standardize(W.ch[2]);
  standardize(W.ch[3]);
  const ax = axis(W), g = W.g;
  const WMAX = 0.07; // max warp reach (disc units), widens each pool's bounding box

  const r = mulberry32(303);
  const out: [Float32Array, Float32Array] = [new Float32Array(S * S), new Float32Array(S * S)];
  const half = S / 2;
  const add = (pools: Pool[], f: Float32Array) => {
    for (const p of pools) {
      const ph0 = r() * 6.28, ph1 = r() * 6.28, ph2 = r() * 6.28;
      const amp = 0.9 + r() * 0.2;
      const cp0 = Math.cos(ph0), sp0 = Math.sin(ph0), cp1 = Math.cos(ph1), sp1 = Math.sin(ph1), cp2 = Math.cos(ph2), sp2 = Math.sin(ph2);
      const rmax2 = (p.r * 1.97) ** 2;
      const reach = p.r * 1.95 + WMAX;
      const cx = (p.x + 1) * half, cy = (p.z + 1) * half, R = reach * half;
      const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(S - 1, Math.ceil(cx + R));
      const y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(S - 1, Math.ceil(cy + R));
      for (let y = y0; y <= y1; y++) {
        const Y = ((y + 0.5) / S) * 2 - 1, iy = ax.i0[y], ty = ax.t[y];
        for (let x = x0; x <= x1; x++) {
          const ix = ax.i0[x], tx = ax.t[x];
          const X = ((x + 0.5) / S) * 2 - 1;
          const dx = X + bil(W.ch[0], g, ix, iy, tx, ty) - p.x, dy = Y + bil(W.ch[1], g, ix, iy, tx, ty) - p.z;
          const d2 = dx * dx + dy * dy;
          if (d2 >= rmax2) continue;
          // Lobes sin(n t + ph) from the unit vector (complex powers), no atan2 / sin per pixel.
          const dl = Math.sqrt(d2) || 1e-9, c1 = dx / dl, s1 = dy / dl;
          const c2 = c1 * c1 - s1 * s1, s2 = 2 * c1 * s1;
          const c4 = c2 * c2 - s2 * s2, s4 = 2 * c2 * s2;
          const c5 = c4 * c1 - s4 * s1, s5 = s4 * c1 + c4 * s1;
          const c9 = c5 * c4 - s5 * s4, s9 = s5 * c4 + c5 * s4;
          const rad = p.r * (1.55 + 0.26 * (s2 * cp0 + c2 * sp0) + 0.1 * (s5 * cp1 + c5 * sp1) + 0.05 * (s9 * cp2 + c9 * sp2));
          const q = d2 / (rad * rad);
          if (q < 1) f[y * S + x] += amp * (1 - q) * (1 - q) * (1 + 0.12 * bil(W.ch[3], g, ix, iy, tx, ty));
        }
      }
    }
  };
  add(base, out[0]);
  add(extra, out[1]);

  // Slope blur: average samples taken uphill along the field gradient, with a noisy length,
  // so the edge creeps outward in soft streaks instead of a clean contour.
  const D = (2.6 / DISC_MM) * S; // max smear, px
  const br = Math.max(1, Math.round(S / 512));
  for (let k = 0; k < 2; k++) {
    const f = out[k];
    const fb = boxBlur(f, S, br);
    const o = new Float32Array(f);
    for (let y = 1; y < S - 1; y++) {
      const iy = ax.i0[y], ty = ax.t[y];
      for (let x = 1; x < S - 1; x++) {
        const i = y * S + x, v = fb[i];
        if (v < 0.003 || v > 0.45) continue;
        const gx = fb[i + 1] - fb[i - 1], gy = fb[i + S] - fb[i - S];
        const gl = Math.sqrt(gx * gx + gy * gy);
        if (gl < 1e-7) continue;
        const n = bil(W.ch[2], g, ax.i0[x], iy, ax.t[x], ty);
        const s = D * Math.min(1, Math.max(0.15, 0.55 + 0.35 * n));
        const ux = (gx / gl) * s, uy = (gy / gl) * s;
        o[i] = (f[i] + sampleField(f, S, x + ux * 0.33, y + uy * 0.33) + sampleField(f, S, x + ux * 0.66, y + uy * 0.66) + sampleField(f, S, x + ux, y + uy)) * 0.25;
      }
    }
    out[k] = o;
  }
  return out;
}

export function paintCheeseField(S: number, base: Pool[], extra: Pool[]) {
  const [fb, fe] = meltFields(S, base, extra);
  const [c, x] = canvas(S);
  const img = x.createImageData(S, S);
  const d = img.data;
  for (let i = 0; i < S * S; i++) {
    d[i * 4] = Math.min(255, fb[i] * 200);
    d[i * 4 + 1] = Math.min(255, fe[i] * 200);
    d[i * 4 + 2] = 0;
    d[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

// ---------- cheese micro detail ----------

/**
 * R: blisters = Worley domes 4-12 mm, ~40% of cells active (clustered by an fbm mask), plus a few big ones.
 * G: browning breakup (fbm, mean 128). B: tiny oil beads (1-3 mm) pooled in the valleys between blisters.
 */
export function paintCheeseDetail(S: number) {
  const mmPx = DISC_MM / S;
  // Coarse fields (~0.6 mm grid): activity mask, browning, big blisters, warp x/y, oil patchiness.
  const G = grid(S, Math.max(1, Math.round(S / 512)), 6);
  fillGrid(G, (X, Y, i) => {
    const mx = (X + 1) * 150, my = (Y + 1) * 150;
    G.ch[0][i] = nfbm(mx / 26, my / 26, 3, 71);
    G.ch[1][i] = nfbm(mx / 7, my / 7, 4, 73, 0.55);
    G.ch[3][i] = nfbm(mx / 5, my / 5, 2, 75);
    G.ch[4][i] = nfbm(mx / 5 + 9.1, my / 5 + 3.7, 2, 77);
    G.ch[5][i] = nfbm(mx / 12, my / 12, 2, 79);
  });
  for (const k of [0, 1, 3, 4, 5]) standardize(G.ch[k]);
  // Big blisters (9-14 mm) are smooth enough to live on the grid.
  fillGrid(G, (X, Y, i) => {
    const mx = (X + 1) * 150 + G.ch[3][i] * 1.2, my = (Y + 1) * 150 + G.ch[4][i] * 1.2;
    const w = cell(mx / 22, my / 22, 911);
    let v = 0;
    if (w.id < 0.22) {
      const d = w.f1 / (0.2 + 0.12 * frac(w.id * 71.3));
      if (d < 1) v = (1 - d * d) ** 0.7 * (0.75 + 0.25 * frac(w.id * 37.9)) * smoothstep(0, 0.25, w.f2 - w.f1);
    }
    G.ch[2][i] = v;
  });
  const ax = axis(G), g = G.g;

  const [c, x] = canvas(S);
  const img = x.createImageData(S, S);
  const d = img.data;
  let seed = 404;
  for (let py = 0; py < S; py++) {
    const iy = ax.i0[py], ty = ax.t[py];
    const my0 = (py + 0.5) * mmPx;
    for (let px = 0; px < S; px++) {
      const ix = ax.i0[px], tx = ax.t[px];
      const mask = bil(G.ch[0], g, ix, iy, tx, ty);
      const brown = bil(G.ch[1], g, ix, iy, tx, ty);
      const big = bil(G.ch[2], g, ix, iy, tx, ty);
      const wx = bil(G.ch[3], g, ix, iy, tx, ty), wy = bil(G.ch[4], g, ix, iy, tx, ty);
      const oilN = bil(G.ch[5], g, ix, iy, tx, ty);
      const mx = (px + 0.5) * mmPx, my = my0;

      // Small/medium blisters: 7 mm cells, warped so the domes are not perfect circles.
      const w = cell((mx + wx * 0.9) / 7, (my + wy * 0.9) / 7, 901);
      let dome = 0;
      if (w.id < Math.min(0.62, Math.max(0.15, 0.4 + 0.15 * mask))) {
        const rad = 0.28 + 0.3 * frac(w.id * 53.7) + (frac(w.id * 17.3) > 0.85 ? 0.15 : 0);
        const dd = w.f1 / rad;
        if (dd < 1) dome = (1 - dd * dd) ** 0.7 * (0.7 + 0.3 * frac(w.id * 29.1)) * smoothstep(0, 0.22, w.f2 - w.f1);
      }
      const blister = Math.max(dome, big * 0.95);
      // Background undulation stays below the shader's browning threshold (0.42).
      const hgt = Math.min(1, blister + 0.1 + 0.04 * mask);

      // Oil beads in the valleys: (1 - height) x small Worley dots, 1-3 mm.
      const b = cell(mx / 3.2, my / 3.2, 777);
      let bead = 0;
      if (frac(b.id * 91.3) < 0.55) {
        const rb = 0.16 + 0.3 * frac(b.id * 41.7);
        bead = smoothstep(rb, rb * 0.35, b.f1) * smoothstep(0, 0.15, b.f2 - b.f1);
      }
      const valley = 1 - smoothstep(0.1, 0.5, blister);
      const patch = Math.min(1, Math.max(0, oilN * 0.5 + 0.5));
      const oil = valley * (bead * (0.55 + 0.45 * patch) + 0.06 * patch);

      // Cheap per-pixel grain on the browning so it does not look airbrushed.
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      const grain = ((seed >>> 8) / 16777216 - 0.5) * 14;

      const o = (py * S + px) * 4;
      d[o] = hgt * 255;
      d[o + 1] = 128 + 55 * brown + grain;
      d[o + 2] = oil * 255;
      d[o + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  return c;
}
