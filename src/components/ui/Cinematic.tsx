import { AnimatePresence, motion } from 'framer-motion'
import { Music, Music2, Pause, Play, SkipForward, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { GLOBE } from '../../config'
import { AmbientEngine } from '../../lib/ambient'
import { formatRange } from '../../lib/geo'
import { coverOf, tourOrder, useOrbis } from '../../store/useOrbis'
import { EASE } from './motion'

/** Recorrido automático cronológico por todos los destinos, con barras de cine y música opcional. */
export function Cinematic() {
  const { cinematic, memories, tourIndex, setTourIndex, setCinematic, fly, music, toggleMusic } = useOrbis()
  const [paused, setPaused] = useState(false)
  const stepMs = useOrbis((s) => s.prefs.tourSeconds) * 1000
  const engine = useRef<AmbientEngine | null>(null)

  const order = useMemo(() => tourOrder(memories), [memories])
  const current = order[tourIndex % Math.max(1, order.length)]

  // Avance del recorrido
  useEffect(() => {
    if (!cinematic || !current) return
    fly(current, GLOBE.tourDistance)
    if (paused) return
    const t = setTimeout(() => setTourIndex((tourIndex + 1) % order.length), stepMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cinematic, tourIndex, paused, order.length])

  // Música ambiental
  useEffect(() => {
    if (cinematic && music) {
      engine.current ??= new AmbientEngine()
      engine.current.start()
    } else engine.current?.stop()
  }, [cinematic, music])
  useEffect(() => () => engine.current?.stop(), [])

  const cover = current && coverOf(current)

  return (
    <AnimatePresence>
      {cinematic && current && (
        <motion.div className="pointer-events-none fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
          {/* Barras de cine */}
          <motion.div initial={{ height: 0 }} animate={{ height: '9vh' }} exit={{ height: 0 }} transition={{ duration: 1.1, ease: EASE }} className="absolute inset-x-0 top-0 bg-black" />
          <motion.div initial={{ height: 0 }} animate={{ height: '9vh' }} exit={{ height: 0 }} transition={{ duration: 1.1, ease: EASE }} className="absolute inset-x-0 bottom-0 bg-black" />

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              className="absolute bottom-[13vh] left-6 max-w-xl md:left-14"
              initial="hidden"
              animate="show"
              exit="exit"
              variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 1.1 } }, exit: { transition: { staggerChildren: 0.04 } } }}
            >
              {[
                <p key="i" className="text-[10px] uppercase tracking-[0.4em] text-amber-200/80">
                  {String((tourIndex % order.length) + 1).padStart(2, '0')} — {current.place}
                </p>,
                <h2 key="t" className="mt-3 font-display text-5xl leading-[0.95] text-white [text-shadow:0_4px_30px_rgba(0,0,0,0.8)] md:text-7xl">
                  {current.title}
                </h2>,
                <p key="d" className="mt-3 text-sm text-white/60">{formatRange(current.startDate, current.endDate)}</p>,
              ].map((child) => (
                <motion.div
                  key={child.key}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
                    exit: { opacity: 0, y: -12, transition: { duration: 0.5 } },
                  }}
                >
                  {child}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {cover?.src && cover.type === 'image' && (
              <motion.img
                key={cover.id}
                src={cover.src}
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 2, transition: { delay: 1.5, duration: 1.2, ease: EASE } }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.4 } }}
                className="absolute bottom-[13vh] right-6 hidden h-44 w-32 rounded-xl border border-white/10 object-cover shadow-2xl md:right-14 md:block lg:h-56 lg:w-40"
                alt=""
              />
            )}
          </AnimatePresence>

          {/* Progreso + controles */}
          <div className="pointer-events-auto absolute right-5 top-[calc(9vh+1rem)] flex items-center gap-1 md:right-10">
            {[
              { label: music ? 'Silenciar música' : 'Música ambiental', icon: music ? <Music2 size={16} /> : <Music size={16} />, onClick: toggleMusic, active: music },
              { label: paused ? 'Reanudar' : 'Pausar', icon: paused ? <Play size={16} /> : <Pause size={16} />, onClick: () => setPaused(!paused) },
              { label: 'Siguiente', icon: <SkipForward size={16} />, onClick: () => setTourIndex((tourIndex + 1) % order.length) },
              { label: 'Salir', icon: <X size={17} />, onClick: () => setCinematic(false) },
            ].map((b) => (
              <button
                key={b.label}
                onClick={b.onClick}
                aria-label={b.label}
                title={b.label}
                className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur-md transition ${b.active ? 'bg-white text-black' : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white'}`}
              >
                {b.icon}
              </button>
            ))}
          </div>

          <div className="absolute inset-x-0 bottom-[9vh] flex gap-1 px-6 pb-3 md:px-14">
            {order.map((m, i) => (
              <div key={m.id} className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/15">
                {i < tourIndex % order.length && <div className="h-full w-full bg-white/70" />}
                {i === tourIndex % order.length && (
                  <motion.div
                    key={`${tourIndex}-${paused}`}
                    className="h-full bg-white"
                    initial={{ width: paused ? '100%' : '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: paused ? 0 : stepMs / 1000, ease: 'linear' }}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
