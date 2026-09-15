import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { PerspectiveCamera, Quaternion, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { easeInOutCubic, latLngToVector3 } from '../../lib/geo'
import { useOrbis } from '../../store/useOrbis'

interface Flight {
  fromDir: Vector3
  fromLen: number
  toLen: number
  rotation: Quaternion
  arc: number
  t: number
  duration: number
}

const identity = new Quaternion()
const qk = new Quaternion()
const dir = new Vector3()

/**
 * Vuelos de cámara cinemáticos: interpolación esférica de la dirección + arco de altitud
 * proporcional a la distancia angular (como un avión que asciende y desciende).
 * También desplaza el encuadre cuando el panel lateral está abierto.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null
  const flyTo = useOrbis((s) => s.flyTo)
  const flight = useRef<Flight | null>(null)
  const viewOffset = useRef(0)

  useEffect(() => {
    if (!flyTo) return
    const to = latLngToVector3(flyTo.lat, flyTo.lng, 1).normalize()
    const fromDir = camera.position.clone().normalize()
    const angle = fromDir.angleTo(to)
    flight.current = {
      fromDir,
      fromLen: camera.position.length(),
      toLen: flyTo.distance,
      rotation: new Quaternion().setFromUnitVectors(fromDir, to),
      arc: Math.min(1.4, angle * 0.45),
      t: 0,
      duration: flyTo.duration ?? Math.min(3.2, 1.4 + angle * 0.9),
    }
  }, [flyTo, camera])

  useFrame(({ size }, dt) => {
    const state = useOrbis.getState()
    const f = flight.current

    if (f) {
      f.t = Math.min(1, f.t + dt / f.duration)
      const k = easeInOutCubic(f.t)
      qk.copy(identity).slerp(f.rotation, k)
      dir.copy(f.fromDir).applyQuaternion(qk)
      const len = f.fromLen + (f.toLen - f.fromLen) * k + Math.sin(Math.PI * k) * f.arc
      camera.position.copy(dir.multiplyScalar(len))
      camera.lookAt(0, 0, 0)
      if (f.t >= 1) flight.current = null
    }

    if (controls) {
      controls.enabled = !f && !state.cinematic
      controls.autoRotate = state.prefs.autoRotate && !state.accountOpen && !f && !state.selectedId && !state.cinematic && !state.picking && !state.hoveredId && !state.curatorOpen
      // Rotación más precisa cuanto más cerca de la superficie
      const d = camera.position.length()
      controls.rotateSpeed = Math.min(0.55, Math.max(0.015, (d - 1) * 0.3))
      controls.zoomSpeed = Math.min(0.9, Math.max(0.35, (d - 1) * 0.35))
    }

    // Desplazar el globo a la izquierda cuando el Memory Vault ocupa la derecha
    const wide = size.width >= 1024
    const target = wide && state.selectedId ? size.width * 0.17 : wide && state.curatorOpen ? -size.width * 0.16 : 0
    viewOffset.current += (target - viewOffset.current) * (1 - Math.exp(-dt * 3))
    if (Math.abs(viewOffset.current) < 0.5 && target === 0) {
      if (camera.view?.enabled) camera.clearViewOffset()
    } else {
      camera.setViewOffset(size.width, size.height, viewOffset.current, 0, size.width, size.height)
    }
  })

  return null
}
