// Saving from the live site (iPad etc.): commits go straight to the GitHub repo,
// then GitHub Actions rebuilds GitHub Pages (~1–2 min).
export const REPO = { owner: 'Danmte', name: 'thanyo-portfolio', branch: 'main' }
const TOKEN_KEY = 'thanyo-gh-token'
const api = (path: string) => `https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${path}`

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' } }
export const setToken = (t: string) => { try { if (t) localStorage.setItem(TOKEN_KEY, t.trim()); else localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ } }

const headers = (token: string) => ({ Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' })

/** Check the token can push to the repo. */
export async function checkToken(token: string) {
  const r = await fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.name}`, { headers: headers(token) })
  if (!r.ok) return false
  const j = await r.json()
  return !!j.permissions?.push
}

async function sha(token: string, path: string) {
  const r = await fetch(`${api(path)}?ref=${REPO.branch}`, { headers: headers(token) })
  return r.ok ? ((await r.json()).sha as string) : undefined
}

async function put(token: string, path: string, base64: string, message: string) {
  const body = { message, content: base64, branch: REPO.branch, sha: await sha(token, path) }
  const r = await fetch(api(path), { method: 'PUT', headers: { ...headers(token), 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${(await r.json().catch(() => ({}))).message ?? ''}`)
}

const utf8ToBase64 = (s: string) => { const bytes = new TextEncoder().encode(s); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(bin) }
const fileToBase64 = (f: File) => new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] ?? ''); fr.onerror = rej; fr.readAsDataURL(f) })

export async function commitSite(token: string, json: string) {
  await put(token, 'src/content/site.json', utf8ToBase64(json), 'Edit site content (from the web editor)')
}

/** Upload a file into public/<dir>/uploads/ and return its site path. */
export async function commitUpload(token: string, file: File, dir: 'media' | 'models') {
  const m = file.name.match(/\.[a-z0-9]+$/i); const ext = (m?.[0] ?? '').toLowerCase()
  if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.glb', '.gltf', '.mp4', '.webm'].includes(ext)) throw new Error(`file type ${ext} not allowed`)
  const stem = file.name.slice(0, file.name.length - ext.length).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'file'
  const name = `${stem}-${Date.now().toString(36)}${ext}`
  await put(token, `public/${dir}/uploads/${name}`, await fileToBase64(file), `Upload ${name} (from the web editor)`)
  return `${dir}/uploads/${name}`
}
