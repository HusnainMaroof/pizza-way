/**
 * Top disc painter, height-first (planar UVs, canvas centre = disc centre, disc radius 1 = half the canvas).
 *
 * 1. Shared Float32 fields (computed once): ladle-swirled warped relief, crushed-tomato chunks (warped Worley),
 *    oil patches, rim wobble, melt field of the base cheese pools (for the fat halo).
 * 2. Sauce thickness T from the relief -> gradient-mapped colour (tomato and BBQ share every field).
 * 3. Height -> bump (displacement), normal (Sobel), AO (cavity); roughness from the same fields.
 * Worker-safe: no DOM, no ctx.filter, no three.js.
 */
import type { Pool } from "./pizza-cheese";
import { canvas } from "./paint-util";
import { hex, rng } from "./pizza-noise";
import type { RGB } from "./pizza-noise";
import { axis, bil, boxBlur, sobelNormals, smoothstep, cell, DISC_MM, fillGrid, grid, meltFields, nfbm, nridged, nwarped, sampleField, standardize } from "./paint-cheese-field";

type Look = {
  ramp: [number, RGB][]; // sauce colour by thickness T (0 = thin, dough shows through)
  chunkLo: RGB; chunkHi: RGB; // crushed tomato: edge -> pulpy top
  pulp: RGB; oil: RGB; caramel: RGB; herb: RGB; seed: RGB;
  fat: RGB; fatK: number; line: RGB; lineK: number;
  maxR: number; // sRGB cap on red (linear R <= ~0.45)
};

const LOOK: Record<"tomato" | "bbq", Look> = {
  tomato: {
    ramp: [[0, hex("#c0603a")], [0.3, hex("#a8321f")], [0.62, hex("#8e2617")], [1, hex("#7a1e12")]],
    chunkLo: hex("#801e10"), chunkHi: hex("#a02e1a"),
    pulp: hex("#b0402a"), oil: hex("#a8441a"), caramel: hex("#5a1a0e"), herb: hex("#4a4a22"), seed: hex("#c49a58"),
    fat: hex("#cc6420"), fatK: 0.32, line: hex("#3c0f05"), lineK: 0.42, maxR: 180,
  },
  bbq: {
    ramp: [[0, hex("#7e3e20")], [0.3, hex("#5a200f")], [0.62, hex("#481a0b")], [1, hex("#381208")]],
    chunkLo: hex("#3a1408"), chunkHi: hex("#5c2410"),
    pulp: hex("#6c2c14"), oil: hex("#5e240e"), caramel: hex("#2a0c05"), herb: hex("#22160c"), seed: hex("#7a4a26"),
    fat: hex("#985024"), fatK: 0.3, line: hex("#1c0803"), lineK: 0.42, maxR: 150,
  },
};

const DOUGH_A = hex("#c49a62"), DOUGH_B = hex("#b98e5a"), DOUGH_TOAST = hex("#a87a48"), CHAR = hex("#3a2414");

/** Height range of the bump map: 1.0 = 255 = +0.9 mm above the dough (displacementScale 0.012 world ~ 1.8 mm). */
const MM_PER_UNIT = 1.8;

/** Soft-edged ellipse stamp (max-blend) into a 0..255 coverage buffer. */
function stamp(buf: Uint8Array, S: number, cx: number, cy: number, a: number, b: number, ang: number, val: number) {
  const c = Math.cos(ang), s = Math.sin(ang), R = Math.ceil(Math.max(a, b) + 1);
  for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(S - 1, Math.ceil(cy + R)); y++) {
    for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(S - 1, Math.ceil(cx + R)); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const u = (dx * c + dy * s) / a, v = (-dx * s + dy * c) / b;
      const e = Math.sqrt(u * u + v * v);
      if (e >= 1) continue;
      const k = (1 - smoothstep(0.55, 1, e)) * val * 255;
      const i = y * S + x;
      if (k > buf[i]) buf[i] = k;
    }
  }
}

