/**
 * Topping models: each one built to be recognisable at a glance (true silhouette + painted detail),
 * still tiny: one InstancedMesh per topping, small canvas textures or vertex colours, no downloads.
 * Units: pizza radius = 1. Every geometry lies flat (y up), centred, bottom near y = -h.
 */
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { mulberry32 } from "./pizza-recipes";
import type { ToppingSpec } from "./pizza-recipes";
import { CAP_R, MUSH_E } from "./pizza-paint";
import { CHILLI_E, OLIVE_E } from "./paint-toppings";
import { fbm } from "./pizza-noise";

const TAU = Math.PI * 2;
const flat = (g: THREE.BufferGeometry) => g.rotateX(-Math.PI / 2);
const cl = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const sstep = (a: number, b: number, x: number) => {
  const t = cl((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// ---------- geometry helpers ----------

/** Top-down UVs: x,z in [-e, e] -> [0, 1] (canvas top = +z away from viewer = shape +y). */
function planarUV(g: THREE.BufferGeometry, e: number) {
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / (2 * e) + 0.5;
    uv[i * 2 + 1] = -p.getZ(i) / (2 * e) + 0.5;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

/** Strip UVs for ring sectors from ringSlice(): u along the arc (0..1), v across it (0 = inner edge, 1 = outer). */
function polarUV(g: THREE.BufferGeometry, inner: number, outer: number, arc: number) {
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i), Z = p.getZ(i);
    uv[i * 2] = cl(Math.atan2(-Z, X) / arc + 0.5);
    uv[i * 2 + 1] = cl((Math.hypot(X, Z) - inner) / (outer - inner));
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

/** Per-vertex colour from a function of position. */
function paint(g: THREE.BufferGeometry, fn: (x: number, y: number, z: number, out: THREE.Color) => void) {
  const p = g.attributes.position;
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    fn(p.getX(i), p.getY(i), p.getZ(i), c);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

/** Smooth lumpy displacement (for chunks of meat, crumbles, meatballs). Welds vertices first so there are no cracks. */
function lumpy(g: THREE.BufferGeometry, amp: number, seed: number, freq = 40) {
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  const m = mergeVertices(g);
  const p = m.attributes.position;
  const r = mulberry32(seed);
  const ph = [r() * 6, r() * 6, r() * 6, r() * 6];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(freq * x + ph[0]) * Math.sin(freq * y + ph[1]) * Math.sin(freq * z + ph[2]) + 0.5 * Math.sin(2.3 * freq * (x + z) + ph[3]);
    const s = 1 + amp * n;
    p.setXYZ(i, x * s, y * s, z * s);
  }
  m.computeVertexNormals();
  return m;
}

/** Annulus sector extruded to a thin slice (rings, arcs, strips). Built in the XY plane, then laid flat. */
function ringSlice(outer: number, inner: number, arc: number, depth: number, bevel = 0) {
  const s = new THREE.Shape();
  s.absarc(0, 0, outer, 0, arc, false);
  if (arc >= TAU - 1e-3) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, inner, 0, TAU, true);
    s.holes.push(hole);
  } else {
    s.lineTo(inner * Math.cos(arc), inner * Math.sin(arc));
    s.absarc(0, 0, inner, arc, 0, true);
    s.closePath();
  }
  const g = new THREE.ExtrudeGeometry(s, {
    depth, curveSegments: 28, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2,
  });
  g.translate(0, 0, -depth / 2);
  if (arc < TAU - 1e-3) g.rotateZ(-arc / 2); // centre the arc on +x
  return flat(g);
}

// ---------- mushroom slice ----------

function mushroomGeo() {
  const s = new THREE.Shape();
  s.moveTo(-0.016, -0.075);
  s.quadraticCurveTo(-0.022, -0.02, -0.03, 0.0);
  s.lineTo(-CAP_R, 0.0);
  s.absarc(0, 0, CAP_R, Math.PI, 0, true);
  s.lineTo(0.03, 0.0);
  s.quadraticCurveTo(0.022, -0.02, 0.016, -0.075);
  s.quadraticCurveTo(0, -0.082, -0.016, -0.075);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 1, curveSegments: 14 });
  g.translate(0, 0.0, -0.006);
  // UVs first (texture is painted for the full-size outline), then shrink a little: cooked slices lose water.
  return planarUV(flat(g), MUSH_E).scale(0.93, 1, 0.93);
}

// ---------- tomato slice ----------


// ---------- jalapeño slice ----------


// ---------- turkey ham ----------

