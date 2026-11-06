import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Glitch } from '../components/Hud'
import { profile } from '../data/profile'
import { sfx } from '../lib/sfx'

/** Overlay for the title view. The 3D hall (MenuScene, mounted in App) shows the hero from behind. */
export default function TitleScreen() {
  const nav = useNavigate()
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const start = (e: Event) => {
      if (leaving) return
      if (e instanceof KeyboardEvent && (e.ctrlKey || e.metaKey || e.altKey)) return
      setLeaving(true)
      sfx('select')
      setTimeout(() => nav('/menu'), 380) // the camera swing continues on the menu
    }
    window.addEventListener('keydown', start)
    window.addEventListener('pointerdown', start)
    return () => {
      window.removeEventListener('keydown', start)
      window.removeEventListener('pointerdown', start)
    }
  }, [leaving, nav])

  return (
    <div className={`overlay title-screen ${leaving ? 'leaving' : ''}`}>
      <div className="title-block">
        <p className="title-pre">PORTFOLIO // GAME DEV · 3D · ART</p>
        <Glitch as="h1" className="title-logo">{profile.name}</Glitch>
        <p className="title-tag">{profile.className}</p>
      </div>
      <p className="press-start">PRESS ANY KEY</p>
      <div className="corner-read tl"><b>№ 2026</b><small>BUILD 2.0</small></div>
      <div className="corner-read br"><small>ARCHIVE HALL</small><b>ONLINE</b></div>
    </div>
  )
}
