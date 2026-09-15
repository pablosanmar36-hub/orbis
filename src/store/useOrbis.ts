import { create } from 'zustand'
import { GLOBE } from '../config'
import { SEED_MEMORIES } from '../data/seed'
import { deleteBlob, loadMemories, saveBlob, saveMemories } from '../lib/db'
import type { FlyTarget, LatLng, MediaItem, Memory } from '../types'

export interface MemoryDraft {
  title: string
  place: string
  lat: number
  lng: number
  startDate: string
  endDate?: string
  note?: string
}

interface OrbisState {
  memories: Memory[]
  hydrated: boolean

  selectedId: string | null
  hoveredId: string | null
  flyTo: FlyTarget | null
  lightbox: { memoryId: string; index: number } | null

  curatorOpen: boolean
  picking: boolean
  pickedLocation: LatLng | null

  cinematic: boolean
  tourIndex: number
  music: boolean
  night: boolean
  uiHidden: boolean
  accountOpen: boolean
  detailActive: boolean
  prefs: Preferences

  hydrate: () => Promise<void>
  addMemory: (draft: MemoryDraft, files: File[]) => Promise<Memory>
  deleteMemory: (id: string) => Promise<void>

  select: (id: string | null) => void
  hover: (id: string | null) => void
  fly: (target: LatLng, distance?: number, duration?: number) => void
  openLightbox: (memoryId: string, index: number) => void
  closeLightbox: () => void
  stepLightbox: (dir: 1 | -1) => void

  setCurator: (open: boolean) => void
  setPicking: (picking: boolean) => void
  setPicked: (loc: LatLng | null) => void

  setCinematic: (on: boolean) => void
  setTourIndex: (i: number) => void
  toggleMusic: () => void
  toggleNight: () => void
  toggleUi: () => void
  setAccountOpen: (open: boolean) => void
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
  clearLocalMemories: () => Promise<void>
}

export interface Preferences {
  /** Abrir el globo con las luces nocturnas activadas */
  nightDefault: boolean
  autoRotate: boolean
  /** Música ambiental al iniciar el modo cinematográfico */
  musicInTour: boolean
  /** Segundos que dura cada destino del recorrido */
  tourSeconds: number
  /** Imágenes de satélite en alta resolución al acercarse */
  detailImagery: boolean
  /** Cordilleras, picos y ríos */
  reliefLabels: boolean
}

const PREFS_KEY = 'orbis.prefs'
export const DEFAULT_PREFS: Preferences = {
  nightDefault: false,
  autoRotate: true,
  musicInTour: false,
  tourSeconds: 7.5,
  detailImagery: true,
  reliefLabels: true,
}

function loadPrefs(): Preferences {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }
  } catch {
    return DEFAULT_PREFS
  }
}
const initialPrefs = loadPrefs()

const uid = () => crypto.randomUUID()

