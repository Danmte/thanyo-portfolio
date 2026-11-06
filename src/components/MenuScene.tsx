import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Float, Grid, Lightformer, MeshReflectorMaterial, PerformanceMonitor, Sparkles, useGLTF, useTexture } from '@react-three/drei'
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { toFlat } from './CharacterStage'
import { rng } from './Hud'
import { asset } from '../lib/asset'

/**
 * The grand menu world: a cylindrical hall of glowing screens, giant holograms of the
 * character, iridescent crystals, rings and a mirror floor.
 * view = 'title' → camera behind the hero looking at the screens
 * view = 'menu'  → camera swings round to her front; drag to look around
 */
export type SceneView = 'title' | 'menu'

const NEON = ['#ff3ea5', '#8b5cff', '#3ad7ff', '#ff8a3d', '#c6ff3a', '#ffffff', '#5b6bff']
const HERO = 'models/character.glb'
const time = { value: 0 } // shared shader clock

export default function MenuScene({ view, accent = 0 }: { view: SceneView; accent?: number }) {
  const [low, setLow] = useState(() => typeof window !== 'undefined' && (window.innerWidth < 860 || (navigator.hardwareConcurrency ?? 8) <= 4))
  return (
    <div className="menu-scene" aria-hidden>
      <Canvas dpr={low ? 0.85 : [1, 1.25]} gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 1.8, -5], fov: 36, near: 0.1, far: 80 }}>
        <PerformanceMonitor onDecline={() => setLow(true)} flipflops={1} />
        <color attach="background" args={['#04030b']} />
        <fog attach="fog" args={['#070514', 10, 34]} />
        <Clock />
        <Suspense fallback={null}>
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={3} color="#8b5cff" position={[-6, 4, -4]} scale={[6, 6, 1]} />
            <Lightformer form="rect" intensity={3} color="#3ad7ff" position={[6, 3, 4]} scale={[6, 6, 1]} />
            <Lightformer form="ring" intensity={4} color="#ff3ea5" position={[0, 7, 0]} scale={4} />
          </Environment>
          <ScreenHall />
          <Holograms low={low} />
          <Hero />
          <Crystals />
          <Relic />
        </Suspense>
        <HaloRings accent={accent} />
        <MegaRings />
        <Floor low={low} />
        <Sparkles count={low ? 80 : 220} scale={[22, 9, 22]} position={[0, 4, 0]} size={2.2} speed={0.25} color="#b9a3ff" opacity={0.8} />
        <CameraRig view={view} />
        {!low && (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={1.15} levels={5} />
            <ChromaticAberration offset={new THREE.Vector2(0.0009, 0.0012)} radialModulation modulationOffset={0.35} />
            <Noise opacity={0.045} />
            <Vignette darkness={0.72} offset={0.28} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  )
}

function Clock() {
  useFrame((_, dt) => { time.value += dt })
  return null
}

