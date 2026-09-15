import { Vector3 } from 'three'

/** Dirección del sol compartida por la Tierra y las capas de detalle (la actualiza Earth cada frame). */
export const sunDirection = new Vector3(1, 0.3, 1).normalize()

/** Intensidad de las luces nocturnas (0–1), también compartida. */
export const lighting = { nightMix: 0.55 }
