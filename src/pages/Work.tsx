import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useSite } from '../content/store'
import { EditBlock, Img, T } from '../content/Editable'
import { Lightbox } from '../components/Lightbox'
import { Icon } from '../components/Icon'
import { StatusTag } from './Home'
import { asset } from '../lib/asset'

const youtubeId = (url: string) => url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1]

export default function Work() {
  const { id } = useParams()
  const { site, edit } = useSite()
  const i = site.works.findIndex((w) => w.id === id)
  const [view, setView] = useState<number | null>(null)
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

        <div className="work-hero"><Img path={['works', i, 'cover']} alt={w.title} /></div>

        <div className="work-layout">
          <div className="work-main">
            <h2 className="h-sm">งานนี้คืออะไร และหนูทำส่วนไหน</h2>
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
            {w.video && !yt && <a className="btn secondary block" href={w.video} target="_blank" rel="noreferrer">ดูวิดีโอ<Icon name="link" size={14} /></a>}
          </aside>
        </div>

        {images.length > 0 && (
          <section className="work-shots">
            <h2 className="h-sm">ภาพจากงาน</h2>
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
      {view !== null && <Lightbox index={view} setIndex={setView} items={images.map((src, k) => ({ src, title: `${w.title} — ${k + 1}` }))} />}
    </article>
  )
}