// ---------------- camera: cinematic swing + drag-to-look ----------------
function CameraRig({ view }: { view: SceneView }) {
  const { camera, gl } = useThree()
  const theta = useRef(Math.PI) // π = behind hero, 0 = in front
  const drag = useRef({ on: false, x: 0, y: 0, yaw: 0, pitch: 0 })
  const look = useMemo(() => new THREE.Vector3(), [])
  useEffect(() => {
    // the UI sits on top of the canvas, so listen on the window and ignore presses on controls
    const el = window
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('button, a, input')) return
      drag.current.on = true; drag.current.x = e.clientX; drag.current.y = e.clientY
    }
    const move = (e: PointerEvent) => {
      const d = drag.current
      if (!d.on) return
      d.yaw = THREE.MathUtils.clamp(d.yaw - (e.clientX - d.x) * 0.004, -1.1, 1.1)
      d.pitch = THREE.MathUtils.clamp(d.pitch + (e.clientY - d.y) * 0.002, -0.25, 0.35)
      d.x = e.clientX; d.y = e.clientY
    }
    const up = () => { drag.current.on = false }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => { el.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [gl])
  useFrame(({ clock, pointer }, dt) => {
    const menu = view === 'menu'
    const goal = menu ? 0 : Math.PI
    theta.current = THREE.MathUtils.damp(theta.current, goal, 1.6, dt)
    const d = drag.current
    if (!d.on) { d.yaw = THREE.MathUtils.damp(d.yaw, 0, 0.35, dt); d.pitch = THREE.MathUtils.damp(d.pitch, 0, 0.5, dt) }
    const t = clock.elapsedTime
    const swing = 1 - Math.abs(theta.current - goal) / Math.PI // 0 → 1 as the move finishes
    const a = theta.current + d.yaw + pointer.x * 0.05 + Math.sin(t * 0.15) * 0.04
    const r = menu ? 3.3 + (1 - swing) * 2.2 : 5.2
    const h = (menu ? 1.42 : 1.75) + d.pitch * 2 + Math.sin(t * 0.3) * 0.03
    camera.position.set(Math.sin(a) * r - (menu ? 0.45 : 0), h, Math.cos(a) * r)
    const tgt = menu ? [-0.45 + Math.sin(a) * 0.2, 1.28 + d.pitch, 0] : [0, 3.2, 12]
    look.lerp(new THREE.Vector3(...tgt), 1 - Math.exp(-dt * 2.5))
    camera.lookAt(look)
  })
  return null
}

// ---------------- hero: front-facing, flat, idle ----------------
function useRig(url: string) {
  const gltf = useGLTF(asset(url))
  return gltf
}

function Hero() {
  const { scene, animations } = useRig(HERO)
  const model = useMemo(() => {
    const m = cloneSkinned(scene)
    stripMorphs(m)
    m.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh) mesh.material = Array.isArray(mesh.material) ? mesh.material.map(toFlat) : toFlat(mesh.material)
    })
    return fitHeight(m, 1.72)
  }, [scene])
  useClip(model, animations, 'Idle')
  return (
    <group>
      <primitive object={model} />
      {/* soft back halo so the black outfit reads against the hall */}
      <mesh position={[0, 1.25, -0.6]}>
        <planeGeometry args={[3.2, 3.6]} />
        <meshBasicMaterial map={useHaloTexture()} transparent blending={THREE.AdditiveBlending} depthWrite={false} color={new THREE.Color(1.4, 1.1, 2.6)} toneMapped={false} />
      </mesh>
    </group>
  )
}

function useClip(root: THREE.Object3D, clips: THREE.AnimationClip[], name: string, speed = 1, offset = 0) {
  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root])
  useEffect(() => {
    const src = clips.find((c) => c.name === name) ?? clips[0]
    if (!src) return
    // menu clones have no shape keys → drop those tracks so the mixer doesn't complain
    const clip = new THREE.AnimationClip(src.name, src.duration, src.tracks.filter((t) => !t.name.includes('morphTargetInfluences')))
    const act = mixer.clipAction(clip)
    act.timeScale = speed
    act.play()
    act.time = offset * clip.duration
    return () => { act.stop() }
  }, [mixer, clips, name, speed, offset])
  useFrame((_, dt) => mixer.update(dt))
}

/** Menu clones don't need the 41 face shape keys — dropping them makes skinning much cheaper. */
function stripMorphs(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    if (Object.keys(mesh.geometry.morphAttributes).length) {
      const g = mesh.geometry.clone()
      g.morphAttributes = {}
      mesh.geometry = g
      mesh.morphTargetInfluences = undefined
      mesh.morphTargetDictionary = undefined
    }
  })
}

