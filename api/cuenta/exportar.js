import { sql } from '../_lib/db.js'
import { methodNotAllowed } from '../_lib/auth.js'
import { requireUser, serverError } from '../_lib/session.js'

/** GET /api/cuenta/exportar  (Authorization: Bearer <token>) → copia completa de los datos de la cuenta en JSON. */
export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])
  res.setHeader('Cache-Control', 'private, no-store')

  try {
    const user = await requireUser(req, res)
    if (!user) return

    const elementos = await sql`SELECT * FROM elementos WHERE user_id = ${user.id} ORDER BY id`
    const { tokenExp: _omit, ...usuario } = user
    return res.status(200).json({ exportado_en: new Date().toISOString(), formato: 'orbis-export/1', usuario, elementos })
  } catch (err) {
    return serverError(res, 'cuenta/exportar', err)
  }
}
