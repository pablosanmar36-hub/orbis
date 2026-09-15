import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { BufferAttribute, CanvasTexture, LinearFilter, PlaneGeometry, SRGBColorSpace, Vector3, type Mesh, type ShaderMaterial } from 'three'
import { DETAIL_IMAGERY } from '../../config'
import { latLngToVector3, smoothstep, vector3ToLatLng } from '../../lib/geo'
import { useOrbis } from '../../store/useOrbis'
import { sunDirection } from './sun'

/**
 * Nivel de detalle real al acercarse: descarga una rejilla de teselas de satélite
 * (Web Mercator) alrededor del punto que mira la cámara y la proyecta sobre un
 * casquete esférico apenas por encima de la Tierra. Así se distinguen montañas,
 * valles, ríos y costas en lugar de la textura global borrosa.
 */

const GRID = DETAIL_IMAGERY.grid
const TILE = 256
const SEGMENTS = 48
const RADIUS = 1.0005

interface Patch {
  z: number
  x0: number
  y0: number
}

const lngToTileX = (lng: number, n: number) => ((lng + 180) / 360) * n
const latToTileY = (lat: number, n: number) => {
  const r = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n
}
const tileYToLat = (y: number, n: number) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI

/** Zoom de teselas para que la rejilla cubra algo más que el campo visual. */
function zoomFor(distance: number, lat: number) {
  const altitude = Math.max(0.005, distance - 1) // en radios terrestres
  const viewKm = 0.77 * altitude * 6371 * 2.2
  const tileKm = (viewKm / GRID) / Math.max(0.2, Math.cos((lat * Math.PI) / 180))
  const z = Math.round(Math.log2(40075 / tileKm))
  return Math.max(DETAIL_IMAGERY.minZoom, Math.min(DETAIL_IMAGERY.maxZoom, z))
}

function buildGeometry({ z, x0, y0 }: Patch) {
  const n = 2 ** z
  const geo = new PlaneGeometry(1, 1, SEGMENTS, SEGMENTS)
  const pos = geo.attributes.position as BufferAttribute
  const uv = geo.attributes.uv as BufferAttribute
  const v = new Vector3()
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i)
    const t = 1 - uv.getY(i) // 0 arriba (norte) → 1 abajo (sur)
    const lng = ((x0 + u * GRID) / n) * 360 - 180
    const lat = tileYToLat(y0 + t * GRID, n)
    latLngToVector3(lat, lng, RADIUS, v)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  geo.computeBoundingSphere()
  return geo
}

const vertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(position); // en la esfera la normal es la posición normalizada
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 sunDir;
  uniform float opacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec3 n = normalize(vNormal);
    float ndl = dot(n, sunDir);
    float dayF = smoothstep(-0.18, 0.32, ndl);
    vec3 tex = texture2D(map, vUv).rgb;
    vec3 col = tex * (0.05 + 1.15 * max(ndl, 0.0));
    // Bordes difuminados para fundirse con la textura global
    float edge = smoothstep(0.0, 0.12, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
    gl_FragColor = vec4(col, opacity * edge * dayF);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function DetailImagery() {
  const mesh = useRef<Mesh>(null)
  const material = useRef<ShaderMaterial>(null)
  const current = useRef<Patch | null>(null)
  const pending = useRef<string>('')
  const requestId = useRef(0)
  const timer = useRef<number>(0)
  const lookDir = useMemo(() => new Vector3(), [])

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = GRID * TILE
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    tex.minFilter = LinearFilter
    tex.generateMipmaps = false
    tex.anisotropy = 8
    return tex
  }, [])

  const uniforms = useMemo(() => ({ map: { value: texture }, sunDir: { value: sunDirection }, opacity: { value: 0 } }), [texture])

  useEffect(() => () => {
    clearTimeout(timer.current)
    texture.dispose()
    mesh.current?.geometry.dispose()
  }, [texture])

  /** Descarga la rejilla completa y solo entonces sustituye la textura y la geometría: sin parpadeos. */
  function load(patch: Patch) {
    const id = ++requestId.current
    const n = 2 ** patch.z
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = GRID * TILE
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0b1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const jobs: Promise<void>[] = []
    for (let gx = 0; gx < GRID; gx++) {
      for (let gy = 0; gy < GRID; gy++) {
        const ty = patch.y0 + gy
        if (ty < 0 || ty >= n) continue
        const tx = (((patch.x0 + gx) % n) + n) % n
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = DETAIL_IMAGERY.url(patch.z, tx, ty)
        jobs.push(
          img.decode().then(
            () => ctx.drawImage(img, gx * TILE, gy * TILE, TILE, TILE),
            () => undefined, // una tesela que falla se queda con el color de fondo
          ),
        )
      }
    }

    Promise.all(jobs).then(() => {
      if (id !== requestId.current || !mesh.current) return
      texture.image = canvas
      texture.needsUpdate = true
      const old = mesh.current.geometry
      mesh.current.geometry = buildGeometry(patch)
      old.dispose()
      current.current = patch
    })
  }

  useFrame(({ camera: cam }, dt) => {
    if (!mesh.current || !material.current) return
    const dist = cam.position.length()
    const enabled = useOrbis.getState().prefs.detailImagery
    const target = enabled && current.current ? smoothstep(DETAIL_IMAGERY.fadeStart, DETAIL_IMAGERY.fadeEnd, dist) : 0
    const u = material.current.uniforms.opacity
    u.value += (target - u.value) * (1 - Math.exp(-dt * 4))
    mesh.current.visible = u.value > 0.01

    const active = enabled && dist < DETAIL_IMAGERY.fadeStart
    if (useOrbis.getState().detailActive !== (u.value > 0.2)) useOrbis.setState({ detailActive: u.value > 0.2 })
    if (!active) return

    const { lat, lng } = vector3ToLatLng(lookDir.copy(cam.position))
    const z = zoomFor(dist, lat)
    const n = 2 ** z
    const x0 = Math.floor(lngToTileX(lng, n) - GRID / 2 + 0.5)
    const y0 = Math.max(0, Math.min(n - GRID, Math.floor(latToTileY(lat, n) - GRID / 2 + 0.5)))

    const c = current.current
    // Solo recargar si cambia el zoom o el centro se aleja dos teselas o más
    if (c && c.z === z && Math.abs(c.x0 - x0) < 2 && Math.abs(c.y0 - y0) < 2) return
    const key = `${z}/${x0}/${y0}`
    if (pending.current === key) return
    pending.current = key
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => load({ z, x0, y0 }), 220)
  })

  // Evita que el casquete capture clics destinados al globo o a los marcadores
  const noRaycast = () => null

  return (
    <mesh ref={mesh} raycast={noRaycast} renderOrder={1} frustumCulled={false} visible={false}>
      <planeGeometry args={[0.001, 0.001]} />
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment} transparent depthWrite={false} />
    </mesh>
  )
}
