/**
 * Photoreal helpers (no downloads):
 * - wrapSSS: fake subsurface scattering (light bleeding through mozzarella, dough, basil).
 * - withOcclusion: multiplies a painted contact-shadow canvas into a material's colour.
 * - withMicroDetail: procedural sauce pulp / cheese bubbles / crust pores (shader noise, no textures).
 * - studioEnvironment: food-studio softbox reflections built from emissive cards (PMREM, once).
 */
import * as THREE from "three";

// ---------- stackable shader patches ----------

type Patch = { key: string; fn: (s: THREE.WebGLProgramParametersWithUniforms) => void };

/** Several tweaks can patch the same material: they run in order, and the program cache key covers all of them. */
function addPatch(mat: THREE.Material, key: string, fn: Patch["fn"]) {
  const list: Patch[] = (mat.userData.patches ??= []);
  list.push({ key, fn });
  mat.onBeforeCompile = (s) => list.forEach((p) => p.fn(s));
  mat.customProgramCacheKey = () => list.map((p) => p.key).join("|");
}

/** True when a patch whose key starts with `prefix` is already on the material (guards against double-patching). */
function hasPatch(mat: THREE.Material, prefix: string) {
  return ((mat.userData.patches ?? []) as Patch[]).some((p) => p.key.startsWith(prefix));
}

/** MeshStandardMaterial and MeshPhysicalMaterial (the physical lighting model these patches target). */
const isPhysical = (mat: THREE.Material): mat is THREE.MeshStandardMaterial => (mat as THREE.MeshStandardMaterial).isMeshStandardMaterial === true;

/**
 * Inlines a fragment `#include <name>` so several patches can edit the same chunk text in any order
 * (the first one to need it inlines it, later ones edit the already-inlined copy).
 */
function inlineFragChunk(s: THREE.WebGLProgramParametersWithUniforms, name: keyof typeof THREE.ShaderChunk) {
  const inc = `#include <${name}>`;
  if (s.fragmentShader.includes(inc)) s.fragmentShader = s.fragmentShader.replace(inc, THREE.ShaderChunk[name]);
}

const LIGHTS_FRAGMENT = "#include <lights_physical_fragment>";

/**
 * Registers patch uniforms that change at runtime (animated values, repainted textures) on
 * `mat.userData.watch`, so the idle refinement (pizza-accumulate) can tell when the picture changed.
 */
export function watchUniforms(mat: THREE.Material, uniforms: Record<string, { value: unknown }>) {
  const list: { value: unknown }[] = (mat.userData.watch ??= []);
  for (const u of Object.values(uniforms)) if (!list.includes(u)) list.push(u);
}

// ---------- fake subsurface scattering ----------

const DIFFUSE_LINE = "reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );";

/**
 * Wrap lighting + a warm scatter band at the terminator + back-light glow (GPU Gems ch.16 style).
 * Patches three r186's physical direct-diffuse line; if a three upgrade changes it, the material stays standard.
 */
/** `weight`: name of a GLSL float (set earlier in main) that scales the effect per pixel, e.g. only thin cheese edges. */
export function wrapSSS(mat: THREE.MeshStandardMaterial, o: { wrap: number; width: number; back: number; color: string; weight?: string }) {
  const col = new THREE.Color(o.color);
  const w = o.weight ?? "1.0";
  addPatch(mat, `sss-${o.wrap}-${o.back}-${w}`, (s) => {
    inlineFragChunk(s, "lights_physical_pars_fragment");
    if (!s.fragmentShader.includes(DIFFUSE_LINE)) {
      console.warn("wrapSSS: three shader chunk changed; skipping subsurface effect");
      return;
    }
    Object.assign(s.uniforms, { uWrap: { value: o.wrap }, uSW: { value: o.width }, uBack: { value: o.back }, uSC: { value: col } });
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uWrap, uSW, uBack; uniform vec3 uSC;")
      .replace(
        DIFFUSE_LINE,
        `float sssW = ${w};
        float nlW = mix(saturate(dot(geometryNormal, directLight.direction)), saturate((dot(geometryNormal, directLight.direction) + uWrap) / (1.0 + uWrap)), sssW);
        float sc = smoothstep(0.0, uSW, nlW) * smoothstep(uSW * 2.0, uSW, nlW);
        float bk = pow(saturate(dot(geometryViewDir, -normalize(directLight.direction + geometryNormal * 0.3))), 3.0);
        vec3 dI = (vec3(nlW) + (sc + uBack * bk) * uSC * sssW) * directLight.color;
        reflectedLight.directDiffuse += dI * BRDF_Lambert(material.diffuseContribution) * (1.0 - F);`,
      );
  });
}

