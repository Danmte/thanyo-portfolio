import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSite } from '../content/store'
import { AddItem, EditBlock, Img, ItemTools, T } from '../content/Editable'
import { blank } from '../content/types'
import type { Work } from '../content/types'
import { StudioView } from '../components/StudioView'
import { Lightbox } from '../components/Lightbox'
import { Icon } from '../components/Icon'
import { scrollToSection } from '../components/Layout'
import { sfx } from '../lib/sfx'

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
          <AddItem list={['gallery']} make={blank.art} label="+ เพิ่มภาพ" className="card-add art-add" />
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
            <div><h4>Software & Skills</h4><div className="chips">{ab.skills.map((s) => <em key={s} className="tag">{s}</em>)}</div></div>
            <div><h4>การศึกษา</h4><ul className="edu">{ab.education.map((e, i) => <li key={i}><b>{e.school}</b><small>{e.years}</small></li>)}</ul></div>
            <div><h4>งานอดิเรก</h4><div className="chips">{ab.hobbies.map((s) => <em key={s} className="tag soft">{s}</em>)}</div></div>
          </div>
        </div>
      </div>
    </section>
  )
}
