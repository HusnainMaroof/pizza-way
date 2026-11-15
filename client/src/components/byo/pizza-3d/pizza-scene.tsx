"use client";

/**
 * The 3D pizza (three + react-three-fiber). Loaded lazily by pizza-preview.tsx, never on the server.
 * Look: procedural PBR (painted colour + bump + roughness maps), real mozzarella pool meshes,
 * studio reflections from RoomEnvironment (no HDR download), Neutral tone mapping.
 * Performance: frameloop "demand", capped DPR, ~25 draw calls, all animation in one useFrame.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useByoStore } from "@/store/byo-store";
import type { CrustId, SizeId } from "@/lib/byo-data";
import {
  CRUSTS_3D, PROFILE_POINTS, RIM_FIRST, RIM_LAST,
  placeTopping, resampleProfile, rimNoise, roundNoise, sizeScale, toppingCount, toppingScale,
} from "./pizza-recipes";
import type { Placement } from "./pizza-recipes";
import { paint, repaintInto } from "./pizza-texture-client";
import type { TextureSet } from "./pizza-texture-client";
import type { OccSpot, HeightField } from "./pizza-paint";
import { TOPPING_LAYER, TOPPINGS_3D } from "./pizza-toppings";
import { BASE_POOLS, EXTRA_POOLS } from "./pizza-cheese";
import { blur as blurField } from "./pizza-noise";
import { studioEnvironment, withCheeseSurface, withMicroDetail, withOcclusion, withRealismPatches, wrapSSS } from "./pizza-shading";

/** ULTRA-only lens effects, in their own chunk so other devices never download them. */
const PizzaPost = lazy(() => import("./pizza-post"));

export type Tier = "low" | "mid" | "ultra";

export type SceneProps = {
  /**
   * low: weak device (DPR 1, light geometry, no shadows, no idle spin).
   * mid: phones/tablets and modest GPUs (real shadows, milky cheese/dough).
   * ultra: capable desktops (+ ambient occlusion, depth of field, bloom, grain).
   */
  tier: Tier;
  /** ULTRA ran too slowly: drop to MID. */
  onDowngrade: () => void;
  reducedMotion: boolean;
  /** Canvas on screen; when false the render loop stops completely. */
  active: boolean;
  onReady: () => void;
  onFail: () => void;
};

const P = PROFILE_POINTS;
const TAU = Math.PI * 2;
const SPIN_SPEED = 0.2; // rad/s idle rotation
/** Idle spin runs this long after load / any change / a drag, then the scene stops rendering (zero GPU when idle). */
const SPIN_SECONDS = 6;
/** Idle-spin frames are paced (~40 fps) instead of following the screen (60/120 Hz ProMotion). Animations stay full rate. */
const IDLE_FRAME_MS = 25;
const BASIL: [number, number, number][] = [
  [0.34, 0.12, 0.6], [-0.3, -0.22, 2.4], [0.02, -0.48, 4.1], [-0.42, 0.34, 5.3],
];

/** Texture detail per tier. Painting happens in a Web Worker, so bigger sizes cost no main-thread time. */
const DETAIL = {
  low: { top: 512, strip: 512, board: 256, topping: 1, occ: 128, cheese: 512 },
  mid: { top: 1024, strip: 2048, board: 1024, topping: 2, occ: 256, cheese: 1024 },
  ultra: { top: 1536, strip: 2048, board: 2048, topping: 4, occ: 512, cheese: 1024 },
} as const;
type Detail = { top: number; strip: number; board: number; topping: number; occ: number; cheese: number };

/** Seeded topping layouts, shared by the scene and the occlusion painter. */
const PLACEMENTS = new Map<string, Placement>();
const placementOf = (id: string) => {
  if (!PLACEMENTS.has(id)) PLACEMENTS.set(id, placeTopping(id, TOPPINGS_3D[id]));
  return PLACEMENTS.get(id)!;
};

/** Contact-shadow spots for the current selection (target layout, not mid-animation positions). */
function occSpots(toppings: string[], size: SizeId): OccSpot[] {
  const spots: OccSpot[] = [];
  const ts = toppingScale(size);
  for (const id of toppings) {
    const spec = TOPPINGS_3D[id];
    if (!spec) continue;
    const pl = placementOf(id);
    const n = toppingCount(spec.n12, size);
    for (let i = 0; i < n; i++) spots.push({ x: pl.x[i], z: pl.z[i], r: spec.r * pl.scale[i] * ts * 1.5, strength: 1 });
  }
  if (toppings.includes("double-cheese")) for (const p of EXTRA_POOLS) spots.push({ x: p.x, z: p.z, r: p.r * 1.35, strength: 0.45 });
  return spots;
}

type CrustTex = { map: THREE.Texture; bump?: THREE.Texture; normal?: THREE.Texture; orm?: THREE.Texture; height: HeightField };
/**
 * The height map also pushes blisters into the crust geometry (one sample per vertex).
 * Pre-blur it to roughly the vertex spacing so 2-5 mm blisters don't flicker; big bubbles survive.
 */
const asCrust = (t: TextureSet): CrustTex => {
  const h = t.height!;
  return { map: t.tex.map, bump: t.tex.bump, normal: t.tex.normal, orm: t.tex.orm, height: blurField(h, Math.max(1, Math.round(h.w / 400)), true) };
};

/**
 * Surface detail maps: a baked normal map when the painter provides one (sharper and stable in motion),
 * else the older height bump map; an ORM texture (R = AO, G = roughness) when available.
 */
