import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, Info, MapPin, X } from 'lucide-react'
import { useState } from 'react'
import { formatCoords, formatDate } from '../../lib/geo'
import { useOrbis } from '../../store/useOrbis'
import { EASE } from './motion'
import { VideoPlayer } from './VideoPlayer'

export function Lightbox() {
  const lightbox = useOrbis((s) => s.lightbox)
  const memory = useOrbis((s) => s.memories.find((m) => m.id === s.lightbox?.memoryId))
  const closeLightbox = useOrbis((s) => s.closeLightbox)
  const stepLightbox = useOrbis((s) => s.stepLightbox)
  const [showInfo, setShowInfo] = useState(true)
  const [direction, setDirection] = useState<1 | -1>(1)

  const item = memory && lightbox ? memory.media[lightbox.index] : undefined
  const step = (d: 1 | -1) => {
    setDirection(d)
    stepLightbox(d)
  }

  return (
    <AnimatePresence>
      {memory && lightbox && item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="fixed inset-0 z-[60] flex flex-col bg-black/80 backdrop-blur-2xl"
          onClick={closeLightbox}
        >
          {/* Barra superior */}
          <div className="flex items-center justify-between p-4 text-white/70 md:p-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs tabular-nums tracking-[0.2em]">
              {String(lightbox.index + 1).padStart(2, '0')} <span className="text-white/30">/ {String(memory.media.length).padStart(2, '0')}</span>
            </p>
            <div className="flex gap-1">
              <button onClick={() => setShowInfo(!showInfo)} aria-label="Información" className={`grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/10 ${showInfo ? 'text-white' : ''}`}>
                <Info size={18} strokeWidth={1.6} />
              </button>
              <button onClick={closeLightbox} aria-label="Cerrar" className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/10 hover:text-white">
                <X size={20} strokeWidth={1.6} />
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center gap-6 px-4 pb-4 md:px-20 md:pb-8">
            <AnimatePresence mode="popLayout" custom={direction} initial={false}>
              <motion.div
                key={item.id}
                custom={direction}
                initial={{ opacity: 0, x: direction * 60, scale: 0.97, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: direction * -60, scale: 0.97, filter: 'blur(10px)' }}
                transition={{ duration: 0.55, ease: EASE }}
                className="flex max-h-full min-w-0 items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {item.type === 'video' ? (
                  <VideoPlayer src={item.src} />
                ) : (
                  <img src={item.src} alt={item.caption ?? ''} className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl" draggable={false} />
                )}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {showInfo && (
                <motion.aside
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  onClick={(e) => e.stopPropagation()}
                  className="glass absolute bottom-6 left-4 right-4 rounded-2xl p-5 md:static md:w-72 md:shrink-0"
                >
                  <p className="font-display text-2xl leading-tight text-white">{item.caption || memory.title}</p>
                  <dl className="mt-4 space-y-2.5 text-xs text-white/60">
                    <div className="flex items-center gap-2"><CalendarDays size={13} className="text-white/35" /> {formatDate(item.takenAt || memory.startDate)}</div>
                    <div className="flex items-center gap-2"><MapPin size={13} className="text-white/35" /> {memory.place}</div>
                    <div className="pl-5 tabular-nums text-white/35">{formatCoords(memory)}</div>
                  </dl>
                  {memory.note && <p className="mt-4 border-t border-white/[0.07] pt-4 font-display text-base italic leading-snug text-white/70">“{memory.note}”</p>}
                </motion.aside>
              )}
            </AnimatePresence>

            {memory.media.length > 1 && (
              <>
                <NavButton side="left" onClick={() => step(-1)} />
                <NavButton side="right" onClick={() => step(1)} />
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function NavButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={side === 'left' ? 'Anterior' : 'Siguiente'}
      className={`absolute top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/5 text-white/70 backdrop-blur-md transition hover:bg-white/15 hover:text-white ${
        side === 'left' ? 'left-3 md:left-6' : 'right-3 md:right-6'
      }`}
    >
      <Icon size={22} strokeWidth={1.5} />
    </button>
  )
}
