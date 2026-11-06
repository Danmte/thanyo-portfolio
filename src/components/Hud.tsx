import { useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'

/** Seeded random so decorations stay the same between renders. */
export function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Text with red/blue split-channel glitch slices (pure CSS, see .glitch). */
export function Glitch({ children, as: Tag = 'span', className = '', style }: {
  children: string
  as?: 'span' | 'h1' | 'h2' | 'p'
  className?: string
  style?: CSSProperties
}) {
  return <Tag className={`glitch ${className}`} data-text={children} style={style}>{children}</Tag>
}

/** Field of square pixel blocks — the "data corruption" motif. */
const PIXEL_COLORS = ['#3ad7ff', '#ff3ea5', '#8b5cff', '#ffffff']
export function PixelField({ seed = 1, count = 40, className = '', colors = PIXEL_COLORS }: {
  seed?: number; count?: number; className?: string; colors?: string[]
}) {
  const blocks = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: count }, (_, i) => ({
      x: r() * 100, y: r() * 100, s: 4 + Math.floor(r() * 4) * 6,
      c: colors[Math.floor(r() * colors.length)], o: 0.35 + r() * 0.6, d: (i % 7) * 0.4,
    }))
  }, [seed, count, colors])
  return (
    <div className={`pixel-field ${className}`} aria-hidden>
      {blocks.map((b, i) => (
        <i key={i} style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.s, height: b.s, background: b.c, opacity: b.o, animationDelay: `${b.d}s` }} />
      ))}
    </div>
  )
}

/** Thin technical line art: partial rings, crosshair, ticks, coordinate labels. */
export function HudRings({ className = '', size = 600, spin = true }: { className?: string; size?: number; spin?: boolean }) {
  const c = size / 2
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2, r1 = c * 0.86, r2 = c * (i % 6 === 0 ? 0.8 : 0.83)
    return <line key={i} x1={c + Math.cos(a) * r1} y1={c + Math.sin(a) * r1} x2={c + Math.cos(a) * r2} y2={c + Math.sin(a) * r2} />
  })
  return (
    <svg className={`hud-rings ${spin ? 'spin' : ''} ${className}`} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <g className="r-outer">
        <circle cx={c} cy={c} r={c * 0.96} strokeDasharray="2 10" />
        <path d={arc(c, c * 0.9, -20, 200)} />
        <g className="ticks">{ticks}</g>
      </g>
      <g className="r-inner">
        <path d={arc(c, c * 0.62, 120, 330)} strokeWidth={2.5} />
        <circle cx={c} cy={c} r={c * 0.5} strokeDasharray="60 14 4 14" />
      </g>
      <line x1={c} y1={c * 0.02} x2={c} y2={c * 0.3} />
      <line x1={c} y1={c * 1.7} x2={c} y2={c * 1.98} />
      <line x1={c * 0.02} y1={c} x2={c * 0.3} y2={c} />
      <line x1={c * 1.7} y1={c} x2={c * 1.98} y2={c} />
      <text x={c * 1.08} y={c * 0.12}>Z AXIS</text>
      <text x={c * 0.1} y={c * 0.94}>A1</text>
      <text x={c * 1.76} y={c * 1.1}>{'0.' + Math.round(size / 7)}</text>
    </svg>
  )
}

function arc(c: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [c + Math.cos((a * Math.PI) / 180) * r, c + Math.sin((a * Math.PI) / 180) * r]
  const [x0, y0] = p(a0), [x1, y1] = p(a1)
  return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`
}

/** Four corner brackets around any box. */
export function Brackets({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`brackets ${className}`}><i /><i /><i /><i />{children}</div>
}

/** Little "code" readouts used as decoration (e.g. MT-S-1 / OPERATION). */
export function Tag({ code, label, className = '' }: { code: string; label?: string; className?: string }) {
  return (
    <span className={`hud-tag ${className}`}>
      <b>{code}</b>{label && <small>{label}</small>}
    </span>
  )
}
