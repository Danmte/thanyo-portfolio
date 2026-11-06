import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ElementType, ReactNode } from 'react'
import { useSite } from './store'
import type { Path } from './store'
import { Icon } from '../components/Icon'
import { asset } from '../lib/asset'
import { REPO } from '../lib/github'

const str = (v: unknown) => (v == null ? '' : String(v))

/** Text that turns into an inline editor in edit mode. */
export function T({ path, as: Tag = 'span', className, multiline, placeholder }: {
  path: Path; as?: ElementType; className?: string; multiline?: boolean; placeholder?: string
}) {
  const { edit, get, set } = useSite()
  const value = str(get(path))
  if (!edit) return value ? <Tag className={className}>{value}</Tag> : null
  return (
    <Tag key={value} className={`${className ?? ''} editable`} contentEditable suppressContentEditableWarning spellCheck={false}
      data-placeholder={placeholder ?? 'พิมพ์ข้อความ…'}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' && !multiline) { e.preventDefault(); (e.target as HTMLElement).blur() } if (e.key === 'Escape') (e.target as HTMLElement).blur() }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => { const next = e.currentTarget.innerText.replace(/ /g, ' ').replace(/\n$/, ''); if (next !== value) set(path, next) }}>
      {value}
    </Tag>
  )
}

/** Image that can be replaced (upload) in edit mode. */
export function Img({ path, className, alt = '', style, fit = 'cover', empty }: {
  path: Path; className?: string; alt?: string; style?: CSSProperties; fit?: 'cover' | 'contain'; empty?: ReactNode
}) {
  const { edit, get } = useSite()
  const src = str(get(path))
  return (
    <span className={`img-slot ${className ?? ''}`} style={style}>
      {src ? <img src={asset(src)} alt={alt} loading="lazy" style={{ objectFit: fit }} /> : (empty ?? <span className="img-empty"><Icon name="image" /></span>)}
      {edit && <ImagePicker path={path} label={src ? 'เปลี่ยนรูป' : 'ใส่รูป'} className="img-edit" />}
    </span>
  )
}

export function ImagePicker({ path, label, className, accept = 'image/*', dir = 'media' }: { path: Path; label: string; className?: string; accept?: string; dir?: 'media' | 'models' }) {
  const { upload, set } = useSite()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <button type="button" className={`edit-chip ${className ?? ''}`} disabled={busy} onClick={(e) => { e.preventDefault(); e.stopPropagation(); input.current?.click() }}>
        <Icon name="image" size={14} />{busy ? 'กำลังอัปโหลด…' : label}
      </button>
      <input ref={input} type="file" accept={accept} hidden onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = ''
        if (!f) return
        setBusy(true); try { set(path, await upload(f, dir)) } finally { setBusy(false) }
      }} />
    </>
  )
}

/** Move / edit / delete controls for an item in a list (edit mode only). */
export function ItemTools({ list, index, title }: { list: Path; index: number; title: string }) {
  const { edit, get, set, openForm } = useSite()
  if (!edit) return null
  const arr = (get(list) as unknown[]) ?? []
  const move = (d: number) => { const j = index + d; if (j < 0 || j >= arr.length) return; const next = [...arr]; [next[index], next[j]] = [next[j], next[index]]; set(list, next) }
  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); fn() }
  return (
    <span className="item-tools">
      <button type="button" onClick={stop(() => openForm([...list, index], title))} title="แก้ไขทุกช่อง"><Icon name="edit" size={14} />แก้ไข</button>
      <button type="button" onClick={stop(() => move(-1))} disabled={index === 0} title="เลื่อนขึ้น"><Icon name="up" size={14} /></button>
      <button type="button" onClick={stop(() => move(1))} disabled={index === arr.length - 1} title="เลื่อนลง"><Icon name="down" size={14} /></button>
      <button type="button" className="danger" onClick={stop(() => { if (confirm(`ลบ "${title}" ?`)) set(list, arr.filter((_, i) => i !== index)) })} title="ลบ"><Icon name="trash" size={14} /></button>
    </span>
  )
}

export function AddItem<V>({ list, make, label, className, open = true }: { list: Path; make: () => V; label: string; className?: string; open?: boolean }) {
  const { edit, get, set, openForm } = useSite()
  if (!edit) return null
  return (
    <button type="button" className={`add-item ${className ?? ''}`} onClick={() => {
      const arr = (get(list) as unknown[]) ?? []; set(list, [...arr, make()])
      if (open) openForm([...list, arr.length], label.replace(/^\+\s*/, ''))
    }}><Icon name="plus" size={16} />{label}</button>
  )
}

