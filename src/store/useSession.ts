import { create } from 'zustand'

export interface SessionUser {
  id: number
  nombre: string
  email: string
  creado_en?: string
  actualizado_en?: string | null
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

const TOKEN_KEY = 'orbis.token'
const USER_KEY = 'orbis.usuario'

const storage = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* modo privado */
    }
  },
  del: (k: string) => {
    try {
      localStorage.removeItem(k)
    } catch {
      /* modo privado */
    }
  },
}

/** Lee la caducidad del JWT sin verificarlo (la verificación real la hace el servidor). */
export function tokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function readStoredSession() {
  const token = storage.get(TOKEN_KEY)
  const exp = token ? tokenExpiry(token) : null
  if (!token || !exp || exp <= Date.now()) {
    storage.del(TOKEN_KEY)
    storage.del(USER_KEY)
    return { token: null, user: null }
  }
  let user: SessionUser | null = null
  try {
    user = JSON.parse(storage.get(USER_KEY) || 'null')
  } catch {
    user = null
  }
  return { token, user }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
}

interface SessionState {
  token: string | null
  user: SessionUser | null
  /** Motivo por el que se cerró la sesión, para mostrarlo en la pantalla de entrada */
  notice: string | null

  request: <T>(path: string, options?: RequestOptions) => Promise<T>
  login: (email: string, password: string) => Promise<void>
  register: (nombre: string, email: string, password: string) => Promise<void>
  setSession: (token: string, user?: SessionUser) => void
  logout: (notice?: string) => void
}

const stored = readStoredSession()

export const useSession = create<SessionState>((set, get) => ({
  token: stored.token,
  user: stored.user,
  notice: null,

  request: async <T,>(path: string, { method = 'GET', body, auth = false }: RequestOptions = {}) => {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (auth && get().token) headers.Authorization = `Bearer ${get().token}`

    let res: Response
    try {
      res = await fetch(path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
    } catch {
      throw new ApiError('Sin conexión con el servidor. Revisa tu conexión e inténtalo de nuevo.', 0)
    }
    if (res.status === 204) return undefined as T

    const isJson = res.headers.get('content-type')?.includes('application/json')
    if (!isJson) throw new ApiError('El servidor de cuentas no está activo. Arranca el proyecto con «vercel dev» o despliégalo en Vercel.', 503)

    const data = await res.json()
    if (res.status === 401 && auth) {
      get().logout(data.error || 'Tu sesión ha caducado. Vuelve a iniciar sesión.')
    }
    if (!res.ok) throw new ApiError(data.error || `Error ${res.status}`, res.status)
    return data as T
  },

  login: async (email, password) => {
    const { token, usuario } = await get().request<{ token: string; usuario: SessionUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    get().setSession(token, usuario)
  },

  register: async (nombre, email, password) => {
    const { token, usuario } = await get().request<{ token: string; usuario: SessionUser }>('/api/auth/register', {
      method: 'POST',
      body: { nombre, email, password },
    })
    get().setSession(token, usuario)
  },

  setSession: (token, user) => {
    storage.set(TOKEN_KEY, token)
    const next = user ?? get().user
    if (next) storage.set(USER_KEY, JSON.stringify(next))
    set({ token, user: next, notice: null })
  },

  logout: (notice) => {
    storage.del(TOKEN_KEY)
    storage.del(USER_KEY)
    set({ token: null, user: null, notice: notice ?? null })
  },
}))

export const initialOf = (name?: string | null) => (name?.trim().charAt(0) || '·').toUpperCase()
