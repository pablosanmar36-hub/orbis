import { Html } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Group, Mesh, MeshBasicMaterial, Vector3 } from 'three'
import { latLngToVector3 } from '../../lib/geo'
import { coverOf, tourOrder, useOrbis } from '../../store/useOrbis'
import type { Memory } from '../../types'

const tmp = new Vector3()

function Marker({ memory }: { memory: Memory }) {
  const group = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const ring2 = useRef<Mesh>(null)
  const core = useRef<Mesh>(null)
  const hovered = useOrbis((s) => s.hoveredId === memory.id)
  const selected = useOrbis((s) => s.selectedId === memory.id)
  const touring = useOrbis((s) => s.cinematic && tourOrder(s.memories)[s.tourIndex % s.memories.length]?.id === memory.id)
  const position = useMemo(() => latLngToVector3(memory.lat, memory.lng, 1.002), [memory.lat, memory.lng])
  const phase = useMemo(() => Math.random() * 10, [])

  useFrame(({ camera, clock }) => {
    if (!group.current) return
    const dist = camera.position.length()
    const active = hovered || selected || touring
    // Tamaño aparente estable con el zoom
    const target = Math.min(1, Math.max(0.18, (dist - 1) * 0.42)) * (active ? 1.25 : 1)
    const s = group.current.scale.x + (target - group.current.scale.x) * 0.15
    group.current.scale.setScalar(s)

    // Atenuar marcadores en la cara oculta
    const facing = tmp.copy(position).normalize().dot(camera.position.clone().normalize())
    group.current.visible = facing > -0.05

    const t = (clock.elapsedTime * 0.55 + phase) % 1
    const t2 = (clock.elapsedTime * 0.55 + phase + 0.5) % 1
    for (const [r, k] of [[ring.current, t], [ring2.current, t2]] as const) {
      if (!r) continue
      r.scale.setScalar(1 + k * 2.6)
      ;(r.material as MeshBasicMaterial).opacity = (1 - k) * (active ? 0.9 : 0.55)
    }
    if (core.current) (core.current.material as MeshBasicMaterial).opacity = 0.85 + Math.sin(clock.elapsedTime * 2 + phase) * 0.15
  })

  const inFront = (e: ThreeEvent<PointerEvent | MouseEvent>) => e.intersections[0]?.object.userData.markerId === memory.id

  return (
    <group ref={group} position={position} onUpdate={(g) => g.lookAt(position.clone().multiplyScalar(2))}>
      {/* Área de interacción invisible, más generosa que el punto visible */}
      <mesh
        userData={{ markerId: memory.id }}
        onPointerOver={(e) => {
          if (!inFront(e)) return
          e.stopPropagation()
          useOrbis.getState().hover(memory.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          if (useOrbis.getState().hoveredId === memory.id) useOrbis.getState().hover(null)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          if (!inFront(e) || e.delta > 5 || useOrbis.getState().picking) return
          e.stopPropagation()
          useOrbis.getState().select(memory.id)
        }}
      >
        <circleGeometry args={[0.045, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh ref={core} raycast={() => null} position-z={0.002}>
        <circleGeometry args={[0.011, 32]} />
        <meshBasicMaterial color={selected ? '#ffffff' : '#ffe2b0'} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh raycast={() => null} position-z={0.001}>
        <circleGeometry args={[0.028, 32]} />
        <meshBasicMaterial color="#ffb45e" transparent opacity={0.18} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      {[ring, ring2].map((r, i) => (
        <mesh key={i} ref={r} raycast={() => null} position-z={0.001}>
          <ringGeometry args={[0.014, 0.017, 48]} />
          <meshBasicMaterial color="#ffd08a" transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}

      <Html center zIndexRange={[40, 0]} style={{ pointerEvents: 'none' }}>
        <AnimatePresence>{hovered && !selected && <HoverCard memory={memory} />}</AnimatePresence>
      </Html>
    </group>
  )
}

function HoverCard({ memory }: { memory: Memory }) {
  const cover = coverOf(memory)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.94, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 6, scale: 0.96, filter: 'blur(4px)' }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="glass pointer-events-none absolute bottom-5 left-1/2 w-56 -translate-x-1/2 overflow-hidden rounded-2xl"
    >
      {cover?.type === 'image' && cover.src ? (
        <img src={cover.src} alt="" className="h-28 w-full object-cover" />
      ) : cover?.type === 'video' && cover.src ? (
        <video src={cover.src} muted autoPlay loop playsInline className="h-28 w-full object-cover" />
      ) : (
        <div className="h-16 w-full bg-gradient-to-br from-amber-400/30 to-sky-500/20" />
      )}
      <div className="px-3.5 py-2.5">
        <p className="font-display text-lg leading-tight text-white">{memory.title}</p>
        <p className="mt-0.5 text-[11px] tracking-wide text-white/55">{memory.place}</p>
      </div>
    </motion.div>
  )
}

export function Markers() {
  const memories = useOrbis((s) => s.memories)
  return (
    <group>
      {memories.map((m) => (
        <Marker key={m.id} memory={m} />
      ))}
    </group>
  )
}

export function PickedLocationMarker() {
  const picked = useOrbis((s) => s.pickedLocation)
  const curatorOpen = useOrbis((s) => s.curatorOpen)
  const ref = useRef<Group>(null)
  useFrame(({ clock, camera }) => {
    if (!ref.current) return
    const s = Math.min(1, Math.max(0.2, (camera.position.length() - 1) * 0.42))
    ref.current.scale.setScalar(s * (1 + Math.sin(clock.elapsedTime * 4) * 0.12))
  })
  if (!picked || !curatorOpen) return null
  const p = latLngToVector3(picked.lat, picked.lng, 1.003)
  return (
    <group ref={ref} position={p} onUpdate={(g) => g.lookAt(p.clone().multiplyScalar(2))}>
      <mesh raycast={() => null}>
        <ringGeometry args={[0.018, 0.024, 48]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.95} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh raycast={() => null}>
        <circleGeometry args={[0.006, 24]} />
        <meshBasicMaterial color="#cffafe" toneMapped={false} />
      </mesh>
    </group>
  )
}
