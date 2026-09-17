/** Contenido de la página comercial. Las fotos son de ejemplo (Unsplash) y se pueden sustituir por las tuyas. */

export const APP_URL = '/app/'

const unsplash = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`

export interface Trip {
  place: string
  country: string
  lat: number
  lng: number
  photo: string
  caption: string
  date: string
}

/** Viajes de ejemplo: alimentan el globo de portada, el panel de salidas y la galería. */
export const TRIPS: Trip[] = [
  { place: 'Kioto', country: 'Japón', lat: 35.0116, lng: 135.7681, photo: unsplash('1493976040374-85c8e12f0c0e'), caption: 'Amanecer en Higashiyama, antes que los turistas', date: 'Nov 2023' },
  { place: 'Reikiavik', country: 'Islandia', lat: 64.1466, lng: -21.9426, photo: unsplash('1531366936337-7c912a4589a7'), caption: 'Veinte minutos de silencio bajo la aurora', date: 'Feb 2024' },
  { place: 'Oia', country: 'Grecia', lat: 36.4618, lng: 25.3753, photo: unsplash('1570077188670-e3a8d69ac5ff'), caption: 'El azul que no sale bien en ninguna foto', date: 'Jun 2025' },
  { place: 'Machu Picchu', country: 'Perú', lat: -13.1631, lng: -72.545, photo: unsplash('1526392060635-9d6019884377'), caption: 'Cuatro días de camino inca para este momento', date: 'Ago 2022' },
  { place: 'Barcelona', country: 'España', lat: 41.3874, lng: 2.1686, photo: unsplash('1583422409516-2895a77efded'), caption: 'El Eixample desde arriba, como un tablero', date: 'Jul 2025' },
  { place: 'Ciudad del Cabo', country: 'Sudáfrica', lat: -33.9249, lng: 18.4241, photo: unsplash('1580060839134-75a5edca2e99'), caption: 'Table Mountain, último atardecer del año', date: 'Dic 2022' },
  { place: 'Manarola', country: 'Italia', lat: 44.1069, lng: 9.7292, photo: unsplash('1516483638261-f4dbaf036963'), caption: 'Cinque Terre a la hora dorada', date: 'May 2024' },
  { place: 'Merzouga', country: 'Marruecos', lat: 31.0802, lng: -4.0133, photo: unsplash('1489493585363-d69421e0edd3'), caption: 'Noche en el Sáhara, el cielo más limpio', date: 'Mar 2023' },
  { place: 'Sídney', country: 'Australia', lat: -33.8688, lng: 151.2093, photo: unsplash('1506973035872-a4ec16b8e8d9'), caption: 'Ferry a Manly con la Ópera de fondo', date: 'Mar 2019' },
  { place: 'Venecia', country: 'Italia', lat: 45.4408, lng: 12.3155, photo: unsplash('1523906834658-6e24ef2386f9'), caption: 'Rialto antes de que despierte la ciudad', date: 'Oct 2021' },
  { place: 'Bali', country: 'Indonesia', lat: -8.2752, lng: 115.1668, photo: unsplash('1537996194471-e657df975ab4'), caption: 'Ulun Danu flotando sobre el lago Bratan', date: 'Abr 2024' },
  { place: 'Lago di Braies', country: 'Italia', lat: 46.6943, lng: 12.0857, photo: unsplash('1476514525535-07fb3b4ae5f1'), caption: 'Remar entre Dolomitas', date: 'Sep 2023' },
]

export const HERO_ROUTE = ['Barcelona', 'Reikiavik', 'Kioto', 'Bali', 'Sídney', 'Ciudad del Cabo', 'Machu Picchu', 'Barcelona']

export const PHOTOS = {
  traveler: unsplash('1503220317375-aaad61436b1b', 1400),
  airport: unsplash('1530521954074-e64f6810b32d', 1400),
  map: unsplash('1488646953014-85cb44e25828', 1400),
  van: unsplash('1469854523086-cc02fe5d8800', 1400),
  tokyo: unsplash('1540959733332-eab4deabeeaf', 1400),
  dolomites: unsplash('1506905925346-21bda4d32df4', 1800),
}

export const CINEMA = [
  { title: 'Otoño en Kioto', place: 'Japón', photo: unsplash('1493976040374-85c8e12f0c0e', 1800) },
  { title: 'Auroras del norte', place: 'Islandia', photo: unsplash('1531366936337-7c912a4589a7', 1800) },
  { title: 'Dunas de Erg Chebbi', place: 'Marruecos', photo: unsplash('1489493585363-d69421e0edd3', 1800) },
  { title: 'Verano en las Cícladas', place: 'Grecia', photo: unsplash('1570077188670-e3a8d69ac5ff', 1800) },
]

export const FAQ = [
  {
    q: '¿Necesito instalar algo?',
    a: 'No. Orbis funciona en el navegador del ordenador, la tablet o el móvil. Creas tu cuenta y tu globo está listo en segundos.',
  },
  {
    q: '¿Quién puede ver mis viajes?',
    a: 'Solo tú. Cada cuenta es privada: tus recuerdos están aislados del resto de usuarios y tu contraseña se guarda cifrada.',
  },
  {
    q: '¿Qué pasa con mis fotos si dejo de pagar?',
    a: 'Nada se borra. Puedes exportar tus datos en cualquier momento desde «Tu cuenta» y volver al plan gratuito cuando quieras.',
  },
  {
    q: '¿Se ve de verdad tan de cerca?',
    a: 'Sí. Al acercarte, Orbis carga imágenes de satélite en alta resolución y dibuja cordilleras, picos con su altitud y los grandes ríos. Puedes bajar hasta unos 190 km sobre la superficie.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Cuando quieras y sin permanencia. Si cancelas, conservas las ventajas hasta el final del periodo que ya pagaste.',
  },
]
