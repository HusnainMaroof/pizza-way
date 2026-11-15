"use client";

/**
 * 3D pizza preview with a safe fallback.
 * - A soft skeleton shows while the 3D scene loads (no photo flash).
 * - three.js is code-split and only downloaded when the card is near the screen and WebGL2 works.
 * - The photo is only a fallback: no WebGL2, a WebGL error or a lost GPU context.
 */
import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";

const PizzaScene = dynamic(() => import("./pizza-scene"), { ssr: false, loading: () => null });

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("3D pizza preview failed, showing the photo instead.", error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type Tier = "low" | "mid" | "ultra";

/**
 * One throwaway WebGL2 probe: is 3D possible, and which quality tier fits this device?
 * - low: few cores / little memory, or a software renderer.
 * - mid: phones and tablets (touch, mobile UA).
 * - ultra: everything else (desktops); the scene drops itself to mid if the first frames are slow.
 */
function probe(): { ok: boolean; tier: Tier; forced?: boolean } {
  let renderer = "";
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return { ok: false, tier: "low" };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext(); // free the probe context right away
  } catch {
    return { ok: false, tier: "low" };
  }
  // QA override: ?pizza3d=low|mid|ultra forces a tier on any machine.
  const forced = new URLSearchParams(window.location.search).get("pizza3d");
  if (forced === "low" || forced === "mid" || forced === "ultra") return { ok: true, tier: forced, forced: true }; // no auto-downgrade
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4) return { ok: true, tier: "low" };
  if (/SwiftShader|llvmpipe|Software|Basic Render/i.test(renderer)) return { ok: true, tier: "low" };
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.matchMedia("(pointer: coarse)").matches;
  return { ok: true, tier: mobile ? "mid" : "ultra" };
}

export function PizzaPreview() {
  const box = useRef<HTMLDivElement>(null);
  const [env, setEnv] = useState<{ ok: boolean; tier: Tier; forced?: boolean; reducedMotion: boolean } | null>(null);
  const [near, setNear] = useState(false); // ever came near the screen: mount the canvas
  const [onScreen, setOnScreen] = useState(false); // visible now: keep rendering
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const p = probe();
    setEnv({ ...p, reducedMotion: rm.matches });
    const onRm = () => setEnv((e) => (e ? { ...e, reducedMotion: rm.matches } : e));
    rm.addEventListener("change", onRm);
    return () => rm.removeEventListener("change", onRm);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setOnScreen(e.isIntersecting);
        if (e.isIntersecting) {
          if (process.env.NODE_ENV !== "production") console.info(`[pizza3d] near screen at ${Math.round(performance.now())} ms`);
          setNear(true);
        }
      },
      { rootMargin: "1200px 0px" }, // start early: the card is usually within the first screen or two
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // While the browser is idle, fetch the 3D code and start the texture workers, so the pizza appears faster.
  useEffect(() => {
    if (!env?.ok) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const go = () => {
      void import("./pizza-scene");
      void import("./pizza-texture-client").then((m) => m.warmTexturePool());
    };
    if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 1500 });
    else setTimeout(go, 300);
  }, [env?.ok]);

  const show3d = !!env?.ok && near && !failed;
  // The photo is only a fallback (no WebGL2 or a GPU error). While 3D loads, show a soft skeleton instead.
  const usePhoto = failed || env?.ok === false;

  return (
    <div ref={box} className="relative size-full">
      {usePhoto ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-220 shrink-0 overflow-hidden rounded-pill max-lg:size-[200px] max-sm:size-[min(180px,50vw)]">
            <Image
              src="/brand/byo/pizza-preview.png"
              alt="Preview of your custom pizza"
              width={220}
              height={220}
              sizes="(max-width: 640px) 50vw, (max-width: 1023px) 200px, 16vw"
              className="block size-full object-cover"
            />
          </div>
        </div>
      ) : (
        <div
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
        >
          <div className="h-140 w-280 animate-pulse rounded-[50%] bg-[radial-gradient(ellipse_at_center,#f3e6cf_0%,#ead6b3_60%,#e2cca6_100%)] motion-reduce:animate-none max-lg:h-[130px] max-lg:w-[260px] max-sm:h-[110px] max-sm:w-[220px]" />
        </div>
      )}

      {show3d && env && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
          role="img"
          aria-label="3D preview of your custom pizza. Drag to turn it."
        >
          <SceneBoundary onError={() => setFailed(true)}>
            <PizzaScene
              tier={env.tier}
              onDowngrade={() => setEnv((e) => (e && e.tier === "ultra" && !e.forced ? { ...e, tier: "mid" } : e))}
              reducedMotion={env.reducedMotion}
              active={onScreen}
              onReady={() => {
                if (process.env.NODE_ENV !== "production") console.info(`[pizza3d] FIRST FRAME at ${Math.round(performance.now())} ms`);
                setReady(true);
              }}
              onFail={() => setFailed(true)}
            />
          </SceneBoundary>
        </div>
      )}
    </div>
  );
}