function hamGeo() {
  const g = new THREE.BoxGeometry(0.135, 0.008, 0.135, 8, 1, 8);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i), Z = p.getZ(i);
    p.setY(i, p.getY(i) + 0.006 * Math.sin(X * 45) * Math.cos(Z * 30)); // slightly wavy slice
  }
  g.computeVertexNormals();
  return planarUV(g, 0.0675);
}

const C = (h: string) => new THREE.Color(h);

// ---------- prawn ----------

function prawnGeo() {
  const R = 0.06, arc = Math.PI * 1.35;
  const g = new THREE.TorusGeometry(R, 0.027, 10, 28, arc);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i);
    const phi = Math.atan2(Y, X);
    const t = Math.min(1, Math.max(0, (phi < 0 ? phi + TAU : phi) / arc));
    const f = 1 - 0.55 * t; // thick head end, tapering tail
    const cx = R * Math.cos(phi), cy = R * Math.sin(phi);
    p.setXYZ(i, cx + (X - cx) * f, cy + (Y - cy) * f, Z * f * 0.75);
  }
  g.computeVertexNormals();
  g.rotateZ(-arc / 2);
  flat(g);
  const BELLY = C("#fbe0cf"), BACK = C("#f26a3c"), SEG = C("#e0542c"), TAIL = C("#d23f24");
  return paint(g, (X, _Y, Z, out) => {
    const a = Math.atan2(-Z, X) + arc / 2;
    const outer = sstep(R - 0.012, R + 0.016, Math.hypot(X, Z)); // orange-red back, pale belly
    out.copy(BELLY).lerp(BACK, 0.2 + 0.8 * outer);
    out.lerp(SEG, sstep(0.75, 1, Math.sin(a * 11)) * 0.45 * outer); // shell segment lines
    if (a > arc - 0.35) out.lerp(TAIL, 0.85); // red tail
  });
}

// ---------- pepperoni (cupped lathe: oily centre dips, rim curls up) ----------

function pepperoniGeo() {
  const prof: [number, number][] = [
    [0.0001, -0.008], [0.04, -0.0067], [0.07, -0.0037], [0.092, 0], [0.104, 0.0035], [0.11, 0.0085],
    [0.109, 0.0135], [0.104, 0.0158], [0.094, 0.0148], [0.07, 0.0102], [0.04, 0.0063], [0.0001, 0.0045],
  ];
  let g: THREE.BufferGeometry = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g); // weld the lathe seam so normals are smooth all round
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const X = p.getX(i), Z = p.getZ(i), Y = p.getY(i);
    const a = Math.atan2(Z, X), rr = Math.min(1, Math.hypot(X, Z) / 0.11);
    const k = 1 + 0.025 * Math.sin(3 * a + 0.7) + 0.012 * Math.sin(7 * a + 2.1); // not a perfect circle
    p.setXYZ(i, X * k, Y + 0.0022 * rr * rr * Math.sin(2 * a + 1.3), Z * k); // uneven cupping
  }
  g.computeVertexNormals();
  return planarUV(g, 0.11);
}

// ---------- registry ----------

// Shared colours for the vertex-coloured pieces (allocated once).
const K = {
  chickPale: C("#e8b48c"), chick: C("#c9531e"), chickRed: C("#a5321a"), chickChar: C("#3b1c0d"),
  beefD: C("#3e2214"), beefL: C("#7a4a2c"), beefCrisp: C("#24130a"), beefGrey: C("#6e5444"),
  ballSide: C("#74401f"), ballLight: C("#8f5634"), ballSear: C("#3f2010"), ballSauce: C("#8a2e1a"), crumb: C("#c79a6e"), herb: C("#4a5a26"),
  cornBody: C("#efb526"), cornTop: C("#fbd44a"), cornBase: C("#f4e2a6"), cornCrown: C("#e0a01e"),
};

/** Ring sector sizes, shared by geometry and strip UVs. */
const ONION = { outer: 0.085, inner: 0.062, arc: Math.PI * 1.25 };
const PEPPER = { outer: 0.118, inner: 0.09, arc: Math.PI * 0.6 };

