import jwt from 'jsonwebtoken'

const EXPIRES_IN = '7d'
const ISSUER = 'orbis'

function secret() {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) throw new Error('JWT_SECRET debe existir y tener al menos 32 caracteres')
  return s
}

export function signToken(user) {
  return jwt.sign({ email: user.email, nombre: user.nombre }, secret(), {
    subject: String(user.id),
    expiresIn: EXPIRES_IN,
    issuer: ISSUER,
    algorithm: 'HS256',
  })
}

/** Devuelve { id, email, nombre } si la cabecera "Authorization: Bearer <token>" es válida; si no, null. */
export function getAuthUser(req) {
  const header = req.headers?.authorization ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  try {
    const payload = jwt.verify(token, secret(), { issuer: ISSUER, algorithms: ['HS256'] })
    const id = Number(payload.sub)
    if (!Number.isInteger(id) || id <= 0) return null
    return { id, email: payload.email, nombre: payload.nombre }
  } catch {
    return null
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Vercel ya parsea JSON, pero se acepta también el cuerpo como texto. */
export function readBody(req) {
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}')
  return req.body ?? {}
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '))
  return res.status(405).json({ error: `Método no permitido. Usa ${allowed.join(' o ')}.` })
}
