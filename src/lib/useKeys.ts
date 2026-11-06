import { useEffect, useRef } from 'react'

/** Bind keyboard shortcuts. Keys are KeyboardEvent.key values (letters lower-case). */
export function useKeys(map: Record<string, (e: KeyboardEvent) => void>, enabled = true, capture = false) {
  const ref = useRef(map)
  useEffect(() => { ref.current = map })
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const fn = ref.current[e.key] ?? ref.current[e.key.toLowerCase()]
      if (fn) { e.preventDefault(); fn(e) }
    }
    window.addEventListener('keydown', onKey, capture)
    return () => window.removeEventListener('keydown', onKey, capture)
  }, [enabled, capture])
}
