import bcrypt from 'bcryptjs'
import { ensureSchema, sql } from '../_lib/db.js'
import { methodNotAllowed, readBody, signToken } from '../_lib/auth.js'

// Hash de referencia: si el email no existe se compara igualmente, para que el tiempo
// de respuesta no revele qué emails están registrados.
const DUMMY_HASH = bcrypt.hashSync('orbis-dummy-password', 12)

// POST /api/auth/login  { email, password } → 200 { token, usuario }
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  try {
    const body = readBody(req)
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    if (!email || !password) return res.status(400).json({ error: 'Escribe tu email y tu contraseña.' })

    await ensureSchema()
    const [row] = await sql`
      SELECT id, nombre, email, password_hash, creado_en
      FROM usuarios
      WHERE email = ${email}
    `

    const ok = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH)
    // Usuarios antiguos sin contraseña (creados con /api/usuarios) no pueden iniciar sesión.
    if (!row?.password_hash || !ok) return res.status(401).json({ error: 'Email o contraseña incorrectos.' })

    const { password_hash: _omit, ...usuario } = row
    return res.status(200).json({ token: signToken(usuario), usuario })
  } catch (err) {
    if (err instanceof SyntaxError) return res.status(400).json({ error: 'El cuerpo debe ser JSON válido.' })
    console.error('[login]', err)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
