import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, Lightformer, OrbitControls, useAnimations, useGLTF, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { Character } from '../data/characters'
import { asset } from '../lib/asset'

export type Backdrop = 'paper' | 'grid' | 'dark'
export type Lighting = 'studio' | 'rim' | 'flat'
export type StageOptions = {
  wireframe: boolean
  autoRotate: boolean
  shadows: boolean
  backdrop: Backdrop
  lighting: Lighting
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
  seek: (t: number) => void
  setSpeed: (s: number) => void
  setLoop: (loop: boolean) => void
}

// The page behind the (transparent) canvas provides the backdrop; only the floor lines change here.
const floorInk: Record<Backdrop, { line: string; grid: boolean }> = {
  paper: { line: '#b69cff', grid: false },
  grid: { line: '#8b5cff', grid: true },
  dark: { line: '#e8e9eb', grid: true },
}

export function CharacterStage({ character, options, onApi }: {
  character: Character
  options: StageOptions
  onApi: (api: AnimApi | null) => void
}) {
  const f = floorInk[options.backdrop]
  return (
    <Canvas className="stage-canvas" shadows="percentage" dpr={[1, 2]} gl={{ alpha: true }} camera={{ position: [0, 1.3, 5.8], fov: 30 }}>
      <Lights lighting={options.lighting} shadows={options.shadows} color={character.color} />

      {f.grid && <Grid position={[0, 0.001, 0]} infiniteGrid cellSize={0.5} sectionSize={2.5} cellColor={f.line}
        sectionColor={f.line} cellThickness={0.4} sectionThickness={0.8} fadeDistance={9} fadeStrength={3} />}
      {/* HUD floor rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[1.05, 1.065, 128]} />
        <meshBasicMaterial color={f.line} transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[0.78, 0.8, 96, 1, 0, Math.PI * 1.3]} />
        <meshBasicMaterial color={character.color} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[1.5, 1.505, 128]} />
        <meshBasicMaterial color={f.line} transparent opacity={0.25} toneMapped={false} />
      </mesh>
      {options.shadows && <ContactShadows position={[0, 0.004, 0]} opacity={0.55} scale={5} blur={2.4} far={2.5} />}

      <ModelBoundary key={character.id} fallback={<PlaceholderModel character={character} wireframe={options.wireframe} onApi={onApi} />}>
        <Suspense fallback={null}>
          <Spawn>
            {character.model
              ? <GltfModel url={asset(character.model)} wireframe={options.wireframe} onApi={onApi} defaultClip={character.defaultClip} />
              : <PlaceholderModel character={character} wireframe={options.wireframe} onApi={onApi} />}
          </Spawn>
        </Suspense>
      </ModelBoundary>

      <Controls autoRotate={options.autoRotate} resetKey={options.resetKey} />
    </Canvas>
  )
}

function Lights({ lighting, shadows, color }: { lighting: Lighting; shadows: boolean; color: string }) {
  if (lighting === 'flat') return <ambientLight intensity={2.6} />
  const rim = lighting === 'rim'
  return (
    <>
      <ambientLight intensity={rim ? 0.15 : 0.5} />
      <hemisphereLight args={['#ffffff', '#8a8f99', rim ? 0.2 : 0.7]} />
      <directionalLight position={[3, 5, 4]} intensity={rim ? 0.8 : 2.2} castShadow={shadows} shadow-mapSize={[1024, 1024]} />
      <spotLight position={[-2.5, 3, -3]} intensity={rim ? 90 : 25} angle={0.7} penumbra={1} color={rim ? color : '#ffffff'} />
      {rim && <spotLight position={[2.5, 2, -3]} intensity={60} angle={0.7} penumbra={1} color={color} />}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={rim ? 0.4 : 1.6} position={[0, 4, 3]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1} position={[-4, 1, -2]} scale={[2, 4, 1]} color={color} />
      </Environment>
    </>
  )
}

function Controls({ autoRotate, resetKey }: { autoRotate: boolean; resetKey: number }) {
  const ref = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  useEffect(() => { if (resetKey) ref.current?.reset() }, [resetKey])
  return (
    <OrbitControls ref={ref} target={[0, 0.9, 0]} enablePan={false} minDistance={1.6} maxDistance={10}
      minPolarAngle={0.2} maxPolarAngle={Math.PI / 2 - 0.03} autoRotate={autoRotate} autoRotateSpeed={1.2}
      enableDamping makeDefault />
  )
}

/** Pop-in whenever a new character mounts. */
function Spawn({ children }: { children: ReactNode }) {
  const g = useRef<THREE.Group>(null)
  const t = useRef(0)
  useFrame((_, dt) => {
    if (!g.current || t.current >= 1) return
    t.current = Math.min(1, t.current + dt * 2.2)
    const e = 1 - Math.pow(1 - t.current, 3)
    g.current.position.y = (1 - e) * 0.5
    g.current.scale.setScalar(0.88 + 0.12 * e)
    g.current.rotation.y = (1 - e) * -1.1
  })
  return <group ref={g}>{children}</group>
}

/** DOM overlay (outside the Canvas) — drei's <Html> crashes on unmount under React 19. */
export function StageLoader() {
  const { active, progress } = useProgress()
  if (!active) return null
  return <div className="stage-loader">LOADING {progress.toFixed(0)}%</div>
}

class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err: unknown) { console.warn('Model failed to load, showing placeholder.', err) }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

/** Wraps a model, drives its clips with a mixer and hands an AnimApi to the UI. */
function AnimatedRig({ clips, onApi, children, defaultClip }: { clips: THREE.AnimationClip[]; onApi: (a: AnimApi | null) => void; children: ReactNode; defaultClip?: string }) {
  const ref = useRef<THREE.Group>(null)
  const { actions, mixer, names } = useAnimations(clips, ref)
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
        if (prev && prev !== next) prev.fadeOut(0.25)
        next.reset().fadeIn(prev ? 0.25 : 0).play()
        cur = name
      },
      paused: () => act()?.paused ?? true,
      setPaused(p) { const a = act(); if (a) a.paused = p },
      time: () => act()?.time ?? 0,
      duration: () => act()?.getClip().duration ?? 0,
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

/** Loads a GLB/GLTF and scales it to ~1.9 units tall with feet on the floor. */
function GltfModel({ url, wireframe, onApi, defaultClip }: { url: string; wireframe: boolean; onApi: (a: AnimApi | null) => void; defaultClip?: string }) {
  const { scene, animations } = useGLTF(url)
  const wrapper = useMemo(() => {
    const m = cloneSkinned(scene)
    m.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map(toFlat) : toFlat(mesh.material)
      }
    })
    // scale a wrapper, so clips that animate the root node don't undo it
    const w = new THREE.Group()
    w.add(m)
    const box = new THREE.Box3().setFromObject(m)
    const size = box.getSize(new THREE.Vector3())
    const s = 1.9 / Math.max(size.y, size.x * 0.8, 0.001)
    w.scale.setScalar(s)
    const box2 = new THREE.Box3().setFromObject(w)
    const c = box2.getCenter(new THREE.Vector3())
    w.position.set(-c.x, -box2.min.y, -c.z)
    return w
  }, [scene])
  useLayoutEffect(() => { setWireframe(wrapper, wireframe) }, [wrapper, wireframe])
  return <AnimatedRig clips={animations} onApi={onApi} defaultClip={defaultClip}><primitive object={wrapper} /></AnimatedRig>
}

