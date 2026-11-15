"use client";

/**
 * ULTRA tier: idle progressive refinement.
 * When the scene stops asking for frames (~150 ms with no frame), render N more frames with sub-pixel
 * camera jitter (Halton 2,3) and average them into a history buffer -> a converged, crisp, anti-aliased still.
 * Then rendering stops again (zero GPU when idle, apart from those N frames).
 * Any change (scene asks for a frame, transforms / instance matrices / geometry / textures / watched
 * uniforms / camera / canvas size change) aborts at once: that frame is a normal, un-jittered render.
 *
 * Mount <PizzaRefine /> INSIDE <EffectComposer>, after tone mapping + SMAA and BEFORE the last effect
 * (the composer's last pass draws to the screen; this pass is disabled most of the time).
 */
import { useFrame, useThree } from "@react-three/fiber";
import { Pass } from "postprocessing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}`;

const frag = /* glsl */ `
uniform sampler2D tCur;
uniform sampler2D tHist;
uniform float uW;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(tCur, vUv);
  if (uW < 1.0) c = mix(texture2D(tHist, vUv), c, uW);
  gl_FragColor = c;
  #include <colorspace_fragment>
}`;

/**
 * Running average: history = mix(history, current, 1 / (index + 1)). Two fullscreen draws per refinement
 * frame (blend into history, copy to the composer's output). Disabled = skipped by the composer (0 cost).
 */
export class AccumulatePass extends Pass {
  /** Sample number in the current refinement run (0 = start a new average). */
  index = 0;
  private histA: THREE.WebGLRenderTarget;
  private histB: THREE.WebGLRenderTarget;
  private mat: THREE.ShaderMaterial;

  constructor() {
    super("AccumulatePass");
    const opts = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter } as const;
    this.histA = new THREE.WebGLRenderTarget(1, 1, opts);
    this.histB = new THREE.WebGLRenderTarget(1, 1, opts);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { tCur: { value: null }, tHist: { value: null }, uW: { value: 1 } },
      vertexShader: vert,
      fragmentShader: frag,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.fullscreenMaterial = this.mat;
    this.enabled = false;
  }

  override initialize(_renderer: THREE.WebGLRenderer, _alpha: boolean, frameBufferType: number) {
    if (frameBufferType !== undefined) {
      for (const rt of [this.histA, this.histB]) rt.texture.type = frameBufferType as THREE.TextureDataType;
    }
  }

  override setSize(width: number, height: number) {
    this.histA.setSize(width, height);
    this.histB.setSize(width, height);
  }

  override render(renderer: THREE.WebGLRenderer, inputBuffer: THREE.WebGLRenderTarget | null, outputBuffer: THREE.WebGLRenderTarget | null) {
    if (!inputBuffer) return;
    const u = this.mat.uniforms;
    u.tCur.value = inputBuffer.texture;
    u.tHist.value = this.histA.texture;
    u.uW.value = 1 / (this.index + 1);
    renderer.setRenderTarget(this.histB);
    renderer.render(this.scene, this.camera);
    u.tCur.value = this.histB.texture;
    u.uW.value = 1;
    renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer);
    renderer.render(this.scene, this.camera);
    [this.histA, this.histB] = [this.histB, this.histA];
  }
}

const halton = (i: number, b: number) => {
  let f = 1, r = 0;
  while (i > 0) {
    f /= b;
    r += f * (i % b);
    i = Math.floor(i / b);
  }
  return r;
};

type Tex = { isTexture?: boolean; version?: number };

