import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import { ACESFilmicToneMapping, AdditiveBlending, BufferGeometry, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, QuadraticBezierCurve3, Vector3 } from 'three'
import { Atmosphere } from '../components/globe/Atmosphere'
import { Earth } from '../components/globe/Earth'
import { latLngToVector3 } from '../lib/geo'
import { HERO_ROUTE, TRIPS } from './content'

const SEGMENTS = 90

/** Ruta de vuelo entre dos viajes: arco que se eleva según la distancia. */
function useRoutes() {
  return useMemo(() => {
    const byName = new Map(TRIPS.map((t) => [t.place, t]))
    const stops = HERO_ROUTE.map((name) => byName.get(name)!).filter(Boolean)
    const material = () => new LineBasicMaterial({ color: '#f6c77a', transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false })
    return stops.slice(0, -1).map((from, i) => {
      const to = stops[i + 1]
      const a = latLngToVector3(from.lat, from.lng, 1.004)
      const b = latLngToVector3(to.lat, to.lng, 1.004)
      const lift = 1 + Math.min(0.45, a.angleTo(b) * 0.22)
      const mid = a.clone().add(b).normalize().multiplyScalar(lift)
      const points = new QuadraticBezierCurve3(a, mid, b).getPoints(SEGMENTS)
      const line = new Line(new BufferGeometry().setFromPoints(points), material())
      line.geometry.setDrawRange(0, 0)
      return { line, points }
    })
  }, [])
}

function Scene({ launching }: { launching: boolean }) {
  const spinner = useRef<Group>(null)
  const heads = useRef<(Mesh | null)[]>([])
  const routes = useRoutes()
  const pins = useMemo(() => TRIPS.map((t) => ({ key: t.place, pos: latLngToVector3(t.lat, t.lng, 1.003) })), [])
  const launchT = useRef(0)
  const target = useMemo(() => new Vector3(), [])

  useFrame(({ clock, camera }, dt) => {
    const t = clock.elapsedTime
    if (spinner.current) spinner.current.rotation.y += dt * (launching ? 0.9 : 0.06)

    // Vuelos: cada arco se dibuja, viaja un cometa y se borra, escalonado en bucle
    const cycle = 2.6
    const stagger = 1.3
    const period = routes.length * stagger + cycle
    routes.forEach(({ line, points }, i) => {
      const local = ((t % period) - i * stagger) / cycle
      const head = Math.max(0, Math.min(1, local))
      const tail = Math.max(0, Math.min(1, local - 0.55))
      const start = Math.floor(tail * SEGMENTS)
      const end = Math.floor(head * SEGMENTS)
      line.geometry.setDrawRange(start, Math.max(0, end - start))
      const h = heads.current[i]
      if (h) {
        h.visible = local > 0 && local < 1
        h.position.copy(points[Math.min(SEGMENTS, end)])
        ;(h.material as MeshBasicMaterial).opacity = 1 - tail
      }
    })

    // Despegue: la cámara se lanza contra el planeta
    if (launching) {
      launchT.current = Math.min(1, launchT.current + dt / 1.5)
      const k = launchT.current ** 3
      target.set(0, 0.25 * (1 - k), 3.1 - 2.08 * k)
      camera.position.lerp(target, 0.18)
      camera.lookAt(0, 0, 0)
    } else {
      // Ligero paralaje con el ratón
      const px = (typeof window !== 'undefined' ? (window as unknown as { __orbisMouse?: [number, number] }).__orbisMouse : undefined) ?? [0, 0]
      camera.position.x += (px[0] * 0.25 - camera.position.x) * 0.03
      camera.position.y += (0.25 - px[1] * 0.15 - camera.position.y) * 0.03
      camera.lookAt(0, 0, 0)
    }
  })

  return (
    <group rotation={[0.32, 0, -0.08]}>
      <group ref={spinner} rotation={[0, -Math.PI / 2 - 0.35, 0]}>
        <Suspense fallback={null}>
          <Earth />
        </Suspense>
        {routes.map(({ line }, i) => (
          <primitive key={i} object={line} />
        ))}
        {routes.map((_, i) => (
          <mesh
            key={`h${i}`}
            ref={(m) => {
              heads.current[i] = m
            }}
          >
            <sphereGeometry args={[0.012, 12, 12]} />
            <meshBasicMaterial color="#fff4dc" transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
        {pins.map((p) => (
          <group key={p.key} position={p.pos} onUpdate={(g) => g.lookAt(p.pos.clone().multiplyScalar(2))}>
            <mesh>
              <circleGeometry args={[0.011, 20]} />
              <meshBasicMaterial color="#ffe2b0" toneMapped={false} />
            </mesh>
            <mesh position-z={-0.001}>
              <circleGeometry args={[0.03, 24]} />
              <meshBasicMaterial color="#f6c77a" transparent opacity={0.22} blending={AdditiveBlending} depthWrite={false} />
            </mesh>
          </group>
        ))}
      </group>
      <Atmosphere />
    </group>
  )
}

export default function HeroGlobe({ launching }: { launching: boolean }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.25, 3.1], fov: 38, near: 0.01, far: 400 }}
      gl={{ antialias: true, alpha: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      onPointerMove={(e) => {
        ;(window as unknown as { __orbisMouse?: [number, number] }).__orbisMouse = [
          (e.clientX / window.innerWidth) * 2 - 1,
          (e.clientY / window.innerHeight) * 2 - 1,
        ]
      }}
    >
      <Scene launching={launching} />
    </Canvas>
  )
}