/** Wrap and scale so the model is `h` units tall with its feet at y=0. */
function fitHeight(m: THREE.Object3D, h: number) {
  const w = new THREE.Group()
  w.add(m)
  const box = new THREE.Box3().setFromObject(m)
  const s = h / Math.max(box.getSize(new THREE.Vector3()).y, 0.001)
  w.scale.setScalar(s)
  const b2 = new THREE.Box3().setFromObject(w)
  const c = b2.getCenter(new THREE.Vector3())
  w.position.set(-c.x, -b2.min.y, -c.z)
  const outer = new THREE.Group()
  outer.add(w)
  return outer
}

let haloTex: THREE.Texture | null = null
function useHaloTexture() {
  if (haloTex) return haloTex
  const c = document.createElement('canvas'); c.width = c.height = 256
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grd.addColorStop(0, 'rgba(160,120,255,0.55)'); grd.addColorStop(0.45, 'rgba(90,60,255,0.18)'); grd.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256)
  haloTex = new THREE.CanvasTexture(c)
  return haloTex
}

// ---------------- holograms: giant ghost copies of the hero ----------------
function hologramMaterial(color: THREE.Color, opacity = 1) {
  const m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  m.onBeforeCompile = (s) => {
    s.uniforms.uTime = time
    s.uniforms.uColor = { value: color }
    s.uniforms.uOpacity = { value: opacity }
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec3 vHN;\nvarying vec3 vHV;\nvarying float vHY;\nfloat hr(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float gs = smoothstep(0.55, 1.0, sin(uTime * 1.7 + position.y * 0.02));
        transformed.x += (hr(vec2(floor(position.y * 40.0), floor(uTime * 12.0))) - 0.5) * 0.06 * gs;`)
      .replace('#include <fog_vertex>', `#include <fog_vertex>
        #ifdef USE_SKINNING
          vHN = normalize(transformedNormal);
        #else
          vHN = normalize(normalMatrix * normal);
        #endif
        vHV = -mvPosition.xyz;
        vHY = (modelMatrix * vec4(transformed, 1.0)).y;`)
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform vec3 uColor;\nuniform float uOpacity;\nvarying vec3 vHN;\nvarying vec3 vHV;\nvarying float vHY;')
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        vec3 n = normalize(vHN); if (!gl_FrontFacing) n *= -1.0;
        float fres = pow(1.0 - abs(dot(normalize(vHV), n)), 2.0);
        float stripes = pow(fract(vHY * 3.0 - uTime * 0.35), 3.0);
        float holo = stripes * fres + fres * 1.25 + 0.04;
        holo *= smoothstep(1.0, 0.25, fres) * 0.6 + 0.4;
        gl_FragColor = vec4(uColor * holo, holo * uOpacity);`)
  }
  m.customProgramCacheKey = () => 'holo'
  return m
}

function Ghost({ clipName, position, rotation, height, color, speed = 1, offset = 0 }: {
  clipName: string; position: [number, number, number]; rotation: number; height: number; color: THREE.Color; speed?: number; offset?: number
}) {
  const { scene, animations } = useRig(HERO)
  const model = useMemo(() => {
    const m = cloneSkinned(scene)
    stripMorphs(m)
    const mat = hologramMaterial(color, 0.9)
    m.traverse((o) => { const mesh = o as THREE.Mesh; if (mesh.isMesh) { mesh.material = mat; mesh.frustumCulled = false } })
    return fitHeight(m, height)
  }, [scene, color, height])
  useClip(model, animations, clipName, speed, offset)
  return <group position={position} rotation={[0, rotation, 0]}><primitive object={model} /></group>
}

const GHOST_A = new THREE.Color(0.55, 0.65, 2.2)
const GHOST_B = new THREE.Color(1.9, 0.6, 1.6)
function Holograms({ low }: { low: boolean }) {
  return (
    <>
      <Ghost clipName="Idle" position={[3.4, 0, -8.2]} rotation={-0.25} height={7.5} color={GHOST_A} offset={0.3} />
      {!low && <Ghost clipName="Horse Catwalk" position={[-3.2, 0, 8.4]} rotation={Math.PI + 1.2} height={7} color={GHOST_B} speed={0.6} />}
    </>
  )
}

