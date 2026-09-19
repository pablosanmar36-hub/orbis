import { sql } from '../_lib/db.js'
import { methodNotAllowed, signToken } from '../_lib/auth.js'
import { requireUser, serverError } from '../_lib/session.js'
import { securityAlert } from '../_lib/push.js'

/**
 * POST /api/cuenta/sesiones  (Authorization: Bearer <token>)
 * Cierra la sesión en todos los dispositivos. Este dispositivo recibe un token nuevo y sigue dentro.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])
  res.setHeader('Cache-Control', 'private, no-store')

  try {
    const user = await requireUser(req, res)
    if (!user) return

    const now = Date.now()
    await sql`UPDATE usuarios SET sesiones_desde = to_timestamp(${Math.floor(now / 1000)}) WHERE id = ${user.id}`
    await securityAlert(req, user.id, 'Sesiones cerradas', 'Se han cerrado las sesiones de tus otros dispositivos')
    return res.status(200).json({ token: signToken(user, now) })
  } catch (err) {
    return serverError(res, 'cuenta/sesiones', err)
  }
}
