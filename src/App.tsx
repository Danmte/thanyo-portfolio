import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ContentProvider } from './content/store'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Work from './pages/Work'

const Studio = lazy(() => import('./pages/Studio'))

/**
 * THANYO portfolio — a normal scrolling website with a live 3D viewer.
 * All content lives in src/content/site.json and can be edited in the browser ("แก้ไขเว็บ").
 */
export default function App() {
  return (
    <ContentProvider>
      <Routes>
        <Route path="/studio" element={<Suspense fallback={<div className="loading-screen">Loading…</div>}><Studio /></Suspense>} />
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/work/:id" element={<Layout><Work /></Layout>} />
        {/* old routes from earlier versions */}
        <Route path="/games/*" element={<Navigate to="/" state={{ section: 'works' }} replace />} />
        <Route path="/gallery" element={<Navigate to="/" state={{ section: 'gallery' }} replace />} />
        <Route path="/profile" element={<Navigate to="/" state={{ section: 'about' }} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ContentProvider>
  )
}
