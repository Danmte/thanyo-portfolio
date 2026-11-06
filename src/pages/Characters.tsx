import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { HudFrame } from '../components/HudFrame'
import { CharacterStage, StageLoader } from '../components/CharacterStage'
import type { AnimApi, Backdrop, StageOptions } from '../components/CharacterStage'
import { HudRings, PixelField, Tag } from '../components/Hud'
import { Icon } from '../components/Icon'
import { characters } from '../data/characters'
import { asset } from '../lib/asset'
import { sfx } from '../lib/sfx'
import { useKeys } from '../lib/useKeys'

type Drawer = 'backdrop' | null
const speeds = [0.25, 0.5, 1, 1.5, 2]
const fmt = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`

export default function Characters() {
  const [idx, setIdx] = useState(0)
  const [api, setApi] = useState<AnimApi | null>(null)
  const [drawer, setDrawer] = useState<Drawer>(null)
  const [opts, setOpts] = useState<StageOptions>({
    wireframe: false, autoRotate: false, shadows: true, backdrop: 'paper', lighting: 'flat', resetKey: 0, // flat only (Thanyo's choice)
  })
  const [, setTick] = useState(0) // re-render when the clip changes
  const c = characters[idx]
  const onApi = useCallback((a: AnimApi | null) => setApi(a), [])

  const pick = (i: number) => {
    const n = (i + characters.length) % characters.length
    if (n === idx) return
    sfx('switch'); setIdx(n)
  }
  const set = <K extends keyof StageOptions>(k: K, v: StageOptions[K]) => { sfx('hover'); setOpts((o) => ({ ...o, [k]: v })) }
  const toggleDrawer = (d: Drawer) => { sfx('hover'); setDrawer((cur) => (cur === d ? null : d)) }
  const playClip = (n: string) => { sfx('hover'); api?.play(n); setTick((t) => t + 1) }

  useKeys({
    q: () => pick(idx - 1), e: () => pick(idx + 1),
    f: () => set('wireframe', !opts.wireframe), r: () => set('autoRotate', !opts.autoRotate),
    c: () => set('resetKey', opts.resetKey + 1),
    ' ': () => api?.setPaused(!api.paused()),
  })

  const specs = c.specs
  return (
    <HudFrame title="OPERATOR" sub="MODEL VIEWER" code="MT-S-1" className={`viewer bg-${opts.backdrop}`}>
      <div className="op" style={{ ['--accent' as string]: c.color }}>
        <div className="op-ghost" aria-hidden>{c.name}</div>
        <HudRings className="op-rings" size={820} />
        <PixelField seed={idx * 7 + 3} count={22} className="op-pixels" />

        <div className="op-stage">
          <CharacterStage character={c} options={opts} onApi={onApi} />
          <StageLoader />
        </div>

        {/* roster rail */}
        <nav className="op-roster">
          {characters.map((ch, i) => (
            <button key={ch.id} className={`op-avatar ${i === idx ? 'on' : ''}`} onClick={() => pick(i)} onMouseEnter={() => sfx('hover')} title={ch.name}>
              {ch.avatar ? <img src={asset(ch.avatar)} alt="" /> : <span>{ch.name.slice(0, 2)}</span>}
            </button>
          ))}
        </nav>

        {/* left: identity + attributes */}
        <section className="op-left" key={c.id}>
          <div className="op-name">
            <span className="op-badge"><i /></span>
            <div><h2>{c.name}</h2><small>{c.title}</small></div>
          </div>
          <div className="op-tags">{c.tools.map((t) => <span key={t}>{t}</span>)}</div>
          <h3 className="op-head">Attributes<i>···</i></h3>
          <div className="op-attrs">
            {c.stats.map((s) => (
              <div key={s.label} className="op-attr">
                <small>{s.label}</small>
                <b>{s.value}</b>
                <i style={{ width: `${s.value}%` }} />
              </div>
            ))}
          </div>
          <h3 className="op-head">Data</h3>
          <dl className="op-specs">{specs.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl>
          <p className="op-desc">{c.description}</p>
          {!c.model && <p className="op-note">* หุ่นตัวอย่าง — ใส่ .glb ใน public/models/ แล้วตั้ง model ใน src/data/characters.ts</p>}
        </section>

        {/* right: level block + clip list + vertical banner */}
        <section className="op-right" key={c.id + 'r'}>
          <div className="op-level">
            <b>{String(api?.names.length ?? 0).padStart(2, '0')}</b>
            <div><small>CLIPS</small><span>Elite <i>◆◆◆</i></span></div>
          </div>
          <div className="op-clips">
            {api?.names.length ? api.names.map((n) => (
              <button key={n} className={api.current() === n ? 'on' : ''} onClick={() => playClip(n)}>
                <span>{n}</span><Icon name="play" size={12} />
              </button>
            )) : <p className="op-empty">ไม่มีแอนิเมชัน</p>}
          </div>
          <Tag code={`${String(idx + 1).padStart(2, '0')} / ${String(characters.length).padStart(2, '0')}`} label="OPERATOR FILE" />
        </section>
        <div className="op-banner" aria-hidden><span>{c.name}</span><small>{c.title.toUpperCase()}</small></div>

        <button className="op-arrow l" onClick={() => pick(idx - 1)} aria-label="Previous (Q)"><Icon name="prev" size={22} /></button>
        <button className="op-arrow r" onClick={() => pick(idx + 1)} aria-label="Next (E)"><Icon name="next" size={22} /></button>

        {/* bottom controls */}
        <div className="op-bottom">
          {drawer && (
            <div className="op-drawer">
              {drawer === 'backdrop' && (['paper', 'grid', 'dark'] as Backdrop[]).map((b) => (
                <button key={b} className={opts.backdrop === b ? 'on' : ''} onClick={() => set('backdrop', b)}>{b.toUpperCase()}</button>
              ))}
            </div>
          )}
          <Timeline api={api} />
          <nav className="op-tools">
            <Tool icon="image" label="Backdrop" on={drawer === 'backdrop'} onClick={() => toggleDrawer('backdrop')} />
            <Tool icon="wire" label="Wireframe" k="F" on={opts.wireframe} onClick={() => set('wireframe', !opts.wireframe)} />
            <Tool icon="shadow" label="Shadows" on={opts.shadows} onClick={() => set('shadows', !opts.shadows)} />
            <Tool icon="spin" label="Auto-spin" k="R" on={opts.autoRotate} onClick={() => set('autoRotate', !opts.autoRotate)} />
            <Tool icon="reset" label="Reset" k="C" onClick={() => set('resetKey', opts.resetKey + 1)} />
          </nav>
        </div>
      </div>
    </HudFrame>
  )
}

function Tool({ icon, label, on, onClick, k }: { icon: string; label: string; on?: boolean; onClick: () => void; k?: string }) {
  return (
    <button className={`op-tool ${on ? 'on' : ''}`} onClick={onClick} onMouseEnter={() => sfx('hover')} title={k ? `${label} (${k})` : label}>
      <Icon name={icon} size={16} /><span>{label}</span>
    </button>
  )
}

function Timeline({ api }: { api: AnimApi | null }) {
  const [, force] = useState(0)
  const [speed, setSpeed] = useState(2)
  const [loop, setLoop] = useState(true)
  useEffect(() => {
    let raf = 0
    const tick = () => { force((n) => (n + 1) % 1e6); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  useEffect(() => { api?.setSpeed(speeds[speed]); api?.setLoop(loop) }, [api, speed, loop])

  const dur = api?.duration() ?? 0
  const t = api ? Math.min(api.time() % (dur || 1), dur) : 0
  const paused = api?.paused() ?? true
  const step = (d: number) => {
    if (!api?.names.length) return
    const i = api.names.indexOf(api.current() ?? '')
    api.play(api.names[(i + d + api.names.length) % api.names.length])
  }
  const ctl = (children: ReactNode, onClick: () => void, title: string, on = false) => (
    <button className={`op-ctl ${on ? 'on' : ''}`} onClick={onClick} disabled={!api} title={title}>{children}</button>
  )
  return (
    <div className={`op-timeline ${api ? '' : 'disabled'}`}>
      {ctl(<Icon name="prev" />, () => step(-1), 'Previous clip')}
      {ctl(<Icon name={paused ? 'play' : 'pause'} />, () => api?.setPaused(!paused), 'Play / pause (Space)')}
      {ctl(<Icon name="next" />, () => step(1), 'Next clip')}
      {ctl(<span className="op-speed">{speeds[speed]}x</span>, () => setSpeed((s) => (s + 1) % speeds.length), 'Speed')}
      {ctl(<Icon name="loop" />, () => setLoop((l) => !l), 'Loop', loop)}
      <span className="op-clip">{api?.current() ?? 'NO CLIP'}</span>
      <input type="range" min={0} max={dur || 1} step={0.01} value={t} disabled={!api}
        onChange={(e) => { api?.setPaused(true); api?.seek(Number(e.target.value)) }}
        style={{ ['--p' as string]: `${dur ? (t / dur) * 100 : 0}%` }} />
      <span className="op-time">{fmt(t)} / {fmt(dur)}</span>
    </div>
  )
}
