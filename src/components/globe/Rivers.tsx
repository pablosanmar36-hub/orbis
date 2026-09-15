import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BufferGeometry, CatmullRomCurve3, Group, Line, LineBasicMaterial, Vector3 } from 'three'
import { RELIEF_LOD } from '../../config'
import { RIVERS } from '../../data/relief'
import { latLngToVector3, smoothstep } from '../../lib/geo'
import { useOrbis } from '../../store/useOrbis'

const RADIUS = 1.0012

/** Trazado de los ríos principales, suavizado con una curva Catmull-Rom y visible solo al acercarse. */
export function Rivers() {
  const group = useRef<Group>(null)
  const material = useMemo(
    () => new LineBasicMaterial({ color: '#4fb3ff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
    [],
  )

  const lines = useMemo(
    () =>
      RIVERS.map((river) => {
        const control = river.path.map(([lat, lng]) => latLngToVector3(lat, lng, RADIUS))
        const curve = new CatmullRomCurve3(control, false, 'centripetal')
        // Reproyecta cada punto a la superficie para que la curva no atraviese la esfera
        const points = curve.getPoints(control.length * 12).map((p: Vector3) => p.normalize().multiplyScalar(RADIUS))
        const line = new Line(new BufferGeometry().setFromPoints(points), material)
        line.name = river.name
        line.renderOrder = 2
        line.raycast = () => {}
        return line
      }),
    [material],
  )

  useFrame(({ camera }) => {
    if (!group.current) return
    const enabled = useOrbis.getState().prefs.reliefLabels
    const o = enabled ? smoothstep(RELIEF_LOD.rivers[0], RELIEF_LOD.rivers[1], camera.position.length()) : 0
    material.opacity = o * 0.9
    group.current.visible = o > 0.01
  })

  return (
    <group ref={group} visible={false}>
      {lines.map((line) => (
        <primitive key={line.name} object={line} />
      ))}
    </group>
  )
}
