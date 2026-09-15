import { useTexture } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { MathUtils, Quaternion, SRGBColorSpace, Vector2, Vector3, type ShaderMaterial } from 'three'
import { GLOBE, TEXTURES } from '../../config'
import { vector3ToLatLng } from '../../lib/geo'
import { useOrbis } from '../../store/useOrbis'
import { earthFragment, earthVertex } from './shaders'
import { sunDirection } from './sun'

const Y = new Vector3(0, 1, 0)
const q = new Quaternion()

export function Earth() {
  const [day, night, topology, water] = useTexture([TEXTURES.day, TEXTURES.night, TEXTURES.topology, TEXTURES.water])
  day.colorSpace = night.colorSpace = SRGBColorSpace
  day.anisotropy = night.anisotropy = 8

  const material = useRef<ShaderMaterial>(null)
  const sunAngle = useRef(0.65)
  const nightMix = useRef(0)

  const uniforms = useMemo(
    () => ({
      dayMap: { value: day },
      nightMap: { value: night },
      bumpMap: { value: topology },
      specMap: { value: water },
      sunDir: { value: sunDirection },
      nightMix: { value: 0 },
      texel: { value: new Vector2(1 / ((topology.image as HTMLImageElement)?.width || 2048), 1 / ((topology.image as HTMLImageElement)?.height || 1024)) },
      bumpScale: { value: 5.0 },
    }),
    [day, night, topology, water],
  )

  useFrame(({ camera }, dt) => {
    const isNight = useOrbis.getState().night
    const k = 1 - Math.exp(-dt * 2.2)
    // El sol sigue a la cámara con un desfase: en modo día ilumina la cara visible,
    // en modo noche gira hacia la cara oculta y revela las luces de las ciudades.
    sunAngle.current = MathUtils.lerp(sunAngle.current, isNight ? 2.75 : 0.65, k)
    nightMix.current = MathUtils.lerp(nightMix.current, isNight ? 1 : 0.55, k)
    const sun = uniforms.sunDir.value.copy(camera.position).normalize()
    sun.y += 0.35
    sun.applyQuaternion(q.setFromAxisAngle(Y, sunAngle.current)).normalize()
    uniforms.nightMix.value = nightMix.current
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    const { picking, setPicked } = useOrbis.getState()
    if (!picking || e.delta > 5) return
    e.stopPropagation()
    setPicked(vector3ToLatLng(e.point))
  }

  return (
    <mesh onClick={onClick} name="earth">
      <sphereGeometry args={[GLOBE.radius, 192, 128]} />
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={earthVertex} fragmentShader={earthFragment} />
    </mesh>
  )
}
