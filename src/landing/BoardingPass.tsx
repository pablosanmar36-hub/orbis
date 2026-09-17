import { Plane } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const HOLD_MS = 1400

interface Props {
  onLaunch: () => void
  size?: 'md' | 'lg'
  passenger?: string
}

/**
 * Tarjeta de embarque: la entrada a la app. Se mantiene pulsado el talón para "despegar";
 * al soltar antes de tiempo el avión vuelve atrás. Funciona con ratón, táctil y teclado (Espacio / Enter).
 */
export function BoardingPass({ onLaunch, size = 'md', passenger = 'Tú' }: Props) {
  const [progress, setProgress] = useState(0)
  const value = useRef(0)
  const holding = useRef(false)
  const raf = useRef(0)
  const last = useRef(0)
  const done = useRef(false)

  // El progreso vive en una ref y se refleja en el estado: sin efectos dentro de los actualizadores
  const tick = (now: number) => {
    const dt = last.current ? now - last.current : 16
    last.current = now
    value.current = holding.current ? Math.min(1, value.current + dt / HOLD_MS) : Math.max(0, value.current - dt / 380)
    setProgress(value.current)
    if (value.current >= 1 && !done.current) {
      done.current = true
      onLaunch()
      return
    }
    if (holding.current || value.current > 0) raf.current = requestAnimationFrame(tick)
  }

  const start = () => {
    if (done.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      done.current = true
      onLaunch()
      return
    }
    holding.current = true
    last.current = 0
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(tick)
  }
  const stop = () => {
    holding.current = false
    last.current = 0
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(tick)
  }

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const lg = size === 'lg'
  const today = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date()).toUpperCase().replace('.', '')

  return (
    <div
      className={`relative flex w-full select-none overflow-hidden rounded-[1.4rem] bg-paper text-[#1c1a16] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)] ${
        lg ? 'max-w-3xl flex-col sm:flex-row' : 'max-w-[34rem] flex-col sm:flex-row'
      }`}
      style={{ transform: `rotate(${progress * -1.5}deg) translateY(${progress * -4}px)` }}
    >
      {/* Cuerpo del billete */}
      <div className={`relative flex-1 ${lg ? 'p-7 sm:p-9' : 'p-5 sm:p-6'}`}>
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-[#1c1a16]/55">
          <span>Orbis Air</span>
          <span>Embarque</span>
        </div>

        <div className={`mt-4 flex items-end justify-between gap-3 ${lg ? 'sm:mt-6' : ''}`}>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1c1a16]/50">Origen</p>
            <p className={`font-display leading-none ${lg ? 'text-5xl sm:text-6xl' : 'text-4xl'}`}>CRT</p>
            <p className="mt-1 truncate text-[11px] text-[#1c1a16]/60">Tu carrete de fotos</p>
          </div>
          <div className="relative mb-4 flex-1 px-2">
            <div className="h-px w-full border-t border-dashed border-[#1c1a16]/30" />
            <Plane
              size={lg ? 22 : 18}
              className="absolute -top-[10px] text-[#b4642c] transition-transform"
              style={{ left: `calc(${progress * 100}% - ${progress * (lg ? 22 : 18)}px)`, transform: 'rotate(45deg)' }}
              fill="currentColor"
            />
          </div>
          <div className="min-w-0 text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1c1a16]/50">Destino</p>
            <p className={`font-display leading-none ${lg ? 'text-5xl sm:text-6xl' : 'text-4xl'}`}>ORB</p>
            <p className="mt-1 truncate text-[11px] text-[#1c1a16]/60">Tu planeta</p>
          </div>
        </div>

        <dl className={`mt-5 grid grid-cols-4 gap-1.5 border-t border-[#1c1a16]/12 pt-4 font-mono ${lg ? 'sm:mt-7' : ''}`}>
          {[
            ['Pasajero', passenger],
            ['Vuelo', 'OR26'],
            ['Fecha', today],
            ['Asiento', '∞A'],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[9px] uppercase tracking-[0.16em] text-[#1c1a16]/45">{k}</dt>
              <dd className="mt-0.5 truncate text-[12px] font-medium sm:text-[13px]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Perforación */}
      <div className="perforation hidden w-4 shrink-0 sm:block" aria-hidden="true" />
      <div className="h-4 w-full shrink-0 sm:hidden" style={{ backgroundImage: 'radial-gradient(circle, #05070f 3.5px, transparent 4px)', backgroundSize: '14px 100%' }} aria-hidden="true" />

      {/* Talón: botón de mantener pulsado */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          start()
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault()
            start()
          }
        }}
        onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && stop()}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Mantén pulsado para despegar y entrar en tu globo"
        className={`group relative flex shrink-0 flex-col items-center justify-center gap-2 overflow-hidden bg-[#1c1a16] text-paper touch-none ${
          lg ? 'px-8 py-7 sm:w-56' : 'px-6 py-5 sm:w-40'
        }`}
      >
        <span className="absolute inset-y-0 left-0 bg-sun" style={{ width: `${progress * 100}%` }} aria-hidden="true" />
        <span className={`relative flex flex-col items-center gap-2 ${progress > 0.5 ? 'text-[#1c1a16]' : ''}`}>
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] opacity-70">Puerta ∞</span>
          <span className={`font-display leading-none ${lg ? 'text-4xl' : 'text-3xl'}`}>{progress >= 1 ? '¡Despega!' : 'Despegar'}</span>
          <span className="font-mono text-[10px] tracking-wide opacity-70">{progress > 0 && progress < 1 ? `${Math.round(progress * 100)} %` : 'Mantén pulsado'}</span>
          <span className="barcode mt-1 h-6 w-24 opacity-30 invert" aria-hidden="true" />
        </span>
      </button>
    </div>
  )
}
