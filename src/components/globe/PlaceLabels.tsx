import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import { PLACES } from '../../data/places'
import { latLngToVector3, smoothstep } from '../../lib/geo'

/** Distancia de cámara a la que cada nivel empieza (a) y termina (b) de aparecer. */
const TIERS: Record<number, [fadeFar: number, fullNear: number, hideNear?: number]> = {
  0: [3.6, 2.8, 1.45],
  1: [2.5, 2.1],
  2: [1.95, 1.62],
  3: [1.5, 1.3],
}

const camDir = new Vector3()

export function PlaceLabels() {
  const items = useMemo(
    () => PLACES.map(([name, lat, lng, tier]) => ({ name, tier, pos: latLngToVector3(lat, lng, 1.004), normal: latLngToVector3(lat, lng, 1) })),
    [],
  )
  const refs = useRef<(HTMLDivElement | null)[]>([])

  // Actualizamos el DOM directamente: cero re-renders de React por frame.
  useFrame(({ camera }) => {
    const dist = camera.position.length()
    camDir.copy(camera.position).normalize()
    items.forEach((item, i) => {
      const el = refs.current[i]
      if (!el) return
      const [far, near, hide] = TIERS[item.tier]
      let o = smoothstep(far, near, dist)
      if (hide) o *= smoothstep(hide - 0.2, hide, dist)
      // Solo en la cara visible y desvanecido cerca del limbo
      o *= smoothstep(0.35, 0.65, item.normal.dot(camDir))
      if (o < 0.01) {
        if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden'
        return
      }
      el.style.visibility = 'visible'
      el.style.opacity = o.toFixed(3)
      el.style.filter = `blur(${((1 - o) * 5).toFixed(2)}px)`
      el.style.transform = `translateY(${((1 - o) * 6).toFixed(1)}px)`
    })
  })

  return (
    <group>
      {items.map((item, i) => (
        <Html key={item.name + i} position={item.pos} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div
            ref={(el) => {
              refs.current[i] = el
            }}
            style={{ visibility: 'hidden' }}
            className={
              item.tier === 0
                ? 'place-label whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.35em] text-white/60'
                : 'place-label flex items-center gap-1.5 whitespace-nowrap text-[11px] font-light tracking-wide text-white/80'
            }
          >
            {item.tier > 0 && <span className="h-[3px] w-[3px] rounded-full bg-white/70" />}
            {item.name}
          </div>
        </Html>
      ))}
    </group>
  )
}
