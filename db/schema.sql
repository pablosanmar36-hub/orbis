-- Esquema de Orbis para Neon (PostgreSQL).
-- Es idempotente: puedes ejecutarlo en el SQL Editor de Neon tantas veces como quieras.
-- Las funciones de /api también lo aplican automáticamente en su primera ejecución.

-- 1. Usuarios -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id             SERIAL PRIMARY KEY,
  nombre         TEXT        NOT NULL,
  email          TEXT        NOT NULL UNIQUE,
  password_hash  TEXT,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Si la tabla ya existía (creada por api/usuarios.js), le añade la columna que falta.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Los tokens emitidos antes de esta fecha dejan de valer
-- (cambio de contraseña o "cerrar sesión en todos los dispositivos").
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS sesiones_desde TIMESTAMPTZ NOT NULL DEFAULT to_timestamp(0);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ;

-- 2. Elementos privados de cada usuario ----------------------------------
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
);

CREATE INDEX IF NOT EXISTS elementos_user_id_idx ON elementos (user_id);