// ---------------- screen hall ----------------
function splashTexture(seed: number) {
  const r = rng(seed)
  const c = document.createElement('canvas'); c.width = 512; c.height = 320
  const g = c.getContext('2d')!
  const bg = g.createLinearGradient(0, 0, 512, 320)
  bg.addColorStop(0, '#0b0930'); bg.addColorStop(1, ['#2a0b3d', '#06223d', '#1b0f4a'][seed % 3])
  g.fillStyle = bg; g.fillRect(0, 0, 512, 320)
  g.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 46; i++) {
    g.strokeStyle = NEON[Math.floor(r() * NEON.length)]
    g.globalAlpha = 0.35 + r() * 0.6
    g.lineWidth = 2 + r() * 26
    g.lineCap = 'round'
    g.beginPath()
    const x = r() * 512, y = r() * 320
    g.moveTo(x, y)
    g.quadraticCurveTo(x + (r() - 0.5) * 300, y + (r() - 0.5) * 200, x + (r() - 0.5) * 420, y + (r() - 0.5) * 260)
    g.stroke()
  }
  for (let i = 0; i < 120; i++) { // splatter + shards
    g.fillStyle = NEON[Math.floor(r() * NEON.length)]
    g.globalAlpha = 0.4 + r() * 0.6
    const x = r() * 512, y = r() * 320, s = 1 + r() * 9
    if (i % 3) { g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill() }
    else { g.beginPath(); g.moveTo(x, y); g.lineTo(x + r() * 40, y + r() * 12); g.lineTo(x + r() * 10, y + r() * 40); g.fill() }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const screenVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`
const screenFrag = `
uniform sampler2D map; uniform float uTime; uniform float uGlow; uniform float uSeed; uniform vec3 uTint;
varying vec2 vUv;
float rnd(float x){ return fract(sin(x * 91.3 + uSeed * 17.0) * 43758.5); }
void main(){
  vec2 uv = vUv;
  float band = step(0.982, rnd(floor(uv.y * 36.0) + floor(uTime * 7.0)));
  uv.x += band * 0.05 * (rnd(floor(uTime * 7.0)) - 0.5);
  float ca = 0.004 + band * 0.01;
  vec3 c = vec3(texture2D(map, uv + vec2(ca, 0.0)).r, texture2D(map, uv).g, texture2D(map, uv - vec2(ca, 0.0)).b);
  float scan = 0.86 + 0.14 * sin(uv.y * 420.0 + uTime * 3.0);
  float flick = 0.88 + 0.12 * sin(uTime * (2.0 + uSeed * 4.0) + uSeed * 30.0);
  float edge = smoothstep(0.0, 0.015, uv.x) * smoothstep(1.0, 0.985, uv.x) * smoothstep(0.0, 0.02, uv.y) * smoothstep(1.0, 0.98, uv.y);
  vec3 col = c * uTint * uGlow * scan * flick;
  col = mix(vec3(0.9, 0.8, 1.6) * 1.6, col, edge);
  gl_FragColor = vec4(col, 1.0);
}`

function ScreenHall() {
  const art = useTexture([
    asset('art/gallery/coastal-town.webp'), asset('art/undertaker_key.webp'), asset('art/gallery/composition-study.webp'),
    asset('art/undertaker_bust.webp'), asset('art/gallery/base-mesh.webp'),
  ])
  const screens = useMemo(() => {
    art.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace })
    const splashes = Array.from({ length: 9 }, (_, i) => splashTexture(i * 13 + 5))
    const r = rng(77)
    const list: { pos: THREE.Vector3; rotY: number; w: number; h: number; mat: THREE.ShaderMaterial }[] = []
    const R = 13, cols = 30, rows = 5
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (r() < 0.22) continue
        const a = (col / cols) * Math.PI * 2 + row * 0.05 + (r() - 0.5) * 0.04
        const w = 2.2 + r() * 1.4, h = 1.4 + r() * 1.1
        const y = 1.2 + row * 2.35 + (r() - 0.5) * 0.5
        const rr = R + (r() - 0.5) * 1.4
        const useArt = r() < 0.14
        const tex = useArt ? art[Math.floor(r() * art.length)] : splashes[Math.floor(r() * splashes.length)]
        const tint = new THREE.Color(NEON[Math.floor(r() * 3)]).lerp(new THREE.Color('#ffffff'), 0.55)
        const mat = new THREE.ShaderMaterial({
          uniforms: { map: { value: tex }, uTime: time, uGlow: { value: (useArt ? 1.2 : 1.6) * (0.7 + r() * 0.7) }, uSeed: { value: r() }, uTint: { value: tint } },
          vertexShader: screenVert, fragmentShader: screenFrag, toneMapped: false, side: THREE.DoubleSide,
        })
        list.push({ pos: new THREE.Vector3(Math.sin(a) * rr, y, Math.cos(a) * rr), rotY: a + Math.PI, w, h, mat })
      }
    }
    return list
  }, [art])
  return (
    <group>
      {screens.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={[0, s.rotY, 0]} material={s.mat}>
          <planeGeometry args={[s.w, s.h]} />
        </mesh>
      ))}
    </group>
  )
}

// ---------------- crystals ----------------
function Crystals() {
  const items = useMemo(() => {
    const r = rng(31)
    return Array.from({ length: 10 }, (_, i) => {
      const side = i % 4 === 0 ? -1 : 1 // mostly on screen-right, away from the menu list
      const a = side * (0.75 + r() * 1.6) // keep clear of the front/back camera axis
      const rad = 1.5 + r() * 1.8
      return { pos: [Math.sin(a) * rad, 0.7 + r() * 2.6, -Math.abs(Math.cos(a)) * rad * 0.7 - 0.5] as [number, number, number], s: 0.08 + r() * 0.13, rot: r() * 6 }
    })
  }, [])
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#c9b8ff', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.82,
    iridescence: 1, iridescenceIOR: 1.35, envMapIntensity: 3, clearcoat: 1,
    emissive: new THREE.Color('#5a2cff'), emissiveIntensity: 0.35,
  }), [])
  return (
    <>
      {items.map((c, i) => (
        <Float key={i} speed={1.2 + (i % 3) * 0.4} rotationIntensity={1.4} floatIntensity={1.2}>
          <mesh position={c.pos} rotation={[c.rot, c.rot * 0.7, 0]} scale={[c.s, c.s * 1.7, c.s]} material={mat}>
            <octahedronGeometry args={[1, 0]} />
          </mesh>
        </Float>
      ))}
    </>
  )
}

function Relic() {
  const { scene } = useGLTF(asset('models/relic.glb'))
  const g = useRef<THREE.Group>(null)
  const model = useMemo(() => {
    const m = scene.clone(true)
    m.traverse((o) => { const mesh = o as THREE.Mesh; if (mesh.isMesh) mesh.material = toFlat(mesh.material as THREE.Material) })
    const size = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3())
    m.scale.setScalar(1.3 / Math.max(size.x, size.y, size.z))
    const c = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3())
    m.position.sub(c)
    return m
  }, [scene])
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * 0.4 })
  return (
    <Float speed={1} floatIntensity={0.6}>
      <group ref={g} position={[2.4, 2.7, -2.2]}><primitive object={model} /></group>
    </Float>
  )
}

// ---------------- rings ----------------
const ringFrag = `
uniform float uTime; uniform vec3 uColor; uniform float uDash; varying vec2 vUv;
void main(){
  float d = fract(vUv.x * uDash - uTime * 0.15);
  float on = smoothstep(0.0, 0.05, d) * smoothstep(0.6, 0.5, d);
  float pulse = 0.6 + 0.4 * sin(uTime * 2.0 + vUv.x * 30.0);
  gl_FragColor = vec4(uColor * on * pulse, on);
}`
function ringMat(color: THREE.Color, dash: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: time, uColor: { value: color }, uDash: { value: dash } },
    vertexShader: screenVert, fragmentShader: ringFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  })
}

function HaloRings({ accent }: { accent: number }) {
  const g = useRef<THREE.Group>(null)
  const cols = [new THREE.Color(1.6, 0.9, 3.0), new THREE.Color(3.0, 0.9, 1.8), new THREE.Color(0.8, 2.2, 3.0), new THREE.Color(3.0, 2.2, 0.6)]
  const mats = useMemo(() => [ringMat(cols[0].clone(), 24), ringMat(cols[2].clone(), 60), ringMat(cols[1].clone(), 12)], []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { (mats[0].uniforms.uColor.value as THREE.Color).copy(cols[accent % cols.length]) }, [accent]) // eslint-disable-line react-hooks/exhaustive-deps
  useFrame((_, dt) => {
    if (!g.current) return
    g.current.children[0].rotation.z += dt * 0.3
    g.current.children[1].rotation.z -= dt * 0.18
    g.current.children[2].rotation.z += dt * 0.5
  })
  return (
    <group ref={g} position={[0, 0.02, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats[0]}><ringGeometry args={[0.95, 1.0, 128]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats[1]}><ringGeometry args={[1.35, 1.37, 128]} /></mesh>
      <mesh rotation={[-Math.PI / 2.15, 0.2, 0]} position={[0, 1.1, 0]} material={mats[2]}><torusGeometry args={[1.15, 0.008, 6, 160]} /></mesh>
    </group>
  )
}

/** Huge tilted rings overhead — the "megastructure". */
function MegaRings() {
  const g = useRef<THREE.Group>(null)
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: '#15132a', metalness: 0.9, roughness: 0.3, envMapIntensity: 1.4 }), [])
  const seam = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.0, 3.2), toneMapped: false }), [])
  const seam2 = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 2.2, 3.2), toneMapped: false }), [])
  useFrame((_, dt) => {
    if (!g.current) return
    g.current.children[0].rotation.z += dt * 0.05
    g.current.children[1].rotation.z -= dt * 0.035
  })
  return (
    <group ref={g} position={[0, 9.5, 0]}>
      <group rotation={[Math.PI / 2 + 0.25, 0.1, 0]}>
        <mesh material={metal}><torusGeometry args={[8.5, 0.35, 12, 160]} /></mesh>
        <mesh material={seam}><torusGeometry args={[8.5, 0.37, 4, 160, Math.PI * 1.2]} /></mesh>
      </group>
      <group rotation={[Math.PI / 2 - 0.35, -0.2, 0.3]}>
        <mesh material={metal}><torusGeometry args={[6.2, 0.22, 12, 140]} /></mesh>
        <mesh material={seam2}><torusGeometry args={[6.2, 0.235, 4, 140, Math.PI * 0.7]} /></mesh>
      </group>
    </group>
  )
}

function Floor({ low }: { low: boolean }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[40, 64]} />
        {low ? <meshStandardMaterial color="#07060f" metalness={0.8} roughness={0.4} /> : (
          <MeshReflectorMaterial blur={[260, 80]} resolution={512} mixBlur={1} mixStrength={28} roughness={0.85}
            depthScale={1.1} minDepthThreshold={0.4} maxDepthThreshold={1.4} color="#07060f" metalness={0.7} mirror={0.6} />
        )}
      </mesh>
      <Grid position={[0, 0.005, 0]} infiniteGrid cellSize={0.6} sectionSize={3} cellColor="#2a2260" sectionColor="#5a46c8"
        cellThickness={0.5} sectionThickness={0.9} fadeDistance={26} fadeStrength={2.5} />
    </group>
  )
}

useGLTF.preload(asset(HERO))
