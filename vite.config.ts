import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { cms } from './cms.plugin.ts'

// base: './' so the built site works from any folder (GitHub Pages, itch.io, Netlify...)
// cms(): in-browser editor saves to src/content/site.json during `npm run dev`
export default defineConfig({
  base: './',
  define: { __BUILD_TIME__: JSON.stringify(Date.now()) },
  plugins: [react(), cms(import.meta.dirname)],
})
