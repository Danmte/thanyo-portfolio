import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { seedSite } from './types'
import type { Site } from './types'
import { checkToken, commitSite, commitUpload, getToken, setToken } from '../lib/github'
import { addPreview } from '../lib/asset'

declare const __BUILD_TIME__: number

export type Path = (string | number)[]
type Ctx = {
  site: Site
  edit: boolean
  setEdit: (on: boolean) => void
  dirty: boolean
  canSave: boolean // local CMS (npm run dev) reachable, or a GitHub token is connected
  mode: 'local' | 'github' | 'none'
  connect: (token: string) => Promise<boolean>
  disconnect: () => void
  status: string
  get: (path: Path) => unknown
  set: (path: Path, value: unknown) => void
  update: (fn: (draft: Site) => void) => void
  save: () => Promise<void>
  discard: () => void
  download: () => void
  upload: (file: File, dir?: 'media' | 'models') => Promise<string>
  openForm: (path: Path, title?: string) => void
  form: { path: Path; title: string } | null
  closeForm: () => void
}

const C = createContext<Ctx | null>(null)
const DRAFT = 'thanyo-site-draft'
const EDIT = 'thanyo-edit'
const PENDING = 'thanyo-site-pending' // saved to GitHub but the site hasn't been rebuilt yet

