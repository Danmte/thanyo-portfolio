import { lazy, Suspense, useSyncExternalStore } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import TitleScreen from './pages/TitleScreen'
import MainMenu from './pages/MainMenu'
import Projects from './pages/Projects'
import Gallery from './pages/Gallery'
import Profile from './pages/Profile'
import { menuAccent } from './lib/menuAccent'

// Three.js pages/scenes are split out so the first paint is fast.
const Characters = lazy(() => import('./pages/Characters'))
const MenuScene = lazy(() => import('./components/MenuScene'))

export default function App() {
  const location = useLocation()
  const path = location.pathname
  const view = path === '/' ? 'title' : path === '/menu' ? 'menu' : null
  const accent = useSyncExternalStore(menuAccent.subscribe, menuAccent.get)
  return (
    <div className="app">
      {/* one persistent 3D world for title + menu, so the camera can swing between them */}
      {view && <Suspense fallback={null}><MenuScene view={view} accent={accent} /></Suspense>}
      <Suspense fallback={<div className="loading-screen"><div className="loader" />LOADING</div>}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<TitleScreen />} />
          <Route path="/menu" element={<MainMenu />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}
