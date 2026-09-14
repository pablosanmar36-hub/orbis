import { Vector3 } from 'three'
import type { LatLng } from '../types'

const DEG = Math.PI / 180

/** Convierte lat/lng a un punto sobre la esfera (coincide con el UV de SphereGeometry). */
export function latLngToVector3(lat: number, lng: number, radius = 1, target = new Vector3()) {
  const phi = (90 - lat) * DEG
  const theta = (lng + 180) * DEG
  return target.set(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

export function vector3ToLatLng(v: Vector3): LatLng {
  const r = v.length()
  const lat = 90 - Math.acos(v.y / r) / DEG
  let lng = Math.atan2(v.z, -v.x) / DEG - 180
  if (lng < -180) lng += 360
  return { lat, lng }
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function formatCoords({ lat, lng }: LatLng) {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lng >= 0 ? 'E' : 'O'
  return `${Math.abs(lat).toFixed(4)}° ${ns} · ${Math.abs(lng).toFixed(4)}° ${ew}`
}

const dateFmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

export function formatDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : dateFmt.format(d)
}

export function formatRange(start: string, end?: string) {
  return end && end !== start ? `${formatDate(start)} — ${formatDate(end)}` : formatDate(start)
}

export function daysBetween(start: string, end?: string) {
  if (!end) return 1
  return Math.max(1, Math.round((+new Date(end) - +new Date(start)) / 86_400_000) + 1)
}