function detailMaps(t: { normal?: THREE.Texture; bump?: THREE.Texture; orm?: THREE.Texture; rough?: THREE.Texture }, bumpScale: number) {
  return {
    ...(t.normal ? { normalMap: t.normal, normalScale: new THREE.Vector2(1, 1) } : t.bump ? { bumpMap: t.bump, bumpScale } : {}),
    // AO kept moderate: N8AO (ultra) also darkens indirect light.
    ...(t.orm ? { roughnessMap: t.orm, aoMap: t.orm, aoMapIntensity: 0.75, roughness: 1 } : t.rough ? { roughnessMap: t.rough, roughness: 1 } : {}),
  };
}

/** Apply new crust maps to the material (crust type switch). */
function setCrustMaps(m: THREE.MeshStandardMaterial, t: CrustTex) {
  m.map = t.map;
  m.normalMap = t.normal ?? null;
  m.bumpMap = t.normal ? null : (t.bump ?? null);
  m.roughnessMap = t.orm ?? null;
  m.aoMap = t.orm ?? null;
  m.roughness = t.orm ? 1 : 0.8;
  m.needsUpdate = true;
}

/** Sharper texture filtering at grazing angles (the far half of the pizza), by tier. */
const ANISOTROPY = { low: 4, mid: 8, ultra: 16 } as const;

/** All painted textures, made off the main thread before the pizza mounts. */
type TexBundle = {
  top: TextureSet; board: TextureSet; toppings: TextureSet; occ: THREE.Texture; cheese: TextureSet; crust: Map<CrustId, CrustTex>;
  /** CC0 scan detail (null if it failed to load: everything still works procedurally). */
  photoCheese: THREE.Texture | null;
};

/** Small CC0 photo textures in /public/textures/pizza (made from ambientCG Pizza002 + Poly Haven kitchen_wood). */
const PHOTO = "/textures/pizza/";
function loadPhoto(file: string, color: boolean, repeat = false): Promise<THREE.Texture> {
  return new THREE.TextureLoader().loadAsync(PHOTO + file).then((t) => {
    t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}

/** Real wood board (mid/ultra). Falls back to the procedural board if any file fails. */
async function photoBoard(): Promise<TextureSet> {
  const [map, normal, orm] = await Promise.all([loadPhoto("board-map.webp", true), loadPhoto("board-normal.webp", false), loadPhoto("board-orm.webp", false)]);
  return { tex: { map, normal, orm } };
}

const damp = (cur: number, tgt: number, lambda: number, dt: number) => cur + (tgt - cur) * (1 - Math.exp(-lambda * dt));
const easeOutBack = (t: number) => {
  const c1 = 1.6, c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

type ToppingRuntime = {
  id: string;
  mesh: THREE.InstancedMesh | null;
  place: Placement;
  shown: Float32Array;
  target: Uint8Array;
  start: Float32Array;
  h: number;
  layer: number;
  stretch: [number, number, number];
};

/** Food-studio reflections (softbox, rim strip, warm bounce), generated once on the GPU (no file download). */
function StudioLight() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const rt = studioEnvironment(gl);
    scene.environment = rt.texture;
    scene.environmentIntensity = 0.8;
    return () => {
      scene.environment = null;
      rt.dispose();
    };
  }, [gl, scene]);
  return null;
}

/**
 * Dense polar grid (radius 1, lying flat) with the same UVs as a rotated CircleGeometry,
 * so the sauce height map can push real relief into it (ULTRA).
 */