/** Everything that can change the picture, as a flat list of numbers (compared exactly). Cheap: ~30 objects. */
function snapshot(scene: THREE.Scene, camera: THREE.Camera, gl: THREE.WebGLRenderer, out: number[], size: THREE.Vector2) {
  out.length = 0;
  gl.getDrawingBufferSize(size);
  out.push(size.x, size.y, ...camera.position.toArray(), ...camera.quaternion.toArray(), ...camera.projectionMatrix.elements);
  if (scene.background instanceof THREE.Color) out.push(scene.background.r, scene.background.g, scene.background.b);
  const seenMat = new Set<THREE.Material>();
  scene.traverse((o) => {
    out.push(o.visible ? 1 : 0, o.position.x, o.position.y, o.position.z, o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w, o.scale.x, o.scale.y, o.scale.z);
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geo = mesh.geometry;
    for (const a of Object.values(geo.attributes)) out.push((a as THREE.BufferAttribute).version ?? 0);
    out.push(geo.index?.version ?? 0, geo.drawRange.start, geo.drawRange.count);
    const inst = o as THREE.InstancedMesh;
    if (inst.isInstancedMesh) out.push(inst.count, inst.instanceMatrix.version, inst.instanceColor?.version ?? 0);
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (seenMat.has(m)) continue;
      seenMat.add(m);
      out.push(m.version);
      for (const k in m) {
        const v = (m as unknown as Record<string, Tex | null>)[k];
        if (v && v.isTexture) out.push(v.version ?? 0);
      }
      for (const u of (m.userData.watch ?? []) as { value: unknown }[]) {
        const v = u.value as Tex | number | null;
        if (typeof v === "number") out.push(v);
        else if (v && (v as Tex).isTexture) out.push((v as Tex).version ?? 0);
      }
    }
  });
}

const sameList = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

export type RefineProps = {
  /** Frames averaged per still (8-16). */
  samples?: number;
  /** No frame for this long = idle. */
  idleMs?: number;
  /** Jitter radius in pixels (0.5 = box filter over one pixel). */
  radius?: number;
};

export function PizzaRefine({ samples = 12, idleMs = 150, radius = 0.5 }: RefineProps) {
  const pass = useMemo(() => new AccumulatePass(), []);
  const get = useThree((s) => s.get);
  const r = useRef({
    k: -1, // -1 = not refining
    timer: 0,
    jittered: false,
    base: [] as number[],
    cur: [] as number[],
    size: new THREE.Vector2(),
    proj: new THREE.Matrix4(),
    projInv: new THREE.Matrix4(),
  });

  useEffect(
    () => () => {
      window.clearTimeout(r.current.timer);
      pass.dispose();
    },
    [pass],
  );

  // Before the composer renders (priority 1), after the scene's own useFrame (priority 0).
  useFrame((state) => {
    const st = r.current;
    const arm = () => {
      window.clearTimeout(st.timer);
      st.timer = window.setTimeout(() => {
        st.timer = 0;
        const s = get();
        if (s.frameloop === "never" || document.hidden) return;
        st.k = 0;
        s.invalidate();
      }, idleMs);
    };
    if (st.k < 0) {
      pass.enabled = false;
      arm();
      return;
    }
    snapshot(state.scene, state.camera, state.gl, st.cur, st.size);
    // internal.frames >= 2 here = someone else asked for a frame during this frame (the scene is animating).
    const changed = state.internal.frames >= 2 || (st.k > 0 && !sameList(st.cur, st.base));
    if (changed) {
      st.k = -1;
      pass.enabled = false;
      arm();
      return;
    }
    if (st.k === 0) [st.base, st.cur] = [st.cur, st.base];

    // Sub-pixel jitter in clip space (P' = T * P): exact for perspective and orthographic cameras.
    const cam = state.camera;
    st.proj.copy(cam.projectionMatrix);
    st.projInv.copy(cam.projectionMatrixInverse);
    const jx = ((halton(st.k + 1, 2) - 0.5) * 2 * radius * 2) / st.size.x;
    const jy = ((halton(st.k + 1, 3) - 0.5) * 2 * radius * 2) / st.size.y;
    const e = cam.projectionMatrix.elements;
    for (let c = 0; c < 4; c++) {
      e[c * 4] += jx * e[c * 4 + 3];
      e[c * 4 + 1] += jy * e[c * 4 + 3];
    }
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    st.jittered = true;

    pass.index = st.k;
    pass.enabled = true;
    st.k++;
    if (st.k < samples) state.invalidate();
    else st.k = -1; // converged: stop. The next frame (from a real change) is a normal render.
  }, 0.5);

  // After the composer: put the exact projection back.
  useFrame((state) => {
    const st = r.current;
    if (!st.jittered) return;
    st.jittered = false;
    state.camera.projectionMatrix.copy(st.proj);
    state.camera.projectionMatrixInverse.copy(st.projInv);
  }, 1.5);

  return <primitive object={pass} />;
}
