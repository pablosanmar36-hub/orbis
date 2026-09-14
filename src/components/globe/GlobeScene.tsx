import { OrbitControls, Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { ACESFilmicToneMapping } from 'three'
import { GLOBE } from '../../config'
import { latLngToVector3 } from '../../lib/geo'
import { Atmosphere } from './Atmosphere'
import { CameraRig } from './CameraRig'
import { Earth } from './Earth'
import { Markers, PickedLocationMarker } from './Markers'
import { PlaceLabels } from './PlaceLabels'

const START = latLngToVector3(28, -10, GLOBE.homeDistance).toArray()

export function GlobeScene() {
  return (
    <Canvas
      className="!fixed inset-0"
      dpr={[1, 2]}
      camera={{ position: START, fov: 42, near: 0.01, far: 1000 }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#010208']} />
      <Stars radius={120} depth={60} count={3200} factor={3.2} saturation={0} fade speed={0.25} />
      <Suspense fallback={null}>
        <Earth />
        <Markers />
        <PlaceLabels />
        <PickedLocationMarker />
      </Suspense>
      <Atmosphere />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.055}
        minDistance={GLOBE.minDistance}
        maxDistance={GLOBE.maxDistance}
        autoRotateSpeed={0.18}
      />
      <CameraRig />
    </Canvas>
  )
}
