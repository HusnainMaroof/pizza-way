/**
 * Melted mozzarella pools: irregular lobed blobs with a puffed, browned edge.
 * All pools are merged into one geometry (one draw call). Units: sauce radius = 1.
 */
import * as THREE from "three";
import { mulberry32 } from "./pizza-recipes";

/** Ring radii (fraction of pool radius); denser near the puffed edge. */
const RINGS_HI = [0.18, 0.34, 0.48, 0.6, 0.7, 0.78, 0.84, 0.88, 0.92, 0.95, 0.98, 1];
const RINGS_LO = [0.38, 0.7, 0.86, 0.95, 1];

const C_CENTRE = new THREE.Color("#f3eee2"); // kept below sRGB ~231 so Neutral tone mapping keeps the shading
const C_MID = new THREE.Color("#efe5cd");
const C_EDGE = new THREE.Color("#e2a955");
const C_BLISTER = new THREE.Color("#a8682a");

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export type Pool = { x: number; z: number; r: number };

/** Seeded pool layout; `avoid` keeps extra (double-cheese) pools in the gaps. */
export function layoutPools(seed: number, count: number, avoid: Pool[] = []): Pool[] {
  const r = mulberry32(seed);
  const out: Pool[] = [];
  let tries = 0;
  while (out.length < count && tries++ < 4000) {
    const rad = 0.1 + r() * 0.08;
    const d = Math.sqrt(r()) * (0.86 - rad);
    const a = r() * Math.PI * 2;
    const p = { x: d * Math.cos(a), z: d * Math.sin(a), r: rad };
    const ok = [...avoid, ...out].every((q) => Math.hypot(q.x - p.x, q.z - p.z) > (q.r + p.r) * 0.95);
    if (ok) out.push(p);
  }
  return out;
}

export function poolsGeometry(pools: Pool[], seed: number, hi: boolean) {
  const r = mulberry32(seed);
  const RINGS = hi ? RINGS_HI : RINGS_LO;
  const SEG = hi ? 56 : 30;
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  const c = new THREE.Color();
  for (const p of pools) {
    const base = pos.length / 3;
    const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
    const H = 0.014 + r() * 0.009; // melted: low and flat
    const rad = (t: number) => p.r * (1 + 0.24 * Math.sin(2 * t + ph[0]) + 0.1 * Math.sin(5 * t + ph[1]) + 0.05 * Math.sin(9 * t + ph[2]));
    const height = (d: number) => H * (1 - smooth(0.72, 1, d)) * (1 - 0.12 * (1 - d)) + H * 0.3 * Math.exp(-((d - 0.84) ** 2) / 0.004) - 0.004 * smooth(0.95, 1, d);
    // Centre vertex.
    pos.push(p.x, height(0), p.z);
    col.push(C_CENTRE.r, C_CENTRE.g, C_CENTRE.b);
    for (const d of RINGS) {
      for (let i = 0; i < SEG; i++) {
        const t = (i / SEG) * Math.PI * 2;
        const rr = rad(t) * d;
        // Small melted bubbles on top, a little stretchy wobble overall.
        const bubble = hi ? H * 0.06 * Math.max(0, Math.sin(t * 7 + ph[0] + d * 9) * Math.sin(d * 14 + ph[1])) : 0;
        pos.push(p.x + rr * Math.cos(t), (height(d) + bubble) * (1 + (r() - 0.5) * 0.04), p.z + rr * Math.sin(t));
        if (d < 0.5) c.copy(C_CENTRE).lerp(C_MID, d / 0.5);
        else c.copy(C_MID).lerp(C_EDGE, smooth(0.6, 1, d));
        if (d > 0.78 && r() > 0.7) c.lerp(C_BLISTER, 0.35 + r() * 0.45); // browned blisters on the puffed edge
        else if (d > 0.25 && d < 0.75 && r() > 0.94) c.lerp(C_EDGE, 0.6); // a few golden spots on top
        col.push(c.r, c.g, c.b);
      }
    }
    // Fan around the centre, then quads between rings (counter-clockwise from above = faces up).
    for (let i = 0; i < SEG; i++) idx.push(base, base + 1 + ((i + 1) % SEG), base + 1 + i);
    for (let k = 0; k < RINGS.length - 1; k++) {
      const a0 = base + 1 + k * SEG, b0 = base + 1 + (k + 1) * SEG;
      for (let i = 0; i < SEG; i++) {
        const i1 = (i + 1) % SEG;
        idx.push(a0 + i, a0 + i1, b0 + i, a0 + i1, b0 + i1, b0 + i);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Fixed layouts: normal cheese, and the extra pools that "double cheese" adds in the gaps. */
export const BASE_POOLS = layoutPools(3, 8);
export const EXTRA_POOLS = layoutPools(4, 7, BASE_POOLS);
