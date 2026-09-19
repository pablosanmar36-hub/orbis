import bcrypt from 'bcryptjs'
import { sql } from '../_lib/db.js'
import { methodNotAllowed, passwordProblem, readBody, signToken } from '../_lib/auth.js'
import { requireUser, serverError } from '../_lib/session.js'
import { securityAlert } from '../_lib/push.js'

/**
 * POST /api/cuenta/password  { actual, nueva }  (Authorization: Bearer <token>)
 * Cambia la contraseña, cierra la sesión en los demás dispositivos y devuelve un token nuevo.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])
  res.setHeader('Cache-Control', 'private, no-store')

  try {
    const user = await requireUser(req, res)
    if (!user) return

    const { actual, nueva } = readBody(req)
    const problem = passwordProblem(nueva)
    if (problem) return res.status(400).json({ error: problem })
    if (actual === nueva) return res.status(400).json({ error: 'La nueva contraseña debe ser distinta de la actual.' })

    const [row] = await sql`SELECT password_hash FROM usuarios WHERE id = ${user.id}`
    const ok = row?.password_hash && (await bcrypt.compare(String(actual ?? ''), row.password_hash))
    if (!ok) return res.status(403).json({ error: 'La contraseña actual no es correcta.' })

    const hash = await bcrypt.hash(nueva, 12)
    const now = Date.now()
    await sql`
      UPDATE usuarios
      SET password_hash = ${hash}, sesiones_desde = to_timestamp(${Math.floor(now / 1000)}), actualizado_en = now()
      WHERE id = ${user.id}
    `
    await securityAlert(req, user.id, 'Tu contraseña ha cambiado', 'Se ha cambiado la contraseña de tu cuenta')
    return res.status(200).json({ token: signToken(user, now) })
  } catch (err) {
    return serverError(res, 'cuenta/password', err)
  }
}