function polarDisc(rings: number, segs: number) {
  const pos: number[] = [0, 0, 0], uv: number[] = [0.5, 0.5], idx: number[] = [];
  for (let k = 1; k <= rings; k++) {
    const r = k / rings;
    for (let i = 0; i < segs; i++) {
      const t = (i / segs) * Math.PI * 2;
      const x = r * Math.cos(t), z = r * Math.sin(t);
      pos.push(x, 0, z);
      uv.push((x + 1) / 2, (1 - z) / 2);
    }
  }
  for (let i = 0; i < segs; i++) idx.push(0, 1 + ((i + 1) % segs), 1 + i);
  for (let k = 0; k < rings - 1; k++) {
    const a0 = 1 + k * segs, b0 = 1 + (k + 1) * segs;
    for (let i = 0; i < segs; i++) {
      const i1 = (i + 1) % segs;
      idx.push(a0 + i, a0 + i1, b0 + i, a0 + i1, b0 + i1, b0 + i);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Bends a flat leaf plane into a V-fold with a curled tip. */
function basilGeometry() {
  const g = new THREE.PlaneGeometry(0.32, 0.18, 10, 4);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const u = (x + 0.16) / 0.32;
    p.setZ(i, 0.14 * Math.abs(y) + 0.06 * (u - 0.5) ** 2 + 0.015 * Math.sin(u * 3.1));
  }
  g.computeVertexNormals();
  return g.rotateX(-Math.PI / 2);
}

function Pizza({ tier, reducedMotion, onReady, onDowngrade, bundle, upgrade, detail }: Pick<SceneProps, "tier" | "reducedMotion" | "onReady" | "onDowngrade"> & { bundle: TexBundle; upgrade: TexBundle | null; detail: Detail }) {
  const lowTier = tier === "low";
  const shadows = !lowTier;
  const size = useByoStore((s) => s.size);
  const sauce = useByoStore((s) => s.sauce);
  const crust = useByoStore((s) => s.crust);
  const toppings = useByoStore((s) => s.toppings);
  const invalidate = useThree((s) => s.invalidate);

  // Detail tiers: desktop gets a smooth high-res crust shell; weak devices stay light.
  const seg = lowTier ? 96 : 256;
  const ptsN = lowTier ? 26 : 44;

  const sel = useRef({ size, sauce, crust, toppings });
  sel.current = { size, sauce, crust, toppings };

  // ---------- one-time resources ----------
  const res = useMemo(() => {
    const t0 = performance.now();
    const crust0 = CRUSTS_3D[useByoStore.getState().crust];
    const rs = resampleProfile(new Float32Array(crust0.pts.flat()), ptsN);
    const lathe = new THREE.LatheGeometry(Array.from({ length: ptsN }, (_, k) => new THREE.Vector2(rs[k * 3], rs[k * 3 + 1])), seg);
    // Top surface: one blended sauce + cheese surface. Mid/ultra get a dense grid with real height
    // (sauce chunks + melted cheese); low gets a light flat disc with the same shading.
    const relief = !lowTier;
    const disc = tier === "ultra" ? polarDisc(96, 320) : relief ? polarDisc(64, 192) : new THREE.CircleGeometry(1, 72).rotateX(-Math.PI / 2);
    const shadowGeo = new THREE.CircleGeometry(1.35, 32).rotateX(-Math.PI / 2);
    const top = bundle.top.tex;
    const crustTex = bundle.crust;
    const ct = crustTex.get(useByoStore.getState().crust) ?? crustTex.values().next().value!;
    const crustMat = lowTier
      ? new THREE.MeshStandardMaterial({ map: ct.map, roughness: 0.8, ...detailMaps(ct, 2.2) })
      : new THREE.MeshPhysicalMaterial({
          map: ct.map, roughness: 0.8, ...detailMaps(ct, 2.2),
          sheen: 0.3, sheenRoughness: 0.8, sheenColor: new THREE.Color("#fff3e0"), // flour dust at grazing angles
        });
    if (!lowTier) {
      wrapSSS(crustMat, { wrap: 0.2, width: 0.3, back: 0.15, color: "#e07a3a" }); // dry crust: subtle
      withMicroDetail(crustMat, { freq: 120, amp: 0.5, rough: 0.1 }); // dough pores
    }
    const st = useByoStore.getState();
    const surfMat = lowTier
      ? new THREE.MeshStandardMaterial({ map: top.tomato, roughness: 1, ...detailMaps(top, 1.6) })
      : new THREE.MeshPhysicalMaterial({
          map: top.tomato, roughness: 1, ...detailMaps(top, 1.6),
          displacementMap: top.bump, displacementScale: 0.012, displacementBias: -0.006,
          clearcoat: 1, clearcoatRoughness: 0.06, // masked per pixel to oil only
        });
    // Contact shadows under every topping, repainted (in the worker) when the selection changes.
    const occTex = bundle.occ;
    withOcclusion(surfMat, occTex);
    const surf = withCheeseSurface(surfMat, {
      field: bundle.cheese.tex.field, detail: bundle.cheese.tex.detail, bbq: top.bbq, photo: bundle.photoCheese,
      lift: relief ? 0.022 : 0, extra: st.toppings.includes("double-cheese") ? 1 : 0, sauceMix: st.sauce === "bbq" ? 1 : 0,
    });
    if (!lowTier) {
      wrapSSS(surfMat, { wrap: 0.5, width: 0.3, back: 0.6, color: "#ff9a4a", weight: "gSSS" }); // light glows through thin cheese only
      withMicroDetail(surfMat, { freq: 70, amp: 0.8, rough: 0.2 }); // pulp + cheese bubbles
    }
    const shadowTex = bundle.toppings.tex.shadow;
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const basilGeo = basilGeometry();
    const basilTex = bundle.toppings.tex.basil;
    const basilMat = new THREE.MeshStandardMaterial({ map: basilTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.3 });
    if (!lowTier) wrapSSS(basilMat, { wrap: 0.4, width: 0.3, back: 0.8, color: "#7ab03a" });
    // Wooden serving board (static, does not spin).
    const board = bundle.board.tex;
    const boardGeo = new THREE.CylinderGeometry(1.08, 1.1, 0.05, 96);
    const boardMat = lowTier
      ? new THREE.MeshLambertMaterial({ map: board.map })
      : new THREE.MeshStandardMaterial({ map: board.map, roughness: 0.72, ...detailMaps(board, 1.2) });

    const tops: ToppingRuntime[] = Object.entries(TOPPINGS_3D).map(([id, spec]) => {
      const place = placementOf(id);
      const n = place.x.length;
      return {
        id, mesh: null, place, h: spec.h, layer: TOPPING_LAYER[id], stretch: spec.stretch ?? [1, 1, 1],
        shown: new Float32Array(n), target: new Uint8Array(n), start: new Float32Array(n),
      };
    });
    const geos = Object.fromEntries(Object.entries(TOPPINGS_3D).map(([id, s]) => [id, s.geo()]));
    const mats = Object.fromEntries(
      Object.entries(TOPPINGS_3D).map(([id, s]) => {
        const map = s.tex ? bundle.toppings.tex[s.tex] : null;
        // Low tier: Lambert (much smaller shader = faster compile + cheaper pixels on weak GPUs).
        const vertexColors = !!geos[id].attributes.color;
        const m = lowTier
          ? new THREE.MeshLambertMaterial({ flatShading: !!s.flat, map, vertexColors })
          : new THREE.MeshStandardMaterial({ flatShading: !!s.flat, roughness: s.roughness ?? 0.6, map, vertexColors });
        m.shadowSide = THREE.DoubleSide; // thin slices: avoid shadow leaks
        return [id, m];
      }),
    );
    // Mid/ultra: specular anti-aliasing (no sparkling oil highlights) + crevice micro-shadows from the AO map.
    if (!lowTier) {
      [crustMat, surfMat, boardMat, basilMat, ...Object.values(mats)].forEach((m) => withRealismPatches(m));
    }
    const textures: THREE.Texture[] = [...Object.values(top), ...Object.values(board), ...Object.values(bundle.toppings.tex), ...Object.values(bundle.cheese.tex), occTex, ...(bundle.photoCheese ? [bundle.photoCheese] : [])];
    if (process.env.NODE_ENV !== "production") {
      const w = window as unknown as { __pizzaBuildMs?: number };
      w.__pizzaBuildMs = Math.round(performance.now() - t0);
      console.info(`[pizza3d] tier=${tier} scene build ${w.__pizzaBuildMs} ms`);
    }
    return {
      lathe, disc, shadowGeo, crustMat, surfMat, surf, shadowMat,
      basilGeo, basilMat, tops, geos, mats, textures, crustTex, occTex, boardGeo, boardMat,
      noise: rimNoise(seg), round: roundNoise(seg), rs,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- built once per mounted bundle
  }, [seg, ptsN, lowTier, bundle]);

  useEffect(
    () => () => {
      [res.lathe, res.disc, res.shadowGeo, res.basilGeo, res.boardGeo].forEach((g) => g.dispose());
      [res.crustMat, res.surfMat, res.shadowMat, res.basilMat, res.boardMat].forEach((m) => m.dispose());
      res.textures.forEach((t) => t.dispose());
      res.crustTex.forEach((t) => {
        [t.map, t.bump, t.normal, t.orm].forEach((x) => x?.dispose());
      });
      Object.values(res.geos).forEach((g) => g.dispose());
      Object.values(res.mats).forEach((m) => m.dispose());
    },
    [res],
  );

  // Repaint contact shadows under toppings (uses target layout, not mid-animation positions).
  const occFirst = useRef(true);
  useEffect(() => {
    if (occFirst.current) {
      occFirst.current = false; // the bundle already holds this selection's occlusion
      return;
    }
    let alive = true;
    repaintInto(res.occTex, { kind: "occ", S: detail.occ, spots: occSpots(toppings, size) }, "occ").then(() => alive && invalidate());
    return () => {
      alive = false;
    };
  }, [toppings, size, res, invalidate, detail.occ]);

  // ULTRA safety net: if the first ~45 frames average slower than ~45 fps, drop to MID.
  // Samples skip paused frames (hidden tab / offscreen) and use the median, so a tab switch never triggers it.
  const perf = useRef({ samples: [] as number[], done: tier !== "ultra" });

  // Swap the crust texture when the crust type changes (geometry morphs in useFrame).
  const heightRef = useRef<HeightField>(res.crustTex.values().next().value!.height);

  // Progressive load: once the full-detail textures are painted (phase B), upload them to the GPU one per tick
  // (no hitch), then swap them into the existing materials. No rebuild, no recompile, toppings don't re-drop.
  const glUp = useThree((s) => s.gl);
  useEffect(() => {
    if (!upgrade) return;
    let alive = true;
    (async () => {
      const crusts = [...upgrade.crust.values()];
      const fresh: THREE.Texture[] = [
        ...Object.values(upgrade.top.tex), ...Object.values(upgrade.board.tex), ...Object.values(upgrade.toppings.tex),
        ...Object.values(upgrade.cheese.tex), ...crusts.flatMap((c) => [c.map, c.normal, c.orm].filter((t): t is THREE.Texture => !!t)),
      ];
      for (const t of fresh) {
        if (!alive) return;
        glUp.initTexture(t);
        await new Promise((r) => setTimeout(r, 0));
      }
      if (!alive) return;
      const old: THREE.Texture[] = [];
      const swap = <K extends string>(m: Partial<Record<K, THREE.Texture | null>>, k: K, t: THREE.Texture | undefined) => {
        if (!t) return;
        const prev = m[k];
        if (prev && prev !== t) old.push(prev);
        m[k] = t;
      };
      const top = upgrade.top.tex;
      const sm = res.surfMat as THREE.MeshStandardMaterial;
      swap(sm, "map", top.tomato);
      if (sm.normalMap) swap(sm, "normalMap", top.normal);
      if (sm.roughnessMap) swap(sm, "roughnessMap", top.orm ?? top.rough);
      if (sm.aoMap) swap(sm, "aoMap", top.orm);
      if (sm.displacementMap) swap(sm, "displacementMap", top.bump);
      const su = res.surf as unknown as Record<string, { value: THREE.Texture | null }>;
      su.uBbq.value = top.bbq;
      su.uField.value = upgrade.cheese.tex.field;
      su.uDetail.value = upgrade.cheese.tex.detail;
      for (const [id, c] of upgrade.crust) res.crustTex.set(id, c);
      const cur = res.crustTex.get(sel.current.crust as CrustId);
      if (cur) {
        setCrustMaps(res.crustMat, cur);
        heightRef.current = cur.height;
        if (anim.current) anim.current.crustId = ""; // re-shape blisters from the sharper height map
      }
      const bm = res.boardMat as THREE.MeshStandardMaterial;
      swap(bm, "map", upgrade.board.tex.map);
      if (bm.normalMap) swap(bm, "normalMap", upgrade.board.tex.normal);
      if (bm.roughnessMap) swap(bm, "roughnessMap", upgrade.board.tex.orm);
      if (bm.aoMap) swap(bm, "aoMap", upgrade.board.tex.orm);
      for (const [id, spec] of Object.entries(TOPPINGS_3D)) {
        if (spec.tex) swap(res.mats[id] as THREE.MeshStandardMaterial, "map", upgrade.toppings.tex[spec.tex]);
      }
      swap(res.basilMat, "map", upgrade.toppings.tex.basil);
      swap(res.shadowMat, "map", upgrade.toppings.tex.shadow);
      res.textures.push(...fresh);
      old.forEach((t) => t.dispose()); // free the quick low-detail textures' GPU memory
      if (process.env.NODE_ENV !== "production") console.info(`[pizza3d] full detail swapped in at ${Math.round(performance.now())} ms`);
      invalidate();
    })();
    return () => {
      alive = false;
    };
  }, [upgrade, res, glUp, invalidate]);
  useEffect(() => {
    let alive = true;
    const apply = (t: CrustTex) => {
      setCrustMaps(res.crustMat, t);
      res.crustMat.needsUpdate = true;
      heightRef.current = t.height;
      if (anim.current) anim.current.crustId = ""; // rebuild blisters from the new height map
      invalidate();
    };
    const cached = res.crustTex.get(crust);
    if (cached) apply(cached);
    else
      paint({ kind: "crust", crust, w: detail.strip }).then((t) => {
        const c = asCrust(t);
        res.crustTex.set(crust, c);
        if (alive && sel.current.crust === crust) apply(c);
      });
    return () => {
      alive = false;
    };
  }, [crust, res, detail.strip, invalidate]);

  // Preload the other crust types in the worker, so switching is instant. Waits until the full-detail
  // textures are in (mid/ultra), so it never competes with the first paints for workers.
  useEffect(() => {
    if (!upgrade && tier !== "low") return;
    let alive = true;
    (async () => {
      for (const id of Object.keys(CRUSTS_3D) as CrustId[]) {
        if (!alive) return;
        if (res.crustTex.has(id)) continue;
        const t = await paint({ kind: "crust", crust: id, w: detail.strip });
        if (alive && !res.crustTex.has(id)) res.crustTex.set(id, asCrust(t));
      }
    })();
    return () => {
      alive = false;
    };
  }, [res, detail.strip, upgrade, tier]);

  // ---------- animated state ----------
  const anim = useRef<{ prof: Float32Array; rimAmp: number; scale: number; tScale: number; extra: number; time: number; first: boolean; crustId: string } | null>(null);
  if (!anim.current) {
    const s = useByoStore.getState();
    const c = CRUSTS_3D[s.crust];
    anim.current = {
      prof: new Float32Array(c.pts.flat()), rimAmp: c.rimAmp, scale: sizeScale(s.size), tScale: toppingScale(s.size),
      extra: s.toppings.includes("double-cheese") ? 1 : 0, time: 0, first: true, crustId: s.crust,
    };
  }

  const pizza = useRef<THREE.Group>(null);
  const topGroup = useRef<THREE.Group>(null);
  const basil = useRef<THREE.InstancedMesh>(null);
  const spin = useRef({ angle: -0.6, vel: 0, dragging: false, lastX: 0, idleAt: 0, spinUntil: performance.now() / 1000 + SPIN_SECONDS });
  const idleTimer = useRef(0);
  const lastPaced = useRef(false);
  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  // Any change: render again and show it off with a short spin.
  useEffect(() => {
    spin.current.spinUntil = performance.now() / 1000 + SPIN_SECONDS;
    invalidate();
  }, [size, sauce, crust, toppings, invalidate]);

  // Drag to rotate (horizontal only, so vertical page scroll still works on phones).
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "pan-y";
    el.style.cursor = "grab";
    const sp = spin.current;
    const down = (e: PointerEvent) => {
      sp.dragging = true; sp.lastX = e.clientX; sp.vel = 0;
      el.style.cursor = "grabbing";
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!sp.dragging) return;
      const dx = e.clientX - sp.lastX;
      sp.lastX = e.clientX;
      sp.angle += dx * 0.012;
      sp.vel = dx * 0.012 * 60;
      invalidate();
    };
    const up = () => {
      sp.dragging = false;
      sp.idleAt = performance.now() / 1000 + 2.5;
      sp.spinUntil = sp.idleAt + SPIN_SECONDS;
      el.style.cursor = "grab";
      invalidate();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl, invalidate]);

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), s: new THREE.Vector3() }), []);

  useFrame((state, rawDt) => {
    const a = anim.current!;
    const { size: sz, sauce: sc, crust: cr, toppings: tp } = sel.current;
    const dt = Math.min(rawDt, 1 / 20);
    const snap = reducedMotion || a.first;
    a.time += dt;
    let moving = false;
    let spinning = false; // only the idle spin wants frames (paced, not full rate)
    const track = (cur: number, tgt: number, l: number) => {
      const v = damp(cur, tgt, snap ? Infinity : l, dt);
      if (Math.abs(tgt - v) > 1e-4) {
        moving = true;
        return v;
      }
      return tgt;
    };

    // Crust profile morph.
    const target = CRUSTS_3D[cr as CrustId];
    // A new crust type also brings new blisters (from its height map), so rebuild once even if the shape matches.
    let crustMoved = a.first || a.crustId !== cr;
    a.crustId = cr;
    for (let j = 0; j < P; j++) {
      for (let k = 0; k < 2; k++) {
        const idx = j * 2 + k;
        const v = track(a.prof[idx], target.pts[j][k], 9);
        if (v !== a.prof[idx]) crustMoved = true;
        a.prof[idx] = v;
      }
    }
    const rimAmp = track(a.rimAmp, target.rimAmp, 9);
    if (rimAmp !== a.rimAmp) crustMoved = true;
    a.rimAmp = rimAmp;
    if (crustMoved) writeCrust(res.lathe, a.prof, a.rimAmp, res.noise, res.round, seg, ptsN, res.rs, heightRef.current);

    const baseTop = a.prof[(P - 1) * 2 + 1];
    const sauceR = a.prof[10 * 2];

    // Size.
    a.scale = track(a.scale, sizeScale(sz as SizeId), 8);
    a.tScale = track(a.tScale, toppingScale(sz as SizeId), 8);
    pizza.current!.scale.setScalar(a.scale);

    // Sauce + cheese layer follows the crust.
    const tg = topGroup.current!;
    tg.position.y = baseTop + 0.003;
    tg.scale.set(sauceR, 1, sauceR);

    // Sauce crossfade (BBQ disc fades over the tomato one).
    const su = res.surf;
    su.uSauceMix.value = track(su.uSauceMix.value, sc === "bbq" ? 1 : 0, 7);

    // Double cheese: extra pools rise out of the sauce.
    a.extra = track(a.extra, tp.includes("double-cheese") ? 1 : 0, 7);
    su.uExtra.value = a.extra; // the melt field grows and merges

    // Basil garnish sits on top of the cheese.
    if (crustMoved || a.first) {
      const b = basil.current!;
      BASIL.forEach(([x, z, rot], i) => {
        tmp.e.set(0.12, rot, 0.08);
        tmp.q.setFromEuler(tmp.e);
        tmp.p.set(x * sauceR, baseTop + 0.03, z * sauceR);
        tmp.s.setScalar(1);
        tmp.m.compose(tmp.p, tmp.q, tmp.s);
        b.setMatrixAt(i, tmp.m);
      });
      b.instanceMatrix.needsUpdate = true;
    }

    // Toppings.
    const now = a.time;
    const yBase = baseTop + 0.018; // toppings press into the cheese instead of floating
    for (const t of res.tops) {
      const mesh = t.mesh;
      if (!mesh) continue;
      const on = tp.includes(t.id);
      const n = toppingCount(TOPPINGS_3D[t.id].n12, sz as SizeId);
      let stagger = 0;
      let last = -1;
      let changed = crustMoved || a.scale !== sizeScale(sz as SizeId);
      for (let i = 0; i < t.shown.length; i++) {
        const want = on && i < n ? 1 : 0;
        if (want !== t.target[i]) {
          t.target[i] = want;
          t.start[i] = now + (want ? stagger++ * 0.025 : 0);
        }
        let v = t.shown[i];
        if (reducedMotion) v = want; // first load still drops toppings in
        else if (now >= t.start[i] && v !== want) v = want ? Math.min(1, v + dt / 0.45) : Math.max(0, v - dt / 0.2);
        if (v !== want) moving = true;
        if (v !== t.shown[i]) changed = true;
        t.shown[i] = v;
        if (v > 0) last = i;
      }
      if (!changed && !a.first) continue;
      const pl = t.place;
      for (let i = 0; i <= last; i++) {
        const v = t.shown[i];
        const grow = t.target[i] ? easeOutBack(v) : v;
        const drop = t.target[i] ? (1 - v) ** 3 * 0.5 : 0;
        const k = Math.max(0, grow) * pl.scale[i] * a.tScale;
        tmp.e.set(pl.tiltX[i], pl.rot[i], pl.tiltZ[i]);
        tmp.q.setFromEuler(tmp.e);
        tmp.p.set(pl.x[i] * sauceR, yBase + t.layer * 0.0025 + t.h * k * 0.7 + drop, pl.z[i] * sauceR);
        tmp.s.set(k * t.stretch[0], k * t.stretch[1], k * t.stretch[2]);
        tmp.m.compose(tmp.p, tmp.q, tmp.s);
        mesh.setMatrixAt(i, tmp.m);
      }
      mesh.count = last + 1;
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Rotation: drag inertia, then a slow idle spin.
    const sp = spin.current;
    if (!sp.dragging) {
      if (Math.abs(sp.vel) > 0.01 && !reducedMotion) {
        sp.angle += sp.vel * dt;
        sp.vel *= Math.exp(-4 * dt);
        moving = true;
      } else sp.vel = 0;
      const nowS = performance.now() / 1000;
      if (!lowTier && !reducedMotion && nowS > sp.idleAt && nowS < sp.spinUntil) {
        sp.angle += SPIN_SPEED * dt;
        spinning = true;
      }
    }
    pizza.current!.rotation.y = sp.angle;

    if (a.first) {
      a.first = false;
      onReady();
    } else if (!perf.current.done) {
      const pf = perf.current;
      if (!document.hidden && !lastPaced.current && rawDt > 0 && rawDt < 0.1) pf.samples.push(rawDt);
      if (pf.samples.length >= 45) {
        pf.done = true;
        const sorted = [...pf.samples].sort((x, y) => x - y);
        if (sorted[sorted.length >> 1] > 0.022) onDowngrade();
      }
    }
    if (moving) {
      lastPaced.current = false;
      state.invalidate();
    } else if (spinning && !idleTimer.current) {
      lastPaced.current = true;
      idleTimer.current = window.setTimeout(() => {
        idleTimer.current = 0;
        state.invalidate();
      }, IDLE_FRAME_MS);
    }
  });

  return (
    <>
      {/* Board top sits just under the pizza (y = -0.004). */}
      <mesh geometry={res.boardGeo} material={res.boardMat} position-y={-0.029} receiveShadow={shadows} />
      <group ref={pizza}>
      <mesh geometry={res.shadowGeo} material={res.shadowMat} position-y={-0.002} renderOrder={-1} />
      <mesh geometry={res.lathe} material={res.crustMat} castShadow={shadows} receiveShadow={shadows} />
      <group ref={topGroup}>
        <mesh geometry={res.disc} material={res.surfMat} receiveShadow={shadows} />
      </group>
      <instancedMesh ref={basil} args={[res.basilGeo, res.basilMat, BASIL.length]} frustumCulled={false} castShadow={shadows} />
      {res.tops.map((t) => (
        <instancedMesh
          key={t.id}
          ref={(m) => {
            t.mesh = m;
            if (m && !m.instanceColor) {
              t.place.color.forEach((c, i) => m.setColorAt(i, c));
              m.count = 0;
            }
          }}
          args={[res.geos[t.id], res.mats[t.id], t.shown.length]}
          frustumCulled={false}
          castShadow={shadows}
        />
      ))}
      </group>
    </>
  );
}


