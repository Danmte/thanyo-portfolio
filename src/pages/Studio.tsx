import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Viewport, ViewportLoader } from '../components/Viewport'
import type { AnimApi, ViewOptions } from '../components/Viewport'
import { DockButton, Timeline } from '../components/Dock'
import { AnimList, BackdropPicker, FacePicker, ModelPicker } from '../components/Popovers'
import { Icon } from '../components/Icon'
import { useSite } from '../content/store'
import { sfx, toggleMute, useMuted } from '../lib/sfx'
import { useKeys } from '../lib/useKeys'

type Pop = 'models' | 'anims' | 'bg' | 'faces' | null

/** Full-screen 3D viewer (Warfarin-Studio style). Reached from "เปิดเต็มจอ". */
export default function Studio() {
  const { site } = useSite()
  const nav = useNavigate()
  const models = site.models
  const [idx, setIdx] = useState(0)
  const [api, setApi] = useState<AnimApi | null>(null)
  const [pop, setPop] = useState<Pop>(null)
  const [face, setFace] = useState<number[] | null>(null)
  const [hideUi, setHideUi] = useState(false)
  const [info, setInfo] = useState(() => window.innerWidth > 640)
  const [opts, setOpts] = useState<ViewOptions>({ wireframe: false, autoRotate: false, shadows: true, backdrop: 'light', resetKey: 0 })
  const muted = useMuted()
  const m = models[Math.min(idx, models.length - 1)]
  const onApi = useCallback((a: AnimApi | null) => setApi(a), [])
  const label = (n: string) => n
  const set = <K extends keyof ViewOptions>(k: K, v: ViewOptions[K]) => setOpts((o) => ({ ...o, [k]: v }))
  const togglePop = (p: Pop) => setPop((cur) => (cur === p ? null : p))
  const pick = (i: number) => { if (i !== idx) { sfx('switch'); setIdx(i); setFace(null) } setPop(null) }
  useEffect(() => { document.body.classList.add('no-scroll'); return () => document.body.classList.remove('no-scroll') }, [])
  const fullscreen = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}) }

  useKeys({
    ' ': () => api?.setPaused(!api.paused()),
    f: () => set('wireframe', !opts.wireframe),
    r: () => set('autoRotate', !opts.autoRotate),
    c: () => set('resetKey', opts.resetKey + 1),
    h: () => setHideUi((v) => !v),
    escape: () => { if (pop) setPop(null); else nav('/') },
  })
  if (!m) return <div className="studio bg-light"><p className="pad">ยังไม่มีโมเดล</p></div>

  return (
    <div className={`studio bg-${opts.backdrop} ${hideUi ? 'ui-hidden' : ''}`}>
      <div className="viewport">{m.model && <Viewport model={m} options={opts} shift={0} onApi={onApi} face={face} />}</div>
      <ViewportLoader />

      <div className="corner tl">
        <button className="icon-btn" onClick={() => nav('/')} aria-label="Back to site" title="กลับหน้าเว็บ (Esc)"><Icon name="back" /></button>
        <div className="brand"><b>{site.site.name}</b><span>Studio</span><small>{site.site.role}</small></div>
      </div>
      <div className="corner tr">
        <button className="icon-btn" onClick={() => setHideUi((v) => !v)} aria-label="Hide interface (H)" title="Hide interface (H)"><Icon name={hideUi ? 'eye' : 'eyeOff'} /></button>
        <button className="icon-btn" onClick={fullscreen} aria-label="Fullscreen" title="Fullscreen"><Icon name="full" /></button>
        <button className="icon-btn" onClick={toggleMute} aria-label={muted ? 'Sound off' : 'Sound on'}><Icon name={muted ? 'mute' : 'sound'} /></button>
      </div>

      {info && (
        <section className="model-card-info" key={m.id}>
          <header><small>{m.kind}</small><button className="icon-btn sm" onClick={() => setInfo(false)} aria-label="Hide model info"><Icon name="close" size={14} /></button></header>
          <h1>{m.name}</h1>
          <p className="muted">{m.title}</p>
          <p className="body">{m.description}</p>
          <dl className="facts compact">{m.specs.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl>
          <div className="chips">{m.tools.map((t) => <em key={t} className="pill">{t}</em>)}</div>
        </section>
      )}
      <div className="corner bl">
        <button className={`icon-btn ${info ? 'on' : ''}`} onClick={() => setInfo((v) => !v)} aria-label="Model info" title="Model info"><Icon name="info" /></button>
      </div>

      <div className="bottom">
        {pop === 'models' && <ModelPicker models={models} current={m.id} onPick={pick} onClose={() => setPop(null)} />}
        {pop === 'anims' && <AnimList api={api} label={label} onClose={() => setPop(null)} />}
        {pop === 'faces' && m?.faces && <FacePicker fb={m.faces} value={face} onPick={setFace} onClose={() => setPop(null)} />}
        {pop === 'bg' && <BackdropPicker value={opts.backdrop} onPick={(b) => { sfx('hover'); set('backdrop', b) }} onClose={() => setPop(null)} />}
        <Timeline api={api} label={label} />
        <nav className="dock" aria-label="Studio tools">
          <div className="dock-group">
            <DockButton icon="cube" label="Models" active={pop === 'models'} onClick={() => togglePop('models')} />
            <DockButton icon="film" label="Animations" active={pop === 'anims'} onClick={() => togglePop('anims')} disabled={!api} />
            {m?.faces && <DockButton icon="smile" label="Faces" active={pop === 'faces'} on={!!face} onClick={() => togglePop('faces')} />}
            <DockButton icon="palette" label="Backgrounds" active={pop === 'bg'} onClick={() => togglePop('bg')} />
          </div>
          <div className="dock-group">
            <DockButton icon="wire" label="Wireframe" k="F" on={opts.wireframe} onClick={() => set('wireframe', !opts.wireframe)} />
            <DockButton icon="shadow" label="Shadows" on={opts.shadows} onClick={() => set('shadows', !opts.shadows)} />
            <DockButton icon="spin" label="Auto-spin" k="R" on={opts.autoRotate} onClick={() => set('autoRotate', !opts.autoRotate)} />
            <DockButton icon="reset" label="Reset view" k="C" onClick={() => set('resetKey', opts.resetKey + 1)} />
          </div>
        </nav>
      </div>
      {hideUi && <button className="show-ui" onClick={() => setHideUi(false)}><Icon name="up" size={16} />Show interface</button>}
    </div>
  )
}
