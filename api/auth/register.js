import bcrypt from 'bcryptjs'
import { ensureSchema, sql } from '../_lib/db.js'
import { EMAIL_RE, methodNotAllowed, readBody, signToken } from '../_lib/auth.js'

// POST /api/auth/register  { nombre, email, password } → 201 { token, usuario }
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  try {
    const body = readBody(req)
    const nombre = String(body.nombre ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')

    if (!nombre || nombre.length > 120) return res.status(400).json({ error: 'Escribe un nombre (máx. 120 caracteres).' })
    if (!EMAIL_RE.test(email) || email.length > 200) return res.status(400).json({ error: 'Escribe un email válido.' })
    // bcrypt solo usa los primeros 72 bytes de la contraseña
    if (password.length < 8 || Buffer.byteLength(password) > 72) {
      return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 72 caracteres.' })
    }

    await ensureSchema()
    const passwordHash = await bcrypt.hash(password, 12)

    const [usuario] = await sql`
      INSERT INTO usuarios (nombre, email, password_hash)
      VALUES (${nombre}, ${email}, ${passwordHash})
      RETURNING id, nombre, email, creado_en
    `
    return res.status(201).json({ token: signToken(usuario), usuario })
  } catch (err) {
    if (err?.code === '23505') return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' })
    if (err instanceof SyntaxError) return res.status(400).json({ error: 'El cuerpo debe ser JSON válido.' })
    console.error('[register]', err)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