/** Rim weight along the profile (t in original point units): 1 on the cornicione, fading out. */
const rimWeight = (t: number) => Math.min(1, Math.max(0, Math.min(t - (RIM_FIRST - 1), RIM_LAST + 0.5 - t)));

/**
 * Writes the lathe from the current profile: smooth resample, lumpy rim, slightly out of round,
 * and real blisters pushed out along the surface normal from the crust's height map.
 */
function writeCrust(
  geo: THREE.LatheGeometry, prof: Float32Array, rimAmp: number, noise: Float32Array, round: Float32Array,
  seg: number, n: number, rs: Float32Array, hf: HeightField,
) {
  resampleProfile(prof, n, rs);
  const pos = geo.attributes.position.array as Float32Array;
  const baseTop = prof[(P - 1) * 2 + 1];
  for (let i = 0; i <= seg; i++) {
    const phi = (i / seg) * TAU;
    const s = Math.sin(phi), co = Math.cos(phi);
    const nz = noise[i];
    const ro = round[i];
    const hx = Math.min(hf.w - 1, Math.round((i / seg) * (hf.w - 1)));
    for (let k = 0; k < n; k++) {
      const t = rs[k * 3 + 2];
      const w = rimWeight(t);
      let x = rs[k * 3], y = rs[k * 3 + 1];
      // Profile normal (outward) from neighbours, for blister displacement.
      const k0 = Math.max(0, k - 1), k1 = Math.min(n - 1, k + 1);
      let tx = rs[k1 * 3] - rs[k0 * 3], ty = rs[k1 * 3 + 1] - rs[k0 * 3 + 1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      if (w > 0) {
        y = baseTop + (y - baseTop) * (1 + rimAmp * nz * w);
        x += 0.012 * rimAmp * nz * w;
        const hy = Math.min(hf.h - 1, Math.round((1 - t / (P - 1)) * (hf.h - 1)));
        const d = (hf.data[hy * hf.w + hx] - 0.5) * 0.03 * w;
        x += ty * d;
        y += -tx * d;
      }
      if (t >= 2.5 && t <= 9.5) x *= ro;
      const idx = (i * n + k) * 3;
      pos[idx] = x * s;
      pos[idx + 1] = y;
      pos[idx + 2] = x * co;
    }
  }
  geo.attributes.position.needsUpdate = true;
  geo.computeVertexNormals();
  const nrm = geo.attributes.normal.array as Float32Array;
  for (let k = 0; k < n; k++) {
    const a = k * 3, b = (seg * n + k) * 3;
    for (let c = 0; c < 3; c++) nrm[a + c] = nrm[b + c] = (nrm[a + c] + nrm[b + c]) / 2;
  }
  geo.attributes.normal.needsUpdate = true;
  geo.computeBoundingSphere();
}

/** Stops/starts rendering when the canvas leaves/enters the screen. */
function Visibility({ active }: { active: boolean }) {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    setFrameloop(active ? "demand" : "never");
    if (active) invalidate();
  }, [active, setFrameloop, invalidate]);
  return null;
}

