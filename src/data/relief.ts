/**
 * Geografía física para el zoom cercano: cordilleras, picos y ríos principales.
 * Coordenadas en grados decimales (WGS84). Los trazados de los ríos son una
 * simplificación por las poblaciones que atraviesan, suficiente para escala regional.
 */

export interface Range {
  name: string
  lat: number
  lng: number
}

export interface Peak {
  name: string
  lat: number
  lng: number
  /** Altitud en metros sobre el nivel del mar */
  elevation: number
}

export interface River {
  name: string
  /** Punto donde se coloca la etiqueta */
  label: [lat: number, lng: number]
  /** Recorrido de nacimiento a desembocadura, como [lat, lng] */
  path: [number, number][]
}

export const RANGES: Range[] = [
  // Península Ibérica
  { name: 'Pirineos', lat: 42.68, lng: 0.6 },
  { name: 'Picos de Europa', lat: 43.24, lng: -4.85 },
  { name: 'Cordillera Cantábrica', lat: 42.93, lng: -5.9 },
  { name: 'Sierra Nevada', lat: 37.02, lng: -3.2 },
  { name: 'Sistema Central', lat: 40.55, lng: -4.6 },
  { name: 'Sierra de Guadarrama', lat: 40.9, lng: -3.85 },
  { name: 'Sierra de Gredos', lat: 40.2, lng: -5.2 },
  { name: 'Sistema Ibérico', lat: 41.45, lng: -2.25 },
  { name: 'Sierra Morena', lat: 38.25, lng: -5.2 },
  { name: 'Montes de Toledo', lat: 39.45, lng: -4.4 },
  { name: 'Montes de León', lat: 42.4, lng: -6.45 },
  { name: 'Serra da Estrela', lat: 40.32, lng: -7.62 },
  // Europa
  { name: 'Alpes', lat: 46.45, lng: 9.6 },
  { name: 'Macizo Central', lat: 45.35, lng: 2.8 },
  { name: 'Jura', lat: 46.75, lng: 6.3 },
  { name: 'Vosgos', lat: 48.1, lng: 7.0 },
  { name: 'Selva Negra', lat: 48.25, lng: 8.2 },
  { name: 'Apeninos', lat: 43.3, lng: 12.6 },
  { name: 'Alpes Dináricos', lat: 43.8, lng: 17.5 },
  { name: 'Cárpatos', lat: 47.3, lng: 24.9 },
  { name: 'Tatras', lat: 49.2, lng: 20.05 },
  { name: 'Balcanes', lat: 42.75, lng: 24.9 },
  { name: 'Alpes Escandinavos', lat: 64.0, lng: 14.0 },
  { name: 'Highlands', lat: 57.0, lng: -4.6 },
  { name: 'Cáucaso', lat: 42.7, lng: 44.0 },
  { name: 'Atlas', lat: 31.4, lng: -6.3 },
]

export const PEAKS: Peak[] = [
  // España
  { name: 'Teide', lat: 28.2724, lng: -16.6425, elevation: 3715 },
  { name: 'Mulhacén', lat: 37.0532, lng: -3.3113, elevation: 3479 },
  { name: 'Veleta', lat: 37.0563, lng: -3.3659, elevation: 3398 },
  { name: 'Aneto', lat: 42.631, lng: 0.6566, elevation: 3404 },
  { name: 'Monte Perdido', lat: 42.675, lng: 0.034, elevation: 3355 },
  { name: 'Torre Cerredo', lat: 43.1975, lng: -4.8528, elevation: 2650 },
  { name: 'Naranjo de Bulnes', lat: 43.2034, lng: -4.815, elevation: 2519 },
  { name: 'Almanzor', lat: 40.2466, lng: -5.2977, elevation: 2591 },
  { name: 'Peñalara', lat: 40.8503, lng: -3.9555, elevation: 2428 },
  { name: 'Moncayo', lat: 41.7872, lng: -1.8395, elevation: 2314 },
  // Europa
  { name: 'Mont Blanc', lat: 45.8326, lng: 6.8652, elevation: 4806 },
  { name: 'Monte Rosa', lat: 45.9368, lng: 7.8668, elevation: 4634 },
  { name: 'Cervino', lat: 45.9763, lng: 7.6586, elevation: 4478 },
  { name: 'Grossglockner', lat: 47.0742, lng: 12.6947, elevation: 3798 },
  { name: 'Zugspitze', lat: 47.4211, lng: 10.9853, elevation: 2962 },
  { name: 'Etna', lat: 37.751, lng: 14.994, elevation: 3357 },
  { name: 'Vesubio', lat: 40.821, lng: 14.426, elevation: 1281 },
  { name: 'Olimpo', lat: 40.0859, lng: 22.3583, elevation: 2918 },
  { name: 'Musala', lat: 42.1795, lng: 23.585, elevation: 2925 },
  { name: 'Gerlach', lat: 49.164, lng: 20.134, elevation: 2655 },
  { name: 'Puy de Dôme', lat: 45.772, lng: 2.964, elevation: 1465 },
  { name: 'Ben Nevis', lat: 56.7969, lng: -5.0036, elevation: 1345 },
  { name: 'Galdhøpiggen', lat: 61.6364, lng: 8.3125, elevation: 2469 },
  { name: 'Elbrus', lat: 43.3499, lng: 42.4453, elevation: 5642 },
  { name: 'Toubkal', lat: 31.0597, lng: -7.915, elevation: 4167 },
]

