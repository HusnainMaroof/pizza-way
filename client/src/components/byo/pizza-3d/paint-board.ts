/**
 * Wooden serving board painter, height-first: S x S top-down disc (centre = canvas centre).
 * 4 planks running along x with thin dark seams; grain = distance to growth rings around a
 * per-plank pith line (domain-warped -> cathedral arches), pores stretched ~1:20 along the grain,
 * pizza-cutter / knife marks as shallow dents, light flour dust near the outer ring.
 * Height -> normal + AO; roughness ~0.7 (cuts and flour rougher). Worker-safe: pixel loops only.
 */
import { canvas } from "./paint-util";
import { blur, clamp01, field, hex, smoothstep } from "./pizza-noise";
import { fbm2, noise2, normalAniso } from "./paint-crust";
import type { Field, RGB } from "./pizza-noise";
import { mulberry32 } from "./pizza-random";

/** The canvas spans the board diameter (radius 1.08 x 150 mm). */
const BOARD_MM = 324;
const PLANKS = 4;

const MAPLE = hex("#c9a27a"), OAK = hex("#b88a5e"), RING = hex("#8c6440");
const PORE = hex("#6e4a2e"), SEAM = hex("#4a3020"), FLOUR = hex("#ece4d6");

export function paintBoard(S: number) {
  const r = mulberry32(201);
  const N = S * S;
  const mm = BOARD_MM / S; // mm per px
  const pxPerMm = 1 / mm;
  const plankMm = BOARD_MM / PLANKS;
  const planks = Array.from({ length: PLANKS }, () => ({
    y0: (r() - 0.5) * plankMm * 1.1, // pith offset from the plank centre (mm)
    z0: 22 + 70 * r(), // pith depth below the surface (mm): shallow = tight arches
    tilt: (r() - 0.5) * 0.14, // pith rises/falls along the plank -> cathedral arches
    spacing: 2.6 + 1.8 * r(), // growth ring spacing (mm)
    tint: r(), // maple .. oak
    off: r() * 97,
  }));

  // Low-frequency warp at quarter resolution: broad grain sway (mm) and fine ring wiggle (ring units).
  const F = 4;
  const warpA = lowRes(S, F, (xm, ym) => fbm2(xm / 90, ym / 32, 4, 3));
  const warpB = lowRes(S, F, (xm, ym) => fbm2(xm / 26, ym / 7, 3, 9));

  // ---- knife marks (dents, mm deep) ----
  const K = new Float32Array(N);
  const cut = (x0: number, y0: number, x1: number, y1: number, halfMm: number, depth: number, taper: number) => {
    const hw = Math.max(0.6, halfMm * pxPerMm);
    const dep = depth * Math.min(1, (halfMm * pxPerMm) / hw); // thin sub-pixel cuts: shallower, not wider
    line(K, S, x0, y0, x1, y1, hw, dep, taper);
  };
  const C = S / 2, R = S / 2;
  for (let i = 0; i < 10; i++) {
    // Pizza-cutter passes through (near) the centre, edge to edge.
    const a = r() * Math.PI, ox = (r() - 0.5) * 16 * pxPerMm, oy = (r() - 0.5) * 16 * pxPerMm;
    const l = R * (0.9 + 0.08 * r());
    cut(C + ox - Math.cos(a) * l, C + oy - Math.sin(a) * l, C + ox + Math.cos(a) * l, C + oy + Math.sin(a) * l, 0.25 + 0.2 * r(), 0.08 + 0.07 * r(), 0.04);
  }
  for (let i = 0; i < 36; i++) {
    // Short knife scratches, mostly where the pizza does not cover.
    const d = R * (0.35 + 0.62 * Math.sqrt(r())), p = r() * Math.PI * 2, a = r() * Math.PI;
    const l = (8 + 30 * r()) * pxPerMm;
    const cx = C + Math.cos(p) * d, cy = C + Math.sin(p) * d;
    cut(cx - Math.cos(a) * l, cy - Math.sin(a) * l, cx + Math.cos(a) * l, cy + Math.sin(a) * l, 0.15 + 0.2 * r(), 0.04 + 0.06 * r(), 0.25);
  }

  // ---- flour dust near the outer ring (light, sparse) ----
  const Fl = new Float32Array(N);
  for (let i = 0; i < 700; i++) {
    const d = R * (0.86 + 0.13 * r()), p = r() * Math.PI * 2;
    const radMm = 0.15 + 0.45 * r() ** 2;
    const rp = Math.max(0.7, radMm * pxPerMm);
    const a = (0.35 + 0.55 * r()) * Math.min(1, (radMm * pxPerMm) / rp) ** 2;
    disc(Fl, S, C + Math.cos(p) * d, C + Math.sin(p) * d, rp, (q2) => a * smoothstep(0, 0.5, 1 - q2));
  }
  for (let i = 0; i < 7; i++) {
    const d = R * (0.88 + 0.1 * r()), p = r() * Math.PI * 2;
    const rp = (6 + 12 * r()) * pxPerMm, a = 0.08 + 0.08 * r();
    disc(Fl, S, C + Math.cos(p) * d, C + Math.sin(p) * d, rp, (q2) => a * (1 - q2) ** 2);
  }

  // ---- main pass: grain, pores, seams -> colour, roughness, height ----
  const H = new Float32Array(N);
  const [mapC, mapX] = canvas(S);
  const [nrmC, nrmX] = canvas(S);
  const [ormC, ormX] = canvas(S);
  const mapI = mapX.createImageData(S, S), ormI = ormX.createImageData(S, S), nrmI = nrmX.createImageData(S, S);
  const M = mapI.data, O = ormI.data;
  const seamHw = Math.max(0.6, 0.3 * pxPerMm);
  const poreFine = 0.3 + 0.7 * smoothstep(1.5, 5, pxPerMm);
  const plankPx = S / PLANKS;
  const base: RGB = [0, 0, 0];

  for (let y = 0; y < S; y++) {
    const yc = y + 0.5, ym = yc * mm;
    const p = Math.min(PLANKS - 1, Math.floor(yc / plankPx)), pl = planks[p];
    const yRel = ym - (p + 0.5) * plankMm - pl.y0;
    // Seam: thin dark groove at plank joints (+ a slightly darker 1 mm bevel).
    const ds = Math.min(p > 0 ? yc - p * plankPx : Infinity, p < PLANKS - 1 ? (p + 1) * plankPx - yc : Infinity);
    const sm = 1 - smoothstep(seamHw * 0.5, seamHw + 0.5, ds);
    const bv = 1 - smoothstep(0, 1.2 * pxPerMm + 1, ds);
    const ringPx = pl.spacing * pxPerMm;
    const aa = 0.25 + 0.75 * smoothstep(2.5, 7, ringPx);
    for (let x = 0; x < S; x++) {
      const xc = x + 0.5, xm = xc * mm, i = y * S + x;
      const wa = sampleLow(warpA, S, F, xc, yc), wb = sampleLow(warpB, S, F, xc, yc);
      // Growth rings around the pith line of this plank.
      const yy = yRel + 3.2 * wa;
      const zz = pl.z0 + pl.tilt * (xm - BOARD_MM / 2) + 2.5 * wa;
      const ring = Math.sqrt(yy * yy + zz * zz) / pl.spacing + 0.07 * wb;
      const f = ring - Math.floor(ring);
      const late = smoothstep(0.68, 0.92, f) * (1 - smoothstep(0.94, 1, f));
      const wood = (0.22 * f * f + 0.78 * late) * aa;
      // Pores / rays: noise stretched ~1:20 along the grain, denser in the earlywood.
      const n = noise2((xm + pl.off) / 10, (ym + 3.2 * wa) / 0.5, 41 + p);
      const pore = smoothstep(0.35, 0.8, n) * (0.55 + 0.45 * (1 - f)) * poreFine;
      const kn = clamp01(K[i] * 9), fl = Math.min(1, Fl[i]);

      // Colour.
      const tint = clamp01(pl.tint * 0.8 + 0.2 * (wa * 0.5 + 0.5));
      for (let c = 0; c < 3; c++) base[c] = MAPLE[c] + (OAK[c] - MAPLE[c]) * tint;
      const tone = 1 + 0.05 * wa;
      const pi = i * 4;
      for (let c = 0; c < 3; c++) {
        let v = base[c] * tone;
        v += (RING[c] - v) * wood * 0.85;
        v += (PORE[c] - v) * pore * 0.45;
        v *= 1 + 0.05 * kn - 0.12 * bv;
        v += (SEAM[c] - v) * sm * 0.85;
        v += (FLOUR[c] - v) * fl;
        M[pi + c] = v;
      }
      M[pi + 3] = 255;

      // Height (mm, 0.5 = surface): worn earlywood sits a hair lower than latewood.
      H[i] = 0.5 + 0.03 * late * aa - 0.05 * pore - K[i] - 0.35 * sm - 0.04 * bv + 0.01 * wb;

      let rough = 0.7 - 0.03 * late * aa + 0.05 * pore + 0.1 * kn + 0.12 * sm;
      rough += (0.92 - rough) * fl;
      O[pi + 1] = clamp01(rough) * 255;
      O[pi + 2] = 0;
      O[pi + 3] = 255;
    }
  }

  // AO from the height cavities (seams, cuts, pores).
  // The blur runs at half resolution (a 1.2 mm blur does not need full detail).
  const Hf: Field = { w: S, h: S, data: H };
  const hs = S >> 1, half = field(hs, hs);
  for (let y = 0; y < hs; y++) {
    for (let x = 0; x < hs; x++) {
      const i = 2 * y * S + 2 * x;
      half.data[y * hs + x] = (H[i] + H[i + 1] + H[i + S] + H[i + S + 1]) * 0.25;
    }
  }
  const b = blur(half, Math.max(1, Math.round(0.6 * pxPerMm))).data;
  for (let y = 0; y < S; y++) {
    const br = Math.min(hs - 1, y >> 1) * hs;
    for (let x = 0; x < S; x++) {
      const i = y * S + x;
      O[i * 4] = Math.max(0.4, 1 - 0.6 * clamp01((b[br + Math.min(hs - 1, x >> 1)] - H[i]) * 4)) * 255;
    }
  }

  const ns = (1 / (8 * mm)) * 0.8; // 1 height unit = 1 mm
  normalAniso(Hf, ns, ns, nrmI.data);
  mapX.putImageData(mapI, 0, 0);
  ormX.putImageData(ormI, 0, 0);
  nrmX.putImageData(nrmI, 0, 0);
  return { map: mapC, normal: nrmC, orm: ormC };
}

