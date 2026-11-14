import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSite } from '../content/store'
import { AddItem, EditBlock, Img, ItemTools, T } from '../content/Editable'
import { blank } from '../content/types'
import type { ReelClip, Work } from '../content/types'
import { asset } from '../lib/asset'
import { StudioView } from '../components/StudioView'
import { Lightbox } from '../components/Lightbox'
import { Icon } from '../components/Icon'
import { scrollToSection } from '../components/Layout'
import { sfx } from '../lib/sfx'
import { isPersonal } from '../content/edition'

export function SectionHead({ id, link }: { id: 'works' | 'studio' | 'gallery' | 'about' | 'contact'; link?: { label: string; to: string } }) {
  return (
    <header className="section-head">
      <div>
        <T path={['sections', id, 'eyebrow']} as="span" className="eyebrow" />
        <T path={['sections', id, 'title']} as="h2" multiline />
        <T path={['sections', id, 'intro']} as="p" className="lead" multiline placeholder="คำอธิบายสั้น ๆ (ไม่ใส่ก็ได้)" />
      </div>
      {link && <Link className="text-link" to={link.to}>{link.label}<Icon name="arrow" size={16} /></Link>}
    </header>
  )
}

export function StatusTag({ w }: { w: Work }) {
  return <em className={`tag ${w.tone}`}>{w.status}</em>
}

export default function Home() {
  const loc = useLocation()
  useEffect(() => {
    const id = (loc.state as { section?: string } | null)?.section
    if (id) requestAnimationFrame(() => scrollToSection(id))
  }, [loc.state])
  return (
    <>
      <Hero />
      <Works />
      <section className="section studio-section" id="studio">
        <div className="wrap">
          <SectionHead id="studio" link={{ label: 'เปิดเต็มจอ', to: '/studio' }} />
          <StudioView variant="section" />
        </div>
      </section>
      <Gallery />
      <About />
    </>
  )
}

function Hero() {
  const { site } = useSite()
  const stats = [[site.works.length, 'ผลงาน'], [site.models.length, 'โมเดล 3D'], [site.gallery.length, 'งานภาพ']] as const
  return (
    <section className="hero wrap" id="top">
      <div className="hero-copy">
        <span className="role-tag"><i /><T path={['hero', 'tag']} /></span>
        <T path={['hero', 'title']} as="h1" multiline />
        <T path={['hero', 'intro']} as="p" className="hero-intro" multiline />
        <div className="ctas">
          <button className="btn primary" onClick={() => scrollToSection('works')}><T path={['hero', 'primary']} /><Icon name="arrow" size={16} /></button>
          <Link className="btn secondary" to="/studio"><T path={['hero', 'secondary']} /></Link>
        </div>
        <div className="stats">{stats.map(([n, l]) => <div key={l}><b>{n}</b><small>{l}</small></div>)}</div>
      </div>
      {site.hero.reel?.length ? <HeroReel clips={site.hero.reel} /> : <StudioView variant="card" />}
    </section>
  )
}

const REEL_MS = 2000 // time on each slide
const REEL_HOLD_MS = 5000 // pause after the visitor touches the reel (dragging the model, a dot)

/**
 * Hero carousel: the live 3D card, then each clip; slides every REEL_MS and loops.
 * A clip plays only while it is on screen and pauses when it slides away, so it resumes where it left off.
 * The 3D card stays mounted while slid out (keepAlive), so its animation continues too.
 */
