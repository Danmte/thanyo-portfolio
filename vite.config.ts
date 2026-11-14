import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { cms } from './cms.plugin.ts'
import { offline } from './offline.plugin.ts'

/**
 * Three editions from one codebase:
 *   portfolio (default)  → content src/content/site.json           → build to dist/        (CAMT CMU)
 *   kmitl (--mode kmitl) → content src/content/site.kmitl.json     → build to dist/kmitl/  (KMITL IT)
 *   personal (--mode personal) → content src/content/site.personal.json → build to dist/me/
 *   personal-offline / kmitl-offline → same content, opens by double-clicking index.html → dist/<mode>/
 * base: './' so the built site works from any folder (GitHub Pages, itch.io, Netlify...)
 * cms(): in-browser editor saves to that edition's content file during `npm run dev`
 */
export default defineConfig(({ mode }) => {
  const isOffline = mode === 'personal-offline' || mode === 'kmitl-offline'
  const personal = mode === 'personal' || mode === 'personal-offline'
  const kmitl = mode === 'kmitl' || mode === 'kmitl-offline'
  const content = personal ? 'src/content/site.personal.json' : kmitl ? 'src/content/site.kmitl.json' : 'src/content/site.json'
  return {
    base: './',
    define: {
      __BUILD_TIME__: JSON.stringify(Date.now()),
      __EDITION__: JSON.stringify(personal ? 'personal' : kmitl ? 'kmitl' : 'portfolio'),
      __CONTENT_FILE__: JSON.stringify(content),
    },
    resolve: { alias: { '@content/site.json': path.join(import.meta.dirname, content) } },
    build: isOffline
      ? {
          outDir: `dist/${mode}`, // dist/personal-offline or dist/kmitl-offline
          modulePreload: false,
          chunkSizeWarningLimit: 4000,
          rolldownOptions: { output: { format: 'iife', codeSplitting: false } },
        }
      : { outDir: personal ? 'dist/me' : kmitl ? 'dist/kmitl' : 'dist' },
    server: personal ? { port: 5174 } : kmitl ? { port: 5176 } : undefined,
    plugins: [
      react(),
      cms(import.meta.dirname, content),
      {
        name: 'edition-html',
        transformIndexHtml: (html) => personal
          ? html.replace(/<title>.*?<\/title>/, '<title>Thanyo — Personal</title>')
            .replace(/(<meta name="description" content=")[^"]*/, '$1เว็บส่วนตัวของธัญโย: งานที่ทำเล่น ตัวละคร โมเดล 3D และงานวาด')
          : kmitl
            ? html.replace(/(<meta name="description" content=")[^"]*/, '$1พอร์ตฟอลิโอของธัญโย สำหรับคณะเทคโนโลยีสารสนเทศ สจล. (KMITL IT): เกม โมเดล 3D และงานเว็บ')
            : html,
      },
      isOffline && offline(import.meta.dirname, content),
    ],
  }
})