// ---------- helpers ----------

/** Evaluate fn(x mm, y mm) on a 1/F resolution grid. */
function lowRes(S: number, F: number, fn: (xm: number, ym: number) => number): Field {
  const n = Math.ceil(S / F) + 1, mm = BOARD_MM / S;
  const f = field(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) f.data[y * n + x] = fn(x * F * mm, y * F * mm);
  return f;
}

/** Bilinear lookup of a lowRes field at full-res pixel coords. */
function sampleLow(f: Field, S: number, F: number, xc: number, yc: number) {
  const fx = Math.min(f.w - 1.001, xc / F), fy = Math.min(f.h - 1.001, yc / F);
  const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
  const d = f.data, ra = y0 * f.w + x0, rb = ra + f.w;
  const a = d[ra] + (d[ra + 1] - d[ra]) * tx;
  const b = d[rb] + (d[rb + 1] - d[rb]) * tx;
  return a + (b - a) * ty;
}

/** Shallow V/U dent along a segment (px), max-combined into K; taper = fraction of length faded at each end. */
function line(K: Float32Array, S: number, x0: number, y0: number, x1: number, y1: number, hw: number, depth: number, taper: number) {
  const dx = x1 - x0, dy = y1 - y0, len2 = dx * dx + dy * dy || 1;
  const chunks = Math.max(1, Math.ceil(Math.sqrt(len2) / 32));
  const pad = hw + 1;
  for (let c = 0; c < chunks; c++) {
    const ax = x0 + (dx * c) / chunks, ay = y0 + (dy * c) / chunks;
    const bx = x0 + (dx * (c + 1)) / chunks, by = y0 + (dy * (c + 1)) / chunks;
    const xa = Math.max(0, Math.floor(Math.min(ax, bx) - pad)), xb = Math.min(S - 1, Math.ceil(Math.max(ax, bx) + pad));
    const ya = Math.max(0, Math.floor(Math.min(ay, by) - pad)), yb = Math.min(S - 1, Math.ceil(Math.max(ay, by) + pad));
    for (let y = ya; y <= yb; y++) {
      for (let x = xa; x <= xb; x++) {
        const px = x + 0.5 - x0, py = y + 0.5 - y0;
        const t = Math.max(0, Math.min(1, (px * dx + py * dy) / len2));
        const ex = px - t * dx, ey = py - t * dy;
        const d2 = (ex * ex + ey * ey) / (hw * hw);
        if (d2 >= 1) continue;
        const end = taper > 0 ? smoothstep(0, taper, t) * smoothstep(0, taper, 1 - t) : 1;
        const v = depth * (1 - d2) * end;
        const i = y * S + x;
        if (v > K[i]) K[i] = v;
      }
    }
  }
}

/** Accumulate a round stamp (px radius) into a field; fn(q2) gives the added amount. */
function disc(Fl: Float32Array, S: number, cx: number, cy: number, rp: number, fn: (q2: number) => number) {
  const xa = Math.max(0, Math.floor(cx - rp)), xb = Math.min(S - 1, Math.ceil(cx + rp));
  const ya = Math.max(0, Math.floor(cy - rp)), yb = Math.min(S - 1, Math.ceil(cy + rp));
  for (let y = ya; y <= yb; y++) {
    for (let x = xa; x <= xb; x++) {
      const ex = (x + 0.5 - cx) / rp, ey = (y + 0.5 - cy) / rp, q2 = ex * ex + ey * ey;
      if (q2 < 1) Fl[y * S + x] += fn(q2);
    }
  }
}