/** All character 3D on the site is FLAT: unlit, texture colour only (Thanyo's choice). */
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
    mats.forEach((m) => { (m as THREE.MeshStandardMaterial).wireframe = on })
  })
}

// ---------- Placeholder figures + demo clips (shown until you add a .glb) ----------

function makeDemoClips(kind: Character['placeholder']) {
  const V = THREE.VectorKeyframeTrack
  const Q = THREE.QuaternionKeyframeTrack
  const qy = (a: number) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a).toArray()
  const idle = kind === 'drone'
    ? new THREE.AnimationClip('Hover', 2.4, [new V('rig.position', [0, 1.2, 2.4], [0, 0, 0, 0, 0.12, 0, 0, 0, 0])])
    : new THREE.AnimationClip('Idle', 2.4, [new V('rig.scale', [0, 1.2, 2.4], [1, 1, 1, 1.01, 1.015, 1.01, 1, 1, 1])])
  const jump = new THREE.AnimationClip('Jump', 1.2, [
    new V('rig.position', [0, 0.25, 0.55, 0.85, 1.2], [0, 0, 0, 0, 0, 0, 0, 0.45, 0, 0, 0, 0, 0, 0, 0]),
    new V('rig.scale', [0, 0.25, 0.4, 0.85, 0.95, 1.2], [1, 1, 1, 1.08, 0.88, 1.08, 0.95, 1.08, 0.95, 1, 1, 1, 1.06, 0.92, 1.06, 1, 1, 1]),
  ])
  const spin = new THREE.AnimationClip('Spin', 1.6, [
    new Q('rig.quaternion', [0, 0.4, 0.8, 1.2, 1.6], [...qy(0), ...qy(Math.PI / 2), ...qy(Math.PI), ...qy(Math.PI * 1.5), ...qy(Math.PI * 2)]),
  ])
  return [idle, jump, spin]
}

