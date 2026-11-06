import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls, useAnimations, useGLTF, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { FaceBoard, Model3D } from '../content/types'
import { asset } from '../lib/asset'

export type Backdrop = 'light' | 'dark' | 'white' | 'gray' | 'black'
export const backdrops: { id: Backdrop; label: string; swatch: string; dark: boolean }[] = [
  { id: 'light', label: 'Light studio', swatch: 'linear-gradient(#d6d6da, #f1f1f3)', dark: false },
  { id: 'dark', label: 'Dark studio', swatch: 'linear-gradient(#2a2b30, #4a4b52)', dark: true },
  { id: 'white', label: 'White', swatch: '#ffffff', dark: false },
  { id: 'gray', label: 'Gray', swatch: '#8d8e93', dark: true },
  { id: 'black', label: 'Black', swatch: '#050506', dark: true },
]

export type ViewOptions = {
  wireframe: boolean
  autoRotate: boolean
  shadows: boolean
  backdrop: Backdrop
  resetKey: number
}

/** Controls for whatever animation clips the current model has. */
export type AnimApi = {
  names: string[]
  current: () => string | null
  play: (name: string) => void
  paused: () => boolean
  setPaused: (p: boolean) => void
  time: () => number
  duration: () => number
  lengthOf: (name: string) => number
  seek: (t: number) => void
  setSpeed: (s: number) => void
  setLoop: (loop: boolean) => void
}

/**
 * The always-on 3D studio. `shift` (0–0.5) slides the framing left so a side panel
 * on the right never covers the model.
 */
export function Viewport({ model, options, shift, onApi, face = null }: {
  model: Model3D
  options: ViewOptions
  shift: number
  onApi: (api: AnimApi | null) => void
  face?: number[] | null // manual expression [col,row]; null = follow the animation
}) {
  const dark = backdrops.find((b) => b.id === options.backdrop)?.dark ?? false
  return (
    <Canvas className="viewport-canvas" dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 1.6, 9], fov: 30 }}>
      <Floor dark={dark} />
      {options.shadows && <ContactShadows position={[0, 0.002, 0]} opacity={dark ? 0.7 : 0.45} scale={6} blur={2.6} far={2.4} />}
      <ModelBoundary key={model.id}>
        <Suspense fallback={null}>
          <Spawn><GltfModel model={model} wireframe={options.wireframe} onApi={onApi} face={face} /></Spawn>
        </Suspense>
      </ModelBoundary>
      <Rig shift={shift} />
      <Controls autoRotate={options.autoRotate} resetKey={options.resetKey} />
    </Canvas>
  )
}

/** Soft concentric guide rings, fading out with distance — like a turntable on an infinite floor. */
function Floor({ dark }: { dark: boolean }) {
  const ink = dark ? '#ffffff' : '#7b7c84'
  const rings = [
    { r: 1.1, w: 0.012, o: 0.5 },
    { r: 2.2, w: 0.01, o: 0.32 },
    { r: 4.2, w: 0.012, o: 0.2 },
    { r: 7.5, w: 0.016, o: 0.12 },
  ]
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {rings.map((g) => (
        <mesh key={g.r} position={[0, 0, 0.001]}>
          <ringGeometry args={[g.r, g.r + g.w, 160]} />
          <meshBasicMaterial color={ink} transparent opacity={g.o * (dark ? 0.6 : 1)} depthWrite={false} />
        </mesh>
      ))}
      {/* thin arc that reads as "selected" */}
      <mesh position={[0, 0, 0.002]}>
        <ringGeometry args={[1.18, 1.2, 96, 1, Math.PI * 0.15, Math.PI * 0.7]} />
        <meshBasicMaterial color={dark ? '#9fc4ff' : '#4f7cff'} transparent opacity={0.8} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Smoothly slides the framing (view offset) and does a short dolly-in on first load. */
function Rig({ shift }: { shift: number }) {
  const { camera, size } = useThree()
  const cur = useRef(0)
  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera
    cur.current = THREE.MathUtils.damp(cur.current, shift, 6, dt)
    const w = size.width, h = size.height
    // always lift the framing a little so the feet clear the dock at the bottom
    cam.setViewOffset(w, h, cur.current * w, h * 0.07, w, h)
  })
  return null
}

