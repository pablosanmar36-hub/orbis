import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Fragment, useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import { RELIEF_LOD } from '../../config'
import { PLACES } from '../../data/places'
import { formatElevation, PEAKS, RANGES, RIVERS } from '../../data/relief'
import { latLngToVector3, smoothstep } from '../../lib/geo'
import { useOrbis } from '../../store/useOrbis'

type Kind = 'country' | 'city' | 'range' | 'peak' | 'river'

interface Label {
  key: string
  kind: Kind
  name: string
  detail?: string
  pos: Vector3
  normal: Vector3
  /** [empieza a verse, totalmente visible, (opcional) se oculta por debajo de] */
  lod: readonly [number, number, number?]
  /** Mayor = gana cuando dos etiquetas se solapan en pantalla */
  priority: number
}

/** Distancia de cámara por nivel de ciudad. */
const CITY_LOD: Record<number, readonly [number, number, number?]> = {
  0: [3.6, 2.8, 1.45],
  1: [2.5, 2.1],
  2: [1.95, 1.62],
  3: [1.5, 1.3],
}

const camDir = new Vector3()
const projected = new Vector3()

/** Prioridad al resolver solapes: relieve primero, luego grandes ciudades, ríos y el resto. */
const CITY_PRIORITY: Record<number, number> = { 0: 10, 1: 70, 2: 40, 3: 30 }
const PAD = 6

function buildLabels(): Label[] {
  const at = (lat: number, lng: number, r = 1.004) => ({ pos: latLngToVector3(lat, lng, r), normal: latLngToVector3(lat, lng, 1) })
  return [
    ...PLACES.map(([name, lat, lng, tier], i) => ({
      key: `p${i}`,
      kind: (tier === 0 ? 'country' : 'city') as Kind,
      name,
      lod: CITY_LOD[tier],
      priority: CITY_PRIORITY[tier],
      ...at(lat, lng),
    })),
    ...RANGES.map((r, i) => ({ key: `r${i}`, kind: 'range' as Kind, name: r.name, lod: [...RELIEF_LOD.ranges, 1.07] as const, priority: 90, ...at(r.lat, r.lng) })),
    ...PEAKS.map((p, i) => ({
      key: `k${i}`,
      kind: 'peak' as Kind,
      name: p.name,
      detail: formatElevation(p.elevation),
      lod: RELIEF_LOD.peaks,
      priority: 60 + p.elevation / 1000, // entre picos cercanos, gana el más alto
      ...at(p.lat, p.lng, 1.003),
    })),
    ...RIVERS.map((r, i) => ({ key: `v${i}`, kind: 'river' as Kind, name: r.name, lod: RELIEF_LOD.rivers, priority: 50, ...at(r.label[0], r.label[1], 1.002) })),
  ].sort((a, b) => b.priority - a.priority)
}

const STYLES: Record<Kind, string> = {
  country: 'place-label whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.35em] text-white/60',
  city: 'place-label flex items-center gap-1.5 whitespace-nowrap text-[11px] font-light tracking-wide text-white/85',
  range: 'place-label whitespace-nowrap font-display text-[15px] italic tracking-[0.12em] text-[#f3dcb4]',
  peak: 'place-label flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-white',
  river: 'place-label whitespace-nowrap font-display text-[13px] italic tracking-wide text-[#a9dcff]',
}

export function PlaceLabels() {
  const labels = useMemo(buildLabels, [])
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const sizes = useRef<([number, number] | undefined)[]>([])

  // El DOM se actualiza directamente: cero re-renders de React por frame.
  useFrame(({ camera, size }) => {
    const dist = camera.position.length()
    const reliefOn = useOrbis.getState().prefs.reliefLabels
    camDir.copy(camera.position).normalize()
    // Rectángulos ya ocupados en pantalla (las etiquetas vienen ordenadas por prioridad)
    const placed: number[] = []
    labels.forEach((label, i) => {
      const el = refs.current[i]
      if (!el) return
      const [far, near, hide] = label.lod
      let o = label.kind === 'country' || label.kind === 'city' || reliefOn ? smoothstep(far, near, dist) : 0
      if (hide) o *= smoothstep(hide - (label.kind === 'country' ? 0.2 : 0.03), hide, dist)
      // Solo en la cara visible, desvanecida cerca del limbo
      o *= smoothstep(0.35, 0.65, label.normal.dot(camDir))
      if (o > 0.01) {
        // Tamaño medido una sola vez (el texto no cambia) para no forzar layout cada frame
        let box = sizes.current[i]
        if (!box || !box[0]) {
          const prev = el.style.visibility
          el.style.visibility = 'visible'
          box = sizes.current[i] = [el.offsetWidth, el.offsetHeight]
          el.style.visibility = prev
        }
        projected.copy(label.pos).project(camera)
        const x = ((projected.x + 1) / 2) * size.width
        const y = ((1 - projected.y) / 2) * size.height
        const x0 = x - box[0] / 2 - PAD, x1 = x + box[0] / 2 + PAD
        const y0 = y - box[1] / 2 - PAD / 2, y1 = y + box[1] / 2 + PAD / 2
        let collides = false
        for (let k = 0; k < placed.length; k += 4) {
          if (x0 < placed[k + 2] && x1 > placed[k] && y0 < placed[k + 3] && y1 > placed[k + 1]) {
            collides = true
            break
          }
        }
        if (collides) o = 0
        else placed.push(x0, y0, x1, y1)
      }
      if (o < 0.01) {
        if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden'
        return
      }
      el.style.visibility = 'visible'
      el.style.opacity = o.toFixed(3)
      el.style.transform = `translateY(${((1 - o) * 5).toFixed(1)}px)`
    })
  })

  return (
    <group>
      {labels.map((label, i) => (
        <Html key={label.key} position={label.pos} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div
            ref={(el) => {
              refs.current[i] = el
            }}
            style={{ visibility: 'hidden' }}
            className={STYLES[label.kind]}
          >
            {label.kind === 'city' && <span className="h-[3px] w-[3px] rounded-full bg-white/75" />}
            {label.kind === 'peak' ? (
              <Fragment>
                <svg width="9" height="8" viewBox="0 0 9 8" aria-hidden="true" className="-mt-px">
                  <path d="M4.5 0 9 8H0z" fill="#f3dcb4" />
                </svg>
                {label.name}
                <span className="font-light text-white/60 tabular-nums">{label.detail}</span>
              </Fragment>
            ) : (
              label.name
            )}
          </div>
        </Html>
      ))}
    </group>
  )
}
