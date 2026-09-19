import { ensureSchema, sql } from '../_lib/db.js'
import { methodNotAllowed, readBody } from '../_lib/auth.js'
import { serverError } from '../_lib/session.js'
import { notifyUser, pushReady, sendTo } from '../_lib/push.js'

/**
 * Avisos automáticos. Protegido con CRON_SECRET (Authorization: Bearer <CRON_SECRET>).
 *
 *  GET  → Vercel Cron, cada mañana: "Tal día como hoy" con los viajes de hace 1, 2, 3… años.
 *  POST { titulo, cuerpo, url? } → anuncio importante a quien tenga activadas las novedades.
 */
export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return methodNotAllowed(res, ['GET', 'POST'])
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'No autorizado.' })
  if (!pushReady()) return res.status(503).json({ error: 'Faltan las claves VAPID.' })

  try {
    await ensureSchema()

    if (req.method === 'POST') {
      const { titulo, cuerpo, url } = readBody(req)
      if (!titulo || !cuerpo) return res.status(400).json({ error: 'Faltan titulo y cuerpo.' })
      const subs = await sql`SELECT endpoint, p256dh, auth FROM push_suscripciones WHERE novedades`
      const payload = { tipo: 'novedades', titulo: String(titulo).slice(0, 80), cuerpo: String(cuerpo).slice(0, 240), url: url || '/app/', tag: 'novedad' }
      const results = await Promise.all(subs.map((s) => sendTo(s, payload)))
      return res.status(200).json({ enviadas: results.filter((r) => r === 'ok').length, dispositivos: subs.length })
    }

    // Viajes cuyo aniversario es hoy (hora de España), de años anteriores
    const hits = await sql`
      SELECT e.user_id, e.titulo, e.lugar,
             (extract(year FROM (now() AT TIME ZONE 'Europe/Madrid')) - extract(year FROM e.fecha))::int AS anos
      FROM elementos e
      WHERE e.fecha IS NOT NULL
        AND to_char(e.fecha, 'MM-DD') = to_char(now() AT TIME ZONE 'Europe/Madrid', 'MM-DD')
        AND e.fecha < (now() AT TIME ZONE 'Europe/Madrid')::date
        AND EXISTS (SELECT 1 FROM push_suscripciones p WHERE p.user_id = e.user_id AND p.recuerdos)
      ORDER BY e.user_id, e.fecha
    `
    const byUser = new Map()
    for (const h of hits) byUser.set(h.user_id, [...(byUser.get(h.user_id) ?? []), h])

    let enviadas = 0
    for (const [userId, viajes] of byUser) {
      const [v] = viajes
      const hace = v.anos === 1 ? 'Hace un año' : `Hace ${v.anos} años`
      const donde = v.lugar || v.titulo
      const extra = viajes.length > 1 ? ` y ${viajes.length - 1} ${viajes.length === 2 ? 'recuerdo más' : 'recuerdos más'}` : ''
      enviadas += await notifyUser(userId, 'recuerdos', {
        titulo: `Tal día como hoy · ${donde}`,
        cuerpo: `${hace} estabas en ${donde}${extra}. Vuelve a ese lugar en tu globo.`,
        url: '/app/',
        tag: 'tal-dia-como-hoy',
      })
    }
    return res.status(200).json({ usuarios: byUser.size, enviadas })
  } catch (err) {
    return serverError(res, 'cron/avisos', err)
  }
}
