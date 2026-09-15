import bcrypt from 'bcryptjs'
import { ensureSchema, sql } from '../_lib/db.js'
import { EMAIL_RE, methodNotAllowed, passwordProblem, readBody, signToken } from '../_lib/auth.js'
import { serverError } from '../_lib/session.js'

// POST /api/auth/register  { nombre, email, password } → 201 { token, usuario }
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  try {
    const body = readBody(req)
    const nombre = String(body.nombre ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = body.password

    if (!nombre || nombre.length > 120) return res.status(400).json({ error: 'Escribe un nombre (máx. 120 caracteres).' })
    if (!EMAIL_RE.test(email) || email.length > 200) return res.status(400).json({ error: 'Escribe un email válido.' })
    const problem = passwordProblem(password)
    if (problem) return res.status(400).json({ error: problem })

    await ensureSchema()
    const passwordHash = await bcrypt.hash(password, 12)
    const now = Date.now()

    const [usuario] = await sql`
      INSERT INTO usuarios (nombre, email, password_hash, sesiones_desde)
      VALUES (${nombre}, ${email}, ${passwordHash}, to_timestamp(${Math.floor(now / 1000)}))
      RETURNING id, nombre, email, creado_en
    `
    return res.status(201).json({ token: signToken(usuario, now), usuario })
  } catch (err) {
    if (err?.code === '23505') return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' })
    return serverError(res, 'register', err)
  }
}
