import { createStore, del, get, set } from 'idb-keyval'
import type { Memory } from '../types'

// Dos bases separadas: idb-keyval crea un único object store por base de datos.
const metaStore = createStore('orbis-memories', 'kv')
const blobStore = createStore('orbis-media', 'blobs')
/** Clave antigua, compartida por todo el navegador. Solo se lee para migrarla. */
const LEGACY_KEY = 'memories:v1'
const keyFor = (userId: number) => `memories:v1:${userId}`

export async function loadMemories(userId: number): Promise<Memory[] | undefined> {
  let list = await get<Memory[]>(keyFor(userId), metaStore)
  if (!list) {
    // Primer inicio de sesión tras separar los datos por usuario: los recuerdos
    // guardados antes pasan a la cuenta que entra y dejan de ser compartidos.
    const legacy = await get<Memory[]>(LEGACY_KEY, metaStore)
    if (legacy) {
      await set(keyFor(userId), legacy, metaStore)
      await del(LEGACY_KEY, metaStore)
      list = legacy
    }
  }
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
export function saveMemories(userId: number, list: Memory[]) {
  const serializable = list.map((m) => ({
    ...m,
    media: m.media.map((item) => (item.stored ? { ...item, src: '' } : item)),
  }))
  return set(keyFor(userId), serializable, metaStore)
}

export const saveBlob = (id: string, blob: Blob) => set(id, blob, blobStore)
export const deleteBlob = (id: string) => del(id, blobStore)
