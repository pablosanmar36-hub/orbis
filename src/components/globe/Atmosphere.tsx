import { useMemo } from 'react'
import { AdditiveBlending, BackSide, Color } from 'three'
import { atmosphereFragment, atmosphereVertex } from './shaders'

export function Atmosphere() {
  const uniforms = useMemo(() => ({ glowColor: { value: new Color('#5b9dff') }, intensity: { value: 1.7 } }), [])
  return (
    <mesh scale={1.18} raycast={() => null}>
      <sphereGeometry args={[1, 96, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={atmosphereVertex}
        fragmentShader={atmosphereFragment}
        side={BackSide}
        blending={AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
