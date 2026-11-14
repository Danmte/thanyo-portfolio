import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSite } from '../content/store'
import { AddItem, EditBlock, Img, ItemTools, T } from '../content/Editable'
import { blank } from '../content/types'
import type { Work } from '../content/types'
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
      <StudioView variant="card" />
    </section>
  )
}

/**
 * One featured work, shown in full: big cover (or its clip) + summary. `i` = index in site.works (for the editor paths).
 * A clip plays while the card is on screen; links into the work page carry its time (state.t) so the clip continues there.
 * A work with `demo` gets a play button on the cover and next to "ดูรายละเอียด", so it's clear it can be played.
 */
function FeaturedCard({ w, i }: { w: Work; i: number }) {
  const vid = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = vid.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => { /* autoplay blocked: poster stays */ }); else v.pause() })
    io.observe(v)
    return () => io.disconnect()
  }, [w.clip])
  const nav = useNavigate()
  // open the work page with the clip's current time, read at click time, so the clip continues there
  const open = (e: React.MouseEvent) => { if (!w.clip || e.metaKey || e.ctrlKey) return; e.preventDefault(); nav(`/work/${w.id}`, { state: { t: vid.current?.currentTime ?? 0 } }) }
  const playTo = `/work/${w.id}?play=1`
  return (
    <article className={`featured${w.clip ? ' featured-clip' : ''}`}>
      <div className="featured-cover">
        <Link to={`/work/${w.id}`} onClick={open} className="featured-cover-link" aria-label={w.title}>
          {w.clip
            ? <video ref={vid} src={asset(w.clip)} poster={w.clipPoster ? asset(w.clipPoster) : undefined} muted loop playsInline preload="metadata" />
            : <Img path={['works', i, 'cover']} alt={w.title} />}
        </Link>
        {w.demo && <Link to={playTo} className="btn primary cover-play">▶ กดเล่น · เปิดกล้อง</Link>}
      </div>
      <div className="featured-body">
        <div className="chips"><StatusTag w={w} />{w.genre && <em className="tag">{w.genre}</em>}</div>
        <T path={['works', i, 'title']} as="h3" />
        <T path={['works', i, 'subtitle']} as="p" className="muted" />
        <T path={['works', i, 'summary']} as="p" className="body clamp-4" multiline />
        <dl className="mini-facts">
          {(['role', 'team', 'duration'] as const).map((k) => w[k] ? <div key={k}><dt>{k === 'role' ? 'บทบาท' : k === 'team' ? 'ทีม' : 'ระยะเวลา'}</dt><dd>{w[k]}</dd></div> : null)}
        </dl>
        <div className="row">
          {w.demo && <Link to={playTo} className="btn primary">▶ กดเล่น · เปิดกล้อง</Link>}
          <Link to={`/work/${w.id}`} onClick={open} className={`btn ${w.demo ? 'secondary' : 'primary'}`}>ดูรายละเอียด<Icon name="arrow" size={16} /></Link>
          <ItemTools list={['works']} index={i} title={w.title} />
        </div>
      </div>
    </article>
  )
}

function Works() {
  const { site } = useSite()
  const all = site.works.map((w, i) => ({ w, i }))
  const ids = site.featured?.length ? site.featured : site.works.slice(0, 1).map((w) => w.id)
  const featured = ids.map((id) => all.find((x) => x.w.id === id)).filter((x): x is { w: Work; i: number } => !!x)
  const rest = all.filter((x) => !featured.includes(x))
  return (
    <section className="section" id="works">
      <div className="wrap">
        <SectionHead id="works" />
        {featured.map(({ w, i }) => <FeaturedCard key={w.id} w={w} i={i} />)}
        <div className="work-grid">
          {rest.map(({ w, i }) => (
            <article key={w.id} className="work-card">
              <Link to={`/work/${w.id}`} className="cover"><Img path={['works', i, 'cover']} alt={w.title} /></Link>
              <div className="wc-body">
                <Link to={`/work/${w.id}`}><h3>{w.title}</h3></Link>
                <p className="muted">{w.genre}</p>
                <div className="chips"><StatusTag w={w} /></div>
                {w.demo && <Link className="btn primary" to={`/work/${w.id}?play=1`} style={{ marginTop: 12, height: 36, padding: '0 14px', fontSize: 13 }}>▶ กดเล่น · เปิดกล้อง</Link>}
              </div>
              <ItemTools list={['works']} index={i} title={w.title} />
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