function PlaceholderModel({ character, wireframe, onApi }: { character: Character; wireframe: boolean; onApi: (a: AnimApi | null) => void }) {
  const clips = useMemo(() => makeDemoClips(character.placeholder), [character.placeholder])
  const body = <meshStandardMaterial color="#5b6676" metalness={0.45} roughness={0.45} wireframe={wireframe} />
  const accent = <meshStandardMaterial color={character.color} emissive={character.color} emissiveIntensity={1.2} toneMapped={false} wireframe={wireframe} />
  const trim = <meshStandardMaterial color="#e4e8ee" metalness={0.6} roughness={0.3} wireframe={wireframe} />
  return (
    <AnimatedRig clips={clips} onApi={onApi}>
      <group name="rig">
        {character.placeholder === 'drone' ? <Drone body={body} accent={accent} trim={trim} />
          : character.placeholder === 'mage' ? <Mage body={body} accent={accent} trim={trim} />
          : <Knight body={body} accent={accent} trim={trim} />}
      </group>
    </AnimatedRig>
  )
}

type Mats = { body: ReactNode; accent: ReactNode; trim: ReactNode }

function Part({ children, mat, ...props }: { children: ReactNode; mat: ReactNode } & React.ComponentProps<'mesh'>) {
  return <mesh castShadow receiveShadow {...props}>{children}{mat}</mesh>
}

