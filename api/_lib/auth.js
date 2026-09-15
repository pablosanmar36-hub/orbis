import jwt from 'jsonwebtoken'

const EXPIRES_IN_S = 7 * 24 * 60 * 60
const ISSUER = 'orbis'

function secret() {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) throw new Error('JWT_SECRET debe existir y tener al menos 32 caracteres')
  return s
}

/**
 * Firma un token. `issuedAtMs` debe ser el mismo instante que se guarda en
 * usuarios.sesiones_desde cuando se invalidan sesiones, para que ambos relojes coincidan.
 */
export function signToken(user, issuedAtMs = Date.now()) {
  const iat = Math.floor(issuedAtMs / 1000)
  return jwt.sign({ email: user.email, nombre: user.nombre, iat }, secret(), {
    subject: String(user.id),
    expiresIn: EXPIRES_IN_S,
    issuer: ISSUER,
    algorithm: 'HS256',
  })
}

/** Devuelve { id, email, nombre, iat, exp } si la cabecera "Authorization: Bearer <token>" es válida; si no, null. */
export function getAuthUser(req) {
  const header = req.headers?.authorization ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  try {
    const payload = jwt.verify(token, secret(), { issuer: ISSUER, algorithms: ['HS256'] })
    const id = Number(payload.sub)
    if (!Number.isInteger(id) || id <= 0) return null
    return { id, email: payload.email, nombre: payload.nombre, iat: payload.iat, exp: payload.exp }
  } catch {
    return null
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Reglas de contraseña compartidas por registro y cambio de contraseña. Devuelve el error o null. */
export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  // bcrypt solo usa los primeros 72 bytes
  if (Buffer.byteLength(password) > 72) return 'La contraseña no puede superar los 72 caracteres.'
  return null
}

/** Vercel ya parsea JSON, pero se acepta también el cuerpo como texto. */
export function readBody(req) {
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}')
  return req.body ?? {}
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '))
  return res.status(405).json({ error: `Método no permitido. Usa ${allowed.join(' o ')}.` })
}

export function unauthorized(res, message = 'Inicia sesión para continuar.') {
  res.setHeader('WWW-Authenticate', 'Bearer')
  return res.status(401).json({ error: message })
}
