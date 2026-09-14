# Orbis — Archivo personal de viajes en 3D

Globo terráqueo inmersivo para explorar tus viajes: marcadores luminosos, etiquetas con nivel de detalle,
Memory Vault con galería masonry, lightbox con reproductor de vídeo, panel "The Curator" para añadir
recuerdos y un modo cinematográfico con música ambiental generativa.

## Puesta en marcha

Requisitos: Node 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de producción en /dist
npm run preview    # sirve el build
```

Uso offline de las texturas (opcional):

```bash
npm run textures   # descarga a public/textures
```

y cambia `TEXTURE_BASE` en `src/config.ts` a `'/textures'`.

## Stack

Vite · React 19 · TypeScript · @react-three/fiber + drei · Three.js (shaders propios) · Tailwind CSS v4 ·
Framer Motion · Zustand · idb-keyval (IndexedDB) · lucide-react

## Arquitectura

```
src/
├─ config.ts                 Texturas, distancias de cámara, duración del tour
├─ types.ts                  Memory, MediaItem, FlyTarget
├─ store/useOrbis.ts         Estado global (Zustand) + acciones con persistencia
├─ lib/
│  ├─ db.ts                  IndexedDB: metadatos + blobs de fotos/vídeos
│  ├─ geo.ts                 lat/lng ⇄ Vector3, easing, formatos de fecha
│  └─ ambient.ts             Motor de música ambiental (Web Audio, sin archivos)
├─ data/
│  ├─ places.ts              Países y ciudades por niveles de zoom
│  └─ seed.ts                Recuerdos de ejemplo (primera carga)
├─ hooks/useKeyboard.ts      Atajos globales
└─ components/
   ├─ globe/
   │  ├─ GlobeScene.tsx      Canvas, estrellas, OrbitControls
   │  ├─ Earth.tsx           Tierra: día/noche, relieve, reflejo en océanos
   │  ├─ shaders.ts          GLSL de la Tierra y la atmósfera
   │  ├─ Atmosphere.tsx      Halo atmosférico aditivo
   │  ├─ Markers.tsx         Pines con pulso, hover card, marcador de selección
   │  ├─ PlaceLabels.tsx     Etiquetas LOD (DOM actualizado sin re-render)
   │  └─ CameraRig.tsx       Vuelos cinemáticos en arco + desplazamiento de encuadre
   └─ ui/
      ├─ TopBar, ControlDock, Loader
      ├─ MemoryVault.tsx     Panel glassmorphism del lugar
      ├─ Gallery.tsx         Masonry de fotos y vídeos
      ├─ Lightbox.tsx        Pantalla completa con metadatos
      ├─ VideoPlayer.tsx     Reproductor con controles limpios
      ├─ Curator.tsx         Alta de recuerdos (selección en el globo, drag & drop)
      └─ Cinematic.tsx       Tour automático con barras de cine
```

## Persistencia

Todo se guarda automáticamente en IndexedDB del navegador (sin botón de guardar): los metadatos en
`orbis-memories` y los archivos originales en `orbis-media`. Sobrevive a recargas, pero es local a ese
navegador. Para sincronizar entre dispositivos, sustituye `src/lib/db.ts` por un backend
(Supabase / Firebase / S3) — el resto de la app no cambia.

## Atajos

| Tecla | Acción |
|---|---|
| `Esc` | Cerrar capa actual |
| `H` | Ocultar / mostrar interfaz |
| `N` | Luces nocturnas |
| `←` `→` | Navegar en el lightbox |
