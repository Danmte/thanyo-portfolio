import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from './Icon'
import type { AnimApi } from './Viewport'
import { sfx } from '../lib/sfx'

export function DockButton({ icon, label, on, active, onClick, k, disabled }: {
  icon: string; label: string; on?: boolean; active?: boolean; onClick: () => void; k?: string; disabled?: boolean
}) {
  // on = a toggle that is enabled (tinted), active = the panel/popover it opens is open (raised)
  return (
    <button className={`dock-btn ${on ? 'on' : ''} ${active ? 'active' : ''}`} onClick={() => { sfx('hover'); onClick() }}
      title={k ? `${label} (${k})` : label} disabled={disabled} aria-pressed={on || active}>
      <Icon name={icon} size={18} /><span>{label}</span>
    </button>
  )
}

const speeds = [0.25, 0.5, 1, 1.5, 2]
export const fmt = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`

export function Timeline({ api, label }: { api: AnimApi | null; label: (n: string) => string }) {
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
    <button className={`tl-btn ${on ? 'on' : ''}`} onClick={onClick} disabled={!api} title={title}>{children}</button>
  )
  return (
    <div className={`timeline ${api ? '' : 'off'}`}>
      {ctl(<Icon name="prev" size={16} />, () => step(-1), 'Previous animation')}
      {ctl(<Icon name={paused ? 'play' : 'pause'} size={14} />, () => api?.setPaused(!paused), 'Play / pause (Space)')}
      {ctl(<Icon name="next" size={16} />, () => step(1), 'Next animation')}
      {ctl(<span className="tl-speed">{speeds[speed]}x</span>, () => setSpeed((s) => (s + 1) % speeds.length), 'Playback speed')}
      {ctl(<Icon name="loop" size={15} />, () => setLoop((l) => !l), 'Loop', loop)}
      <span className="tl-clip">{api?.current() ? label(api.current()!) : 'No animation'}</span>
      <input type="range" min={0} max={dur || 1} step={0.01} value={t} disabled={!api} aria-label="Scrub animation"
        onChange={(e) => { api?.setPaused(true); api?.seek(Number(e.target.value)) }}
        style={{ ['--p' as string]: `${dur ? (t / dur) * 100 : 0}%` }} />
      <span className="tl-time">{fmt(t)} / {fmt(dur)}</span>
    </div>
  )
}