/**
 * Warm-up before the first frame, so weak phones never freeze:
 * 1. compile every shader in parallel where supported (KHR_parallel_shader_compile);
 * 2. upload the painted canvas textures to the GPU one per tick (a single big first-frame upload blocked ~270 ms).
 * Rendering stays paused (frameloop "never") until this finishes.
 */
function ShaderWarmup({ onDone }: { onDone: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    let alive = true;
    const t0 = performance.now();
    const textures = new Set<THREE.Texture>();
    scene.traverse((o) => {
      const mats = (o as THREE.Mesh).material;
      if (!mats) return;
      for (const m of Array.isArray(mats) ? mats : [mats]) {
        for (const v of Object.values(m)) if (v instanceof THREE.Texture) textures.add(v);
      }
    });
    const tick = () => new Promise<void>((r) => setTimeout(r, 0));
    (async () => {
      await gl.compileAsync(scene, camera).catch(() => undefined);
      for (const t of textures) {
        if (!alive) return;
        gl.initTexture(t);
        await tick();
      }
      if (!alive) return;
      if (process.env.NODE_ENV !== "production") {
        console.info(`[pizza3d] warm-up ${Math.round(performance.now() - t0)} ms (${textures.size} textures)`);
      }
      onDone();
    })();
    return () => {
      alive = false;
    };
  }, [gl, scene, camera, onDone]);
  return null;
}

