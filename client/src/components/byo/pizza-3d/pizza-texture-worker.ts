/**
 * Web Worker: paints pizza textures on OffscreenCanvas, off the main thread.
 * Each canvas is flipped vertically (to match WebGL's flipY convention) and handed back as an
 * ImageBitmap with zero copy (transferred, not cloned).
 */
import { runJob } from "./pizza-paint";
import type { PaintJob } from "./pizza-paint";

type Msg = { id: number; job: PaintJob };

const post = (self as unknown as { postMessage(m: unknown, transfer: Transferable[]): void }).postMessage.bind(self);

function flippedBitmap(src: OffscreenCanvas) {
  const out = new OffscreenCanvas(src.width, src.height);
  const ctx = out.getContext("2d")!;
  ctx.translate(0, src.height);
  ctx.scale(1, -1);
  ctx.drawImage(src, 0, 0);
  return out.transferToImageBitmap();
}

self.onmessage = (e: MessageEvent<Msg>) => {
  const { id, job } = e.data;
  try {
    const res = runJob(job);
    const bitmaps: Record<string, ImageBitmap> = {};
    for (const [k, c] of Object.entries(res.canvases)) bitmaps[k] = flippedBitmap(c as OffscreenCanvas);
    const transfer: Transferable[] = [...Object.values(bitmaps)];
    if (res.height) transfer.push(res.height.data.buffer);
    post({ id, bitmaps, height: res.height }, transfer);
  } catch (err) {
    post({ id, error: String(err) }, []);
  }
};
