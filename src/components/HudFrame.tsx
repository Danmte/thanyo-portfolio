import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { profile } from '../data/profile'
import { sfx, toggleMute, useMuted } from '../lib/sfx'
import { useKeys } from '../lib/useKeys'
import { Icon } from './Icon'

type Hint = { keys: string; label: string }

/** Page chrome: angled back/home chips, section title, status chips, key hints. */
export function HudFrame({ title, sub, code, hints = [], children, tone = 'light', className = '' }: {
  title: string
  sub?: string
  code?: string
  hints?: Hint[]
  children: ReactNode
  tone?: 'light' | 'dark'
  className?: string
}) {
  const nav = useNavigate()
  const muted = useMuted()
  const back = () => { sfx('back'); nav('/menu') }
  useKeys({ Escape: back, Backspace: back })

  return (
    <div className={`frame tone-${tone} page-enter ${className}`}>
      <header className="frame-top">
        <nav className="chip-group">
          <button className="chip" onClick={back} onMouseEnter={() => sfx('hover')} aria-label="Back"><Icon name="prev" /></button>
          <button className="chip" onClick={() => { sfx('back'); nav('/') }} onMouseEnter={() => sfx('hover')} aria-label="Title"><Icon name="home" /></button>
        </nav>
        <div className="frame-title">
          {code && <span className="frame-code">{code}</span>}
          <h1>{title}</h1>
          {sub && <span className="frame-sub">{sub}</span>}
        </div>
        <div className="frame-status">
          <span className="stat-chip"><small>LV</small>{profile.level}</span>
          <span className="stat-chip"><small>ID</small>{profile.name}</span>
          <button className="chip chip-text" onClick={toggleMute}>{muted ? 'SFX OFF' : 'SFX ON'}</button>
        </div>
      </header>
      <main className="frame-body">{children}</main>
      {hints.length > 0 && (
        <footer className="frame-hints">
          {hints.map((h) => <span key={h.label}><kbd>{h.keys}</kbd>{h.label}</span>)}
        </footer>
      )}
    </div>
  )
}

export function StatBar({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="stat">
      <div className="stat-head"><span>{label}</span><span className="num">{value}</span></div>
      <div className="stat-track"><div className="stat-fill" style={{ width: `${value}%`, background: color }} /></div>
    </div>
  )
}
