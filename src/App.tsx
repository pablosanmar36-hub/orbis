import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { DETAIL_IMAGERY } from './config'
import { GlobeScene } from './components/globe/GlobeScene'
import { AccountPage } from './components/ui/AccountPage'
import { AuthGate } from './components/ui/AuthGate'
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
  const detailActive = useOrbis((s) => s.detailActive)
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
      <AccountPage />
      <AuthGate />
      <Loader />

      <AnimatePresence>
        {detailActive && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed bottom-2 right-3 z-10 text-[10px] text-white/40"
          >
            {DETAIL_IMAGERY.attribution}
          </motion.p>
        )}
      </AnimatePresence>
    </main>
  )
}
