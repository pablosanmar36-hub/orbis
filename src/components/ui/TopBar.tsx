import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { useOrbis } from '../../store/useOrbis'
import { EASE } from './motion'

export function TopBar() {
  const memories = useOrbis((s) => s.memories)
  const hidden = useOrbis((s) => s.uiHidden || s.cinematic)
  const selectOpen = useOrbis((s) => !!s.selectedId)

  const stats = useMemo(() => {
    const media = memories.flatMap((m) => m.media)
    const countries = new Set(memories.map((m) => m.place.split(',').pop()?.trim()).filter(Boolean))
    return [
      { label: 'Lugares', value: memories.length },
      { label: 'Países', value: countries.size },
      { label: 'Fotos', value: media.filter((m) => m.type === 'image').length },
      { label: 'Vídeos', value: media.filter((m) => m.type === 'video').length },
    ]
  }, [memories])

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
          className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between p-5 md:p-7"
        >
          <div>
            <h1 className="font-display text-3xl leading-none tracking-wide text-white md:text-4xl">Orbis</h1>
            <p className="mt-1.5 text-[10px] uppercase tracking-[0.32em] text-white/40">Archivo personal de viajes</p>
          </div>
          <motion.dl
            animate={{ opacity: selectOpen ? 0 : 1 }}
            className="hidden gap-8 md:flex"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-right">
                <dd className="font-display text-3xl leading-none text-white tabular-nums">{s.value}</dd>
                <dt className="mt-1 text-[9px] uppercase tracking-[0.28em] text-white/40">{s.label}</dt>
              </div>
            ))}
          </motion.dl>
        </motion.header>
      )}
    </AnimatePresence>
  )
}
