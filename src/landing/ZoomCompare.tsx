import { useEffect, useMemo, useRef, useState } from 'react'
import { DETAIL_IMAGERY, TEXTURES } from '../config'

/**
 * Comparador honesto del zoom de Orbis sobre los Picos de Europa:
 *  - izquierda: la textura global que tendría cualquier globo 3D (recortada y ampliada)
 *  - derecha: las teselas de satélite que Orbis carga al acercarse
 */

const Z = 10
const GRID = 3
const CENTER = { lat: 43.215, lng: -4.87 }
const LABELS = [
  { name: 'Picos de Europa', lat: 43.235, lng: -4.9, kind: 'range' as const },
  { name: 'Torre Cerredo', lat: 43.1975, lng: -4.8528, kind: 'peak' as const, detail: '2.650 m' },
  { name: 'Naranjo de Bulnes', lat: 43.2034, lng: -4.815, kind: 'peak' as const, detail: '2.519 m' },
  { name: 'Cangas de Onís', lat: 43.351, lng: -5.129, kind: 'town' as const },
  { name: 'Potes', lat: 43.1543, lng: -4.6233, kind: 'town' as const },
]

const n = 2 ** Z
const tileX = (lng: number) => ((lng + 180) / 360) * n
const tileY = (lat: number) => {
  const r = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n
}
const x0 = Math.floor(tileX(CENTER.lng) - GRID / 2 + 0.5)
const y0 = Math.floor(tileY(CENTER.lat) - GRID / 2 + 0.5)
/** Posición en porcentaje dentro del mosaico */
const pos = (lat: number, lng: number) => ({ left: ((tileX(lng) - x0) / GRID) * 100, top: ((tileY(lat) - y0) / GRID) * 100 })

/** Recorta la textura global al mismo rectángulo y la amplía: así se ve cualquier globo "normal". */
function useGlobalCrop() {
  const [url, setUrl] = useState<string>('')
  useEffect(() => {
    const img = new Image()
    img.src = TEXTURES.day
    img.decode().then(() => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const lngL = (x0 / n) * 360 - 180
      const lngR = ((x0 + GRID) / n) * 360 - 180
      const latT = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y0) / n))) * 180) / Math.PI
      const latB = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y0 + GRID)) / n))) * 180) / Math.PI
      const sx = ((lngL + 180) / 360) * w
      const sw = ((lngR - lngL) / 360) * w
      const sy = ((90 - latT) / 180) * h
      const sh = ((latT - latB) / 180) * h
      const c = document.createElement('canvas')
      c.width = c.height = 768
      const ctx = c.getContext('2d')!
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 768, 768)
      setUrl(c.toDataURL('image/jpeg', 0.85))
    }, () => undefined)
  }, [])
  return url
}

export function ZoomCompare() {
  const [split, setSplit] = useState(50)
  const box = useRef<HTMLDivElement>(null)
  const crop = useGlobalCrop()
  const tiles = useMemo(
    () =>
      Array.from({ length: GRID * GRID }, (_, i) => ({
        key: i,
        src: DETAIL_IMAGERY.url(Z, x0 + (i % GRID), y0 + Math.floor(i / GRID)),
      })),
    [],
  )

  const drag = (clientX: number) => {
    const r = box.current!.getBoundingClientRect()
    setSplit(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)))
  }

  return (
    <figure className="m-0">
      <div
        ref={box}
        className="relative aspect-square w-full cursor-ew-resize touch-none overflow-hidden rounded-[1.75rem] bg-night select-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          drag(e.clientX)
        }}
        onPointerMove={(e) => e.buttons === 1 && drag(e.clientX)}
      >
        {/* Satélite (Orbis) */}
        <div className="absolute inset-0 grid grid-cols-3">
          {tiles.map((t) => (
            <img key={t.key} src={t.src} alt="" crossOrigin="anonymous" loading="lazy" draggable={false} className="h-full w-full object-cover" />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0">
          {LABELS.map((l) => {
            const p = pos(l.lat, l.lng)
            return (
              <span
                key={l.name}
                className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap [text-shadow:0_1px_8px_rgba(0,0,0,0.95)]"
                style={{ left: `${p.left}%`, top: `${p.top}%` }}
              >
                {l.kind === 'range' && <span className="font-display text-lg italic tracking-[0.12em] text-[#f3dcb4] sm:text-2xl">{l.name}</span>}
                {l.kind === 'peak' && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-white sm:text-xs">
                    <svg width="9" height="8" viewBox="0 0 9 8" aria-hidden="true">
                      <path d="M4.5 0 9 8H0z" fill="#f3dcb4" />
                    </svg>
                    {l.name} <span className="font-normal text-white/65">{l.detail}</span>
                  </span>
                )}
                {l.kind === 'town' && (
                  <span className="flex items-center gap-1.5 text-[11px] text-white/90 sm:text-xs">
                    <span className="h-1 w-1 rounded-full bg-white" />
                    {l.name}
                  </span>
                )}
              </span>
            )
          })}
        </div>

        {/* Textura global (lo habitual) */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          {crop ? <img src={crop} alt="" draggable={false} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[#2b3a2a]" />}
        </div>

        {/* Tirador */}
        <div className="pointer-events-none absolute inset-y-0" style={{ left: `${split}%` }}>
          <div className="absolute inset-y-0 -translate-x-1/2 border-l border-white/80 shadow-[0_0_20px_rgba(0,0,0,0.6)]" />
          <div className="absolute top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-paper font-mono text-sm text-[#1c1a16] shadow-xl">⇆</div>
        </div>

        <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/85 backdrop-blur">Un globo cualquiera</span>
        <span className="absolute right-4 top-4 rounded-full bg-sun px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#1c1a16]">Orbis</span>

        <input
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          aria-label="Comparar el globo habitual con el zoom de satélite de Orbis"
          className="absolute inset-x-0 bottom-0 h-8 w-full cursor-ew-resize opacity-0"
        />
      </div>
      <figcaption className="mt-3 flex flex-wrap justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-star/40">
        <span>43,2° N · 4,9° O — Picos de Europa, a unos 85 km de ancho</span>
        <span>{DETAIL_IMAGERY.attribution}</span>
      </figcaption>
    </figure>
  )
}