// ---------- painted contact occlusion ----------

/** Multiplies `occ` (a texture in the same UV space as the map) into the diffuse colour, and makes shaded spots less glossy. */
export function withOcclusion(mat: THREE.Material, occ: THREE.Texture) {
  const uOcc = { value: occ };
  watchUniforms(mat, { uOcc });
  addPatch(mat, "occ", (s) => {
    s.uniforms.uOcc = uOcc;
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D uOcc;")
      .replace("#include <map_fragment>", "#include <map_fragment>\nvec3 occ = texture2D(uOcc, vMapUv).rgb;\ndiffuseColor.rgb *= occ;")
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(1.0, roughnessFactor, occ.r);");
  });
}

// ---------- unified cheese + sauce surface ----------

export type SurfaceUniforms = { uExtra: { value: number }; uSauceMix: { value: number } };

/**
 * One blended top surface (how photoreal CG pizzas are built): the cheese melt field is thresholded per pixel,
 * so cheese melts into the sauce instead of sitting on it like a sticker.
 * - colour: tomato/BBQ sauce (crossfaded) -> cream mozzarella -> browned blister peaks; orange fat ring at the edge.
 * - gloss is local: oil beads + the fat ring get a tight clearcoat; dry cheese and browned spots stay matte.
 * - normals: cheese plateau + blisters perturb the normal (bump from the height, works on every tier);
 *   with a displaced grid (mid/ultra) the cheese also gets real height.
 * - sets `gSSS`: light glows through THIN cheese only (edges), for wrapSSS({ weight: "gSSS" }).
 */
