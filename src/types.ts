export type MediaType = 'image' | 'video'

export interface MediaItem {
  id: string
  type: MediaType
  /** URL remota o object URL generado al hidratar un blob local. */
  src: string
  /** true si el archivo vive en IndexedDB (subido por el usuario). */
  stored?: boolean
  name?: string
  caption?: string
  takenAt?: string
}

export interface Memory {
  id: string
  title: string
  place: string
  lat: number
  lng: number
  startDate: string
  endDate?: string
  note?: string
  media: MediaItem[]
  createdAt: number
}

export interface LatLng {
  lat: number
  lng: number
}

export interface FlyTarget extends LatLng {
  distance: number
  duration?: number
  key: number
}
