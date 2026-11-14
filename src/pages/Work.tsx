import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { useSite } from '../content/store'
import { EditBlock, Img, T, useImageDrop } from '../content/Editable'
import { Lightbox } from '../components/Lightbox'
import { Icon } from '../components/Icon'
import { StatusTag } from './Home'
import { asset } from '../lib/asset'
import type { Work as WorkT } from '../content/types'
import { EDITION, isPersonal } from '../content/edition'

const youtubeId = (url: string) => url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1]
const PLAY_EVENT = 'work-demo-play'

/** The work's clip as its cover; picks up at state.t (the time it had on the home card), so it continues. */
function CoverClip({ w }: { w: WorkT }) {
  const t = (useLocation().state as { t?: number } | null)?.t ?? 0
  const v = useRef<HTMLVideoElement>(null)
  return (
    <video ref={v} src={asset(w.clip!)} poster={w.clipPoster ? asset(w.clipPoster) : undefined} muted loop playsInline autoPlay
      onLoadedMetadata={() => { if (v.current && t > 0) v.current.currentTime = t }}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#26252c' }} />
  )
}

/**
 * A work with `demo` (e.g. Live Avatar): the cover shows a play button; clicking it swaps the cover for an iframe of
 * the demo with ?embed=1&autostart=1, so the camera opens right away inside the site.
 * Also starts by itself when the URL has ?play=1 (home card button) or on the window event PLAY_EVENT (sidebar button).
 */
function DemoPlayer({ i, w, demo }: { i: number; w: WorkT; demo: string }) {
  const title = w.title
  const [playing, setPlaying] = useState(() => /[?&]play=1/.test(location.hash))
  useEffect(() => {
    const on = () => setPlaying(true)
    addEventListener(PLAY_EVENT, on)
    return () => removeEventListener(PLAY_EVENT, on)
  }, [])
  const src = asset(demo) + (demo.includes('?') ? '&' : '?') + 'embed=1&autostart=1'
  if (playing) return (
    <div className="work-hero" style={{ aspectRatio: innerWidth < 700 ? '4/5' : '16/9', background: '#2b2a33' }}>
      <iframe src={src} title={title} allow="camera; microphone; fullscreen; autoplay" allowFullScreen style={{ width: '100%', height: '100%', border: 0, display: 'block' }} />
    </div>
  )
  return (
    <div className="work-hero" style={{ position: 'relative' }}>
      {w.clip ? <CoverClip w={w} /> : <Img path={['works', i, 'cover']} alt={title} />}
      <button className="demo-start" onClick={() => setPlaying(true)} aria-label="กดเล่น · เปิดกล้อง" />
      <small style={{ position: 'absolute', left: 0, right: 0, bottom: 14, textAlign: 'center', color: '#cfcfd6', fontSize: 13, pointerEvents: 'none' }}>ภาพจากกล้องประมวลผลในเบราว์เซอร์ ไม่ถูกส่งไปไหน · ไม่มีกล้องก็ลองโหมดเดโมได้</small>
    </div>
  )
}

