/** Origen de las texturas. Ejecuta `npm run textures` y cámbialo a '/textures' para uso offline. */
export const TEXTURE_BASE = './textures'

export const TEXTURES = {
  day: `${TEXTURE_BASE}/earth-blue-marble.jpg`,
  night: `${TEXTURE_BASE}/earth-night.jpg`,
  topology: `${TEXTURE_BASE}/earth-topology.png`,
  water: `${TEXTURE_BASE}/earth-water.png`,
}

export const GLOBE = {
  radius: 1,
  minDistance: 1.16,
  maxDistance: 6,
  homeDistance: 3.3,
  focusDistance: 1.75,
  tourDistance: 2.05,
}

export const TOUR_STEP_MS = 7500
