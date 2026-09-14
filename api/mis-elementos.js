import { ensureSchema, sql } from './_lib/db.js'
import { getAuthUser, methodNotAllowed, readBody } from './_lib/auth.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Cabecera obligatoria: Authorization: Bearer <token>
// GET  /api/mis-elementos → elementos del usuario autenticado
// POST /api/mis-elementos { titulo, lugar?, lat?, lng?, fecha?, nota? } → 201 elemento creado
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST'])

  const user = getAuthUser(req)
  if (!user) {
    res.setHeader('WWW-Authenticate', 'Bearer')
    return res.status(401).json({ error: 'Inicia sesión para ver tus elementos.' })
  }

  try {
    res.setHeader('Cache-Control', 'private, no-store')

    if (req.method === 'POST') {
      const body = readBody(req)
      const titulo = String(body.titulo ?? '').trim()
      const lugar = String(body.lugar ?? '').trim() || null
      const nota = String(body.nota ?? '').trim() || null
      const fecha = body.fecha ? String(body.fecha) : null
      const lat = body.lat === '' || body.lat == null ? null : Number(body.lat)
      const lng = body.lng === '' || body.lng == null ? null : Number(body.lng)

      if (!titulo || titulo.length > 160) return res.status(400).json({ error: 'Escribe un título (máx. 160 caracteres).' })
      if ((lat === null) !== (lng === null)) return res.status(400).json({ error: 'Indica latitud y longitud juntas, o ninguna.' })
      if (lat !== null && !(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) {
        return res.status(400).json({ error: 'Latitud entre -90 y 90; longitud entre -180 y 180.' })
      }
      if (fecha && !DATE_RE.test(fecha)) return res.status(400).json({ error: 'La fecha debe tener el formato AAAA-MM-DD.' })
      if (nota && nota.length > 2000) return res.status(400).json({ error: 'La nota admite hasta 2000 caracteres.' })

      await ensureSchema()
      const [elemento] = await sql`
        INSERT INTO elementos (user_id, titulo, lugar, lat, lng, fecha, nota)
        VALUES (${user.id}, ${titulo}, ${lugar}, ${lat}, ${lng}, ${fecha}, ${nota})
        RETURNING *
      `
      return res.status(201).json(elemento)
    }

    // El id sale del token verificado, nunca de la URL ni del cuerpo de la petición.
    await ensureSchema()
    const elementos = await sql`
      SELECT * FROM elementos
      WHERE user_id = ${user.id}
      ORDER BY fecha DESC NULLS LAST, id DESC
    `
    return res.status(200).json(elementos)
  } catch (err) {
    if (err?.code === '23503') return res.status(401).json({ error: 'Tu cuenta ya no existe. Vuelve a iniciar sesión.' })
    if (err instanceof SyntaxError) return res.status(400).json({ error: 'El cuerpo debe ser JSON válido.' })
    console.error('[mis-elementos]', err)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
