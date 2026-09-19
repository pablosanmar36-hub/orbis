import { create } from 'zustand'

/**
 * Orbis como aplicación instalable (PWA) y notificaciones push.
 * El service worker vive en /sw.js y controla todo el sitio.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
export const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1)
export const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

interface PwaState {
  installEvent: InstallPromptEvent | null
  installed: boolean
}

export const usePwa = create<PwaState>(() => ({ installEvent: null, installed: isStandalone() }))

let registration: Promise<ServiceWorkerRegistration | null> | null = null

/** Registra el service worker y escucha el aviso de instalación del navegador. Se llama una vez al arrancar. */
export function initPwa() {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    usePwa.setState({ installEvent: e as InstallPromptEvent })
  })
  window.addEventListener('appinstalled', () => usePwa.setState({ installEvent: null, installed: true }))
  swRegistration()
}

export function swRegistration() {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null)
  registration ??= navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
    console.warn('[Orbis] No se pudo registrar el service worker', err)
    return null
  })
  return registration
}

/** Abre el diálogo nativo de instalación. Devuelve true si el usuario aceptó. */
export async function promptInstall() {
  const ev = usePwa.getState().installEvent
  if (!ev) return false
  await ev.prompt()
  const { outcome } = await ev.userChoice
  usePwa.setState({ installEvent: null, installed: outcome === 'accepted' || usePwa.getState().installed })
  return outcome === 'accepted'
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/** Suscripción push actual de este navegador (o null). */
export async function currentSubscription() {
  if (!pushSupported()) return null
  const reg = await swRegistration()
  return (await reg?.pushManager.getSubscription()) ?? null
}

/** Pide permiso y suscribe este navegador con la clave pública del servidor. */
export async function subscribe(publicKey: string) {
  if (!pushSupported()) throw new Error('Este navegador no admite notificaciones.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Has bloqueado las notificaciones de Orbis. Actívalas en los ajustes del navegador (icono del candado junto a la dirección).'
        : 'No se concedió el permiso de notificaciones.',
    )
  }
  const reg = await swRegistration()
  if (!reg) throw new Error('No se pudo preparar el servicio de notificaciones.')
  await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) })
}

/** Nombre amable del dispositivo actual. */
export function thisDeviceName() {
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Navegador'
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) || isIOS ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : ''
  const app = isStandalone() ? 'App Orbis' : browser
  return os ? `${app} en ${os}` : app
}
