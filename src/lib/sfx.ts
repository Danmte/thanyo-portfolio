import { useSyncExternalStore } from 'react'

// Synthesized UI sounds + an ambient "archive hall" pad (WebAudio, no audio files).
// TODO: swap for ElevenLabs-generated sounds when Thanyo is back (see vault TODO).
let ctx: AudioContext | null = null
let master: GainNode | null = null
let ambient: { stop: () => void } | null = null
let muted = (() => {
  try { return localStorage.getItem('sfx-muted') === '1' } catch { return false }
})()
const listeners = new Set<() => void>()

type Sfx = 'hover' | 'select' | 'back' | 'switch'

function audio() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 1
    // a little shared reverb-ish echo makes everything feel "in the hall"
    const delay = ctx.createDelay(1)
    delay.delayTime.value = 0.18
    const fb = ctx.createGain(); fb.gain.value = 0.28
    const wet = ctx.createGain(); wet.gain.value = 0.22
    master.connect(ctx.destination)
    master.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(ctx.destination)
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
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(out)
  o.start(t); o.stop(t + dur + 0.05)
}

function noiseBurst(dur: number, vol: number, from: number, to: number) {
  const { ctx, out } = audio()
  const t = ctx.currentTime
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource(); src.buffer = buf
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur)
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(out)
  src.start(t)
}

export function sfx(kind: Sfx) {
  if (muted) return
  try {
    startAmbient()
    if (kind === 'hover') { tone(1760, 0.07, 'sine', 0.03); tone(2637, 0.05, 'triangle', 0.012, 1, 0.01) }
    if (kind === 'switch') { tone(880, 0.12, 'triangle', 0.04, 1.5); noiseBurst(0.12, 0.05, 3000, 900) }
    if (kind === 'select') { // glassy rising chord + whoosh
      tone(523.25, 0.5, 'sine', 0.05, 1); tone(783.99, 0.5, 'sine', 0.04, 1, 0.04); tone(1046.5, 0.6, 'triangle', 0.03, 1, 0.08)
      noiseBurst(0.45, 0.08, 400, 6000)
    }
    if (kind === 'back') { tone(660, 0.18, 'triangle', 0.05, 0.5); noiseBurst(0.2, 0.05, 4000, 500) }
  } catch { /* audio not available */ }
}

/** Slow evolving pad: detuned saws through a moving low-pass + soft noise bed. */
function startAmbient() {
  if (ambient || muted) return
  const { ctx, out } = audio()
  const bus = ctx.createGain(); bus.gain.value = 0
  bus.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 4)
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 6
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05
  const lfoG = ctx.createGain(); lfoG.gain.value = 500
  lfo.connect(lfoG).connect(lp.frequency)
  const notes = [55, 82.41, 110, 164.81, 220.0, 329.63] // A minor-ish, wide
  const oscs = notes.flatMap((f) => [-6, 6].map((cents) => {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cents
    const g = ctx.createGain(); g.gain.value = 0.18 / notes.length
    o.connect(g).connect(lp); o.start(); return o
  }))
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3
  const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true
  const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1800; nf.Q.value = 0.7
  const ng = ctx.createGain(); ng.gain.value = 0.05
  n.connect(nf).connect(ng).connect(bus); n.start()
  lp.connect(bus); bus.connect(out); lfo.start()
  ambient = {
    stop: () => {
      const t = ctx.currentTime
      bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(bus.gain.value, t); bus.gain.linearRampToValueAtTime(0, t + 1)
      setTimeout(() => { oscs.forEach((o) => o.stop()); n.stop(); lfo.stop(); bus.disconnect() }, 1200)
    },
  }
}

export function toggleMute() {
  muted = !muted
  try { localStorage.setItem('sfx-muted', muted ? '1' : '0') } catch { /* ignore */ }
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05)
  if (muted && ambient) { ambient.stop(); ambient = null }
  listeners.forEach((l) => l())
}

export function useMuted() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb) } },
    () => muted,
  )
}