export default function Work() {
  const { id } = useParams()
  const { site, edit, upload, update } = useSite()
  const i = site.works.findIndex((w) => w.id === id)
  const [view, setView] = useState<number | null>(null)
  const [adding, setAdding] = useState(0)
  // edit mode: drop image files on the shots area to add them to this work
  const drop = useImageDrop(async (files) => {
    setAdding(files.length)
    for (const f of files) { try { const p = await upload(f); update((d) => { d.works[i].images.push(p) }) } catch { /* shown in the edit bar */ } setAdding((n) => n - 1) }
  }, edit && i >= 0)
  useEffect(() => { window.scrollTo(0, 0) }, [id])
  if (i < 0) return <Navigate to="/" replace />
  const w = site.works[i]
  const prev = site.works[(i - 1 + site.works.length) % site.works.length]
  const next = site.works[(i + 1) % site.works.length]
  const yt = w.video ? youtubeId(w.video) : undefined
  const facts = ([['แนวงาน', 'genre'], ['ระยะเวลา', 'duration'], ['บทบาท', 'role'], ['ทีม', 'team']] as const)
  const images = w.images.length ? w.images : w.cover ? [w.cover] : []

  return (
    <article className="work-page">
      <div className="wrap">
        <div className="crumbs">
          <Link to="/" state={{ section: 'works' }} className="text-link back"><Icon name="back" size={16} />ผลงานทั้งหมด</Link>
          <EditBlock path={['works', i]} title={`แก้ไข: ${w.title}`} label="แก้ไขทุกช่อง / รูป / วิดีโอ" />
        </div>
        <header className="work-head">
          <div className="work-num"><span>{w.number || String(i + 1).padStart(2, '0')}</span><small>WORK</small></div>
          <div>
            <div className="chips"><StatusTag w={w} />{w.software.map((s) => <em key={s} className="tag">{s}</em>)}</div>
            <T path={['works', i, 'title']} as="h1" />
            <T path={['works', i, 'subtitle']} as="p" className="work-sub" />
          </div>
        </header>

        {w.demo
          ? <DemoPlayer key={w.id} i={i} w={w} demo={w.demo} />
          : <div className="work-hero"><Img path={['works', i, 'cover']} alt={w.title} /></div>}

        <div className="work-layout">
          <div className="work-main">
            <h2 className="h-sm">งานนี้คืออะไร และ{isPersonal ? 'เรา' : EDITION === 'kmitl' ? 'ฉัน' : 'หนู'}ทำส่วนไหน</h2>
            <T path={['works', i, 'summary']} as="p" className="body-l" multiline />
            {yt && (
              <div className="video"><iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title={`${w.title} video`} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
            )}
            {w.points.length > 0 && (
              <div className="points">
                {w.points.map((p, k) => (
                  <section key={k} className="point">
                    {(p.code || edit) && <T path={['works', i, 'points', k, 'code']} as="pre" multiline placeholder="กล่องโค้ด / ไดอะแกรม (ไม่ใส่ก็ได้)" />}
                    <div>
                      <T path={['works', i, 'points', k, 'title']} as="h3" />
                      <T path={['works', i, 'points', k, 'body']} as="p" multiline />
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
          <aside className="work-side">
            <dl className="facts-card">{facts.map(([label, k]) => (w[k] || edit) ? <div key={k}><dt>{label}</dt><dd><T path={['works', i, k]} placeholder="—" /></dd></div> : null)}</dl>
            {w.demo && <button className="btn primary block" style={{ marginTop: 12, width: '100%' }} onClick={() => { dispatchEvent(new Event(PLAY_EVENT)); scrollTo({ top: 0, behavior: 'smooth' }) }}>▶ เล่นตรงนี้ · เปิดกล้อง</button>}
            {w.demo && <a className="btn secondary block" href={asset(w.demo)} style={{ marginTop: 8 }}>เปิดเต็มหน้า<Icon name="link" size={14} /></a>}
            {w.video && !yt &&<a className="btn secondary block" href={w.video} target="_blank" rel="noreferrer">ดูวิดีโอ<Icon name="link" size={14} /></a>}
          </aside>
        </div>

        {(images.length > 0 || edit) && (
          <section className={`work-shots ${drop.over ? 'drop-over' : ''}`} {...drop.props}>
            <h2 className="h-sm">ภาพจากงาน{edit && <small className="drop-note">{adding ? `กำลังอัปโหลด ${adding} รูป…` : 'ลากรูปมาวางตรงนี้เพื่อเพิ่ม'}</small>}</h2>
            <div className="shots">
              {images.map((src, k) => (
                <button key={k} className="shot" onClick={() => setView(k)}><img src={asset(src)} alt={`${w.title} ${k + 1}`} loading="lazy" /></button>
              ))}
            </div>
          </section>
        )}

        <nav className="work-nav">
          <Link to={`/work/${prev.id}`}><small>ก่อนหน้า</small><b>{prev.title}</b></Link>
          <Link to={`/work/${next.id}`} className="next"><small>ถัดไป</small><b>{next.title}</b></Link>
        </nav>
      </div>
      {view !== null && <Lightbox index={view} setIndex={setView} items={images.map((src, k) => ({ src, title: `${w.title} · ${k + 1}`}))} />}
    </article>
  )
}
