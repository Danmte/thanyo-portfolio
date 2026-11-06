import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

/**
 * Tiny local CMS for `npm run dev` only.
 *  GET  /__cms/ping                         → { ok: true }
 *  POST /__cms/save      (JSON body)        → writes src/content/site.json (keeps 10 backups in .cms-backup/)
 *  POST /__cms/upload?name=x.png&dir=media  → writes public/<dir>/uploads/<file>, returns { path }
 * Nothing here ships in the production build.
 */
const ALLOWED = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.glb', '.gltf', '.mp4', '.webm'])
const MAX = 80 * 1024 * 1024

export function cms(root: string): Plugin {
  const content = path.join(root, 'src/content/site.json')
  const backups = path.join(root, '.cms-backup')
  const read = (req: import('node:http').IncomingMessage) => new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []; let size = 0
    req.on('data', (c: Buffer) => { size += c.length; if (size > MAX) { reject(new Error('file too large')); req.destroy() } else chunks.push(c) })
    req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject)
  })
  return {
    name: 'thanyo-cms',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__cms', async (req, res) => {
        const send = (code: number, body: unknown) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)) }
        try {
          const url = new URL(req.url ?? '/', 'http://localhost')
          if (req.method === 'GET' && url.pathname === '/ping') return send(200, { ok: true })
          if (req.method === 'POST' && url.pathname === '/save') {
            const data = JSON.parse((await read(req)).toString('utf8'))
            if (!data || typeof data !== 'object' || !Array.isArray(data.works)) return send(400, { error: 'not a site.json' })
            fs.mkdirSync(backups, { recursive: true })
            if (fs.existsSync(content)) fs.copyFileSync(content, path.join(backups, `site-${Date.now()}.json`))
            const old = fs.readdirSync(backups).filter((f) => f.endsWith('.json')).sort()
            old.slice(0, Math.max(0, old.length - 10)).forEach((f) => fs.unlinkSync(path.join(backups, f)))
            fs.writeFileSync(content, JSON.stringify(data, null, 2) + '\n', 'utf8')
            return send(200, { ok: true })
          }
          if (req.method === 'POST' && url.pathname === '/upload') {
            const dir = url.searchParams.get('dir') === 'models' ? 'models' : 'media'
            const raw = path.basename(url.searchParams.get('name') ?? 'file')
            const ext = path.extname(raw).toLowerCase()
            if (!ALLOWED.has(ext)) return send(400, { error: `file type ${ext} not allowed` })
            const stem = raw.slice(0, -ext.length).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'file'
            const name = `${stem}-${Date.now().toString(36)}${ext}`
            const outDir = path.join(root, 'public', dir, 'uploads')
            fs.mkdirSync(outDir, { recursive: true })
            fs.writeFileSync(path.join(outDir, name), await read(req))
            return send(200, { path: `${dir}/uploads/${name}` })
          }
          send(404, { error: 'unknown endpoint' })
        } catch (e) {
          send(500, { error: e instanceof Error ? e.message : String(e) })
        }
      })
    },
  }
}
