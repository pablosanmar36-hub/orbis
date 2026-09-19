import { sql } from './_lib/db.js'
import { methodNotAllowed, readBody } from './_lib/auth.js'
import { requireUser, serverError } from './_lib/session.js'
import { describeDevice, pushReady, sendTo, TIPOS } from './_lib/push.js'

/**
 * Notificaciones push del usuario (Authorization: Bearer <token>).
 *
 *  GET                                   → { clave, dispositivos }
 *  POST   { suscripcion, nombre? }       → activa este dispositivo (o lo actualiza)
 *  POST   { accion: 'probar', endpoint } → notificación de prueba a ese dispositivo
 *  PATCH  { endpoint, nombre?, seguridad?, recuerdos?, novedades? }
 *  DELETE { endpoint }                   → deja de enviar a ese dispositivo
 *
 * Cada usuario solo ve y toca sus propios dispositivos.
 */
export default async function handler(req, res) {
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'DELETE'])
  res.setHeader('Cache-Control', 'private, no-store')

  try {
    const user = await requireUser(req, res)
    if (!user) return
    if (!pushReady()) return res.status(503).json({ error: 'Las notificaciones aún no están configuradas en el servidor (faltan las claves VAPID).' })

    const list = () => sql`
      SELECT id, endpoint, nombre, seguridad, recuerdos, novedades, creado_en, ultimo_envio
      FROM push_suscripciones WHERE user_id = ${user.id} ORDER BY creado_en
    `

    if (req.method === 'GET') return res.status(200).json({ clave: process.env.VAPID_PUBLIC_KEY, dispositivos: await list() })

    const body = readBody(req)
    const endpoint = String(body.endpoint ?? body.suscripcion?.endpoint ?? '')
    if (!/^https:\/\/\S+$/.test(endpoint) || endpoint.length > 1000) return res.status(400).json({ error: 'Dispositivo no válido.' })

    if (req.method === 'POST' && body.accion === 'probar') {
      const [sub] = await sql`SELECT endpoint, p256dh, auth FROM push_suscripciones WHERE user_id = ${user.id} AND endpoint = ${endpoint}`
      if (!sub) return res.status(404).json({ error: 'Ese dispositivo no tiene las notificaciones activadas.' })
      const r = await sendTo(sub, {
        tipo: 'novedades',
        titulo: 'Orbis está conectado ✦',
        cuerpo: `Hola, ${user.nombre}. Así te llegarán los avisos importantes en este dispositivo.`,
        url: '/app/',
        tag: 'prueba',
      })
      if (r === 'caducada') return res.status(410).json({ error: 'Este dispositivo ya no acepta notificaciones. Vuelve a activarlas.' })
      if (r !== 'ok') return res.status(502).json({ error: 'No se pudo entregar la notificación. Inténtalo de nuevo.' })
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'POST') {
      const keys = body.suscripcion?.keys ?? {}
      if (typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') return res.status(400).json({ error: 'Suscripción incompleta.' })
      const nombre = String(body.nombre || describeDevice(req.headers['user-agent'])).trim().slice(0, 60)
      // Si el navegador estaba suscrito con otra cuenta, pasa a esta
      await sql`
        INSERT INTO push_suscripciones (user_id, endpoint, p256dh, auth, nombre)
        VALUES (${user.id}, ${endpoint}, ${keys.p256dh}, ${keys.auth}, ${nombre})
        ON CONFLICT (endpoint) DO UPDATE
        SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, nombre = EXCLUDED.nombre
      `
      return res.status(201).json({ dispositivos: await list() })
    }

    if (req.method === 'PATCH') {
      const [row] = await sql`SELECT * FROM push_suscripciones WHERE user_id = ${user.id} AND endpoint = ${endpoint}`
      if (!row) return res.status(404).json({ error: 'Dispositivo no encontrado.' })
      const next = { ...row }
      for (const t of TIPOS) if (typeof body[t] === 'boolean') next[t] = body[t]
      if (typeof body.nombre === 'string' && body.nombre.trim()) next.nombre = body.nombre.trim().slice(0, 60)
      await sql`
        UPDATE push_suscripciones
        SET nombre = ${next.nombre}, seguridad = ${next.seguridad}, recuerdos = ${next.recuerdos}, novedades = ${next.novedades}
        WHERE id = ${row.id}
      `
      return res.status(200).json({ dispositivos: await list() })
    }

    await sql`DELETE FROM push_suscripciones WHERE user_id = ${user.id} AND endpoint = ${endpoint}`
    return res.status(200).json({ dispositivos: await list() })
  } catch (err) {
    return serverError(res, 'notificaciones', err)
  }
}
