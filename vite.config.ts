import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base: './' so the built site works from any folder (GitHub Pages, itch.io, Netlify...)
export default defineConfig({
  base: './',
  plugins: [react()],
})