export const TOPPINGS_3D: Record<string, ToppingSpec> = {
  // double-cheese has no mesh: it adds more mozzarella pools instead.
  mushrooms: { geo: mushroomGeo, tex: "mushroom", colors: ["#ffffff", "#f3ece2", "#e9dfd0"], n12: 11, roughness: 0.55, h: 0.008, r: 0.09, tilt: 0.05 },
  "red-onions": {
    geo: () => polarUV(ringSlice(ONION.outer, ONION.inner, ONION.arc, 0.008, 0.0015), ONION.inner, ONION.outer, ONION.arc),
    tex: "redOnion", colors: ["#ffffff", "#f7eef2", "#efe6e0"], n12: 14, roughness: 0.35, h: 0.004, r: 0.085, tilt: 0.05,
  },
  "green-chillies": {
    geo: () => planarUV(ringSlice(0.032, 0.02, TAU, 0.01, 0.0015), CHILLI_E),
    tex: "chilli", colors: ["#ffffff", "#eef7e4", "#f6f8ee"], n12: 22, roughness: 0.25, h: 0.005, r: 0.035,
  },
  "fresh-tomatoes": {
    geo: () => planarUV(new THREE.CylinderGeometry(0.09, 0.09, 0.016, 28), 0.09),
    tex: "tomatoSlice", colors: ["#ffffff", "#f6eeee", "#f2e6e2"], n12: 8, roughness: 0.3, h: 0.008, r: 0.09, tilt: 0.04,
  },
  "green-peppers": {
    geo: () => polarUV(ringSlice(PEPPER.outer, PEPPER.inner, PEPPER.arc, 0.01, 0.002), PEPPER.inner, PEPPER.outer, PEPPER.arc),
    tex: "greenPepper", colors: ["#ffffff", "#eef5e8", "#e2ecd9"], n12: 12, roughness: 0.22, h: 0.007, r: 0.11, tilt: 0.06,
  },
  sweetcorn: {
    geo: () => {
      // Kernel: tapered toward the cob end (-x), flat-ish crown (+x).
      const g = new THREE.SphereGeometry(1, 10, 8);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const X = p.getX(i), k = 0.6 + 0.4 * Math.sqrt((X + 1) / 2);
        p.setXYZ(i, X, p.getY(i) * k, p.getZ(i) * k);
      }
      g.scale(0.022, 0.018, 0.017).computeVertexNormals();
      return paint(g, (X, Y, _Z, out) => {
        out.copy(K.cornBody).lerp(K.cornTop, cl(Y / 0.018 + 0.5));
        out.lerp(K.cornBase, sstep(-0.01, -0.02, X) * 0.8); // pale tip where it sat on the cob
        out.lerp(K.cornCrown, sstep(0.016, 0.022, X) * 0.5); // dimpled crown
      });
    },
    colors: ["#ffffff", "#fff3d6", "#f4e2c8"], n12: 50, roughness: 0.28, h: 0.017, r: 0.025,
  },
  jalapenos: {
    geo: () => planarUV(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 22), 0.055),
    tex: "jalapeno", colors: ["#ffffff", "#eef3e6"], n12: 12, roughness: 0.3, h: 0.006, r: 0.055,
  },
  "black-olives": {
    geo: () => planarUV(ringSlice(0.04, 0.016, TAU, 0.012, 0.005), OLIVE_E),
    tex: "olive", colors: ["#ffffff", "#ece6ea", "#dcd4d8"], n12: 16, roughness: 0.15, h: 0.011, r: 0.045,
  },
  pineapple: {
    geo: () => {
      const s = new THREE.Shape();
      s.moveTo(-0.045, -0.022);
      s.lineTo(0.045, -0.03);
      s.lineTo(0.04, 0.03);
      s.lineTo(-0.04, 0.022);
      s.closePath();
      const g = flat(new THREE.ExtrudeGeometry(s, { depth: 0.026, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 }).translate(0, 0, -0.013));
      return paint(g, (X, Y, _Z, out) => {
        out.copy(C("#e9bb2c")).lerp(C("#fbe27a"), Math.min(1, Math.max(0, Y / 0.03 + 0.5)));
        if (Math.sin(X * 160) > 0.85) out.lerp(C("#f7d65a"), 0.5); // fibres
      });
    },
    colors: ["#ffffff", "#fff5dc"], n12: 13, roughness: 0.35, h: 0.017, r: 0.055,
  },
  "tandoori-chicken": {
    geo: () => {
      const g = lumpy(new THREE.IcosahedronGeometry(0.042, 2), 0.18, 71).scale(1.3, 0.62, 1);
      return paint(g, (X, Y, Z, out) => {
        const n = fbm(X * 55 + 3, Z * 55 + Y * 30, { octaves: 3, seed: 71 });
        const m = fbm(X * 25, Z * 25 - Y * 20, { octaves: 2, seed: 72 });
        out.copy(K.chickPale).lerp(K.chick, cl(Y / 0.02 + 0.65 + 0.3 * m)); // pale underside -> tandoori orange
        out.lerp(K.chickRed, cl(m * 1.2) * 0.5); // deeper marinade
        if (Y > -0.004) out.lerp(K.chickChar, sstep(0.25, 0.55, n) * 0.85); // tandoor char on top
      });
    },
    colors: ["#ffffff", "#f6e6da"], n12: 13, roughness: 0.7, h: 0.024, r: 0.06,
  },
  pepperoni: { geo: pepperoniGeo, tex: "pepperoni", colors: ["#ffffff", "#f4e4e0", "#e8d4cf"], n12: 14, roughness: 0.35, h: 0.007, r: 0.11, tilt: 0.03 },
  "turkey-ham": { geo: hamGeo, tex: "ham", colors: ["#ffffff", "#fbefef"], n12: 11, roughness: 0.45, h: 0.006, r: 0.08, tilt: 0.05 },
  beef: {
    geo: () =>
      paint(lumpy(new THREE.IcosahedronGeometry(0.026, 1), 0.3, 81, 70), (X, Y, Z, out) => {
        const n = fbm(X * 90, Z * 90 + Y * 60, { octaves: 2, seed: 81 });
        out.copy(K.beefD).lerp(K.beefL, cl(Y / 0.026 + 0.5 + 0.35 * n));
        out.lerp(K.beefCrisp, sstep(0.2, 0.5, n) * 0.7); // crispy browned bits
        out.lerp(K.beefGrey, sstep(0.3, 0.6, -n) * 0.35); // less seared, greyer
      }),
    colors: ["#ffffff", "#efe2d8"], n12: 38, roughness: 0.6, h: 0.022, r: 0.03,
  },
  meatballs: {
    geo: () => {
      const g = lumpy(new THREE.SphereGeometry(0.052, 18, 14), 0.08, 91, 90).scale(1, 0.86, 1);
      return paint(g, (X, Y, Z, out) => {
        const n = fbm(X * 70, Z * 70 + Y * 50, { octaves: 2, seed: 91 });
        const f = fbm(X * 160, Z * 160 + Y * 120, { octaves: 2, seed: 92 });
        out.copy(K.ballSide).lerp(K.ballLight, cl(0.5 + 0.6 * n));
        out.lerp(K.ballSear, sstep(0, 0.045, Y) * (0.6 + 0.4 * n)); // seared top
        out.lerp(K.ballSauce, sstep(-0.02, -0.04, Y) * 0.5); // sits in the sauce
        out.lerp(K.crumb, sstep(0.45, 0.7, f) * 0.5); // breadcrumb flecks
        out.lerp(K.herb, sstep(0.55, 0.75, -f) * 0.6); // herb flecks
      });
    },
    colors: ["#ffffff", "#f2e6dc"], n12: 9, roughness: 0.55, h: 0.04, r: 0.06,
  },
  prawns: { geo: prawnGeo, colors: ["#ffffff", "#fff0ea"], n12: 10, roughness: 0.3, h: 0.016, r: 0.09 },
  tuna: {
    geo: () => paint(lumpy(new THREE.DodecahedronGeometry(0.036, 1), 0.3, 101, 60).scale(1.3, 0.55, 0.95), (X, _Y, _Z, out) => {
      out.copy(C("#b98d6c"));
      if (Math.sin(X * 220) > 0.4) out.lerp(C("#8e6247"), 0.55); // darker flaky layers
      else if (Math.sin(X * 90) > 0.7) out.lerp(C("#dcc2a6"), 0.5);
    }),
    colors: ["#ffffff", "#f8f0e6"], n12: 18, roughness: 0.6, h: 0.016, r: 0.045, cluster: 3,
  },
  anchovies: {
    geo: () => {
      const g = new THREE.CapsuleGeometry(0.024, 0.15, 4, 12).rotateZ(Math.PI / 2).scale(1, 0.4, 1);
      return paint(g, (_X, Y, Z, out) => {
        out.copy(C("#a0563a")).lerp(C("#6e3424"), Math.min(1, Math.max(0, Y / 0.009 + 0.5)));
        if (Y > 0 && Math.abs(Z) < 0.006) out.set("#4a2216"); // dark back stripe
        if (Y > 0.002 && Math.abs(Z) > 0.016) out.lerp(C("#c9b2a2"), 0.35); // pale silvery edge
      });
    },
    colors: ["#ffffff", "#f0ebe6"], n12: 8, roughness: 0.25, h: 0.009, r: 0.09,
  },
};

/** Fixed draw layer per topping (its index in the list), so overlapping pieces never z-fight. */
export const TOPPING_LAYER: Record<string, number> = Object.fromEntries(Object.keys(TOPPINGS_3D).map((id, i) => [id, i]));
