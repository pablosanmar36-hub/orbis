import { motion } from 'framer-motion'
import { ImageOff, Play } from 'lucide-react'
import { useRef, useState } from 'react'
import { useOrbis } from '../../store/useOrbis'
import type { MediaItem, Memory } from '../../types'
import { EASE } from './motion'

/** Masonry por columnas CSS: respeta la proporción natural de cada foto o vídeo. */
export function Gallery({ memory }: { memory: Memory }) {
  const openLightbox = useOrbis((s) => s.openLightbox)
  if (!memory.media.length) {
    return <p className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-white/35">Aún no hay fotos ni vídeos</p>
  }
  return (
    <div className="columns-2 gap-2.5 [column-fill:_balance]">
      {memory.media.map((item, i) => (
        <motion.button
          key={item.id}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.5 + i * 0.05 }}
          onClick={() => openLightbox(memory.id, i)}
          className="group relative mb-2.5 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-white/[0.03]"
        >
          <Tile item={item} tall={i % 3 === 0} />
        </motion.button>
      ))}
    </div>
  )
}

function Tile({ item, tall }: { item: MediaItem; tall: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(!item.src)

  if (failed) {
    return (
      <div className={`grid w-full place-items-center text-white/25 ${tall ? 'aspect-[3/4]' : 'aspect-square'}`}>
        <ImageOff size={20} />
      </div>
    )
  }

  const zoom = 'transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]'

  if (item.type === 'video') {
    return (
      <div
        onMouseEnter={() => video.current?.play().catch(() => {})}
        onMouseLeave={() => {
          if (!video.current) return
          video.current.pause()
          video.current.currentTime = 0
        }}
      >
        <video ref={video} src={item.src} muted loop playsInline preload="metadata" onError={() => setFailed(true)} className={`block w-full object-cover ${zoom}`} />
        <span className="absolute left-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition group-hover:scale-110">
          <Play size={12} fill="currentColor" />
        </span>
        <Caption item={item} />
      </div>
    )
  }

  return (
    <>
      <img src={item.src} alt={item.caption ?? ''} loading="lazy" onError={() => setFailed(true)} className={`block w-full object-cover ${zoom}`} />
      <Caption item={item} />
    </>
  )
}

function Caption({ item }: { item: MediaItem }) {
  if (!item.caption) return null
  return (
    <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-8 text-left text-[11px] text-white/90 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
      {item.caption}
    </span>
  )
}
