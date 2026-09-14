import { neon } from '@neondatabase/serverless'

// Función serverless (Vercel): GET /api/usuarios lista, POST /api/usuarios inserta.
const sql = neon(process.env.DATABASE_URL)

let tablaLista = false
async function asegurarTabla() {
  if (tablaLista) return
  await sql`
    CREATE TABLE IF NOT EXISTS usuarios (
      id         SERIAL PRIMARY KEY,
      nombre     TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  tablaLista = true
}

export default async function handler(req, res) {
  try {
    await asegurarTabla()

    if (req.method === 'GET') {
      const usuarios = await sql`SELECT id, nombre, email, creado_en FROM usuarios ORDER BY id`
      return res.status(200).json(usuarios)
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {}
      const nombre = String(body.nombre ?? '').trim()
      const email = String(body.email ?? '').trim().toLowerCase()

      if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Envía "nombre" y un "email" válido.' })
      }

      const [usuario] = await sql`
        INSERT INTO usuarios (nombre, email)
        VALUES (${nombre}, ${email})
        RETURNING id, nombre, email, creado_en
      `
      return res.status(201).json(usuario)
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: `Método ${req.method} no permitido.` })
  } catch (err) {
    if (err?.code === '23505') return res.status(409).json({ error: 'Ya existe un usuario con ese email.' })
    if (err instanceof SyntaxError) return res.status(400).json({ error: 'El cuerpo debe ser JSON válido.' })
    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
