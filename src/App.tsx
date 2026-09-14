import { useEffect } from 'react'
import { GlobeScene } from './components/globe/GlobeScene'
import { Cinematic } from './components/ui/Cinematic'
import { ControlDock } from './components/ui/ControlDock'
import { Curator } from './components/ui/Curator'
import { Lightbox } from './components/ui/Lightbox'
import { Loader } from './components/ui/Loader'
import { MemoryVault } from './components/ui/MemoryVault'
import { TopBar } from './components/ui/TopBar'
import { useKeyboard } from './hooks/useKeyboard'
import { useOrbis } from './store/useOrbis'

export default function App() {
  const hydrate = useOrbis((s) => s.hydrate)
  useEffect(() => {
    hydrate()
  }, [hydrate])
  useKeyboard()

  return (
    <main className="fixed inset-0 select-none overflow-hidden">
      <GlobeScene />
      {/* Viñeta cinematográfica */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)]" />
      <TopBar />
      <ControlDock />
      <MemoryVault />
      <Curator />
      <Cinematic />
      <Lightbox />
      <Loader />
    </main>
  )
}
