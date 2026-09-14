// Descarga las texturas de la Tierra a /public/textures para uso 100% offline.
// Después cambia TEXTURE_BASE en src/config.ts a '/textures'.
import { mkdir, writeFile } from 'node:fs/promises'

const BASE = 'https://unpkg.com/three-globe/example/img'
const FILES = ['earth-blue-marble.jpg', 'earth-night.jpg', 'earth-topology.png', 'earth-water.png']

await mkdir('public/textures', { recursive: true })
for (const f of FILES) {
  process.stdout.write(`↓ ${f} … `)
  const res = await fetch(`${BASE}/${f}`)
  if (!res.ok) throw new Error(`${f}: HTTP ${res.status}`)
  await writeFile(`public/textures/${f}`, Buffer.from(await res.arrayBuffer()))
  console.log('ok')
}
