import { useState } from 'react'
import { HudFrame } from '../components/HudFrame'
import { Brackets, HudRings, PixelField, Tag } from '../components/Hud'
import { projects } from '../data/projects'
import { asset } from '../lib/asset'
import { sfx } from '../lib/sfx'
import { useKeys } from '../lib/useKeys'

export default function Projects() {
  const [idx, setIdx] = useState(0)
  const p = projects[idx]
  const pick = (i: number) => {
    const n = (i + projects.length) % projects.length
    if (n !== idx) { sfx('switch'); setIdx(n) }
  }
  const open = () => { const l = p.links[0]; if (l) { sfx('select'); window.open(l.url, '_blank', 'noopener') } }
  useKeys({
    ArrowUp: () => pick(idx - 1), w: () => pick(idx - 1),
    ArrowDown: () => pick(idx + 1), s: () => pick(idx + 1),
    Enter: open,
  })

  return (
    <HudFrame title="OPERATION" sub="GAMES" code="OP" className="projects"
      hints={[{ keys: '↑↓', label: 'SELECT' }, { keys: 'ENTER', label: 'OPEN' }, { keys: 'ESC', label: 'BACK' }]}>
      <div className="pj">
        <HudRings className="pj-rings" size={900} />
        <section className="pj-left" key={p.id}>
          <Tag code={p.code} label={p.status} />
          <h2 className="pj-title">{p.title}</h2>
          <p className="pj-subtitle"><i />{p.subtitle}</p>
          <nav className="pj-list">
            {projects.map((pr, i) => (
              <button key={pr.id} className={`pj-tab ${i === idx ? 'on' : ''}`} onClick={() => pick(i)} onMouseEnter={() => sfx('hover')}>
                <span className="pj-tab-icon">{String(i + 1).padStart(2, '0')}</span>
                <span className="pj-tab-text">{pr.title}</span>
                {pr.status === 'IN DEVELOPMENT' && <i className="pj-dot" />}
              </button>
            ))}
          </nav>
        </section>

        <section className="pj-main" key={p.id + 'm'}>
          <Brackets className="pj-media">
            {p.youtube ? (
              <iframe src={`https://www.youtube-nocookie.com/embed/${p.youtube}`} title={p.title}
                allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            ) : p.cover ? (
              <img src={asset(p.cover)} alt={p.title} />
            ) : (
              <div className="no-signal">
                <PixelField seed={idx * 11 + 5} count={30} />
                <b>NO SIGNAL</b>
                <small>ใส่รูปปก / คลิป gameplay ใน src/data/projects.ts</small>
              </div>
            )}
            <span className="pj-axis" aria-hidden>Z AXIS · {p.code}</span>
          </Brackets>

          <div className="pj-info">
            <dl className="pj-rows">
              <div><dt>GENRE</dt><dd>{p.genre}</dd></div>
              <div><dt>ENGINE</dt><dd>{p.engine}</dd></div>
              <div><dt>ROLE</dt><dd>{p.role}</dd></div>
              <div><dt>TEAM</dt><dd>{p.team}</dd></div>
            </dl>
            <p className="pj-summary">{p.summary}</p>
            <ul className="pj-features">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
          </div>
        </section>

        <aside className="pj-score">
          <div className="pj-score-row"><span>STATUS</span><b>{p.status}</b></div>
          <div className="pj-score-row dark"><span>YEAR</span><b>{p.year}</b></div>
        </aside>

        <button className={`cta ${p.links.length ? '' : 'disabled'}`} onClick={open} disabled={!p.links.length} onMouseEnter={() => sfx('hover')}>
          <i />{p.links.length ? p.links[0].label.toUpperCase() : 'COMING SOON'}
        </button>
      </div>
    </HudFrame>
  )
}