/** Small "edit this block" button for objects that aren't lists (About, contacts…). */
export function EditBlock({ path, title, label = 'แก้ไขส่วนนี้' }: { path: Path; title: string; label?: string }) {
  const { edit, openForm } = useSite()
  if (!edit) return null
  return <button type="button" className="edit-chip block" onClick={() => openForm(path, title)}><Icon name="edit" size={14} />{label}</button>
}

// ---------------- Edit bar + form drawer ----------------

export function EditBar() {
  const { edit, setEdit, dirty, canSave, mode, status, save, discard, download, disconnect } = useSite()
  const [connecting, setConnecting] = useState(false)
  if (!edit) return null
  const hint = mode === 'github' ? 'เชื่อม GitHub แล้ว — บันทึกแล้วเว็บจะอัปเดตเองใน ~1–2 นาที'
    : mode === 'local' ? 'กดข้อความเพื่อพิมพ์ · ปุ่ม “แก้ไข” บนการ์ดเพื่อแก้ทุกช่อง'
    : 'ยังไม่ได้เชื่อม GitHub — กด “เชื่อม GitHub” เพื่อบันทึกจากเครื่องนี้'
  return (
    <>
      <div className="edit-bar" role="toolbar" aria-label="Editor">
        <span className="dot" data-dirty={dirty} />
        <b>โหมดแก้ไข</b>
        <span className="muted">{status || (dirty ? 'มีการแก้ไขที่ยังไม่บันทึก' : hint)}</span>
        <span className="grow" />
        {mode === 'none' && <button type="button" className="eb-btn" onClick={() => setConnecting(true)}>เชื่อม GitHub</button>}
        {mode === 'github' && <button type="button" className="eb-btn ghost" onClick={() => { if (confirm('ยกเลิกการเชื่อม GitHub บนเครื่องนี้?')) disconnect() }}>GitHub ✓</button>}
        <button type="button" className="eb-btn" onClick={download} title="ดาวน์โหลดไฟล์ข้อมูลทั้งหมด">site.json</button>
        <button type="button" className="eb-btn" onClick={() => { if (confirm('ยกเลิกทุกการแก้ไขที่ยังไม่บันทึก?')) discard() }} disabled={!dirty}>ยกเลิก</button>
        <button type="button" className="eb-btn primary" onClick={save} disabled={!dirty}>{canSave ? 'บันทึก' : 'บันทึก (ดาวน์โหลด)'}</button>
        <button type="button" className="eb-btn ghost" onClick={() => setEdit(false)}>ออก</button>
      </div>
      {connecting && <ConnectDialog onClose={() => setConnecting(false)} />}
    </>
  )
}

function ConnectDialog({ onClose }: { onClose: () => void }) {
  const { connect } = useSite()
  const [token, setTokenText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <div className="drawer-scrim center" onClick={onClose}>
      <div className="connect" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="เชื่อม GitHub">
        <h3>เชื่อม GitHub เพื่อบันทึกจากเครื่องนี้</h3>
        <ol>
          <li>เปิด <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">github.com → Fine-grained token</a> (ล็อกอินบัญชี <b>{REPO.owner}</b>)</li>
          <li>Repository access: <b>Only select repositories</b> → <b>{REPO.name}</b></li>
          <li>Permissions → Repository → <b>Contents: Read and write</b> แล้วกด Generate</li>
          <li>คัดลอก token มาวางด้านล่าง (เก็บไว้ในเครื่องนี้เท่านั้น)</li>
        </ol>
        <input type="password" value={token} onChange={(e) => setTokenText(e.target.value)} placeholder="github_pat_…" autoComplete="off" />
        {err && <p className="err">{err}</p>}
        <div className="row end">
          <button type="button" className="eb-btn ghost dark" onClick={onClose}>ยกเลิก</button>
          <button type="button" className="eb-btn primary" disabled={!token.trim() || busy} onClick={async () => {
            setBusy(true); setErr('')
            const ok = await connect(token)
            setBusy(false)
            if (ok) onClose(); else setErr('token ใช้ไม่ได้ หรือไม่มีสิทธิ์ Contents: Read and write ของ repo นี้')
          }}>{busy ? 'กำลังตรวจ…' : 'เชื่อม'}</button>
        </div>
      </div>
    </div>
  )
}