export function withCheeseSurface(
  mat: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial,
  o: {
    field: THREE.Texture; detail: THREE.Texture; bbq: THREE.Texture; lift: number; extra: number; sauceMix: number;
    /** Real browning tile from a CC0 photogrammetry scan (colour RATIO around 0.5 = x1). Optional. */
    photo?: THREE.Texture | null;
  },
): SurfaceUniforms {
  const uni = {
    uField: { value: o.field }, uDetail: { value: o.detail }, uBbq: { value: o.bbq },
    uExtra: { value: o.extra }, uSauceMix: { value: o.sauceMix }, uLift: { value: o.lift },
    uPhoto: { value: o.photo ?? null }, uPhotoAmt: { value: o.photo ? 0.85 : 0 },
  };
  const common = `
uniform sampler2D uField, uDetail, uBbq, uPhoto;
uniform float uExtra, uSauceMix, uLift, uPhotoAmt;
const float CT = 0.13; // melt threshold
float cheeseAmt(vec2 uv) { vec4 f = texture2D(uField, uv); return f.r + f.g * uExtra; }
float cheeseMask(float fc) { return smoothstep(CT - 0.035, CT + 0.035, fc); }
float cheeseHeight(vec2 uv) {
  float fc = cheeseAmt(uv);
  float m = cheeseMask(fc);
  float plateau = smoothstep(CT, CT + 0.3, fc);
  return m * (0.45 + 0.55 * plateau) + m * texture2D(uDetail, uv).r * 0.35;
}`;
  watchUniforms(mat, uni);
  addPatch(mat, "cheese-surface", (s) => {
    Object.assign(s.uniforms, uni);
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\n" + common)
      .replace("#include <displacementmap_vertex>", "#include <displacementmap_vertex>\ntransformed += normalize(objectNormal) * cheeseHeight(uv) * uLift;");
    s.fragmentShader = s.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
${common}
float gSSS = 0.0;
float gOil = 0.0;
float gBrown = 0.0;
float gCheese = 0.0;
vec3 cPerturb(vec3 surfPos, vec3 surfNorm, vec2 dHdxy, float faceDir) {
  vec3 sx = normalize(dFdx(surfPos)), sy = normalize(dFdy(surfPos));
  vec3 r1 = cross(sy, surfNorm), r2 = cross(surfNorm, sx);
  float det = dot(sx, r1) * faceDir;
  vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  return normalize(abs(det) * surfNorm - grad);
}`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
// Sauce: crossfade tomato -> BBQ (both sRGB maps, decoded by the GPU).
diffuseColor.rgb = mix(diffuseColor.rgb, texture2D(uBbq, vMapUv).rgb, uSauceMix);
float fc = cheeseAmt(vMapUv);
gCheese = cheeseMask(fc);
vec4 det = texture2D(uDetail, vMapUv);
float thin = 1.0 - smoothstep(CT, CT + 0.22, fc);              // 1 at the melting edge, 0 on thick plateaus
gBrown = gCheese * smoothstep(0.55, 0.92, det.r) * (0.5 + 0.9 * (det.g - 0.5)) * (1.0 - thin * 0.7) * 0.75 * (1.0 - 0.45 * uPhotoAmt); // browning only on the tallest blisters (less when the real scan adds its own)
float ring = exp(-pow((fc - CT) / 0.03, 2.0));                // fat bleeding out at the edge
gOil = clamp(ring * 0.75 + det.b * gCheese * 0.8, 0.0, 1.0);
// Linear albedos calibrated to measured baked mozzarella (Ma et al.: surface L* 75-88 -> Y 0.48-0.72).
vec3 cream = vec3(0.80, 0.76, 0.60);                           // fresh-mozzarella cream (reads white in a food photo)
vec3 gold = vec3(0.578, 0.323, 0.084);                         // #c89a52 golden blister
vec3 burnt = vec3(0.323, 0.156, 0.053);                        // #9a6e41 browned blister (usual limit)
vec3 brown = vec3(0.147, 0.053, 0.016);                        // #6b4122 deep brown, only on the hottest peaks
vec3 cheeseCol = mix(cream, gold, clamp(gBrown * 1.5, 0.0, 1.0));
cheeseCol = mix(cheeseCol, burnt, clamp(gBrown * 1.8 - 0.75, 0.0, 1.0));
cheeseCol = mix(cheeseCol, brown, clamp(gBrown * 2.5 - 1.9, 0.0, 0.7));
cheeseCol = mix(cheeseCol, cream * vec3(1.03, 0.94, 0.80), thin * 0.35); // thin edges a touch warmer
// Real browning distribution from a CC0 scan (ambientCG Pizza002): golden blister patches + creamy pools.
// Stored as an sRGB-space ratio (0.5 = x1); ^2.2 turns it into a linear-space multiplier.
if (uPhotoAmt > 0.0) {
  vec3 ph = pow(max(texture2D(uPhoto, vMapUv * 3.0 + vec2(0.37, 0.11)).rgb * 2.0, vec3(0.0)), vec3(2.2));
  cheeseCol *= mix(vec3(1.0), ph, uPhotoAmt * (1.0 - thin * 0.5));
}
diffuseColor.rgb = mix(diffuseColor.rgb, cheeseCol, gCheese);
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.15, 0.78, 0.45), ring * (1.0 - gCheese) * 0.6); // orange fat in the sauce
gSSS = gCheese * (0.25 + 0.75 * thin);`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
float cH = cheeseHeight(vMapUv);
normal = cPerturb(-vViewPosition, normal, vec2(dFdx(cH), dFdy(cH)) * 1.6, faceDirection);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, mix(0.42, 0.72, clamp(gBrown * 1.5, 0.0, 1.0)), gCheese);
roughnessFactor = mix(roughnessFactor, 0.12, gOil * 0.85);`,
      )
      .replace(
        "#include <lights_physical_fragment>",
        `#include <lights_physical_fragment>
#ifdef USE_CLEARCOAT
material.clearcoat *= gOil; // gloss only where there is oil (uniform clearcoat = plastic)
#endif`,
      );
  });
  return uni;
}

// ---------- procedural micro detail ----------

/**
 * Fine surface detail with no textures: 3-octave value noise in object space (so it turns with the pizza)
 * perturbs the normal (sauce pulp, cheese bubbles, crust pores) and varies roughness a little.
 * Detail fades out where it would be smaller than a pixel, so it never shimmers.
 */
