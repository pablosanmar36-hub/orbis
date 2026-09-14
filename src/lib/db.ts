import { createStore, del, get, set } from 'idb-keyval'
import type { Memory } from '../types'

// Dos bases separadas: idb-keyval crea un único object store por base de datos.
const metaStore = createStore('orbis-memories', 'kv')
const blobStore = createStore('orbis-media', 'blobs')
const KEY = 'memories:v1'

export async function loadMemories(): Promise<Memory[] | undefined> {
  const list = await get<Memory[]>(KEY, metaStore)
  if (!list) return undefined
  return Promise.all(
    list.map(async (m) => ({
      ...m,
      media: await Promise.all(
        m.media.map(async (item) => {
          if (!item.stored) return item
          const blob = await get<Blob>(item.id, blobStore)
          return { ...item, src: blob ? URL.createObjectURL(blob) : '' }
        }),
      ),
    })),
  )
}

/** Persiste los metadatos; los object URLs no sobreviven a una recarga, así que se eliminan. */
export function saveMemories(list: Memory[]) {
  const serializable = list.map((m) => ({
    ...m,
    media: m.media.map((item) => (item.stored ? { ...item, src: '' } : item)),
  }))
  return set(KEY, serializable, metaStore)
}

export const saveBlob = (id: string, blob: Blob) => set(id, blob, blobStore)
export const deleteBlob = (id: string) => del(id, blobStore)
