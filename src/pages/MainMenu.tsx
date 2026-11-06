import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Glitch } from '../components/Hud'
import { Icon } from '../components/Icon'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { characters } from '../data/characters'
import { artworks } from '../data/artworks'
import { menuAccent } from '../lib/menuAccent'
import { sfx, toggleMute, useMuted } from '../lib/sfx'
import { useKeys } from '../lib/useKeys'

const items = [
  { to: '/projects', label: 'GAMES', sub: 'OPERATION', script: 'Play', desc: 'โปรเจคเกมที่ทำ — ระบบ บทบาท และสิ่งที่หนูทำเอง', count: projects.length, icon: 'film' },
  { to: '/characters', label: 'MODELS', sub: 'OPERATOR', script: 'Shine', desc: 'ดูโมเดล 3D — หมุน ซูม เล่นแอนิเมชัน ดู wireframe', count: characters.length, icon: 'cube' },
  { to: '/gallery', label: 'GALLERY', sub: 'ARCHIVE', script: 'Paint', desc: 'ภาพวาด งาน 3D และ asset เกม', count: artworks.length, icon: 'image' },
  { to: '/profile', label: 'STATUS', sub: 'DOSSIER', script: 'Self', desc: 'เกี่ยวกับหนู สกิล และช่องทางติดต่อ', icon: 'info' },
]

/** Overlay for the menu view — the 3D hall shows the hero from the front behind this. */
export default function MainMenu() {
  const nav = useNavigate()
  const muted = useMuted()
  const [sel, setSel] = useState(0)
  useEffect(() => { menuAccent.set(sel) }, [sel])

  const move = (d: number) => { setSel((s) => (s + d + items.length) % items.length); sfx('hover') }
  const go = (i: number) => { sfx('select'); nav(items[i].to) }
  useKeys({
    ArrowUp: () => move(-1), w: () => move(-1),
    ArrowDown: () => move(1), s: () => move(1),
    Enter: () => go(sel), ' ': () => go(sel),
    Escape: () => { sfx('back'); nav('/') },
  })
  const now = new Date()

  return (
    <div className="overlay menu page-fade">
      <header className="menu-top">
        <div className="menu-logo"><span className="menu-logo-mark" /><b>{profile.name}</b><small>{profile.className}</small></div>
        <div className="menu-top-right">
          <span className="glass-chip"><small>LV</small>{profile.level}</span>
          <button className="glass-chip" onClick={toggleMute}>{muted ? 'SFX OFF' : 'SFX ON'}</button>
        </div>
      </header>

      <nav className="menu-list">
        {items.map((it, i) => (
          <button
            key={it.to}
            className={`menu-item ${i === sel ? 'active' : ''}`}
            style={{ ['--i' as string]: i }}
            onMouseEnter={() => { if (i !== sel) { setSel(i); sfx('hover') } }}
            onClick={() => go(i)}
          >
            <span className="menu-ico"><Icon name={it.icon} size={18} /></span>
            <span className="menu-text">
              {i === sel ? <Glitch className="menu-label">{it.label}</Glitch> : <span className="menu-label">{it.label}</span>}
              <small>{it.sub}{it.count !== undefined && ` · ${String(it.count).padStart(2, '0')}`}</small>
            </span>
            <i className="menu-arrow">›</i>
          </button>
        ))}
      </nav>

      <div className="menu-feature" key={sel}>
        <span className="menu-script">{items[sel].script}</span>
        <p>{items[sel].desc}</p>
        <button className="cta neon" onClick={() => go(sel)}><i />ENTER {items[sel].label}</button>
      </div>

      <footer className="menu-bar">
        <span className="menu-bar-badge">◆</span>
        <b>ARCHIVE HALL</b>
        <span className="menu-bar-sep" />
        <span>GAMES {projects.length} · MODELS {characters.length} · ART {artworks.length}</span>
        <span className="menu-bar-hint"><kbd>DRAG</kbd>LOOK AROUND <kbd>↑↓</kbd>SELECT <kbd>ENTER</kbd>CONFIRM</span>
        <b className="menu-bar-time">{String(now.getDate()).padStart(2, '0')}.{String(now.getMonth() + 1).padStart(2, '0')}</b>
      </footer>
    </div>
  )
}
