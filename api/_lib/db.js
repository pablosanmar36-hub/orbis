import { neon } from '@neondatabase/serverless'

// Los archivos que empiezan por "_" dentro de /api no se publican como rutas en Vercel.
if (!process.env.DATABASE_URL) throw new Error('Falta la variable de entorno DATABASE_URL')

export const sql = neon(process.env.DATABASE_URL)

let schemaReady = null

/** Aplica db/schema.sql una sola vez por instancia de la función. */
export function ensureSchema() {
  schemaReady ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS usuarios (
        id             SERIAL PRIMARY KEY,
        nombre         TEXT        NOT NULL,
        email          TEXT        NOT NULL UNIQUE,
        password_hash  TEXT,
        creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash TEXT`
    // Los tokens emitidos antes de esta fecha dejan de valer (cambio de contraseña, "cerrar todas las sesiones")
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS sesiones_desde TIMESTAMPTZ NOT NULL DEFAULT to_timestamp(0)`
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ`
    await sql`
      CREATE TABLE IF NOT EXISTS elementos (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        titulo     TEXT        NOT NULL,
        lugar      TEXT,
        lat        DOUBLE PRECISION CHECK (lat BETWEEN -90 AND 90),
        lng        DOUBLE PRECISION CHECK (lng BETWEEN -180 AND 180),
        fecha      DATE,
        nota       TEXT,
        media      JSONB       NOT NULL DEFAULT '[]'::jsonb,
        creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    await sql`CREATE INDEX IF NOT EXISTS elementos_user_id_idx ON elementos (user_id)`
    // Dispositivos donde cada usuario ha activado las notificaciones push
    await sql`
      CREATE TABLE IF NOT EXISTS push_suscripciones (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        endpoint     TEXT        NOT NULL UNIQUE,
        p256dh       TEXT        NOT NULL,
        auth         TEXT        NOT NULL,
        nombre       TEXT        NOT NULL DEFAULT 'Dispositivo',
        seguridad    BOOLEAN     NOT NULL DEFAULT true,
        recuerdos    BOOLEAN     NOT NULL DEFAULT true,
        novedades    BOOLEAN     NOT NULL DEFAULT true,
        creado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
        ultimo_envio TIMESTAMPTZ
      )`
    await sql`CREATE INDEX IF NOT EXISTS push_suscripciones_user_id_idx ON push_suscripciones (user_id)`
  })().catch((err) => {
    schemaReady = null // reintentar en la siguiente petición
    throw err
  })
  return schemaReady
}