function Controls({ autoRotate, resetKey }: { autoRotate: boolean; resetKey: number }) {
  const ref = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const { camera } = useThree()
  const intro = useRef(0)
  useEffect(() => {
    if (!resetKey) return
    intro.current = 0
    camera.position.set(0, 1.6, 9)
  }, [resetKey, camera])
  // ease the camera from far to the framing distance (also used by Reset view)
  useFrame((_, dt) => {
    if (intro.current >= 1) return
    intro.current = Math.min(1, intro.current + dt * 0.9)
    const target = new THREE.Vector3(0, 1.25, 6.2)
    camera.position.lerp(target, 1 - Math.pow(0.02, dt))
    if (camera.position.distanceTo(target) < 0.02) intro.current = 1
    ref.current?.update()
  })
  return (
    <OrbitControls ref={ref} target={[0, 0.95, 0]} enablePan={false} minDistance={2} maxDistance={11}
      minPolarAngle={0.25} maxPolarAngle={Math.PI / 2 - 0.04} autoRotate={autoRotate} autoRotateSpeed={0.9}
      enableDamping dampingFactor={0.08} rotateSpeed={0.7} zoomSpeed={0.6} makeDefault />
  )
}

/** Pop-in whenever a new model mounts. */
function Spawn({ children }: { children: ReactNode }) {
  const g = useRef<THREE.Group>(null)
  const t = useRef(0)
  useFrame((_, dt) => {
    if (!g.current || t.current >= 1) return
    t.current = Math.min(1, t.current + dt * 1.8)
    const e = 1 - Math.pow(1 - t.current, 3)
    g.current.position.y = (1 - e) * 0.25
    g.current.scale.setScalar(0.94 + 0.06 * e)
    g.current.rotation.y = (1 - e) * -0.6
  })
  return <group ref={g}>{children}</group>
}

/** DOM overlay (outside the Canvas) — drei's <Html> crashes on unmount under React 19. */
export function ViewportLoader() {
  const { active, progress } = useProgress()
  return (
    <div className={`vp-loader ${active ? 'on' : ''}`}>
      <span>Loading model</span><i style={{ width: `${progress}%` }} />
    </div>
  )
}

class ModelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err: unknown) { console.warn('Model failed to load.', err) }
  render() { return this.state.failed ? null : this.props.children }
}

/** Drives a model's clips with a mixer and hands an AnimApi to the UI. */
type Tick = { name: string | null; time: number }
function AnimatedRig({ clips, onApi, children, defaultClip, tick }: { clips: THREE.AnimationClip[]; onApi: (a: AnimApi | null) => void; children: ReactNode; defaultClip?: string; tick?: React.RefObject<Tick> }) {
  const ref = useRef<THREE.Group>(null)
  const { actions, mixer, names } = useAnimations(clips, ref)
  const curRef = useRef<string | null>(null)
  useFrame(() => { if (!tick?.current) return; const n = curRef.current; tick.current.name = n; tick.current.time = n ? actions[n]?.time ?? 0 : 0 })
  useEffect(() => {
    let cur: string | null = null
    const act = () => (cur ? actions[cur] ?? null : null)
    const api: AnimApi = {
      names,
      current: () => cur,
      play(name) {
        const next = actions[name]
        if (!next) return
        const prev = act()
        if (prev && prev !== next) prev.fadeOut(0.3)
        next.reset().fadeIn(prev ? 0.3 : 0).play()
        cur = name; curRef.current = name
      },
      paused: () => act()?.paused ?? true,
      setPaused(p) { const a = act(); if (a) a.paused = p },
      time: () => act()?.time ?? 0,
      duration: () => act()?.getClip().duration ?? 0,
      lengthOf: (n) => actions[n]?.getClip().duration ?? 0,
      seek(t) { const a = act(); if (a) { a.time = t; mixer.update(0) } },
      setSpeed(s) { mixer.timeScale = s },
      setLoop(loop) {
        names.forEach((n) => {
          const a = actions[n]
          if (!a) return
          a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity)
          a.clampWhenFinished = !loop
        })
      },
    }
    const first = defaultClip && names.includes(defaultClip) ? defaultClip : names[0]
    if (first) api.play(first)
    onApi(names.length ? api : null)
    return () => { mixer.stopAllAction(); onApi(null) }
  }, [actions, mixer, names, onApi, defaultClip])
  return <group ref={ref}>{children}</group>
}

