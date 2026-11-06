// Tiny shared store: the menu's selected index tints the 3D halo ring.
let value = 0
const subs = new Set<() => void>()
export const menuAccent = {
  get: () => value,
  set: (v: number) => { value = v; subs.forEach((s) => s()) },
  subscribe: (cb: () => void) => { subs.add(cb); return () => { subs.delete(cb) } },
}
