import { useState } from 'react'
import { Icon } from './Icon'
import { backdrops } from './Viewport'
import type { AnimApi, Backdrop } from './Viewport'
import { fmt } from './Dock'
import type { FaceBoard, Model3D } from '../content/types'
import { asset } from '../lib/asset'
import { sfx } from '../lib/sfx'

export function Popover({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`popover ${wide ? 'wide' : ''}`} role="dialog" aria-label={title}>
      <header><span>{title}</span><button className="icon-btn sm" onClick={onClose} aria-label="Close"><Icon name="down" size={16} /></button></header>
      {children}
    </div>
  )
}

export function ModelPicker({ models, current, onPick, onClose }: { models: Model3D[]; current: string; onPick: (i: number) => void; onClose: () => void }) {
  const kinds = ['All', 'Character', 'Prop'] as const
  const [kind, setKind] = useState<(typeof kinds)[number]>('All')
  const list = models.map((c, i) => ({ c, i })).filter(({ c }) => kind === 'All' || c.kind === kind)
  return (
    <Popover title="Models" onClose={onClose} wide>
      <div className="seg">
        {kinds.map((k) => (
          <button key={k} className={kind === k ? 'on' : ''} onClick={() => { sfx('hover'); setKind(k) }}>
            {k === 'All' ? 'All' : k === 'Character' ? 'Characters' : 'Props'}
          </button>
        ))}
      </div>
      <div className="model-grid">
        {list.map(({ c, i }) => (
          <button key={c.id} className={`model-card ${c.id === current ? 'on' : ''}`} onClick={() => onPick(i)}>
            <span className="thumb">{c.thumb ? <img src={asset(c.thumb)} alt="" loading="lazy" /> : <Icon name="cube" />}</span>
            <b>{c.name}</b><small>{c.kind}</small>
          </button>
        ))}
      </div>
    </Popover>
  )
}

export function AnimList({ api, label, onClose }: { api: AnimApi | null; label: (n: string) => string; onClose: () => void }) {
  const [, setTick] = useState(0)
  return (
    <Popover title="Animations" onClose={onClose}>
      {api?.names.length ? (
        <ul className="anim-list">
          {api.names.map((n) => (
            <li key={n}>
              <button className={api.current() === n ? 'on' : ''} onClick={() => { sfx('hover'); api.play(n); setTick((t) => t + 1) }}>
                <Icon name="play" size={12} />
                <span>{label(n)}</span>
                <small>{fmt(api.lengthOf(n))}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="muted pad">โมเดลนี้ไม่มีแอนิเมชัน</p>}
    </Popover>
  )
}

export function BackdropPicker({ value, onPick, onClose }: { value: Backdrop; onPick: (b: Backdrop) => void; onClose: () => void }) {
  return (
    <Popover title="Backgrounds" onClose={onClose} wide>
      <div className="swatches">
        {backdrops.map((b) => (
          <button key={b.id} className={value === b.id ? 'on' : ''} onClick={() => onPick(b.id)}>
            <i style={{ background: b.swatch }}>{value === b.id && <Icon name="check" size={16} />}</i>
            <span>{b.label}</span>
          </button>
        ))}
      </div>
    </Popover>
  )
}

/** 6×4 (or any) grid of the face sticker sheet — pick an expression, or let the animation drive it. */
export function FacePicker({ fb, value, onPick, onClose }: { fb: FaceBoard; value: number[] | null; onPick: (f: number[] | null) => void; onClose: () => void }) {
  const [W, H] = fb.sheetSize
  const [u0, v0, uw, vh] = fb.cell
  const tw = 58, th = Math.round(tw * (vh * H) / (uw * W)), k = tw / (uw * W)
  const rows = Array.from({ length: fb.rows }, (_, i) => fb.rows - 1 - i) // top row of the sheet first
  return (
    <Popover title="Faces" onClose={onClose} wide>
      <div className="face-head">
        <button className={`face-auto ${value ? '' : 'on'}`} onClick={() => { sfx('hover'); onPick(null) }}>
          <Icon name="film" size={14} />ตามท่า (อัตโนมัติ)
        </button>
        <small>{value ? `เลือกหน้า ${value[0] + 1}-${fb.rows - value[1]}` : 'หน้าจะเปลี่ยนตามแอนิเมชัน'}</small>
      </div>
      <div className="face-grid" style={{ gridTemplateColumns: `repeat(${fb.cols}, ${tw}px)` }}>
        {rows.map((r) => Array.from({ length: fb.cols }, (_, c) => {
          const x = (u0 + c * fb.stepU) * W, y = (v0 - r * fb.stepV) * H
          const on = value && value[0] === c && value[1] === r
          return (
            <button key={`${c}-${r}`} className={`face-cell ${on ? 'on' : ''}`} title={`หน้า ${c + 1}-${fb.rows - r}`} onClick={() => { sfx('hover'); onPick([c, r]) }}
              style={{ width: tw, height: th, backgroundImage: `url(${asset(fb.sheet)})`, backgroundSize: `${W * k}px ${H * k}px`, backgroundPosition: `${-x * k}px ${-y * k}px` }} />
          )
        }))}
      </div>
    </Popover>
  )
}