/** Loads a GLB, makes it flat, and scales it to `model.height` with its base on the floor. */
function GltfModel({ model, wireframe, onApi, face }: { model: Model3D; wireframe: boolean; onApi: (a: AnimApi | null) => void; face: number[] | null }) {
  const { scene, animations } = useGLTF(asset(model.model))
  const fb = model.faces
  const { wrapper, tpose, faceTex } = useMemo(() => {
    const m = cloneSkinned(scene)
    let faceTex: THREE.Texture | null = null
    m.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(toFlat) : toFlat(mesh.material)
      // the face gets its own texture copy so moving its UV window doesn't touch anything else
      const mat = mesh.material as THREE.MeshBasicMaterial
      if (fb && mat.name === fb.material && mat.map) { faceTex = mat.map.clone(); faceTex.needsUpdate = true; mat.map = faceTex }
    })
    const tpose = restPoseClip(m, animations)
    // scale a wrapper, so clips that animate the root node don't undo it
    const w = new THREE.Group()
    w.add(m)
    const box = new THREE.Box3().setFromObject(m)
    const size = box.getSize(new THREE.Vector3())
    w.scale.setScalar(model.height / Math.max(size.y, size.x * 0.8, 0.001))
    const box2 = new THREE.Box3().setFromObject(w)
    const c = box2.getCenter(new THREE.Vector3())
    w.position.set(-c.x, -box2.min.y + (model.lift ?? 0), -c.z)
    return { wrapper: w, tpose, faceTex: faceTex as THREE.Texture | null }
  }, [scene, animations, model.height, model.lift, fb])
  // only the clips listed for this model, in that order ("T-Pose" = the rig's rest pose)
  const wanted = model.clips ?? []
  const clipKey = wanted.join('|')
  const clips = useMemo(() => {
    const all = tpose ? [...animations, tpose] : [...animations]
    if (!wanted.length) return animations
    return wanted.map((n) => all.find((c) => c.name === n)).filter((c): c is THREE.AnimationClip => !!c)
  }, [animations, tpose, clipKey])
  useLayoutEffect(() => { setWireframe(wrapper, wireframe) }, [wrapper, wireframe])
  const spin = useRef<THREE.Group>(null)
  const tick = useRef<Tick>({ name: null, time: 0 })
  useFrame(() => {
    if (!fb || !faceTex) return
    const [c, r] = face ?? faceAt(fb, tick.current.name, tick.current.time)
    faceTex.offset.set(c * fb.stepU, -r * fb.stepV)
  })
  useFrame((st, dt) => {
    if (!spin.current || !model.spin) return
    spin.current.rotation.y += dt * 0.35
    spin.current.position.y = Math.sin(st.clock.elapsedTime * 1.2) * 0.05
  })
  return (
    <AnimatedRig clips={clips} onApi={onApi} defaultClip={model.defaultClip} tick={tick}>
      <group ref={spin}><primitive object={wrapper} /></group>
    </AnimatedRig>
  )
}

/** Which face cell the timeline says to show at `time` seconds into `clip`. */
export function faceAt(fb: FaceBoard, clip: string | null, time: number): number[] {
  const steps = clip ? fb.timeline[clip] : undefined
  if (!steps?.length) return fb.default
  let cur = steps[0]
  for (const s of steps) { if (s[0] <= time + 1e-4) cur = s; else break }
  return [cur[1], cur[2]]
}

/**
 * A 1-second clip that holds every animated node at its rest transform — for this rig that is the T-pose.
 * Built from the freshly cloned (not yet animated) scene, for the nodes the file's clips animate.
 */
function restPoseClip(root: THREE.Object3D, animations: THREE.AnimationClip[]) {
  if (!animations.length) return null
  const props = new Map<string, Set<string>>()
  for (const clip of animations) for (const t of clip.tracks) {
    const i = t.name.lastIndexOf('.'); const node = t.name.slice(0, i), prop = t.name.slice(i + 1)
    if (prop === 'morphTargetInfluences' || node.includes('[')) continue
    if (!props.has(node)) props.set(node, new Set())
    props.get(node)!.add(prop)
  }
  const tracks: THREE.KeyframeTrack[] = []
  for (const [name, set] of props) {
    const o = root.getObjectByName(name)
    if (!o) continue
    if (set.has('quaternion')) tracks.push(new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, [0, 1], [...o.quaternion.toArray(), ...o.quaternion.toArray()]))
    if (set.has('position')) tracks.push(new THREE.VectorKeyframeTrack(`${name}.position`, [0, 1], [...o.position.toArray(), ...o.position.toArray()]))
    if (set.has('scale')) tracks.push(new THREE.VectorKeyframeTrack(`${name}.scale`, [0, 1], [...o.scale.toArray(), ...o.scale.toArray()]))
  }
  return tracks.length ? new THREE.AnimationClip('T-Pose', 1, tracks) : null
}

/** All 3D on the site is FLAT: unlit, texture colour only (Thanyo's choice). */
export function toFlat(src: THREE.Material): THREE.Material {
  const m = src as THREE.MeshStandardMaterial
  return new THREE.MeshBasicMaterial({
    name: m.name,
    map: m.map ?? null,
    color: m.color ? m.color.clone() : new THREE.Color('#ffffff'),
    alphaMap: m.alphaMap ?? null,
    transparent: m.transparent,
    opacity: m.opacity,
    alphaTest: m.alphaTest,
    side: m.side,
    depthWrite: m.depthWrite,
  })
}

function setWireframe(obj: THREE.Object3D, on: boolean) {
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    mats.forEach((m) => { (m as THREE.MeshBasicMaterial).wireframe = on })
  })
}