function HeroReel({ clips }: { clips: ReelClip[] }) {
  const n = clips.length + 1
  const [at, setAt] = useState(0)
  const [near, setNear] = useState(true)
  const hold = useRef(0) // timestamp until which auto-advance waits
  const box = useRef<HTMLDivElement>(null)
  const vids = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => { // 3D/clip only work while the hero is near the screen
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!near || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => { if (Date.now() >= hold.current && !document.hidden) setAt((a) => (a + 1) % n) }, REEL_MS)
    return () => clearInterval(t)
  }, [n, near])
  useEffect(() => { // play the clip on screen, pause the rest (keeps their time)
    vids.current.forEach((v, k) => {
      if (!v) return
      if (near && at === k + 1) v.play().catch(() => { /* autoplay blocked: poster stays */ })
      else v.pause()
    })
  }, [at, near])

  const touch = () => { hold.current = Date.now() + REEL_HOLD_MS }
  const go = (k: number) => { touch(); setAt(k) }
  return (
    <div ref={box} className="hero-reel" onPointerDown={touch} onWheel={touch}>
      <div className="reel-track" style={{ transform: `translateX(${-at * 100}%)` }}>
        <div className="reel-slide" aria-hidden={at !== 0}><StudioView variant="card" keepAlive={near} /></div>
        {clips.map((c, k) => (
          <div key={k} className="reel-slide reel-clip" aria-hidden={at !== k + 1}>
            <video ref={(v) => { vids.current[k] = v }} src={asset(c.video)} poster={c.poster ? asset(c.poster) : undefined} muted loop playsInline preload="metadata" />
            <div className="v-chip"><b>{c.title}</b>{c.sub && <small>{c.sub}</small>}</div>
            {c.link && <Link className="btn primary reel-link" to={c.link}>ดูผลงานนี้<Icon name="arrow" size={16} /></Link>}
          </div>
        ))}
      </div>
      <div className="reel-dots" role="tablist">
        {Array.from({ length: n }, (_, k) => (
          <button key={k} role="tab" aria-selected={at === k} aria-label={k === 0 ? '3D' : clips[k - 1].title} className={at === k ? 'on' : ''} onClick={() => go(k)} />
        ))}
      </div>
    </div>
  )
}

function Works() {
  const { site } = useSite()
  const [first, ...rest] = site.works
  return (
    <section className="section" id="works">
      <div className="wrap">
        <SectionHead id="works" />
        {first && (
          <article className="featured">
            <Link to={`/work/${first.id}`} className="featured-cover"><Img path={['works', 0, 'cover']} alt={first.title} /></Link>
            <div className="featured-body">
              <div className="chips"><StatusTag w={first} />{first.genre && <em className="tag">{first.genre}</em>}</div>
              <T path={['works', 0, 'title']} as="h3" />
              <T path={['works', 0, 'subtitle']} as="p" className="muted" />
              <T path={['works', 0, 'summary']} as="p" className="body clamp-4" multiline />
              <dl className="mini-facts">
                {(['role', 'team', 'duration'] as const).map((k) => first[k] ? <div key={k}><dt>{k === 'role' ? 'บทบาท' : k === 'team' ? 'ทีม' : 'ระยะเวลา'}</dt><dd>{first[k]}</dd></div> : null)}
              </dl>
              <div className="row">
                <Link to={`/work/${first.id}`} className="btn primary">ดูรายละเอียด<Icon name="arrow" size={16} /></Link>
                <ItemTools list={['works']} index={0} title={first.title} />
              </div>
            </div>
          </article>
        )}
        <div className="work-grid">
          {rest.map((w, n) => (
            <article key={w.id} className="work-card">
              <Link to={`/work/${w.id}`} className="cover"><Img path={['works', n + 1, 'cover']} alt={w.title} /></Link>
              <div className="wc-body">
                <Link to={`/work/${w.id}`}><h3>{w.title}</h3></Link>
                <p className="muted">{w.genre}</p>
                <div className="chips"><StatusTag w={w} /></div>
                {w.demo && <Link className="btn primary" to={`/work/${w.id}?play=1`} style={{ marginTop: 12, height: 36, padding: '0 14px', fontSize: 13 }}>▶ กดเล่น · เปิดกล้อง</Link>}
              </div>
              <ItemTools list={['works']} index={n + 1} title={w.title} />
            </article>
          ))}
          <AddItem list={['works']} make={blank.work} label="+ เพิ่มผลงาน" className="card-add" />
        </div>
      </div>
    </section>
  )
}

