import { useSyncExternalStore } from 'react'

// Soft synthesized UI clicks (WebAudio, no audio files) — quiet on purpose for the calm studio look.
// TODO: swap for ElevenLabs-generated sounds later (see vault TODO).
let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = (() => {
  try { return localStorage.getItem('sfx-muted') === '1' } catch { return false }
})()
const listeners = new Set<() => void>()

type Sfx = 'hover' | 'select' | 'back' | 'switch'

function audio() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.7
    master.connect(ctx.destination)
  }
  return { ctx, out: master! }
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, glide = 1, at = 0) {
  const { ctx, out } = audio()
  const t = ctx.currentTime + at
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  o.frequency.exponentialRampToValueAtTime(freq * glide, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(out)
  o.start(t); o.stop(t + dur + 0.05)
}

export function sfx(kind: Sfx) {
  if (muted) return
  try {
    if (kind === 'hover') tone(1400, 0.05, 'sine', 0.018)
    if (kind === 'switch') { tone(660, 0.09, 'sine', 0.03, 1.4) }
    if (kind === 'select') { tone(880, 0.12, 'sine', 0.035, 1.25); tone(1320, 0.14, 'sine', 0.02, 1, 0.05) }
    if (kind === 'back') tone(700, 0.1, 'sine', 0.03, 0.7)
  } catch { /* audio not available */ }
}

export function toggleMute() {
  muted = !muted
  try { localStorage.setItem('sfx-muted', muted ? '1' : '0') } catch { /* ignore */ }
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.7, ctx.currentTime, 0.05)
  listeners.forEach((l) => l())
}

export function useMuted() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb) } },
    () => muted,
  )
}
