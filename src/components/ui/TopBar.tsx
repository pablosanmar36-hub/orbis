import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { useOrbis } from '../../store/useOrbis'
import { initialOf, useSession } from '../../store/useSession'
import { EASE } from './motion'

export function TopBar() {
  const memories = useOrbis((s) => s.memories)
  const hidden = useOrbis((s) => s.uiHidden || s.cinematic)
  const selectOpen = useOrbis((s) => !!s.selectedId)
  const user = useSession((s) => s.user)

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
          className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between gap-6 p-5 md:p-7"
        >
          <div className="min-w-0">
            <h1 className="font-display text-3xl leading-none tracking-wide text-white md:text-4xl">Orbis</h1>
            <p className="mt-1.5 max-w-[16rem] font-display text-[15px] italic leading-snug text-white/55 md:max-w-none md:text-base">
              Coleccionar viajes es archivar la memoria del alma
            </p>
          </div>

          <motion.div
            animate={{ opacity: selectOpen ? 0 : 1 }}
            className={`flex items-start gap-8 ${selectOpen ? 'pointer-events-none' : ''}`}
          >
            <dl className="hidden gap-8 md:flex">
              {stats.map((s) => (
                <div key={s.label} className="text-right">
                  <dd className="font-display text-3xl leading-none text-white tabular-nums">{s.value}</dd>
                  <dt className="mt-1 text-[9px] uppercase tracking-[0.28em] text-white/40">{s.label}</dt>
                </div>
              ))}
            </dl>

            <button
              type="button"
              onClick={() => useOrbis.getState().setAccountOpen(true)}
              aria-label="Tu cuenta"
              title="Tu cuenta"
              className="group pointer-events-auto relative grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] font-display text-lg text-amber-100 ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/[0.12] hover:ring-amber-100/40 md:mt-[-2px]"
            >
              {initialOf(user?.nombre)}
              <span className="pointer-events-none absolute right-0 top-12 whitespace-nowrap rounded-full bg-black/70 px-2.5 py-1 font-sans text-[10px] tracking-wide text-white/90 opacity-0 transition group-hover:opacity-100">
                Tu cuenta
              </span>
            </button>
          </motion.div>
        </motion.header>
      )}
    </AnimatePresence>
  )
}
