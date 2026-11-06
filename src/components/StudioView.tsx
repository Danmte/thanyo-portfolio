import { Component, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Viewport } from './Viewport'
import type { AnimApi, ViewOptions } from './Viewport'
import { DockButton, Timeline } from './Dock'
import { AnimList, BackdropPicker, FacePicker, ModelPicker } from './Popovers'
import { Icon } from './Icon'
import { useSite } from '../content/store'
import { AddItem, ItemTools, T } from '../content/Editable'
import { blank } from '../content/types'
import { asset } from '../lib/asset'
import { sfx } from '../lib/sfx'

type Pop = 'models' | 'anims' | 'bg' | 'faces' | null

/** Mounts children only while the element is near the viewport (saves the GPU on long pages). */
function useNearView<T extends Element>(margin = '300px') {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [margin])
  return [ref, near] as const
}

/**
 * Live 3D viewer for the web page.
 *  variant "card":    hero card — model chip, compact dock.
 *  variant "section": the 3D Studio section — model info + model list + full dock.
 */
export function StudioView(props: { variant: 'card' | 'section' }) {
  return <ViewerBoundary><StudioViewInner {...props} /></ViewerBoundary>
}

/** If WebGL fails, show a quiet message instead of blanking the whole page. */
class ViewerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(e: unknown) { console.warn('3D viewer crashed', e) }
  render() {
    return this.state.failed
      ? <div className="viewer viewer-failed bg-light"><p>โหลด 3D ไม่สำเร็จ — ลองรีเฟรช หรือเปิดใน Chrome ที่เปิด hardware acceleration</p></div>
      : this.props.children
  }
}

function StudioViewInner({ variant }: { variant: 'card' | 'section' }) {
  const { site, edit } = useSite()
  const models = site.models
  const [idx, setIdx] = useState(0)
  const [api, setApi] = useState<AnimApi | null>(null)
  const [pop, setPop] = useState<Pop>(null)
  const [face, setFace] = useState<number[] | null>(null) // manual expression; null = follow the animation
  const [opts, setOpts] = useState<ViewOptions>({ wireframe: false, autoRotate: false, shadows: true, backdrop: 'light', resetKey: 0 })
  const [ref, near] = useNearView<HTMLDivElement>()
  const onApi = useCallback((a: AnimApi | null) => setApi(a), [])
  const i = Math.min(idx, Math.max(0, models.length - 1))
  const m = models[i]
  const set = <K extends keyof ViewOptions>(k: K, v: ViewOptions[K]) => setOpts((o) => ({ ...o, [k]: v }))
  const toggle = (p: Pop) => setPop((c) => (c === p ? null : p))
  const label = (n: string) => n
  const pick = (n: number) => { if (n !== i) { sfx('switch'); setIdx(n); setFace(null) } setPop(null) }

  const card = variant === 'card'
  return (
    <div ref={ref} className={`viewer viewer-${variant} bg-${opts.backdrop}`}>
      <div className="viewer-stage">
        {near && m?.model ? <Viewport model={m} options={opts} shift={0} onApi={onApi} face={face} />
          : <div className="viewer-empty">{m && !m.model ? 'ยังไม่มีไฟล์โมเดล — กด “แก้ไข” แล้วอัปโหลด .glb' : ''}</div>}
      </div>

      {card ? (
        <>
          <div className="v-chip"><b>{m?.name}</b><small>{m?.title}</small></div>
          <div className="v-tools">
            <Link className="icon-btn" to="/studio" title="Full screen studio"><Icon name="full" /></Link>
          </div>
          <span className="v-hint"><Icon name="drag" size={14} />ลากเพื่อหมุน</span>
        </>
      ) : (
        <>
          {m && (
            <section className="v-info" key={m.id}>
              <header><small>{m.kind}</small><ItemTools list={['models']} index={i} title={m.name} /></header>
              <T path={['models', i, 'name']} as="h3" />
              <T path={['models', i, 'title']} as="p" className="muted" />
              <T path={['models', i, 'description']} as="p" className="v-desc" multiline />
              <dl className="facts compact">{m.specs.map((s, k) => <div key={k}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl>
              <div className="chips">{m.tools.map((t) => <em key={t} className="pill">{t}</em>)}</div>
            </section>
          )}
          <nav className="v-models" aria-label="Models">
            <small>Models</small>
            {models.map((x, n) => (
              <button key={x.id} className={n === i ? 'on' : ''} onClick={() => pick(n)}>
                <span className="thumb">{x.thumb ? <img src={asset(x.thumb)} alt="" /> : <Icon name="cube" />}</span>
                <span><b>{x.name}</b><small>{x.kind}</small></span>
              </button>
            ))}
            <AddItem list={['models']} make={blank.model} label="+ เพิ่มโมเดล" className="dark" />
          </nav>
        </>
      )}

      <div className="v-bottom">
        {pop === 'models' && <ModelPicker models={models} current={m?.id ?? ''} onPick={pick} onClose={() => setPop(null)} />}
        {pop === 'anims' && <AnimList api={api} label={label} onClose={() => setPop(null)} />}
        {pop === 'faces' && m?.faces && <FacePicker fb={m.faces} value={face} onPick={setFace} onClose={() => setPop(null)} />}
        {pop === 'bg' && <BackdropPicker value={opts.backdrop} onPick={(b) => set('backdrop', b)} onClose={() => setPop(null)} />}
        <Timeline api={api} label={label} />
        <nav className="dock" aria-label="Viewer tools">
          <div className="dock-group">
            {card && <DockButton icon="cube" label="Models" active={pop === 'models'} onClick={() => toggle('models')} />}
            <DockButton icon="film" label="Animations" active={pop === 'anims'} onClick={() => toggle('anims')} disabled={!api} />
            {m?.faces && <DockButton icon="smile" label="Faces" active={pop === 'faces'} on={!!face} onClick={() => toggle('faces')} />}
            <DockButton icon="palette" label="Backgrounds" active={pop === 'bg'} onClick={() => toggle('bg')} />
          </div>
          <div className="dock-group">
            <DockButton icon="wire" label="Wireframe" on={opts.wireframe} onClick={() => set('wireframe', !opts.wireframe)} />
            {!card && <DockButton icon="shadow" label="Shadows" on={opts.shadows} onClick={() => set('shadows', !opts.shadows)} />}
            <DockButton icon="spin" label="Auto-spin" on={opts.autoRotate} onClick={() => set('autoRotate', !opts.autoRotate)} />
            <DockButton icon="reset" label="Reset" onClick={() => set('resetKey', opts.resetKey + 1)} />
          </div>
        </nav>
      </div>
      {edit && card && <span className="v-note">แก้โมเดลได้ที่ส่วน 3D Studio ด้านล่าง</span>}
    </div>
  )
}
