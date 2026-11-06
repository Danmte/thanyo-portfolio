import { useEffect } from 'react'
import { Icon } from './Icon'
import { asset } from '../lib/asset'

export type LightItem = { src: string; title: string; meta?: string; note?: string; pixel?: boolean }

export function Lightbox({ items, index, setIndex }: { items: LightItem[]; index: number; setIndex: (i: number | null) => void }) {
  const a = items[index]
  const go = (d: number) => setIndex((index + d + items.length) % items.length)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopImmediatePropagation(); setIndex(null) }
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey, true)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey, true); document.body.style.overflow = '' }
  })
  if (!a) return null
  return (
    <div className="lightbox" onClick={() => setIndex(null)} role="dialog" aria-label={a.title}>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={asset(a.src)} alt={a.title} className={a.pixel ? 'pixel' : ''} />
        {(a.title || a.note) && (
          <figcaption>
            <div><b>{a.title}</b>{a.meta && <small>{a.meta}</small>}</div>
            {a.note && <p>{a.note}</p>}
            {items.length > 1 && <small className="lb-count">{index + 1} / {items.length}</small>}
          </figcaption>
        )}
      </figure>
      <button className="icon-btn lb-x" onClick={() => setIndex(null)} aria-label="Close"><Icon name="close" /></button>
      {items.length > 1 && <>
        <button className="icon-btn lb-prev" onClick={(e) => { e.stopPropagation(); go(-1) }} aria-label="Previous"><Icon name="prev" /></button>
        <button className="icon-btn lb-next" onClick={(e) => { e.stopPropagation(); go(1) }} aria-label="Next"><Icon name="next" /></button>
      </>}
    </div>
  )
}