export function withMicroDetail(mat: THREE.MeshStandardMaterial, o: { freq: number; amp: number; rough: number; ridged?: boolean }) {
  addPatch(mat, `micro-${o.freq}-${o.ridged ? 1 : 0}`, (s) => {
    Object.assign(s.uniforms, { uMicroFreq: { value: o.freq }, uMicroAmp: { value: o.amp }, uMicroRough: { value: o.rough } });
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjPos = position;");
    s.fragmentShader = s.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vObjPos;
uniform float uMicroFreq, uMicroAmp, uMicroRough;
float mHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float mNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(mHash(i), mHash(i + vec3(1,0,0)), f.x), mix(mHash(i + vec3(0,1,0)), mHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(mHash(i + vec3(0,0,1)), mHash(i + vec3(1,0,1)), f.x), mix(mHash(i + vec3(0,1,1)), mHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float mFbm(vec3 p) { return 0.5 * mNoise(p) + 0.3 * mNoise(p * 2.03) + 0.2 * mNoise(p * 4.11); }
vec3 mPerturb(vec3 surfPos, vec3 surfNorm, vec2 dHdxy, float faceDir) {
  vec3 sx = normalize(dFdx(surfPos)), sy = normalize(dFdy(surfPos));
  vec3 r1 = cross(sy, surfNorm), r2 = cross(surfNorm, sx);
  float det = dot(sx, r1) * faceDir;
  vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  return normalize(abs(det) * surfNorm - grad);
}`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
float mH = mFbm(vObjPos * uMicroFreq);
${o.ridged ? "mH = 1.0 - abs(mH * 2.0 - 1.0);" : ""}
float mFade = clamp(0.25 / max(fwidth(mH), 1e-4), 0.0, 1.0);
normal = mPerturb(-vViewPosition, normal, vec2(dFdx(mH), dFdy(mH)) * uMicroAmp * mFade, faceDirection);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor * mix(1.0 - uMicroRough, 1.0 + uMicroRough, mFbm(vObjPos * uMicroFreq * 0.5)), 0.04, 1.0);",
      );
  });
}

// ---------- specular anti-aliasing ----------

/**
 * Specular AA (Kaplanyan/Tokuyoshi, as in Filament): widens roughness where the shading normal changes
 * fast across a pixel (shader-perturbed cheese/micro normals, bump maps), so tight oil highlights stop
 * sparkling while the pizza turns. Toksvig-style term for tangent-space normal maps (shorter mipmapped
 * normal = more spread). Physical materials only; Lambert/Basic are left alone (no-op).
 * Runs right after three fills `material.roughness`, i.e. after every normal perturbation, so the
 * order relative to the other patches does not matter.
 * Cost: ~12 ALU per pixel (+1 cached texture fetch with a normal map).
 */
export function withSpecularAA(mat: THREE.Material, o: { variance?: number; threshold?: number; toksvig?: number } = {}) {
  if (!isPhysical(mat) || hasPatch(mat, "specaa")) return;
  const variance = (o.variance ?? 0.25).toFixed(4);
  const threshold = (o.threshold ?? 0.18).toFixed(4);
  const toksvig = (o.toksvig ?? 1).toFixed(4);
  addPatch(mat, `specaa-${variance}-${threshold}-${toksvig}`, (s) => {
    if (!s.fragmentShader.includes(LIGHTS_FRAGMENT) || !THREE.ShaderChunk.lights_physical_fragment.includes("material.roughness = min( material.roughness, 1.0 );")) {
      console.warn("withSpecularAA: three shader chunk changed; skipping specular anti-aliasing");
      return;
    }
    s.fragmentShader = s.fragmentShader.replace(
      LIGHTS_FRAGMENT,
      `${LIGHTS_FRAGMENT}
{
  vec3 saDu = dFdx(normal), saDv = dFdy(normal);
  float saVar = ${variance} * (dot(saDu, saDu) + dot(saDv, saDv));
  #ifdef USE_NORMALMAP_TANGENTSPACE
    // Toksvig: mip averaging shortens the stored normal; 8-bit noise (~1%) is ignored.
    float saLen = clamp(length(texture2D(normalMap, vNormalMapUv).xyz * 2.0 - 1.0), 0.05, 1.0);
    saVar += ${toksvig} * max(0.99 - saLen, 0.0) / saLen * max(abs(normalScale.x), abs(normalScale.y));
  #endif
  float saK = min(2.0 * saVar, ${threshold});
  float saA = material.roughness * material.roughness; // perceptual -> alpha
  material.roughness = clamp(sqrt(sqrt(saA * saA + saK)), 0.0525, 1.0);
}`,
    );
  });
}

// ---------- micro-shadows from the AO map ----------

const RE_DIRECT_DEFINE = /#define\s+RE_Direct\s+RE_Direct_Physical\b/;
const RE_DIRECT_ARGS =
  "const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight";

/**
 * Micro-shadows (Filament): direct light is also darkened in crevices, using the AO channel
 * (`aoMap`, R channel, so an ORM texture works). three's aoMap only touches indirect light.
 * `directLight *= saturate(|N.L| + 2*ao^2 - 1)`.
 * Wraps RE_Direct instead of editing it, so it stacks with wrapSSS in any order.
 * No aoMap on the material (no USE_AOMAP) = exact no-op; non-physical materials are skipped.
 * Cost: 1 texture fetch per pixel + 3 ALU per light (only when aoMap is set).
 */
export function withMicroShadows(mat: THREE.Material) {
  if (!isPhysical(mat) || hasPatch(mat, "microshadow")) return;
  addPatch(mat, "microshadow", (s) => {
    inlineFragChunk(s, "lights_physical_pars_fragment");
    const fs = s.fragmentShader;
    if (!RE_DIRECT_DEFINE.test(fs) || !fs.includes(`void RE_Direct_Physical( ${RE_DIRECT_ARGS} )`) || !fs.includes(LIGHTS_FRAGMENT)) {
      console.warn("withMicroShadows: three shader chunk changed; skipping micro-shadows");
      return;
    }
    s.fragmentShader = fs
      .replace(
        RE_DIRECT_DEFINE,
        `float gMicroAO = 1.0;
void RE_Direct_MicroShadow( ${RE_DIRECT_ARGS} ) {
  IncidentLight msLight = directLight;
  msLight.color *= saturate(abs(dot(geometryNormal, directLight.direction)) + 2.0 * gMicroAO * gMicroAO - 1.0);
  RE_Direct_Physical(msLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight);
}
#define RE_Direct RE_Direct_MicroShadow`,
      )
      .replace(
        LIGHTS_FRAGMENT,
        `${LIGHTS_FRAGMENT}
#ifdef USE_AOMAP
gMicroAO = (texture2D(aoMap, vAoMapUv).r - 1.0) * aoMapIntensity + 1.0;
#endif`,
      );
  });
}

/** Specular AA + micro-shadows in one call (mid + ultra). Safe on any material; non-physical ones are skipped. */
export function withRealismPatches(mat: THREE.Material, aa?: Parameters<typeof withSpecularAA>[1]) {
  withSpecularAA(mat, aa);
  withMicroShadows(mat);
}

// ---------- studio environment ----------

/** Food-photo lighting for reflections: big warm softbox (key side), strip rim, fill card, warm table bounce, dark room. */
export function studioEnvironment(gl: THREE.WebGLRenderer) {
  const s = new THREE.Scene();
  s.background = new THREE.Color("#2a211b");
  const plane = new THREE.PlaneGeometry(1, 1);
  const mats: THREE.Material[] = [];
  const card = (hex: string, k: number, p: THREE.Vector3Tuple, sc: [number, number]) => {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide });
    mats.push(m);
    const mesh = new THREE.Mesh(plane, m);
    mesh.position.set(...p);
    mesh.scale.set(sc[0], sc[1], 1);
    mesh.lookAt(0, 0, 0);
    s.add(mesh);
  };
  card("#fff4e6", 6, [-3, 4, 2.5], [4, 3]);
  card("#ffe2c0", 3, [3.5, 1.5, -3], [5, 0.6]);
  card("#ffffff", 0.35, [2.5, 0.5, 2.5], [3, 2]); // weak fill: deeper, food-photo shadows
  card("#c98a5a", 0.6, [0, -1.2, 0], [8, 8]);
  const pmrem = new THREE.PMREMGenerator(gl);
  const rt = pmrem.fromScene(s, 0.02);
  pmrem.dispose();
  plane.dispose();
  mats.forEach((m) => m.dispose());
  return rt;
}