export const RIVERS: River[] = [
  {
    name: 'Ebro',
    label: [41.55, -0.55],
    path: [[43.0, -4.15], [42.99, -4.05], [42.8, -3.6], [42.68, -2.95], [42.47, -2.44], [42.3, -1.95], [42.06, -1.6], [41.66, -0.88], [41.38, -0.3], [41.23, -0.04], [41.37, 0.3], [41.23, 0.55], [40.81, 0.52], [40.72, 0.87]],
  },
  {
    name: 'Tajo',
    label: [39.82, -4.55],
    path: [[40.33, -1.7], [40.62, -2.2], [40.35, -2.8], [40.2, -3.25], [40.03, -3.6], [39.86, -4.02], [39.96, -4.83], [39.8, -5.6], [39.72, -6.88], [39.46, -8.2], [39.24, -8.68], [38.95, -8.98], [38.7, -9.1]],
  },
  {
    name: 'Duero',
    label: [41.62, -4.45],
    path: [[41.98, -2.88], [41.76, -2.46], [41.6, -3.0], [41.67, -3.69], [41.63, -4.35], [41.5, -5.0], [41.5, -5.75], [41.49, -6.27], [41.1, -6.9], [41.16, -7.79], [41.14, -8.66]],
  },
  {
    name: 'Guadalquivir',
    label: [37.95, -4.3],
    path: [[37.92, -2.93], [38.0, -3.37], [38.04, -4.05], [37.88, -4.78], [37.7, -5.28], [37.5, -5.7], [37.38, -6.0], [37.0, -6.2], [36.78, -6.35]],
  },
  {
    name: 'Guadiana',
    label: [39.0, -5.6],
    path: [[39.13, -3.64], [39.03, -3.95], [39.1, -4.7], [38.95, -5.6], [38.92, -6.34], [38.88, -6.97], [38.3, -7.4], [37.64, -7.66], [37.21, -7.41]],
  },
  {
    name: 'Miño',
    label: [42.62, -7.62],
    path: [[43.18, -7.55], [43.01, -7.56], [42.6, -7.75], [42.34, -7.86], [42.15, -8.25], [42.05, -8.64], [41.9, -8.87]],
  },
  {
    name: 'Rin',
    label: [49.75, 8.35],
    path: [[46.63, 8.67], [46.85, 9.53], [47.65, 9.3], [47.56, 7.59], [48.57, 7.8], [49.49, 8.46], [50.0, 8.27], [50.36, 7.6], [50.94, 6.96], [51.23, 6.77], [51.85, 5.87], [51.9, 4.4]],
  },
  {
    name: 'Danubio',
    label: [44.05, 24.6],
    path: [[47.95, 8.5], [48.4, 9.99], [49.02, 12.1], [48.57, 13.46], [48.31, 14.29], [48.21, 16.37], [48.14, 17.11], [47.5, 19.05], [45.8, 18.9], [45.25, 19.85], [44.82, 20.45], [44.67, 22.52], [43.7, 24.8], [43.85, 25.95], [44.12, 27.26], [45.43, 28.05], [45.18, 28.8], [45.2, 29.7]],
  },
  {
    name: 'Loira',
    label: [47.42, 0.1],
    path: [[44.84, 4.22], [45.45, 4.1], [46.04, 4.07], [46.99, 3.16], [47.9, 1.9], [47.39, 0.69], [47.47, -0.55], [47.22, -1.55], [47.27, -2.2]],
  },
  {
    name: 'Ródano',
    label: [44.55, 4.62],
    path: [[46.58, 8.38], [46.23, 7.36], [46.4, 6.6], [46.2, 6.15], [45.9, 5.8], [45.76, 4.83], [44.93, 4.89], [43.95, 4.81], [43.68, 4.63], [43.33, 4.84]],
  },
  {
    name: 'Sena',
    label: [49.0, 1.75],
    path: [[47.49, 4.72], [48.3, 4.08], [48.5, 3.0], [48.86, 2.35], [49.0, 2.0], [49.44, 1.1], [49.47, 0.15]],
  },
  {
    name: 'Po',
    label: [45.18, 10.7],
    path: [[44.7, 7.1], [45.07, 7.69], [45.15, 8.6], [45.05, 9.7], [45.13, 10.02], [44.95, 11.6], [44.95, 12.45]],
  },
  {
    name: 'Támesis',
    label: [51.58, -0.95],
    path: [[51.69, -2.03], [51.75, -1.26], [51.46, -0.97], [51.51, -0.12], [51.5, 0.6]],
  },
]

export const formatElevation = (m: number) => `${m.toLocaleString('es-ES')} m`
