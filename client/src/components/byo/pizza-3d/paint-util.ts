/** Shared Canvas2D helpers for the texture painters (worker-safe: OffscreenCanvas or DOM canvas). */
import type { mulberry32 } from "./pizza-random";

export type Rand = ReturnType<typeof mulberry32>;
export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
export type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
export const TAU = Math.PI * 2;


export function canvas(w: number, h = w) {
  const c: AnyCanvas = typeof document === "undefined" ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), { width: w, height: h });
  return [c, c.getContext("2d") as Ctx] as const;
}


export const gauss = (r: Rand) => (r() + r() + r() - 1.5) / 1.5;


export function radial(ctx: Ctx, x: number, y: number, r: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}


export function noiseTile(r: Rand, n = 64) {
  const [c, ctx] = canvas(n);
  const img = ctx.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const v = Math.floor(r() * 255);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}


export function fbm(ctx: Ctx, w: number, h: number, r: Rand, alpha: number, op: GlobalCompositeOperation, scales = [16, 8, 4, 2]) {
  const tile = noiseTile(r);
  ctx.save();
  ctx.globalCompositeOperation = op;
  ctx.imageSmoothingEnabled = true;
  for (const s of scales) {
    ctx.globalAlpha = alpha / Math.sqrt(scales.length);
    const t = tile.width * s;
    for (let x = 0; x < w; x += t) for (let y = 0; y < h; y += t) ctx.drawImage(tile, x, y, t, t);
  }
  ctx.restore();
}


export function dot(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

