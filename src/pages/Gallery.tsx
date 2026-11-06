import { useState } from 'react'
import { HudFrame } from '../components/HudFrame'
import { Brackets, PixelField, Tag } from '../components/Hud'
import { Icon } from '../components/Icon'
import { artworks } from '../data/artworks'
import { asset } from '../lib/asset'
import { sfx } from '../lib/sfx'
import { useKeys } from '../lib/useKeys'

const filters = ['All', 'Illustration', '3D', 'Game Asset', 'Process'] as const

export default function Gallery() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const [open, setOpen] = useState<number | null>(null)
  const list = filter === 'All' ? artworks : artworks.filter((a) => a.category === filter)
  const cur = open !== null ? list[open] : null

  const step = (d: number) => { if (open === null) return; sfx('switch'); setOpen((open + d + list.length) % list.length) }
  const cycle = (d: number) => { sfx('hover'); setFilter(filters[(filters.indexOf(filter) + d + filters.length) % filters.length]) }
  useKeys(open === null
    ? { q: () => cycle(-1), e: () => cycle(1) }
    : { ArrowLeft: () => step(-1), ArrowRight: () => step(1), q: () => step(-1), e: () => step(1) })
  // Esc closes the viewer before the frame's Esc goes back to the menu
  useKeys({ Escape: (ev) => { ev.stopImmediatePropagation(); sfx('back'); setOpen(null) } }, open !== null, true)

  return (
    <HudFrame title="ARCHIVE" sub="GALLERY" code="A1" className="gallery"
      hints={open === null ? [{ keys: 'Q E', label: 'FILTER' }, { keys: 'CLICK', label: 'INSPECT' }] : [{ keys: '← →', label: 'BROWSE' }, { keys: 'ESC', label: 'CLOSE' }]}>
      <div className="gl">
        <div className="gl-top">
          <nav className="gl-filters">
            {filters.map((f) => (
              <button key={f} className={f === filter ? 'on' : ''} onClick={() => { sfx('hover'); setFilter(f) }}>{f.toUpperCase()}</button>
            ))}
          </nav>
          <Tag code={`${String(list.length).padStart(2, '0')} / ${String(artworks.length).padStart(2, '0')}`} label="RECORDS" />
        </div>
        <div className="gl-grid" key={filter}>
          {list.map((a, i) => (
            <button key={a.id} className={`gl-card ${a.category === '3D' ? 'tall' : ''}`} style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => { sfx('select'); setOpen(i) }} onMouseEnter={() => sfx('hover')}>
              <img src={asset(a.image)} alt={a.title} className={a.pixel ? 'pixel' : ''} loading="lazy" />
              <PixelField seed={i * 5 + 2} count={14} className="gl-glitch" />
              <span className="gl-code">A{i + 1}</span>
              <span className="gl-meta"><b>{a.title}</b><small>{a.category} · {a.year}</small></span>
            </button>
          ))}
        </div>
      </div>

      {cur && (
        <div className="gl-view" onClick={() => { sfx('back'); setOpen(null) }}>
          <Brackets className="gl-view-img">
            <img src={asset(cur.image)} alt={cur.title} className={cur.pixel ? 'pixel' : ''} onClick={(e) => e.stopPropagation()} />
          </Brackets>
          <aside className="gl-view-info" onClick={(e) => e.stopPropagation()}>
            <Tag code={`A${open! + 1}`} label={cur.category.toUpperCase()} />
            <h2>{cur.title}</h2>
            <dl className="pj-rows">
              <div><dt>TOOLS</dt><dd>{cur.tools}</dd></div>
              <div><dt>YEAR</dt><dd>{cur.year}</dd></div>
            </dl>
            <p>{cur.note}</p>
            <div className="gl-view-nav">
              <button className="chip" onClick={() => step(-1)}><Icon name="prev" /></button>
              <span>{String(open! + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}</span>
              <button className="chip" onClick={() => step(1)}><Icon name="next" /></button>
            </div>
          </aside>
        </div>
      )}
    </HudFrame>
  )
}
