import webpush from 'web-push'
import { sql } from './db.js'

export const TIPOS = ['seguridad', 'recuerdos', 'novedades']

let configured = null

/** true si las claves VAPID están en las variables de entorno. */
export function pushReady() {
  if (configured !== null) return configured
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env
  configured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
  if (configured) webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:avisos@orbis.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  return configured
}

/** Envía a una suscripción. Borra las que el navegador ya no acepta. Devuelve 'ok' | 'caducada' | 'error'. */
export async function sendTo(sub, payload) {
  if (!pushReady()) return 'error'
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24, urgency: payload.tipo === 'seguridad' ? 'high' : 'normal' },
    )
    await sql`UPDATE push_suscripciones SET ultimo_envio = now() WHERE endpoint = ${sub.endpoint}`
    return 'ok'
  } catch (err) {
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      await sql`DELETE FROM push_suscripciones WHERE endpoint = ${sub.endpoint}`
      return 'caducada'
    }
    console.error('[push]', err?.statusCode, err?.body || err)
    return 'error'
  }
}

/**
 * Envía una notificación a todos los dispositivos de un usuario que tengan activado ese tipo.
 * Nunca lanza: un aviso fallido no debe romper el login ni el cambio de contraseña.
 */
export async function notifyUser(userId, tipo, payload) {
  try {
    if (!pushReady() || !TIPOS.includes(tipo)) return 0
    const subs = await sql`
      SELECT endpoint, p256dh, auth, seguridad, recuerdos, novedades
      FROM push_suscripciones
      WHERE user_id = ${userId}
    `
    const results = await Promise.all(subs.filter((s) => s[tipo]).map((s) => sendTo(s, { tipo, ...payload })))
    return results.filter((r) => r === 'ok').length
  } catch (err) {
    console.error('[push] notifyUser', err)
    return 0
  }
}

/** "Chrome en Windows", "Safari en iPhone"… a partir del User-Agent. */
export function describeDevice(ua = '') {
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Navegador'
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : ''
  return os ? `${browser} en ${os}` : browser
}

/** Aviso de seguridad a todos los dispositivos del usuario, con el dispositivo y la hora. */
export function securityAlert(req, userId, titulo, accion) {
  const cuando = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(new Date())
  return notifyUser(userId, 'seguridad', {
    titulo,
    cuerpo: `${accion} desde ${describeDevice(req.headers['user-agent'])} · ${cuando}. Si no has sido tú, cambia tu contraseña.`,
    url: '/app/?cuenta=seguridad',
    tag: `seguridad-${Date.now()}`,
  })
}