/** Non-allocating gradient map into col. */
function rampInto(stops: [number, RGB][], t: number, col: number[]) {
  let c0 = stops[0][1], c1 = c0, k = 0;
  if (t > stops[0][0]) {
    c0 = c1 = stops[stops.length - 1][1];
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        c0 = stops[i - 1][1];
        c1 = stops[i][1];
        k = (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
        break;
      }
    }
  }
  col[0] = c0[0] + (c1[0] - c0[0]) * k;
  col[1] = c0[1] + (c1[1] - c0[1]) * k;
  col[2] = c0[2] + (c1[2] - c0[2]) * k;
}

const mixc = (col: number[], c: RGB, t: number) => {
  if (t <= 0) return;
  col[0] += (c[0] - col[0]) * t;
  col[1] += (c[1] - col[1]) * t;
  col[2] += (c[2] - col[2]) * t;
};

const frac = (v: number) => v - Math.floor(v);
const sat = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Per-pixel shared values the two sauce looks are painted from. */
type Px = { T: number; ck: number; streak: number; oil: number; car: number; fat: number; line: number; herb: number; seed: number };

function sauceColour(L: Look, p: Px, col: number[]) {
  rampInto(L.ramp, p.T, col);
  mixc(col, L.pulp, smoothstep(0.82, 0.97, p.streak) * 0.22 * smoothstep(0.3, 0.6, p.T));
  if (p.ck > 0) {
    const t = smoothstep(0.15, 0.9, p.ck);
    const k = smoothstep(0.02, 0.25, p.ck);
    col[0] += (L.chunkLo[0] + (L.chunkHi[0] - L.chunkLo[0]) * t - col[0]) * k;
    col[1] += (L.chunkLo[1] + (L.chunkHi[1] - L.chunkLo[1]) * t - col[1]) * k;
    col[2] += (L.chunkLo[2] + (L.chunkHi[2] - L.chunkLo[2]) * t - col[2]) * k;
  }
  mixc(col, L.oil, p.oil * 0.28);
  mixc(col, L.caramel, p.car * 0.85);
  mixc(col, L.fat, p.fat * L.fatK * (1 - p.car));
  mixc(col, L.line, p.line * L.lineK);
  mixc(col, L.seed, p.seed * 0.55);
  mixc(col, L.herb, p.herb * 0.9);
  if (col[0] > L.maxR) col[0] = L.maxR;
}

