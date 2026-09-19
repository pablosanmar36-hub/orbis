import bcrypt from 'bcryptjs'
import { sql } from '../_lib/db.js'
import { EMAIL_RE, methodNotAllowed, readBody, signToken } from '../_lib/auth.js'
import { requireUser, serverError } from '../_lib/session.js'
import { securityAlert } from '../_lib/push.js'

/**
 * /api/cuenta  (Authorization: Bearer <token>)
 *  GET    → perfil, estadísticas y caducidad de la sesión
 *  PATCH  { nombre?, email?, password? } → { usuario, token }   (cambiar el email exige la contraseña)
 *  DELETE { password, confirmacion: "ELIMINAR" } → 204   (borra la cuenta y todos sus elementos)
 */
export default async function handler(req, res) {
  if (!['GET', 'PATCH', 'DELETE'].includes(req.method)) return methodNotAllowed(res, ['GET', 'PATCH', 'DELETE'])
  res.setHeader('Cache-Control', 'private, no-store')

  try {
    const user = await requireUser(req, res)
    if (!user) return

    if (req.method === 'GET') {
      const [stats] = await sql`
        SELECT count(*)::int AS elementos,
               count(DISTINCT lugar)::int AS lugares,
               min(fecha) AS primer_viaje,
               max(fecha) AS ultimo_viaje
        FROM elementos
        WHERE user_id = ${user.id}
      `
      const { tokenExp, ...usuario } = user
      return res.status(200).json({ usuario, estadisticas: stats, sesion: { expira: new Date(tokenExp * 1000).toISOString() } })
    }

    const body = readBody(req)

    if (req.method === 'PATCH') {
      const nombre = body.nombre === undefined ? user.nombre : String(body.nombre).trim()
      const email = body.email === undefined ? user.email : String(body.email).trim().toLowerCase()

      if (!nombre || nombre.length > 120) return res.status(400).json({ error: 'Escribe un nombre (máx. 120 caracteres).' })
      if (!EMAIL_RE.test(email) || email.length > 200) return res.status(400).json({ error: 'Escribe un email válido.' })
      if (nombre === user.nombre && email === user.email) return res.status(400).json({ error: 'No hay cambios que guardar.' })

      if (email !== user.email) {
        const [row] = await sql`SELECT password_hash FROM usuarios WHERE id = ${user.id}`
        const ok = row?.password_hash && (await bcrypt.compare(String(body.password ?? ''), row.password_hash))
        if (!ok) return res.status(403).json({ error: 'Para cambiar el email, confirma tu contraseña actual.' })
      }

      const [usuario] = await sql`
        UPDATE usuarios
        SET nombre = ${nombre}, email = ${email}, actualizado_en = now()
        WHERE id = ${user.id}
        RETURNING id, nombre, email, creado_en, actualizado_en
      `
      if (email !== user.email) await securityAlert(req, user.id, 'El email de tu cuenta ha cambiado', `Ahora inicias sesión con ${email}`)
      // El token lleva nombre y email: se reemite para que la sesión muestre los datos nuevos.
      return res.status(200).json({ usuario, token: signToken(usuario) })
    }

    // DELETE
    if (body.confirmacion !== 'ELIMINAR') return res.status(400).json({ error: 'Escribe ELIMINAR para confirmar.' })
    const [row] = await sql`SELECT password_hash FROM usuarios WHERE id = ${user.id}`
    const ok = row?.password_hash && (await bcrypt.compare(String(body.password ?? ''), row.password_hash))
    if (!ok) return res.status(403).json({ error: 'La contraseña no es correcta.' })

    await sql`DELETE FROM usuarios WHERE id = ${user.id}` // ON DELETE CASCADE borra sus elementos
    return res.status(204).end()
  } catch (err) {
    if (err?.code === '23505') return res.status(409).json({ error: 'Ese email ya pertenece a otra cuenta.' })
    return serverError(res, 'cuenta', err)
  }
}