const getAt = (obj: unknown, path: Path) => path.reduce<unknown>((o, k) => (o == null ? o : (o as Record<string, unknown>)[k as string]), obj)
function setAt<T>(obj: T, path: Path, value: unknown): T {
  const next = structuredClone(obj) as unknown as Record<string, unknown>
  let o: Record<string, unknown> = next
  path.slice(0, -1).forEach((k) => { o = o[k as string] as Record<string, unknown> })
  o[path[path.length - 1] as string] = value
  return next as unknown as T
}
const readDraft = (): Site | null => { try { const s = localStorage.getItem(DRAFT); return s ? JSON.parse(s) : null } catch { return null } }
const readPending = (): Site | null => {
  try {
    const s = localStorage.getItem(PENDING); if (!s) return null
    const p = JSON.parse(s) as { at: number; site: Site }
    if (p.at > __BUILD_TIME__) return p.site
    localStorage.removeItem(PENDING); return null // the live build already has it
  } catch { return null }
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<Site>(() => readDraft() ?? readPending() ?? seedSite)
  const [dirty, setDirty] = useState(() => !!readDraft())
  const [edit, setEditState] = useState(() => { try { return sessionStorage.getItem(EDIT) === '1' } catch { return false } })
  const [mode, setMode] = useState<'local' | 'github' | 'none'>(() => (getToken() ? 'github' : 'none'))
  const canSave = mode !== 'none'
  const [status, setStatus] = useState('')
  const [form, setForm] = useState<{ path: Path; title: string } | null>(null)

  useEffect(() => {
    if (!import.meta.env.DEV) return
    fetch('/__cms/ping').then((r) => { if (r.ok) setMode('local') }).catch(() => {})
  }, [])
  // keep unsaved edits safe across reloads
  useEffect(() => { try { if (dirty) localStorage.setItem(DRAFT, JSON.stringify(site)); else localStorage.removeItem(DRAFT) } catch { /* storage full / private mode */ } }, [site, dirty])

  const setEdit = useCallback((on: boolean) => { setEditState(on); try { sessionStorage.setItem(EDIT, on ? '1' : '0') } catch { /* ignore */ } if (!on) setForm(null) }, [])
  const set = useCallback((path: Path, value: unknown) => { setSite((s) => setAt(s, path, value)); setDirty(true) }, [])
  const update = useCallback((fn: (d: Site) => void) => { setSite((s) => { const d = structuredClone(s); fn(d); return d }); setDirty(true) }, [])
  const flash = (m: string) => { setStatus(m); window.setTimeout(() => setStatus((cur) => (cur === m ? '' : cur)), 3500) }

  const download = useCallback(() => {
    const blob = new Blob([JSON.stringify(site, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'site.json'; a.click(); URL.revokeObjectURL(a.href)
  }, [site])

  const save = useCallback(async () => {
    if (mode === 'none') { download(); flash('ดาวน์โหลด site.json แล้ว — เอาไปวางแทน src/content/site.json'); return }
    setStatus('กำลังบันทึก…')
    if (mode === 'github') {
      // images added before GitHub was connected are still data: URLs — upload them as files first
      const found: { o: Record<string, unknown>; k: string; v: string }[] = []
      const walk = (o: unknown) => { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (typeof v === 'string' && v.startsWith('data:')) found.push({ o: o as Record<string, unknown>, k, v }); else walk(v) } }
      const copy = structuredClone(site); walk(copy)
      try {
        for (const f of found) {
          const blob = await (await fetch(f.v)).blob(); const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
          const path = await commitUpload(getToken(), new File([blob], `image.${ext}`, { type: blob.type }), 'media'); addPreview(path, blob); f.o[f.k] = path
        }
      } catch (e) { flash('อัปโหลดรูปไม่สำเร็จ: ' + (e instanceof Error ? e.message : e)); return }
      if (found.length) setSite(copy)
      try { await commitSite(getToken(), JSON.stringify(found.length ? copy : site, null, 2) + String.fromCharCode(10)) } catch (e) { flash('บันทึกไม่สำเร็จ: ' + (e instanceof Error ? e.message : e)); return }
      try { localStorage.setItem(PENDING, JSON.stringify({ at: Date.now(), site: found.length ? copy : site })) } catch { /* ignore */ }
    } else {
      const r = await fetch('/__cms/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(site) })
      if (!r.ok) { flash('บันทึกไม่สำเร็จ: ' + ((await r.json().catch(() => ({}))).error ?? r.status)); return }
    }
    setDirty(false); try { localStorage.removeItem(DRAFT) } catch { /* ignore */ }
    flash(mode === 'github' ? 'บันทึกขึ้น GitHub แล้ว ✓ เว็บจะอัปเดตเองใน ~1–2 นาที' : 'บันทึกแล้ว ✓')
  }, [mode, site, download])

  const discard = useCallback(() => { setSite(seedSite); setDirty(false); try { localStorage.removeItem(DRAFT) } catch { /* ignore */ } flash('ยกเลิกการแก้ไขที่ยังไม่บันทึกแล้ว') }, [])

  const upload = useCallback(async (file: File, dir: 'media' | 'models' = 'media') => {
    if (mode === 'github') {
      setStatus(`กำลังอัปโหลด ${file.name}…`)
      try { const path = await commitUpload(getToken(), file, dir); addPreview(path, file); flash('อัปโหลดแล้ว ✓'); return path }
      catch (e) { flash('อัปโหลดไม่สำเร็จ: ' + (e instanceof Error ? e.message : e)); throw e }
    }
    if (mode === 'none') {
      // no server and no GitHub: keep the file in the draft as a data URL
      return await new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(file) })
    }
    setStatus(`กำลังอัปโหลด ${file.name}…`)
    const r = await fetch(`/__cms/upload?dir=${dir}&name=${encodeURIComponent(file.name)}`, { method: 'POST', body: file })
    const j = await r.json()
    if (!r.ok) { flash('อัปโหลดไม่สำเร็จ: ' + j.error); throw new Error(j.error) }
    flash('อัปโหลดแล้ว ✓')
    return j.path as string
  }, [mode])

  const connect = useCallback(async (token: string) => {
    const ok = await checkToken(token.trim()).catch(() => false)
    if (ok) { setToken(token); setMode('github'); flash('เชื่อม GitHub แล้ว ✓') } else flash('token ใช้ไม่ได้ หรือไม่มีสิทธิ์แก้ repo นี้')
    return ok
  }, [])
  const disconnect = useCallback(() => { setToken(''); setMode('none') }, [])

  const value = useMemo<Ctx>(() => ({
    site, edit, setEdit, dirty, canSave, mode, connect, disconnect, status, get: (p) => getAt(site, p), set, update, save, discard, download, upload,
    form, openForm: (path, title = 'แก้ไข') => setForm({ path, title }), closeForm: () => setForm(null),
  }), [site, edit, setEdit, dirty, canSave, mode, connect, disconnect, status, set, update, save, discard, download, upload, form])
  return <C.Provider value={value}>{children}</C.Provider>
}

export function useSite() {
  const c = useContext(C)
  if (!c) throw new Error('useSite outside ContentProvider')
  return c
}
