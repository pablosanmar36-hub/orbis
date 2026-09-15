import { getAuthUser, unauthorized } from './auth.js'
import { ensureSchema, sql } from './db.js'

/**
 * Valida el token y comprueba en la base de datos que el usuario sigue existiendo
 * y que el token no se emitió antes de la última invalidación de sesiones.
 * Devuelve la fila del usuario (sin password_hash) o responde 401 y devuelve null.
 */
export async function requireUser(req, res) {
  const auth = getAuthUser(req)
  if (!auth) return unauthorized(res), null

  await ensureSchema()
  const [row] = await sql`
    SELECT id, nombre, email, creado_en, actualizado_en,
           floor(extract(epoch FROM sesiones_desde))::bigint AS sesiones_desde_s
    FROM usuarios
    WHERE id = ${auth.id}
  `
  if (!row) return unauthorized(res, 'Tu cuenta ya no existe.'), null
  if (auth.iat < Number(row.sesiones_desde_s)) return unauthorized(res, 'Tu sesión se cerró desde otro dispositivo. Vuelve a iniciar sesión.'), null

  const { sesiones_desde_s: _omit, ...usuario } = row
  return { ...usuario, tokenExp: auth.exp }
}

export function serverError(res, scope, err) {
  if (err instanceof SyntaxError) return res.status(400).json({ error: 'El cuerpo debe ser JSON válido.' })
  console.error(`[${scope}]`, err)
  return res.status(500).json({ error: 'Error interno del servidor.' })
}
