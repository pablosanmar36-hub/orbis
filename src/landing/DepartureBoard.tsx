import { useEffect, useState } from 'react'
import { TRIPS } from './content'

const CHARSET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚ0123456789·°. '

/** Letras tipo panel de aeropuerto (split-flap) que giran hasta formar el texto. */
function Flap({ text, width }: { text: string; width: number }) {
  const target = text.toUpperCase().padEnd(width, ' ').slice(0, width)
  const [shown, setShown] = useState(target)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setShown(target)
    const steps = Array.from({ length: width }, (_, i) => 4 + i * 1.2 + Math.random() * 6)
    let tick = 0
    const id = setInterval(() => {
      tick++
      let done = true
      setShown(
        Array.from({ length: width }, (_, i) => {
          if (tick >= steps[i]) return target[i]
          done = false
          return CHARSET[Math.floor(Math.random() * CHARSET.length)]
        }).join(''),
      )
      if (done) clearInterval(id)
    }, 45)
    return () => clearInterval(id)
  }, [target, width])

  return (
    <span className="inline-flex gap-[2px]" aria-label={text}>
      {Array.from(shown).map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="relative grid h-7 w-[1.15rem] place-items-center rounded-[3px] bg-[#111624] font-mono text-[13px] font-medium text-star shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)] sm:h-8 sm:w-[1.3rem] sm:text-[15px]"
        >
          {ch}
          <span className="absolute inset-x-0 top-1/2 h-px bg-black/60" />
        </span>
      ))}
    </span>
  )
}

const STATUS = ['EN ÓRBITA', 'RECORDADO', 'EMBARCANDO', 'ATERRIZADO']

function coords(lat: number, lng: number) {
  return `${Math.abs(lat).toFixed(1)}${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(1)}${lng >= 0 ? 'E' : 'O'}`
}

/** Panel de "Salidas" con los viajes de ejemplo, rotando cada pocos segundos. */
export function DepartureBoard() {
  const ROWS = 5
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setOffset((o) => (o + 1) % TRIPS.length), 3800)
    return () => clearInterval(id)
  }, [])

  const rows = Array.from({ length: ROWS }, (_, i) => {
    const trip = TRIPS[(offset + i) % TRIPS.length]
    const hour = String(6 + ((offset + i) * 3) % 17).padStart(2, '0')
    return { trip, time: `${hour}:${String((offset * 7 + i * 15) % 60).padStart(2, '0')}`, status: STATUS[(offset + i) % STATUS.length] }
  })

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/[0.07] bg-[#070a14] p-4 sm:p-6">
      <div className="w-max min-w-full">
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-sun">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-sun/70" />
              <span className="relative h-2 w-2 rounded-full bg-sun" />
            </span>
            Salidas · Recuerdos
          </p>
          <p className="font-mono text-[11px] tracking-widest text-star/40">ORB · TERMINAL ∞</p>
        </div>
        <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-star/40">
          <span>Hora</span>
          <span>Destino</span>
          <span>Coordenadas</span>
          <span>Estado</span>
          {rows.map(({ trip, time, status }, i) => (
            <div key={i} className="contents">
              <Flap text={time} width={5} />
              <Flap text={trip.place} width={15} />
              <Flap text={coords(trip.lat, trip.lng)} width={13} />
              <Flap text={status} width={10} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