const LABEL: Record<string, string> = {
  title: 'ชื่อ / หัวข้อ', subtitle: 'คำโปรย', number: 'ลำดับ', status: 'สถานะ', tone: 'สีป้ายสถานะ', genre: 'แนว', duration: 'ระยะเวลา', role: 'บทบาท', team: 'ทีม',
  summary: 'รายละเอียด', cover: 'รูปปก', images: 'รูปเพิ่มเติม', video: 'ลิงก์วิดีโอ (YouTube)', software: 'โปรแกรมที่ใช้', points: 'หัวข้อย่อย', code: 'กล่องโค้ด/ไดอะแกรม', body: 'เนื้อหา',
  category: 'หมวด', tools: 'เครื่องมือ', note: 'คำอธิบาย', image: 'รูป', pixel: 'พิกเซลอาร์ต (ไม่เบลอ)', kind: 'ประเภท', name: 'ชื่อ', description: 'คำอธิบาย',
  model: 'ไฟล์โมเดล (.glb)', thumb: 'รูปไอคอน', height: 'ความสูงในฉาก', lift: 'ยกจากพื้น', spin: 'หมุนเอง', clips: 'ท่าที่โชว์ (ว่าง = ทุกท่าในไฟล์ · T-Pose = ท่ายืนตั้งต้น)', defaultClip: 'ท่าที่เล่นตอนเปิด',
  specs: 'สเปก', label: 'ชื่อช่อง', value: 'ค่า', url: 'ลิงก์', fullName: 'ชื่อ-นามสกุล', nickname: 'ชื่อเล่น', photo: 'รูปถ่าย', avatar: 'รูปโปรไฟล์', facts: 'ข้อมูลส่วนตัว',
  quote: 'คำคม', quoteBy: 'จากใคร', statement: 'Statement (ย่อหน้า)', skills: 'สกิล / โปรแกรม', education: 'การศึกษา', school: 'โรงเรียน', years: 'ช่วงชั้น', hobbies: 'งานอดิเรก',
  eyebrow: 'หัวเล็ก', intro: 'คำอธิบาย', tag: 'ป้ายบนหัวข้อ', primary: 'ปุ่มหลัก', secondary: 'ปุ่มรอง', sub: 'คำต่อท้าย', id: 'รหัส (ใช้ในลิงก์)',
}
const IMAGE_KEYS = new Set(['cover', 'image', 'thumb', 'photo', 'avatar'])
const LONG_KEYS = new Set(['summary', 'body', 'description', 'note', 'intro', 'code', 'title_multiline'])
const TONES = ['blue', 'green', 'amber', 'violet', 'gray']
const HIDDEN = new Set(['faces']) // face-board config comes from the Blender export, not hand-edited

export function FormDrawer() {
  const { form, closeForm, get } = useSite()
  useEffect(() => {
    if (!form) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); closeForm() } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [form, closeForm])
  if (!form) return null
  const value = get(form.path)
  return (
    <div className="drawer-scrim" onClick={closeForm}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={form.title}>
        <header><h3>{form.title}</h3><button type="button" className="icon-btn sm" onClick={closeForm} aria-label="Close"><Icon name="close" size={16} /></button></header>
        <div className="drawer-body">
          {value && typeof value === 'object' && !Array.isArray(value)
            ? Object.keys(value as object).filter((k) => !HIDDEN.has(k)).map((k) => <Field key={k} path={[...form.path, k]} k={k} />)
            : <Field path={form.path} k={String(form.path[form.path.length - 1])} />}
        </div>
        <footer><span className="muted">แก้แล้วเห็นผลทันที — อย่าลืมกด “บันทึก” ที่แถบล่าง</span><button type="button" className="eb-btn primary" onClick={closeForm}>เสร็จ</button></footer>
      </aside>
    </div>
  )
}

