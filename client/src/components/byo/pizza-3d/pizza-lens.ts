/**
 * ULTRA tier: one full-screen "lens" effect, run after tone mapping + SMAA (+ refinement):
 * 1. CAS-style contrast-adaptive sharpening (AMD FidelityFX CAS, 5-tap cross): sharpens texture,
 *    backs off on edges and on near-white (no halos against the white card).
 * 2. Warm food-photo grade: gentle S-curve (black + white fixed), a little saturation, warm highlights
 *    that fade out before pure white (the card stays exactly white).
 * 3. Very gentle vignette, masked to non-white pixels so the card corners never go grey.
 * One pass, 5 texture fetches per pixel. Marked CONVOLUTION, so it never merges behind per-pixel effects
 * (it reads its neighbours from the input buffer). Keep it the FIRST effect of its pass; Noise may follow.
 */
import { BlendFunction, Effect, EffectAttribute } from "postprocessing";
import { Uniform } from "three";

const frag = /* glsl */ `
uniform float uSharp;
uniform float uContrast;
uniform float uSat;
uniform float uWarm;
uniform float uVignette;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // --- CAS sharpening (values are tone-mapped, 0..1) ---
  vec3 e = inputColor.rgb;
  vec3 b = texture2D(inputBuffer, uv + vec2(0.0, texelSize.y)).rgb;
  vec3 d = texture2D(inputBuffer, uv - vec2(texelSize.x, 0.0)).rgb;
  vec3 f = texture2D(inputBuffer, uv + vec2(texelSize.x, 0.0)).rgb;
  vec3 h = texture2D(inputBuffer, uv - vec2(0.0, texelSize.y)).rgb;
  vec3 mn = min(e, min(min(b, d), min(f, h)));
  vec3 mx = max(e, max(max(b, d), max(f, h)));
  vec3 amp = sqrt(clamp(min(mn, 1.0 - mx) / max(mx, vec3(1e-4)), 0.0, 1.0));
  vec3 w = amp * (-1.0 / mix(8.0, 5.0, uSharp));
  vec3 c = max((e + (b + d + f + h) * w) / (1.0 + 4.0 * w), 0.0);

  // --- grade in a perceptual (gamma ~2) space ---
  vec3 g = sqrt(c);
  g = mix(g, g * g * (3.0 - 2.0 * g), uContrast * step(g, vec3(1.0)));  // gentle S-curve, 0 and 1 fixed
  float l = dot(g, LUMA);
  g = max(mix(vec3(l), g, 1.0 + uSat), 0.0);                            // white has no chroma: unchanged
  float hw = smoothstep(0.45, 0.8, l) * (1.0 - smoothstep(0.86, 0.96, l)); // highlights, not pure white
  g *= mix(vec3(1.0), vec3(1.03, 1.0, 0.95), hw * uWarm);
  c = g * g;

  // --- vignette, only on the food/board (near-white pixels are left alone) ---
  float r = length(uv - 0.5) * 1.41421;                                  // 0 centre, 1 corners
  float notWhite = 1.0 - smoothstep(0.88, 0.985, min(c.r, min(c.g, c.b)));
  c *= 1.0 - uVignette * smoothstep(0.3, 1.05, r) * notWhite;

  outputColor = vec4(c, inputColor.a);
}`;

export type LensOptions = {
  /** CAS strength 0..1 (0.3-0.4 = light). */
  sharpness?: number;
  /** S-curve amount 0..1. */
  contrast?: number;
  /** Extra saturation (0.05 = +5%). */
  saturation?: number;
  /** Warm highlight tint 0..1. */
  warmth?: number;
  /** Vignette darkness at the corners (masked to non-white pixels). */
  vignette?: number;
};

export class PizzaLensEffect extends Effect {
  constructor({ sharpness = 0.35, contrast = 0.14, saturation = 0.05, warmth = 0.6, vignette = 0.25 }: LensOptions = {}) {
    super("PizzaLensEffect", frag, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ["uSharp", new Uniform(sharpness)],
        ["uContrast", new Uniform(contrast)],
        ["uSat", new Uniform(saturation)],
        ["uWarm", new Uniform(warmth)],
        ["uVignette", new Uniform(vignette)],
      ]),
    });
  }

  set(o: LensOptions) {
    const u = this.uniforms;
    if (o.sharpness !== undefined) u.get("uSharp")!.value = o.sharpness;
    if (o.contrast !== undefined) u.get("uContrast")!.value = o.contrast;
    if (o.saturation !== undefined) u.get("uSat")!.value = o.saturation;
    if (o.warmth !== undefined) u.get("uWarm")!.value = o.warmth;
    if (o.vignette !== undefined) u.get("uVignette")!.value = o.vignette;
  }
}