export function paintTopMaps(S: number, pools: Pool[]) {
  const N = S * S, pxMM = S / DISC_MM, U = DISC_MM / 2; // px per mm, mm per disc unit

  // ---------- coarse fields (~1.2 mm grid) ----------
  // 0 sauce relief (swirled, warped, ~16 mm), 1 oil patches (~30 mm), 2 rim wobble, 3 dryness breakup, 4 chunk clustering.
  const A = grid(S, Math.max(2, Math.round(S / 256)), 5);
  fillGrid(A, (X, Y, i) => {
    const r = Math.sqrt(X * X + Y * Y);
    const phi = 2.4 * r + 0.9 * nfbm(X * 1.3, Y * 1.3, 2, 11); // ladle swirl: rotation grows with radius
    const c = Math.cos(phi), s = Math.sin(phi);
    const qx = X * c - Y * s, qy = X * s + Y * c;
    A.ch[0][i] = nwarped(qx * 9, qy * 9, 1.4, 4, 21);
    A.ch[1][i] = nfbm(X * 5 + 7, Y * 5 + 3, 3, 31);
    const nx = r > 1e-4 ? X / r : 1, ny = r > 1e-4 ? Y / r : 0;
    A.ch[2][i] = nfbm(nx * 3 + 10, ny * 3 + 10, 3, 41);
    A.ch[3][i] = nfbm(X * 14, Y * 14, 3, 51);
    A.ch[4][i] = nfbm(X * 6, Y * 6, 2, 61);
  });
  A.ch.forEach(standardize);

  // ---------- fine fields (~0.6 mm grid) ----------
  // 0 fine relief (~3 mm), 1/2 chunk edge warp (~4 mm), 3 pulp streaks (ridged, swirled), 4 dough grain.
  const B = grid(S, Math.max(1, Math.round(S / 512)), 5);
  fillGrid(B, (X, Y, i) => {
    const r = Math.sqrt(X * X + Y * Y);
    const phi = 2.4 * r + 0.9 * nfbm(X * 1.3, Y * 1.3, 2, 11);
    const c = Math.cos(phi), s = Math.sin(phi);
    const qx = X * c - Y * s, qy = X * s + Y * c;
    B.ch[0][i] = nfbm(X * 50, Y * 50, 2, 81);
    B.ch[1][i] = nfbm(X * 37 + 3.3, Y * 37 + 8.1, 2, 83);
    B.ch[2][i] = nfbm(X * 37 + 6.7, Y * 37 + 1.9, 2, 85);
    B.ch[3][i] = nridged(qx * 30, qy * 30 * 0.6, 2, 87);
    B.ch[4][i] = nfbm(X * 20, Y * 20, 3, 89);
  });
  for (const k of [0, 1, 2, 4]) standardize(B.ch[k]);

  const aA = axis(A), aB = axis(B), gA = A.g, gB = B.g;

  // ---------- melt field of the base pools (same function as the cheese texture) ----------
  const Sm = Math.min(S, 768);
  const [melt] = meltFields(Sm, pools, []);
  const mk = Sm / S;

  // ---------- flecks: oregano, tomato seeds, char spots on the dough ring ----------
  const R = rng(777);
  const herb = new Uint8Array(N), seed = new Uint8Array(N), char = new Uint8Array(N);
  const inDisc = (rMax: number) => {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * rMax;
    return [(1 + d * Math.cos(a)) * (S / 2), (1 + d * Math.sin(a)) * (S / 2)];
  };
  for (let i = 0; i < 260; i++) {
    const [x, y] = inDisc(0.94);
    const a = (0.5 + R() * 0.5) * pxMM, b = a * (0.3 + R() * 0.35), ang = R() * Math.PI;
    stamp(herb, S, x, y, Math.max(a, 0.9), Math.max(b, 0.6), ang, 0.85 + R() * 0.15);
    if (R() < 0.6) stamp(herb, S, x + (R() - 0.5) * a, y + (R() - 0.5) * a, Math.max(a * 0.6, 0.8), Math.max(b * 0.8, 0.6), ang + (R() - 0.5) * 1.5, 0.8);
  }
  for (let i = 0; i < 110; i++) {
    const [x, y] = inDisc(0.92);
    stamp(seed, S, x, y, Math.max(0.8 * pxMM, 0.9), Math.max(0.55 * pxMM, 0.7), R() * Math.PI, 0.6 + R() * 0.4);
  }
  for (let i = 0; i < 16; i++) {
    const a = R() * Math.PI * 2, d = 0.984 + R() * 0.014, rr = (0.6 + R() * 1.0) * pxMM;
    stamp(char, S, (1 + d * Math.cos(a)) * (S / 2), (1 + d * Math.sin(a)) * (S / 2), Math.max(rr, 1), Math.max(rr * (0.6 + R() * 0.4), 0.8), R() * Math.PI, 0.7 + R() * 0.3);
  }

  // ---------- per-pixel: height, colour (x2), roughness ----------
  const H = new Float32Array(N);
  const [tc, tx] = canvas(S), [bc, bx] = canvas(S), [oc, ox] = canvas(S), [hc, hx] = canvas(S), [nc, nx] = canvas(S);
  const tImg = tx.createImageData(S, S), bImg = bx.createImageData(S, S), oImg = ox.createImageData(S, S);
  const td = tImg.data, bd = bImg.data, od = oImg.data;
  const rough = new Float32Array(N);
  const col = [0, 0, 0];
  const p: Px = { T: 0, ck: 0, streak: 0, oil: 0, car: 0, fat: 0, line: 0, herb: 0, seed: 0 };

  for (let y = 0; y < S; y++) {
    const Y = ((y + 0.5) / S) * 2 - 1;
    const ayi = aA.i0[y], ayt = aA.t[y], byi = aB.i0[y], byt = aB.t[y];
    for (let x = 0; x < S; x++) {
      const i = y * S + x;
      const X = ((x + 0.5) / S) * 2 - 1;
      const r = Math.sqrt(X * X + Y * Y);
      const axi = aA.i0[x], axt = aA.t[x], bxi = aB.i0[x], bxt = aB.t[x];
      const hf = bil(B.ch[0], gB, bxi, byi, bxt, byt);
      const dn = bil(B.ch[4], gB, bxi, byi, bxt, byt);
      const rimN = bil(A.ch[2], gA, axi, ayi, axt, ayt);
      const rs = Math.min(0.99, 0.972 + 0.008 * rimN) + 0.0022 * hf; // sauce edge (wobbly, ragged)
      const M = smoothstep(rs + 0.003, rs - 0.003, r);

      // Dough ring (and the canvas corners): baked, not raw.
      const charC = char[i] / 255;
      const dg = sat(dn * 0.35 + 0.5);
      let dr = DOUGH_A[0] + (DOUGH_B[0] - DOUGH_A[0]) * dg, dgc = DOUGH_A[1] + (DOUGH_B[1] - DOUGH_A[1]) * dg, db = DOUGH_A[2] + (DOUGH_B[2] - DOUGH_A[2]) * dg;
      const toast = smoothstep(0.975, 1.0, r) * (0.3 + 0.25 * sat(dn * 0.5 + 0.5));
      dr += (DOUGH_TOAST[0] - dr) * toast; dgc += (DOUGH_TOAST[1] - dgc) * toast; db += (DOUGH_TOAST[2] - db) * toast;
      dr += (CHAR[0] - dr) * charC; dgc += (CHAR[1] - dgc) * charC; db += (CHAR[2] - db) * charC;
      const doughH = 0.02 * dn - 0.04 * charC; // mm
      const doughR = 0.75 + 0.03 * dn + 0.1 * charC;

      if (M <= 0) {
        H[i] = 0.5 + doughH / MM_PER_UNIT;
        rough[i] = doughR;
        td[i * 4] = bd[i * 4] = dr; td[i * 4 + 1] = bd[i * 4 + 1] = dgc; td[i * 4 + 2] = bd[i * 4 + 2] = db;
        td[i * 4 + 3] = bd[i * 4 + 3] = 255;
        continue;
      }

      // Sauce thickness from the swirled relief; thins over the last ~9 mm before the edge.
      const hb = bil(A.ch[0], gA, axi, ayi, axt, ayt);
      const edgeThin = smoothstep(rs, rs - 0.06, r);
      const T = sat(0.6 + 0.18 * hb + 0.05 * hf) * (0.35 + 0.65 * edgeThin);

      // Crushed-tomato chunks: warped Worley cells (6.5 mm), ~1/3 active, clustered, 3-8 mm across.
      let ck = 0;
      if (T > 0.12) {
        const wx = bil(B.ch[1], gB, bxi, byi, bxt, byt), wy = bil(B.ch[2], gB, bxi, byi, bxt, byt);
        const dens = bil(A.ch[4], gA, axi, ayi, axt, ayt);
        const w = cell((X * U + wx * 1.1) / 6.5, (Y * U + wy * 1.1) / 6.5, 97);
        if (w.id < 0.32 + 0.12 * dens) {
          const rad = 0.22 + 0.26 * frac(w.id * 97.31) + (frac(w.id * 13.7) > 0.92 ? 0.18 : 0);
          const d = w.f1 / rad;
          if (d < 1) ck = smoothstep(1, 0.5, d) ** 0.8 * (0.6 + 0.4 * frac(w.id * 31.7)) * (0.9 + 0.1 * hf) * smoothstep(0.12, 0.4, T) * smoothstep(0, 0.18, w.f2 - w.f1);
        }
      }

      // Melt halo around the base cheese pools: orange fat bleeding out + a thin dark cooked line.
      const mf = sampleField(melt, Sm, (x + 0.5) * mk - 0.5, (y + 0.5) * mk - 0.5);
      const cover = smoothstep(0.08, 0.3, mf); // under the cheese: relief mostly smoothed over
      const fat = smoothstep(0.012, 0.1, mf) * (1 - smoothstep(0.2, 0.35, mf)); // band just outside / under the pool edge
      const line = Math.exp(-(((mf - 0.08) / 0.012) ** 2)) * (0.55 + 0.45 * sat(hf * 0.5 + 0.5));

      const oil = smoothstep(1.0, 2.0, bil(A.ch[1], gA, axi, ayi, axt, ayt));
      const dry = bil(A.ch[3], gA, axi, ayi, axt, ayt);
      const car = smoothstep(rs - 0.03, rs - 0.004, r) * (0.55 + 0.45 * sat(dry * 0.5 + 0.5)) + 0.25 * smoothstep(0.16, 0.04, T);

      // Height (mm above the dough): sauce layer + chunks + fine pulp texture.
      const rel = 1 - 0.7 * cover;
      const sauceH = 0.12 + (0.35 * (T - 0.56) + 0.5 * ck + 0.03 * hf) * rel;
      H[i] = Math.min(0.98, Math.max(0.02, 0.5 + (doughH + (sauceH - doughH) * M) / MM_PER_UNIT));

      p.T = T; p.ck = ck; p.streak = bil(B.ch[3], gB, bxi, byi, bxt, byt); p.oil = oil; p.car = Math.min(1, car);
      p.fat = fat; p.line = line; p.herb = herb[i] / 255; p.seed = seed[i] / 255;

      // Roughness: wet sauce 0.27-0.37, chunks 0.32, oil 0.11, fat halo 0.1, dried rim 0.55, herbs 0.6.
      let ro = 0.27 + 0.1 * (1 - T);
      ro += (0.32 - ro) * smoothstep(0.05, 0.3, ck);
      ro += (0.55 - ro) * p.car;
      ro += (0.11 - ro) * oil * 0.9;
      ro += (0.1 - ro) * fat * 0.85;
      ro += (0.6 - ro) * Math.max(p.herb, p.seed * 0.5);
      rough[i] = doughR + (ro - doughR) * M;

      sauceColour(LOOK.tomato, p, col);
      td[i * 4] = dr + (col[0] - dr) * M; td[i * 4 + 1] = dgc + (col[1] - dgc) * M; td[i * 4 + 2] = db + (col[2] - db) * M; td[i * 4 + 3] = 255;
      sauceColour(LOOK.bbq, p, col);
      bd[i * 4] = dr + (col[0] - dr) * M; bd[i * 4 + 1] = dgc + (col[1] - dgc) * M; bd[i * 4 + 2] = db + (col[2] - db) * M; bd[i * 4 + 3] = 255;
    }
  }

  // ---------- AO from cavities (around chunks + broad troughs), also baked lightly into the colour ----------
  const r1 = Math.max(1, Math.round(1.2 * pxMM)), r2 = Math.max(2, Math.round(4 * pxMM));
  const bs = boxBlur(boxBlur(H, S, r1), S, r1), bl = boxBlur(boxBlur(H, S, r2), S, r2);
  const hImg = hx.createImageData(S, S), hd = hImg.data;
  for (let i = 0; i < N; i++) {
    const cav = sat(sat((bs[i] - H[i]) * 3) + sat((bl[i] - H[i]) * 6));
    const o = i * 4;
    od[o] = (1 - 0.45 * cav) * 255;
    od[o + 1] = rough[i] * 255;
    od[o + 2] = 0;
    od[o + 3] = 255;
    const k = 1 - 0.18 * cav;
    td[o] *= k; td[o + 1] *= k; td[o + 2] *= k;
    bd[o] *= k; bd[o + 1] *= k; bd[o + 2] *= k;
    hd[o] = hd[o + 1] = hd[o + 2] = H[i] * 255;
    hd[o + 3] = 255;
  }

  // ---------- normal map: physically matched to the displacement (x1.5 for readability) ----------
  const nImg = nx.createImageData(S, S);
  sobelNormals(H, S, 0.00075 * S * 1.5, nImg.data);

  tx.putImageData(tImg, 0, 0);
  bx.putImageData(bImg, 0, 0);
  ox.putImageData(oImg, 0, 0);
  hx.putImageData(hImg, 0, 0);
  nx.putImageData(nImg, 0, 0);
  return { tomato: tc, bbq: bc, bump: hc, normal: nc, orm: oc };
}
