/**
 * Texture job dispatcher, shared by the Web Worker and the main-thread fallback.
 * Each surface has its own painter module (paint-*.ts); this file only routes jobs and holds tiny helpers.
 */
import type { CrustId } from "@/lib/byo-data";
import type { Pool } from "./pizza-cheese";
import { canvas, radial } from "./paint-util";
import type { AnyCanvas } from "./paint-util";
import { paintCrust } from "./paint-crust";
import { paintTopMaps } from "./paint-top";
import { paintCheeseDetail, paintCheeseField } from "./paint-cheese-field";
import { paintBoard } from "./paint-board";
import { basilTexture, chilliTex, greenPepperTex, hamTex, jalapenoTex, mushroomTex, oliveTex, pepperoniTexture, redOnionTex, tomatoTex } from "./paint-toppings";

export type { AnyCanvas } from "./paint-util";
export { canvas } from "./paint-util";
export { CAP_R, MUSH_E } from "./paint-toppings";

// ---------- soft blob shadow + painted contact occlusion ----------

export function paintShadow() {
  const [c, x] = canvas(128);
  radial(x, 64, 64, 64, [[0, "rgba(40,20,10,0.55)"], [0.7, "rgba(40,20,10,0.25)"], [1, "rgba(40,20,10,0)"]]);
  return c;
}


export type OccSpot = { x: number; z: number; r: number; strength: number };

/** Soft dark spots under toppings/cheese (top-down disc space: x,z in [-1,1]) on white. */
export function paintOcclusion(S: number, spots: OccSpot[]) {
  const [c, ctx] = canvas(S);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, S, S);
  ctx.globalCompositeOperation = "multiply";
  for (const s of spots) {
    const a = s.strength;
    radial(ctx, (S / 2) * (1 + s.x), (S / 2) * (1 + s.z), s.r * (S / 2), [
      [0, `rgba(70,40,30,${0.6 * a})`], [0.6, `rgba(140,100,90,${0.3 * a})`], [1, "rgba(255,255,255,0)"],
    ]);
  }
  ctx.globalCompositeOperation = "source-over";
  return c;
}




// ---------- jobs (shared by the worker and the main-thread fallback) ----------

export type ToppingTexKey =
  | "mushroom" | "tomatoSlice" | "jalapeno" | "ham" | "pepperoni" | "basil" | "olive" | "greenPepper" | "redOnion" | "chilli";

export type PaintJob =
  | { kind: "top"; S: number; pools: Pool[] }
  | { kind: "crust"; crust: CrustId; w: number }
  | { kind: "board"; S: number }
  | { kind: "toppings"; scale: number }
  | { kind: "occ"; S: number; spots: OccSpot[] }
  | { kind: "cheese"; S: number; base: Pool[]; extra: Pool[] };

export type HeightField = { w: number; h: number; data: Float32Array };
export type PaintResult = { canvases: Record<string, AnyCanvas>; height?: HeightField };

/** Which outputs hold colour (sRGB) vs data (bump / roughness / occlusion). */
export const COLOR_KEYS = new Set(["tomato", "bbq", "map", "mushroom", "tomatoSlice", "jalapeno", "ham", "pepperoni", "basil", "olive", "greenPepper", "redOnion", "chilli", "shadow"]);

export function runJob(job: PaintJob): PaintResult {
  switch (job.kind) {
    // Painters return { someMap: canvas, ... } (+ optional `height` field); every canvas key is forwarded.
    case "top":
      return { canvases: { ...paintTopMaps(job.S, job.pools) } as Record<string, AnyCanvas> };
    case "crust": {
      const { height, ...maps } = paintCrust(job.crust, job.w);
      return { canvases: maps as Record<string, AnyCanvas>, height };
    }
    case "board":
      return { canvases: { ...paintBoard(job.S) } as Record<string, AnyCanvas> };
    case "toppings": {
      const s = job.scale;
      const canvases: Record<ToppingTexKey | "shadow", AnyCanvas> = {
        mushroom: mushroomTex(s), tomatoSlice: tomatoTex(s), jalapeno: jalapenoTex(s), ham: hamTex(s),
        pepperoni: pepperoniTexture(s), basil: basilTexture(s), olive: oliveTex(s), greenPepper: greenPepperTex(s),
        redOnion: redOnionTex(s), chilli: chilliTex(s), shadow: paintShadow(),
      };
      return { canvases };
    }
    case "occ":
      return { canvases: { occ: paintOcclusion(job.S, job.spots) } };
    case "cheese":
      return { canvases: { field: paintCheeseField(job.S, job.base, job.extra), detail: paintCheeseDetail(job.S) } };
  }
}
