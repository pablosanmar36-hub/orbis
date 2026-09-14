import { useProgress } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { EASE } from './motion'

export function Loader() {
  const { active, progress } = useProgress()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!active && progress === 100) {
      const t = setTimeout(() => setDone(true), 500)
      return () => clearTimeout(t)
    }
  }, [active, progress])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#010208]"
          exit={{ opacity: 0, filter: 'blur(12px)' }}
          transition={{ duration: 1.2, ease: EASE }}
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.2em' }}
            animate={{ opacity: 1, letterSpacing: '0.6em' }}
            transition={{ duration: 2, ease: EASE }}
            className="pl-[0.6em] font-display text-4xl text-white/90"
          >
            ORBIS
          </motion.p>
          <div className="mt-8 h-px w-40 overflow-hidden bg-white/10">
            <motion.div className="h-full bg-gradient-to-r from-amber-200 to-sky-300" animate={{ width: `${progress}%` }} />
          </div>
          <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-white/35">Cargando la Tierra</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
