"use client";

/**
 * ULTRA tier only (lazy chunk): food-photography lens.
 * Passes (auto-merged by the composer, in this order):
 *   1. scene render            2. N8AO (crevice AO, half res)
 *   3. DOF + Bloom + Neutral tone mapping (one pass; DOF is the only convolution in it)
 *   4. SMAA (on tone-mapped LDR, so edges against the HDR-white background stay clean)
 *   5. idle refinement (disabled while moving; 8-16 jittered frames when the scene goes idle)
 *   6. lens: CAS sharpen + warm grade + masked vignette, + film grain (one pass, draws to screen)
 * EffectComposer renders only when R3F renders, so "demand" mode still idles.
 */
import { Bloom, DepthOfField, EffectComposer, N8AO, Noise, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { PizzaRefine } from "./pizza-accumulate";
import { PizzaLensEffect } from "./pizza-lens";
import type { LensOptions } from "./pizza-lens";

function Lens(props: LensOptions) {
  const effect = useMemo(() => new PizzaLensEffect(), []);
  useEffect(() => () => effect.dispose(), [effect]);
  useEffect(() => effect.set(props));
  return <primitive object={effect} />;
}

export type PizzaPostProps = {
  /** Idle progressive refinement (sub-pixel jitter accumulation). Default on. */
  refine?: boolean;
  /** Frames averaged per idle still. */
  refineSamples?: number;
  lens?: LensOptions;
};

export default function PizzaPost({ refine = true, refineSamples = 12, lens }: PizzaPostProps) {
  return (
    <EffectComposer multisampling={0} frameBufferType={THREE.HalfFloatType}>
      <N8AO aoRadius={0.06} distanceFalloff={0.6} intensity={2.2} color="#2a1208" quality="medium" halfRes />
      <DepthOfField target={[0, 0.05, 0.3]} focusRange={0.9} bokehScale={1.6} resolutionScale={0.5} />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.25} radius={0.6} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <SMAA />
      {refine && <PizzaRefine samples={refineSamples} />}
      <Lens sharpness={0.35} contrast={0.14} saturation={0.05} warmth={0.6} vignette={0.25} {...lens} />
      <Noise premultiply opacity={0.02} />
    </EffectComposer>
  );
}
