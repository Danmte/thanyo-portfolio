import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

/**
 * Offline build: the site opens by double-clicking index.html (file://), no server needed.
 * Chrome blocks two things on file://, so this build avoids both:
 *  - <script type="module"> → the app is bundled as one classic script (format: 'iife', see vite.config.ts)
 *  - fetch() of local files (the .glb models) → models used by the content are embedded in models.js
 *    as data: URLs; src/lib/asset.ts reads them from window.__MODELS.
 */
export function offline(root: string, contentFile: string): Plugin {
  return {
    name: 'offline-file-build',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) => {
        const app = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>\s*/)
        if (!app) throw new Error('offline build: app script tag not found')
        return html
          .replace(app[0], '')
          // a CORS request to file:// fails — drop crossorigin on local files only (Google Fonts still needs it)
          .replace(/<(?:script|link)\b[^>]*(?:src|href)="\.\/[^>]*>/g, (tag) => tag.replace(/ crossorigin(?=[ >])/, ''))
          .replace(/\s*<\/head>/, `\n    <script src="./models.js"></script>\n    <script defer src="${app[1]}"></script>\n  </head>`)
      },
    },
    generateBundle() {
      const site = JSON.parse(fs.readFileSync(path.join(root, contentFile), 'utf8')) as { models: { model: string }[] }
      const models: Record<string, string> = {}
      for (const { model } of site.models) {
        const file = path.join(root, 'public', model)
        if (!model || !fs.existsSync(file)) continue
        models[model] = 'data:model/gltf-binary;base64,' + fs.readFileSync(file).toString('base64')
      }
      this.emitFile({ type: 'asset', fileName: 'models.js', source: `window.__MODELS = ${JSON.stringify(models)};\n` })
    },
  }
}