export const useOrbis = create<OrbisState>((set, get) => ({
  memories: [],
  hydrated: false,
  selectedId: null,
  hoveredId: null,
  flyTo: null,
  lightbox: null,
  curatorOpen: false,
  picking: false,
  pickedLocation: null,
  cinematic: false,
  tourIndex: 0,
  music: false,
  night: initialPrefs.nightDefault,
  uiHidden: false,
  accountOpen: false,
  detailActive: false,
  prefs: initialPrefs,

  hydrate: async () => {
    let memories: Memory[]
    try {
      memories = (await loadMemories()) ?? SEED_MEMORIES
      if (memories === SEED_MEMORIES) await saveMemories(memories)
    } catch (err) {
      console.warn('[orbis] IndexedDB no disponible, usando datos en memoria', err)
      memories = SEED_MEMORIES
    }
    set({ memories, hydrated: true })
  },

  addMemory: async (draft, files) => {
    const media: MediaItem[] = await Promise.all(
      files.map(async (file) => {
        const id = uid()
        await saveBlob(id, file)
        return {
          id,
          type: file.type.startsWith('video') ? 'video' : 'image',
          src: URL.createObjectURL(file),
          stored: true,
          name: file.name,
          takenAt: new Date(file.lastModified).toISOString().slice(0, 10),
        } satisfies MediaItem
      }),
    )
    const memory: Memory = { ...draft, id: uid(), media, createdAt: Date.now() }
    const memories = [...get().memories, memory]
    set({ memories })
    await saveMemories(memories)
    return memory
  },

  deleteMemory: async (id) => {
    const target = get().memories.find((m) => m.id === id)
    if (!target) return
    const memories = get().memories.filter((m) => m.id !== id)
    set({ memories, selectedId: null, lightbox: null })
    await saveMemories(memories)
    await Promise.all(
      target.media.filter((m) => m.stored).map((m) => {
        URL.revokeObjectURL(m.src)
        return deleteBlob(m.id)
      }),
    )
  },

  select: (id) => {
    const memory = get().memories.find((m) => m.id === id)
    if (memory) {
      set({ selectedId: id, hoveredId: null })
      get().fly(memory, GLOBE.focusDistance)
    } else {
      const prev = get().memories.find((m) => m.id === get().selectedId)
      set({ selectedId: null })
      if (prev) get().fly(prev, GLOBE.homeDistance * 0.85, 1.8)
    }
  },
  hover: (id) => set({ hoveredId: id }),
  fly: (target, distance = GLOBE.focusDistance, duration) =>
    set({ flyTo: { lat: target.lat, lng: target.lng, distance, duration, key: Date.now() } }),

  openLightbox: (memoryId, index) => set({ lightbox: { memoryId, index } }),
  closeLightbox: () => set({ lightbox: null }),
  stepLightbox: (dir) => {
    const lb = get().lightbox
    const memory = get().memories.find((m) => m.id === lb?.memoryId)
    if (!lb || !memory) return
    const n = memory.media.length
    set({ lightbox: { ...lb, index: (lb.index + dir + n) % n } })
  },

  setCurator: (open) => set({ curatorOpen: open, picking: false, ...(open ? {} : { pickedLocation: null }) }),
  setPicking: (picking) => set({ picking }),
  setPicked: (loc) => set({ pickedLocation: loc }),

  setCinematic: (on) =>
    set({ cinematic: on, tourIndex: 0, selectedId: null, curatorOpen: false, lightbox: null, music: on ? get().prefs.musicInTour : false }),
  setTourIndex: (i) => set({ tourIndex: i }),
  toggleMusic: () => set({ music: !get().music }),
  toggleNight: () => set({ night: !get().night }),
  toggleUi: () => set({ uiHidden: !get().uiHidden }),
  setAccountOpen: (open) => set({ accountOpen: open, ...(open ? { selectedId: null, curatorOpen: false, cinematic: false, lightbox: null } : {}) }),
  setPref: (key, value) => {
    const prefs = { ...get().prefs, [key]: value }
    set({ prefs })
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    } catch {
      /* navegación privada: la preferencia dura hasta cerrar la pestaña */
    }
  },
  clearLocalMemories: async () => {
    const { memories } = get()
    set({ memories: [], selectedId: null, lightbox: null })
    await saveMemories([])
    await Promise.all(
      memories.flatMap((m) => m.media.filter((x) => x.stored).map((x) => {
        URL.revokeObjectURL(x.src)
        return deleteBlob(x.id)
      })),
    )
  },
}))

export const useSelectedMemory = () => useOrbis((s) => s.memories.find((m) => m.id === s.selectedId) ?? null)

/** Orden cronológico usado por el modo cinematográfico. */
export const tourOrder = (memories: Memory[]) => [...memories].sort((a, b) => a.startDate.localeCompare(b.startDate))

export const coverOf = (m: Memory) => m.media.find((x) => x.type === 'image' && x.src) ?? m.media[0]