function Field({ path, k }: { path: Path; k: string }) {
  const { get, set } = useSite()
  const v = get(path)
  const label = LABEL[k] ?? k
  if (typeof v === 'boolean') return <label className="f f-check"><input type="checkbox" checked={v} onChange={(e) => set(path, e.target.checked)} /><span>{label}</span></label>
  if (typeof v === 'number') return <label className="f"><span>{label}</span><input type="number" step="0.05" value={v} onChange={(e) => set(path, Number(e.target.value))} /></label>
  if (typeof v === 'string') {
    if (IMAGE_KEYS.has(k)) return (
      <div className="f"><span>{label}</span>
        <div className="f-image">{v ? <img src={asset(v)} alt="" /> : <span className="img-empty"><Icon name="image" /></span>}
          <div><ImagePicker path={path} label={v ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'} /><input value={v} onChange={(e) => set(path, e.target.value)} placeholder="หรือพิมพ์ path / URL" /></div></div>
      </div>)
    if (k === 'model') return (
      <div className="f"><span>{label}</span><div className="f-row"><input value={v} onChange={(e) => set(path, e.target.value)} placeholder="models/xxx.glb" /><ImagePicker path={path} label="อัปโหลด .glb" accept=".glb,.gltf" dir="models" /></div></div>)
    if (k === 'tone') return <label className="f"><span>{label}</span><select value={v} onChange={(e) => set(path, e.target.value)}>{TONES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
    const long = LONG_KEYS.has(k) || v.length > 70 || v.includes('\n') || typeof path[path.length - 1] === 'number' && v.length > 40
    return <label className="f"><span>{label}</span>{long ? <textarea rows={Math.min(10, Math.max(3, Math.ceil(v.length / 60)))} value={v} onChange={(e) => set(path, e.target.value)} /> : <input value={v} onChange={(e) => set(path, e.target.value)} />}</label>
  }
  if (Array.isArray(v)) return <ArrayField path={path} k={k} arr={v} label={label} />
  if (v && typeof v === 'object') return <fieldset className="f-group"><legend>{label}</legend>{Object.keys(v).map((kk) => <Field key={kk} path={[...path, kk]} k={kk} />)}</fieldset>
  return null
}

function ArrayField({ path, k, arr, label }: { path: Path; k: string; arr: unknown[]; label: string }) {
  const { set } = useSite()
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= arr.length) return; const n = [...arr]; [n[i], n[j]] = [n[j], n[i]]; set(path, n) }
  const remove = (i: number) => set(path, arr.filter((_, x) => x !== i))
  const add = () => {
    const sample = arr[0]
    const fresh = typeof sample === 'object' && sample ? Object.fromEntries(Object.entries(sample).map(([kk, vv]) => [kk, typeof vv === 'number' ? 0 : typeof vv === 'boolean' ? false : Array.isArray(vv) ? [] : ''])) : ''
    set(path, [...arr, fresh])
  }
  const isImages = k === 'images'
  return (
    <fieldset className="f-group">
      <legend>{label}<small>{arr.length}</small></legend>
      {isImages ? (
        <div className="f-thumbs">
          {arr.map((src, i) => (
            <div key={i} className="f-thumb"><img src={asset(String(src))} alt="" />
              <span><button type="button" onClick={() => move(i, -1)} title="เลื่อนซ้าย"><Icon name="prev" size={12} /></button><button type="button" onClick={() => move(i, 1)} title="เลื่อนขวา"><Icon name="next" size={12} /></button><button type="button" className="danger" onClick={() => remove(i)} title="ลบ"><Icon name="trash" size={12} /></button></span>
            </div>
          ))}
          <ImageAdder path={path} arr={arr as string[]} />
        </div>
      ) : arr.map((item, i) => (
        <div key={i} className="f-item">
          <div className="f-item-body">{item && typeof item === 'object'
            ? Object.keys(item).map((kk) => <Field key={kk} path={[...path, i, kk]} k={kk} />)
            : <Field path={[...path, i]} k={k} />}</div>
          <div className="f-item-tools">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="เลื่อนขึ้น"><Icon name="up" size={12} /></button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === arr.length - 1} title="เลื่อนลง"><Icon name="down" size={12} /></button>
            <button type="button" className="danger" onClick={() => remove(i)} title="ลบ"><Icon name="trash" size={12} /></button>
          </div>
        </div>
      ))}
      {!isImages && <button type="button" className="add-item sm" onClick={add}><Icon name="plus" size={14} />เพิ่ม</button>}
    </fieldset>
  )
}

function ImageAdder({ path, arr }: { path: Path; arr: string[] }) {
  const { upload, set } = useSite()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <button type="button" className="f-thumb add" onClick={() => input.current?.click()} disabled={busy}><Icon name="plus" />{busy ? '…' : 'เพิ่มรูป'}</button>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={async (e) => {
        const files = [...(e.target.files ?? [])]; e.target.value = ''
        if (!files.length) return
        setBusy(true)
        try { const paths: string[] = []; for (const f of files) paths.push(await upload(f)); set(path, [...arr, ...paths]) } finally { setBusy(false) }
      }} />
    </>
  )
}