/** Keeps the whole pizza in frame on narrow cards (phones): steps the camera back as the aspect ratio shrinks. */
function CameraFit() {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const k = Math.min(1.5, Math.max(1, 1.9 / (width / Math.max(1, height))));
    camera.position.set(0, 2.43 * k, 3.32 * k); // long lens (~fov 16): food-photo compression
    camera.lookAt(0, 0, 0.06);
    invalidate();
  }, [camera, width, height, invalidate]);
  return null;
}

/** Without the post stack, the renderer itself tone-maps (the composer switches it off while active). */
function RendererLook({ ultra }: { ultra: boolean }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    if (!ultra) {
      gl.toneMapping = THREE.NeutralToneMapping;
      gl.toneMappingExposure = 1.05;
    }
    // HDR white (above 1) so it still lands on pure white after the tone-mapping pass.
    scene.background = ultra ? new THREE.Color(3, 3, 3) : null;
  }, [ultra, gl, scene]);
  return null;
}

export default function PizzaScene({ tier, reducedMotion, active, onReady, onFail, onDowngrade }: SceneProps) {
  const lowTier = tier === "low";
  const ultra = tier === "ultra";
  const [warm, setWarm] = useState(false);
  const onWarm = useCallback(() => setWarm(true), []);
  // Texture detail is fixed by the first tier (an ULTRA -> MID downgrade keeps the textures already made).
  const [detail] = useState<Detail>(() => DETAIL[tier]);
  const [bundle, setBundle] = useState<TexBundle | null>(null);
  const [upgrade, setUpgrade] = useState<TexBundle | null>(null);
  const failRef = useRef(onFail);
  failRef.current = onFail;
  const tierRef = useRef(tier);
  useEffect(() => {
    let alive = true;
    const s = useByoStore.getState();
    const t0 = performance.now();
    const aniso = ANISOTROPY[tierRef.current];
    const photo = loadPhoto("cheese-detail.webp", false, true).catch(() => null); // 7 KB CC0 browning tile; optional
    const build = (d: Detail, board: Promise<TextureSet>) =>
      Promise.all([
        paint({ kind: "top", S: d.top, pools: BASE_POOLS }),
        paint({ kind: "crust", crust: s.crust, w: d.strip }),
        board,
        paint({ kind: "toppings", scale: d.topping }),
        paint({ kind: "occ", S: d.occ, spots: occSpots(s.toppings, s.size) }),
        paint({ kind: "cheese", S: d.cheese, base: BASE_POOLS, extra: EXTRA_POOLS }),
        photo,
      ]).then(([top, crust, boardSet, toppings, occ, cheese, photoCheese]): TexBundle => {
        for (const set of [top, boardSet, crust, toppings, cheese]) for (const t of Object.values(set.tex)) t.anisotropy = aniso;
        if (photoCheese) photoCheese.anisotropy = aniso;
        return { top, board: boardSet, toppings, occ: occ.tex.occ, cheese, photoCheese, crust: new Map([[s.crust, asCrust(crust)]]) };
      });

    // Phase A: quick low-detail textures (procedural board, no download) -> pizza shows almost at once.
    // The contact-occlusion map keeps its final size: it is repainted in place later.
    const low = tierRef.current === "low";
    const quick: Detail = low ? detail : { ...DETAIL.low, cheese: 256, occ: detail.occ }; // quick preview: small cheese field too
    build(quick, paint({ kind: "board", S: quick.board }))
      .then((b) => {
        if (!alive) return;
        if (process.env.NODE_ENV !== "production") console.info(`[pizza3d] quick textures in ${Math.round(performance.now() - t0)} ms`);
        setBundle(b);
        if (low) return;
        // Phase B (mid/ultra): full detail + the real wood board, painted after phase A so A gets the whole worker pool.
        return build(detail, photoBoard().catch(() => paint({ kind: "board", S: detail.board }))).then((hb) => {
          if (!alive) return;
          if (process.env.NODE_ENV !== "production") console.info(`[pizza3d] full-detail textures in ${Math.round(performance.now() - t0)} ms`);
          setUpgrade(hb);
        });
      })
      .catch(() => alive && failRef.current());
    return () => {
      alive = false;
    };
  }, [detail]);
  return (
    <Canvas
      frameloop="never"
      dpr={lowTier ? 1 : [1, 1.5]} // 2x Retina would be ~1.8x the pixels for little visible gain in a small card
      shadows={lowTier ? false : "percentage"}
      gl={{ antialias: !ultra, powerPreference: "default", stencil: false, alpha: true }}
      camera={{ fov: 16, position: [0, 2.43, 3.32], near: 0.5, far: 20 }}
      onCreated={({ camera, gl }) => {
        // Dev only: expose the renderer so polygon / draw-call counts can be checked in the console.
        if (process.env.NODE_ENV !== "production") (window as unknown as { __pizzaGL?: THREE.WebGLRenderer }).__pizzaGL = gl;
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
        camera.lookAt(0, 0.0, 0.06); // ~36 deg down, long lens: food-photo angle
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFail();
        });
      }}
      aria-hidden="true"
    >
      <Visibility active={active && warm} />
      <StudioLight />
      <hemisphereLight args={["#fff3e3", "#4a2e1c", 0.25]} />
      {/* Warm key light front-left, rim light back-right to catch the crust crest and cheese edges. */}
      <directionalLight
        color="#ffe0b5" intensity={3.2} position={[-3, 1.8, 0.6]} // raking side key: shows crust blisters
        castShadow={!lowTier}
        shadow-mapSize={ultra ? [2048, 2048] : [1024, 1024]}
        shadow-radius={ultra ? 5 : 3}
        shadow-bias={-0.0004}
        shadow-normalBias={0.006}
        shadow-camera-left={-1.6} shadow-camera-right={1.6} shadow-camera-top={1.6} shadow-camera-bottom={-1.6}
        shadow-camera-near={1} shadow-camera-far={7}
      />
      {/* Back rim (10-2 o'clock behind): oil glints and glowing thin cheese edges. */}
      <directionalLight color="#ffd29a" intensity={1.8} position={[1.5, 1.2, -3]} />
      <RendererLook ultra={ultra} />
      <CameraFit />
      {bundle && (
        <>
          <Pizza tier={tier} reducedMotion={reducedMotion} onReady={onReady} onDowngrade={onDowngrade} bundle={bundle} upgrade={upgrade} detail={detail} />
          <ShaderWarmup onDone={onWarm} />
        </>
      )}
      {ultra && (
        <Suspense fallback={null}>
          <PizzaPost />
        </Suspense>
      )}
    </Canvas>
  );
}
