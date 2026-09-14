import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Film, ImageIcon, MapPin, Sun, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { daysBetween, formatCoords, formatRange } from '../../lib/geo'
import { coverOf, useOrbis, useSelectedMemory } from '../../store/useOrbis'
import type { Memory } from '../../types'
import { Gallery } from './Gallery'
import { EASE } from './motion'

export function MemoryVault() {
  const memory = useSelectedMemory()
  const uiHidden = useOrbis((s) => s.uiHidden)

  return (
    <AnimatePresence mode="wait">
      {memory && !uiHidden && (
        <motion.aside
          key={memory.id}
          initial={{ opacity: 0, x: 40, scale: 0.98, filter: 'blur(10px)' }}
          animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: 30, scale: 0.98, filter: 'blur(8px)' }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
          className="glass fixed inset-x-3 bottom-3 z-40 flex h-[64vh] flex-col overflow-hidden rounded-3xl md:inset-x-auto md:bottom-5 md:right-5 md:top-5 md:h-auto md:w-[460px]"
        >
          {/* La memoria se pasa como prop: durante la animación de salida ya no está seleccionada */}
          <VaultContent memory={memory} />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function VaultContent({ memory }: { memory: Memory }) {
  const select = useOrbis((s) => s.select)
  const deleteMemory = useOrbis((s) => s.deleteMemory)
  const [confirming, setConfirming] = useState(false)
  const cover = coverOf(memory)
  const photos = memory.media.filter((m) => m.type === 'image').length
  const videos = memory.media.filter((m) => m.type === 'video').length
  const days = daysBetween(memory.startDate, memory.endDate)

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE, delay: 0.35 + i * 0.07 },
  })

  return (
    <div className="scroll-thin relative flex-1 overflow-y-auto">
      {/* Cabecera inmersiva */}
      <div className="relative h-64 shrink-0 overflow-hidden md:h-72">
        {cover?.type === 'image' && cover.src ? (
          <motion.img
            src={cover.src}
            alt=""
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2.4, ease: EASE }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : cover?.type === 'video' && cover.src ? (
          <video src={cover.src} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,190,120,0.35),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(90,150,255,0.3),transparent_60%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c14] via-[#0a0c14]/40 to-black/10" />

        <button
          onClick={() => select(null)}
          aria-label="Cerrar"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white/80 backdrop-blur-md transition hover:bg-black/60 hover:text-white"
        >
          <X size={17} />
        </button>

        <div className="absolute inset-x-0 bottom-0 p-6">
          <motion.p {...stagger(0)} className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.28em] text-amber-200/80">
            <MapPin size={11} /> {memory.place}
          </motion.p>
          <motion.h2 {...stagger(1)} className="mt-2 font-display text-4xl leading-[1.05] text-white md:text-[2.75rem]">
            {memory.title}
          </motion.h2>
          <motion.p {...stagger(2)} className="mt-2 flex items-center gap-1.5 text-xs text-white/60">
            <CalendarDays size={12} /> {formatRange(memory.startDate, memory.endDate)}
          </motion.p>
        </div>
      </div>

      <div className="px-6 pb-8">
        <motion.div {...stagger(3)} className="grid grid-cols-3 gap-2 py-5">
          {[
            { icon: <ImageIcon size={14} />, value: photos, label: 'Fotos' },
            { icon: <Film size={14} />, value: videos, label: 'Vídeos' },
            { icon: <Sun size={14} />, value: days, label: days === 1 ? 'Día' : 'Días' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
              <div className="flex items-center gap-1.5 text-white/40">{s.icon}<span className="text-[9px] uppercase tracking-[0.2em]">{s.label}</span></div>
              <p className="mt-1 font-display text-2xl leading-none text-white tabular-nums">{s.value}</p>
            </div>
          ))}
        </motion.div>

        {memory.note && (
          <motion.blockquote {...stagger(4)} className="mb-6 border-l border-amber-200/30 pl-4 font-display text-lg italic leading-snug text-white/75">
            “{memory.note}”
          </motion.blockquote>
        )}

        <motion.div {...stagger(5)}>
          <Gallery memory={memory} />
        </motion.div>

        <motion.div {...stagger(6)} className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-5 text-[11px] text-white/35">
          <span className="tabular-nums">{formatCoords(memory)}</span>
          {confirming ? (
            <span className="flex items-center gap-2">
              <span className="text-white/60">¿Eliminar recuerdo?</span>
              <button onClick={() => deleteMemory(memory.id)} className="rounded-full bg-red-500/80 px-3 py-1 text-white hover:bg-red-500">Sí</button>
              <button onClick={() => setConfirming(false)} className="rounded-full px-3 py-1 text-white/70 hover:bg-white/10">No</button>
            </span>
          ) : (
            <button onClick={() => setConfirming(true)} className="flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-white/5 hover:text-red-300">
              <Trash2 size={12} /> Eliminar
            </button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
