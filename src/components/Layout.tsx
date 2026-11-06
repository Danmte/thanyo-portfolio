import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSite } from '../content/store'
import { EditBar, EditBlock, FormDrawer, T } from '../content/Editable'
import { Icon } from './Icon'
import { toggleMute, useMuted } from '../lib/sfx'

export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  else window.scrollTo({ top: 0, behavior: 'smooth' })
}

const links = [['works', 'ผลงาน'], ['studio', '3D Studio'], ['gallery', 'Gallery'], ['about', 'About']] as const
/** The editor is offered only while developing (npm run dev) or on the editor link (…/?edit).
 *  The plain link is always read-only, even on a device that has a GitHub token saved. */
const editorAvailable = import.meta.env.DEV || new URLSearchParams(window.location.search).has('edit')

export function Layout({ children }: { children: ReactNode }) {
  const { site, edit, setEdit } = useSite()
  const loc = useLocation()
  const nav = useNavigate()
  const muted = useMuted()
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => { const f = () => setScrolled(window.scrollY > 8); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f) }, [])
  useEffect(() => { setMenu(false) }, [loc.pathname])
  const go = (id: string) => { setMenu(false); if (loc.pathname !== '/') nav('/', { state: { section: id } }); else scrollToSection(id) }

  return (
    <div className={`site ${edit ? 'is-editing' : ''}`}>
      <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="wrap nav-in">
          <Link to="/" className="brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="mark">{site.site.name.slice(0, 1)}</span>
            <T path={['site', 'name']} as="b" /><T path={['site', 'sub']} className="muted" />
          </Link>
          <nav className={`links ${menu ? 'open' : ''}`}>
            {links.map(([id, label]) => <button key={id} onClick={() => go(id)}>{label}</button>)}
          </nav>
          <div className="nav-actions">
            <button className="nav-icon" onClick={toggleMute} title={muted ? 'Sound off' : 'Sound on'} aria-label="Toggle sound"><Icon name={muted ? 'mute' : 'sound'} size={18} /></button>
            {editorAvailable && (
              <button className={`btn ${edit ? 'accent' : 'secondary'} sm`} onClick={() => setEdit(!edit)}><Icon name="edit" size={15} />{edit ? 'กำลังแก้ไข' : 'แก้ไขเว็บ'}</button>
            )}
            <button className="btn primary sm hide-sm" onClick={() => go('contact')}>ติดต่อ</button>
            <button className="nav-icon show-sm" onClick={() => setMenu((v) => !v)} aria-label="Menu"><Icon name={menu ? 'close' : 'menu'} /></button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="contact" id="contact">
        <div className="wrap">
          <div className="contact-top">
            <div>
              <T path={['sections', 'contact', 'eyebrow']} as="span" className="eyebrow" />
              <T path={['sections', 'contact', 'title']} as="h2" multiline />
            </div>
            <div className="contact-links">
              {site.contacts.map((c, i) => c.url
                ? <a key={i} className="btn on-dark" href={c.url} target={c.url.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer"><b>{c.label}</b><span>{c.value}</span></a>
                : <span key={i} className="btn on-dark static"><b>{c.label}</b><span>{c.value}</span></span>)}
              <EditBlock path={['contacts']} title="ช่องทางติดต่อ" label="แก้ไขช่องทางติดต่อ" />
            </div>
          </div>
          <div className="footer">
            <span>© {new Date().getFullYear()} {site.site.name} · {site.about.fullName}</span>
            <span className="footer-links">{links.map(([id, label]) => <button key={id} onClick={() => go(id)}>{label}</button>)}</span>
          </div>
        </div>
      </footer>
      <EditBar />
      <FormDrawer />
    </div>
  )
}
