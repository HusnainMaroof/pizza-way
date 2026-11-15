/**
 * Turns paint jobs into GPU textures.
 * - Preferred: a small POOL of Web Workers paints on OffscreenCanvas in parallel and returns ImageBitmaps
 *   (no main-thread painting at all; the wait is the slowest job, not the sum of all jobs).
 * - Identical jobs share one result (no double painting, e.g. React StrictMode or remounts).
 * - Fallback (no Worker / OffscreenCanvas, or a worker fails): paint on the main thread, one job per tick.
 */
import * as THREE from "three";
import { COLOR_KEYS, runJob } from "./pizza-paint";
import type { AnyCanvas, HeightField, PaintJob } from "./pizza-paint";

export type TextureSet = { tex: Record<string, THREE.Texture>; height?: HeightField };

type Reply = { id: number; bitmaps?: Record<string, ImageBitmap>; height?: HeightField; error?: string };
type Slot = { w: Worker; busy: number };

let pool: Slot[] | null | undefined;
let seq = 0;
const pending = new Map<number, { resolve: (r: Reply) => void; reject: (e: Error) => void; slot: Slot }>();

/** Up to 4 workers, leaving at least one core for the page. */
function poolSize() {
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
  return Math.max(1, Math.min(4, cores - 1));
}

function getPool(): Slot[] | null {
  if (pool !== undefined) return pool;
  try {
    if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") return (pool = null);
    const slots: Slot[] = [];
    for (let i = 0; i < poolSize(); i++) {
      const w = new Worker(new URL("./pizza-texture-worker.ts", import.meta.url), { type: "module" });
      const slot: Slot = { w, busy: 0 };
      w.onmessage = (e: MessageEvent<Reply>) => {
        const p = pending.get(e.data.id);
        if (!p) return;
        pending.delete(e.data.id);
        p.slot.busy--;
        if (e.data.error) p.reject(new Error(e.data.error));
        else p.resolve(e.data);
      };
      w.onerror = () => {
        // A worker could not start or crashed: fail its pending jobs (they retry on the main thread) and drop it.
        pending.forEach((p, id) => {
          if (p.slot === slot) {
            pending.delete(id);
            p.reject(new Error("texture worker failed"));
          }
        });
        w.terminate();
        if (pool) {
          pool = pool.filter((s) => s !== slot);
          if (!pool.length) pool = null;
        }
      };
      slots.push(slot);
    }
    pool = slots;
  } catch {
    pool = null;
  }
  return pool;
}

/** Start the workers early (module load + JIT) so the first real job doesn't pay for it. */
export function warmTexturePool() {
  getPool();
}

function finish(t: THREE.Texture, key: string, repeatX: boolean) {
  t.colorSpace = COLOR_KEYS.has(key) ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (repeatX) t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

function fromBitmap(bmp: ImageBitmap, key: string, repeatX: boolean) {
  const t = new THREE.Texture(bmp as unknown as HTMLImageElement);
  t.flipY = false; // the worker already flipped it
  // Note: the bitmap is not closed on dispose. React StrictMode (dev) unmounts + remounts the scene with the
  // same textures, and a re-upload needs the pixels. The browser frees unreferenced bitmaps on its own.
  return finish(t, key, repeatX);
}

function fromCanvas(c: AnyCanvas, key: string, repeatX: boolean) {
  return finish(new THREE.CanvasTexture(c as HTMLCanvasElement), key, repeatX);
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

async function paintNow(job: PaintJob): Promise<TextureSet> {
  const t0 = performance.now();
  const done = <T,>(r: T) => {
    if (process.env.NODE_ENV !== "production") console.info(`[pizza3d] paint ${job.kind}: ${Math.round(performance.now() - t0)} ms (done at ${Math.round(performance.now())})`);
    return r;
  };
  const repeatX = job.kind === "crust";
  const slots = getPool();
  if (slots && slots.length) {
    try {
      const slot = slots.reduce((a, b) => (b.busy < a.busy ? b : a)); // least busy worker
      const id = ++seq;
      slot.busy++;
      const reply = await new Promise<Reply>((resolve, reject) => {
        pending.set(id, { resolve, reject, slot });
        slot.w.postMessage({ id, job });
      });
      const tex: Record<string, THREE.Texture> = {};
      for (const [k, b] of Object.entries(reply.bitmaps!)) tex[k] = fromBitmap(b, k, repeatX);
      return done({ tex, height: reply.height });
    } catch {
      // fall through to the main thread
    }
  }
  await tick(); // let the page breathe between main-thread jobs
  const res = runJob(job);
  const tex: Record<string, THREE.Texture> = {};
  for (const [k, c] of Object.entries(res.canvases)) tex[k] = fromCanvas(c, k, repeatX);
  return done({ tex, height: res.height });
}

/** Deterministic jobs (everything except contact occlusion) are shared: same job, same result. */
const cache = new Map<string, Promise<TextureSet>>();

/** Paints one job and returns ready-to-use textures. */
export function paint(job: PaintJob): Promise<TextureSet> {
  if (job.kind === "occ") return paintNow(job);
  const key = JSON.stringify(job);
  let p = cache.get(key);
  if (!p) {
    p = paintNow(job);
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

/** Re-paints into an existing texture (same size), e.g. the contact-occlusion map when toppings change. */
export async function repaintInto(target: THREE.Texture, job: PaintJob, key: string) {
  const next = await paint(job);
  const fresh = next.tex[key];
  const old = target.image as ImageBitmap | HTMLCanvasElement;
  target.image = fresh.image;
  target.flipY = fresh.flipY;
  target.needsUpdate = true;
  if (old && "close" in old && old !== fresh.image) (old as ImageBitmap).close();
  // The temporary texture never reached the GPU; drop it without closing the shared bitmap.
  fresh.image = null as unknown as HTMLImageElement;
}