function Gallery() {
  const { site, edit } = useSite()
  const cats = useMemo(() => ['ทั้งหมด', ...new Set(site.gallery.map((a) => a.category).filter(Boolean))], [site.gallery])
  const [cat, setCat] = useState('ทั้งหมด')
  const [view, setView] = useState<number | null>(null)
  const list = site.gallery.map((a, i) => ({ a, i })).filter(({ a }) => cat === 'ทั้งหมด' || a.category === cat)
  return (
    <section className="section" id="gallery">
      <div className="wrap">
        <SectionHead id="gallery" />
        <div className="filter">
          {cats.map((c) => (
            <button key={c} className={cat === c ? 'on' : ''} onClick={() => { sfx('hover'); setCat(c) }}>
              {c}<small>{c === 'ทั้งหมด' ? site.gallery.length : site.gallery.filter((a) => a.category === c).length}</small>
            </button>
          ))}
        </div>
        <div className="masonry">
          {list.map(({ a, i }, n) => (
            <figure key={a.id} className="art" onClick={() => { if (!edit) { sfx('select'); setView(n) } }}>
              <Img path={['gallery', i, 'image']} alt={a.title} className={a.pixel ? 'pixel' : ''} fit="cover" />
              <figcaption><b>{a.title}</b><small>{a.category}</small></figcaption>
              <ItemTools list={['gallery']} index={i} title={a.title} />
            </figure>
          ))}
          <AddItem list={['gallery']} make={blank.art} label="+ เพิ่มภาพ" className="card-add art-add" fromImage={(src, name) => ({ ...blank.art(), title: name, image: src })} />
        </div>
      </div>
      {view !== null && (
        <Lightbox index={view} setIndex={setView}
          items={list.map(({ a }) => ({ src: a.image, title: a.title, meta: [a.category, a.tools].filter(Boolean).join(' · '), note: a.note, pixel: a.pixel }))} />
      )}
    </section>
  )
}

function About() {
  const { site } = useSite()
  const ab = site.about
  return (
    <section className="section about-section" id="about">
      <div className="wrap about">
        <aside className="profile-card">
          <Img path={['about', 'photo']} className="profile-photo" alt={ab.fullName} />
          <div className="profile-name">
            <T path={['about', 'fullName']} as="h3" />
            <span className="muted">{site.site.role}</span>
          </div>
          <dl className="facts-list">{ab.facts.map((f, i) => <div key={i}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
          <EditBlock path={['about']} title="แก้ไข About" label="แก้ไขข้อมูล About ทั้งหมด" />
        </aside>
        <div className="about-main">
          <SectionHead id="about" />
          <blockquote>
            <T path={['about', 'quote']} as="p" multiline />
            <T path={['about', 'quoteBy']} as="cite" />
          </blockquote>
          <div className="statement">{ab.statement.map((_, i) => <T key={i} path={['about', 'statement', i]} as="p" multiline />)}</div>
          <div className="about-cols">
            {ab.skills.length > 0 && <div><h4>Software & Skills</h4><div className="chips">{ab.skills.map((s) => <em key={s} className="tag">{s}</em>)}</div></div>}
            {ab.education.length > 0 && <div><h4>การศึกษา</h4><ul className="edu">{ab.education.map((e, i) => <li key={i}><b>{e.school}</b><small>{e.years}</small></li>)}</ul></div>}
            {ab.hobbies.length > 0 && <div><h4>{isPersonal ? 'ชอบทำ' : 'งานอดิเรก'}</h4><div className="chips">{ab.hobbies.map((s) => <em key={s} className="tag soft">{s}</em>)}</div></div>}
          </div>
        </div>
      </div>
    </section>
  )
}