function Knight({ body, accent, trim }: Mats) {
  return (
    <group>
      <Part mat={body} position={[-0.14, 0.42, 0]}><capsuleGeometry args={[0.09, 0.62, 6, 16]} /></Part>
      <Part mat={body} position={[0.14, 0.42, 0]}><capsuleGeometry args={[0.09, 0.62, 6, 16]} /></Part>
      <Part mat={trim} position={[-0.14, 0.08, 0.04]}><boxGeometry args={[0.18, 0.14, 0.3]} /></Part>
      <Part mat={trim} position={[0.14, 0.08, 0.04]}><boxGeometry args={[0.18, 0.14, 0.3]} /></Part>
      <Part mat={body} position={[0, 1.08, 0]}><capsuleGeometry args={[0.24, 0.42, 8, 20]} /></Part>
      <Part mat={trim} position={[0, 1.18, 0.12]}><boxGeometry args={[0.44, 0.36, 0.22]} /></Part>
      <Part mat={accent} position={[0, 1.2, 0.235]}><boxGeometry args={[0.12, 0.12, 0.02]} /></Part>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Part mat={trim} position={[s * 0.36, 1.38, 0]}><sphereGeometry args={[0.14, 20, 16]} /></Part>
          <Part mat={body} position={[s * 0.4, 1.02, 0]} rotation={[0, 0, s * 0.08]}><capsuleGeometry args={[0.07, 0.52, 6, 12]} /></Part>
        </group>
      ))}
      <Part mat={trim} position={[0, 1.66, 0]}><sphereGeometry args={[0.16, 24, 20]} /></Part>
      <Part mat={accent} position={[0, 1.67, 0.13]}><boxGeometry args={[0.22, 0.04, 0.06]} /></Part>
      <group position={[0.52, 0.72, 0.08]} rotation={[0.1, 0, -0.1]}>
        <Part mat={accent} position={[0, -0.15, 0]}><boxGeometry args={[0.04, 0.9, 0.015]} /></Part>
        <Part mat={trim} position={[0, 0.32, 0]}><boxGeometry args={[0.2, 0.04, 0.05]} /></Part>
      </group>
    </group>
  )
}

function Mage({ body, accent, trim }: Mats) {
  const orb = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!orb.current) return
    const t = clock.elapsedTime
    orb.current.position.set(Math.cos(t) * 0.55, 1.3 + Math.sin(t * 2) * 0.08, Math.sin(t) * 0.55)
  })
  return (
    <group>
      <Part mat={body} position={[0, 0.55, 0]}><coneGeometry args={[0.42, 1.1, 32, 1, true]} /></Part>
      <Part mat={body} position={[0, 1.15, 0]}><capsuleGeometry args={[0.18, 0.3, 8, 16]} /></Part>
      <Part mat={accent} position={[0, 0.98, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.2, 0.025, 8, 32]} /></Part>
      <Part mat={trim} position={[0, 1.55, 0]}><sphereGeometry args={[0.14, 24, 20]} /></Part>
      <Part mat={body} position={[0, 1.78, -0.02]} rotation={[-0.15, 0, 0]}><coneGeometry args={[0.24, 0.55, 24]} /></Part>
      <Part mat={accent} position={[0, 1.56, 0.12]}><boxGeometry args={[0.16, 0.025, 0.04]} /></Part>
      <group position={[-0.42, 0.95, 0.1]}>
        <Part mat={trim}><cylinderGeometry args={[0.02, 0.025, 1.9, 8]} /></Part>
        <Part mat={accent} position={[0, 1.0, 0]}><octahedronGeometry args={[0.09]} /></Part>
      </group>
      <group ref={orb}><Part mat={accent}><icosahedronGeometry args={[0.06, 1]} /></Part></group>
    </group>
  )
}

function Drone({ body, accent, trim }: Mats) {
  const rotor = useRef<THREE.Group>(null)
  useFrame((_, dt) => { if (rotor.current) rotor.current.rotation.y += dt * 2 })
  return (
    <group position={[0, 1.05, 0]}>
      <Part mat={body}><sphereGeometry args={[0.38, 32, 24]} /></Part>
      <Part mat={trim} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.4, 0.04, 12, 48]} /></Part>
      <Part mat={accent} position={[0, 0.02, 0.34]}><sphereGeometry args={[0.1, 24, 16]} /></Part>
      <group ref={rotor}>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
            <Part mat={trim} position={[0.62, 0, 0]}><boxGeometry args={[0.34, 0.04, 0.06]} /></Part>
            <Part mat={accent} position={[0.82, 0, 0]}><cylinderGeometry args={[0.07, 0.07, 0.08, 16]} /></Part>
          </group>
        ))}
      </group>
      <Part mat={trim} position={[0, -0.45, 0]}><coneGeometry args={[0.12, 0.2, 6]} /></Part>
    </group>
  )
}
