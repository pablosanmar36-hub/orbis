import { AnimatePresence, motion } from 'framer-motion'
import { Maximize2, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const fmt = (s: number) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00')

/** Reproductor minimalista: controles que se desvanecen tras 2,5 s de inactividad. */
export function VideoPlayer({ src }: { src: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const idle = useRef<number>(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)

  const poke = () => {
    setShowControls(true)
    clearTimeout(idle.current)
    idle.current = window.setTimeout(() => video.current && !video.current.paused && setShowControls(false), 2500)
  }

  useEffect(() => {
    video.current?.play().catch(() => {})
    return () => clearTimeout(idle.current)
  }, [src])

  const toggle = () => {
    const v = video.current
    if (!v) return
    if (v.paused) v.play()
    else v.pause()
    poke()
  }

  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const k = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    if (video.current && duration) video.current.currentTime = k * duration
  }

  return (
    <div ref={wrap} onPointerMove={poke} className="relative flex max-h-full max-w-full items-center justify-center overflow-hidden rounded-2xl bg-black">
      <video
        ref={video}
        src={src}
        playsInline
        muted={muted}
        onClick={toggle}
        onPlay={() => {
          setPlaying(true)
          poke()
        }}
        onPause={() => {
          setPlaying(false)
          setShowControls(true)
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        className="max-h-[78vh] max-w-full cursor-pointer object-contain"
      />

      <AnimatePresence>
        {!playing && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            onClick={toggle}
            aria-label="Reproducir"
            className="absolute grid h-16 w-16 place-items-center rounded-full bg-white/15 text-white backdrop-blur-xl transition hover:bg-white/25"
          >
            <Play size={24} fill="currentColor" className="ml-1" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 10 }}
        transition={{ duration: 0.35 }}
        className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 text-white"
      >
        <button onClick={toggle} aria-label={playing ? 'Pausa' : 'Reproducir'} className="opacity-85 hover:opacity-100">
          {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>
        <span className="w-10 text-[11px] tabular-nums text-white/70">{fmt(time)}</span>
        <div
          className="group relative h-4 flex-1 cursor-pointer"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            seek(e)
          }}
          onPointerMove={(e) => e.buttons === 1 && seek(e)}
        >
          <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/20" />
          <div className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white" style={{ width: `${duration ? (time / duration) * 100 : 0}%` }} />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-white transition-transform group-hover:scale-100"
            style={{ left: `${duration ? (time / duration) * 100 : 0}%` }}
          />
        </div>
        <span className="w-10 text-right text-[11px] tabular-nums text-white/50">{fmt(duration)}</span>
        <button onClick={() => setMuted(!muted)} aria-label="Silenciar" className="opacity-85 hover:opacity-100">
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <button onClick={() => wrap.current?.requestFullscreen?.()} aria-label="Pantalla completa" className="opacity-85 hover:opacity-100">
          <Maximize2 size={15} />
        </button>
      </motion.div>
    </div>
  )
}
