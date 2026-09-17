/** Texturas globales, servidas desde /public/textures (se descargan con `npm run textures`). */
export const TEXTURE_BASE = '/textures'

export const TEXTURES = {
  day: `${TEXTURE_BASE}/earth-blue-marble.jpg`,
  night: `${TEXTURE_BASE}/earth-night.jpg`,
  topology: `${TEXTURE_BASE}/earth-topology.png`,
  water: `${TEXTURE_BASE}/earth-water.png`,
}

export const GLOBE = {
  radius: 1,
  /** Permite bajar hasta ~190 km de altitud para ver valles y cumbres */
  minDistance: 1.03,
  maxDistance: 6,
  homeDistance: 3.3,
  focusDistance: 1.75,
  tourDistance: 2.05,
}

/** Imágenes de satélite en alta resolución para el zoom cercano. */
export const DETAIL_IMAGERY = {
  url: (z: number, x: number, y: number) =>
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  attribution: 'Imágenes © Esri, Maxar, Earthstar Geographics',
  /** Teselas por lado de la rejilla (GRID × GRID) */
  grid: 7,
  minZoom: 4,
  maxZoom: 12,
  /** Distancia de cámara a la que empieza a aparecer y a la que ya es opaca */
  fadeStart: 1.95,
  fadeEnd: 1.6,
}

/** Distancias de cámara para las capas de geografía física: [empieza a verse, totalmente visible]. */
export const RELIEF_LOD = {
  ranges: [1.75, 1.5] as const,
  peaks: [1.3, 1.16] as const,
  rivers: [1.55, 1.3] as const,
}

export const TOUR_STEP_MS = 7500
