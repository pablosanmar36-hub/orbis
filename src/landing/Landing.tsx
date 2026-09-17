import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  Check,
  Clapperboard,
  Download,
  Lock,
  Minus,
  Mountain,
  Play,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { BoardingPass } from './BoardingPass'
import { APP_URL, CINEMA, FAQ, PHOTOS, TRIPS } from './content'
import { DepartureBoard } from './DepartureBoard'
import { WarpOverlay } from './WarpOverlay'
import { ZoomCompare } from './ZoomCompare'

const HeroGlobe = lazy(() => import('./HeroGlobe'))

const EASE = [0.22, 1, 0.36, 1] as const

/** Aparición al hacer scroll: solo desplaza, el contenido nunca queda invisible. */
function Rise({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ y: 28 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

function SectionHead({ eyebrow, title, lede, align = 'left' }: { eyebrow: string; title: ReactNode; lede?: ReactNode; align?: 'left' | 'center' }) {
  return (
    <Rise className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 font-display text-[clamp(2.6rem,6vw,5rem)] leading-[0.95] tracking-tight text-star">{title}</h2>
      {lede && <p className={`mt-5 max-w-xl text-[17px] leading-relaxed text-star/60 ${align === 'center' ? 'mx-auto' : ''}`}>{lede}</p>}
    </Rise>
  )
}

/* ───────────────────────────── Navegación ───────────────────────────── */

function Nav({ onBoard }: { onBoard: () => void }) {
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${solid ? 'bg-ink/75 backdrop-blur-xl' : ''}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-10">
        <a href="#top" className="font-display text-3xl leading-none text-star">
          Orb<em className="text-sun">is</em>
        </a>
        <ul className="hidden items-center gap-8 text-sm text-star/65 xl:flex">
          {[
            ['Cómo funciona', '#como-funciona'],
            ['Zoom real', '#zoom'],
            ['Modo cine', '#cine'],
            ['Precios', '#precios'],
            ['Preguntas', '#preguntas'],
          ].map(([label, href]) => (
            <li key={href}>
              <a href={href} className="transition hover:text-star">
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <a href={APP_URL} className="hidden rounded-full px-4 py-2 text-sm text-star/75 transition hover:text-star sm:block">
            Iniciar sesión
          </a>
          <button onClick={onBoard} className="rounded-full bg-star px-4 py-2 text-sm font-medium text-ink transition hover:bg-sun">
            Crear mi globo
          </button>
        </div>
      </nav>
    </header>
  )
}

/* ───────────────────────────── Portada ───────────────────────────── */

function Hero({ launching, onLaunch }: { launching: boolean; onLaunch: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const globeY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const globeScale = useTransform(scrollYProgress, [0, 1], [1, 1.12])

  // Polaroids alrededor del globo (posiciones relativas al propio globo)
  const floating = [
    { trip: TRIPS[0], style: { left: '-4%', top: '8%' }, r: -7 },
    { trip: TRIPS[2], style: { right: '12%', bottom: '4%' }, r: 5 },
    { trip: TRIPS[1], style: { right: '10%', top: '-3%' }, r: 4 },
  ]

  return (
    <section ref={ref} id="top" className="grain relative overflow-hidden pb-20 pt-28 lg:flex lg:min-h-[100svh] lg:items-center lg:pb-16 lg:pt-24">
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-6 px-5 md:px-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="relative z-10">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} className="eyebrow">
            40.4168° N · 3.7038° O — Tu archivo de viajes en 3D
          </motion.p>
          <h1 className="mt-6 font-display text-[clamp(3.2rem,7.2vw,6.8rem)] leading-[0.88] tracking-[-0.02em] text-star">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block"
                initial={{ y: '0.35em', opacity: 0.001 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.1 + i * 0.12 }}
              >
                {i === 0 && 'Cada viaje,'}
                {i === 1 && 'un punto de'}
                {i === 2 && (
                  <>
                    <em className="text-sun">luz</em> en tu planeta.
                  </>
                )}
              </motion.span>
            ))}
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-star/65">
            Orbis convierte tus fotos y vídeos en un globo terráqueo que puedes girar, acercar hasta ver las cumbres y revivir como una película.
          </p>
          <p className="mt-4 max-w-lg font-display text-2xl italic leading-snug text-star/80">«Coleccionar viajes es archivar la memoria del alma.»</p>

          <div className="mt-9 max-w-[34rem]">
            <BoardingPass onLaunch={onLaunch} />
            <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-star/45">
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-sun" /> Gratis para empezar
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-sun" /> Sin tarjeta
              </span>
              <a href={APP_URL} className="underline decoration-star/25 underline-offset-4 transition hover:text-star">
                o entra sin despegar
              </a>
            </p>
          </div>
        </div>

        {/* Globo: detrás del texto en móvil, columna propia en escritorio */}
        <motion.div
          style={{ y: globeY, scale: globeScale }}
          className="pointer-events-none absolute -right-[35%] -top-24 aspect-square w-[130%] opacity-45 sm:w-[95%] lg:pointer-events-auto lg:relative lg:right-auto lg:top-auto lg:-mr-[6vw] lg:w-[118%] lg:opacity-100"
        >
          <div className="absolute inset-0" aria-hidden="true">
            <Suspense fallback={<div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_40%_35%,#1b3a66,#05070f_65%)]" />}>
              <HeroGlobe launching={launching} />
            </Suspense>
          </div>
          <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
            {floating.map(({ trip, style, r }, i) => (
              <figure
                key={trip.place}
                className="absolute m-0 w-[26%] rounded-md bg-paper p-2 pb-7 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)]"
                style={{ ...style, ['--r' as string]: `${r}deg`, animation: `floaty ${6 + i}s ease-in-out ${i * 0.8}s infinite` }}
              >
                <img src={trip.photo.replace('w=1200', 'w=400')} alt="" className="aspect-square w-full object-cover" />
                <figcaption className="absolute inset-x-2 bottom-1.5 flex justify-between font-mono text-[9px] uppercase tracking-wide text-[#1c1a16]/70">
                  <span>{trip.place}</span>
                  <span>{trip.date}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </motion.div>
      </div>

      <a href="#salidas" className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-star/35 lg:flex">
        Desliza
        <ArrowDown size={14} className="animate-bounce" />
      </a>
    </section>
  )
}

/* ───────────────────────────── Salidas ───────────────────────────── */

function Departures() {
  return (
    <section id="salidas" className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 grid-cols-[minmax(0,1fr)] md:px-10 md:py-32 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
      <SectionHead
        eyebrow="Terminal de recuerdos"
        title={
          <>
            Tus viajes nunca <em className="text-sun">aterrizan</em> del todo.
          </>
        }
        lede="Las fotos se pierden en el carrete entre capturas de pantalla y memes. En Orbis cada viaje tiene su sitio exacto en el mapa, su fecha y su historia."
      />
      <Rise delay={0.1} className="min-w-0">
        <DepartureBoard />
      </Rise>
    </section>
  )
}

/* ───────────────────────────── Cómo funciona ───────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      icon: <UploadCloud size={20} strokeWidth={1.6} />,
      title: 'Sube',
      text: 'Arrastra las fotos y vídeos de un viaje. Todas de golpe, sin ordenar nada.',
      visual: (
        <div className="grid grid-cols-3 gap-1.5 p-4">
          {TRIPS.slice(0, 6).map((t, i) => (
            <img key={t.place} src={t.photo.replace('w=1200', 'w=300')} alt="" className={`aspect-square w-full rounded-md object-cover ${i === 4 ? 'ring-2 ring-sun' : ''}`} />
          ))}
        </div>
      ),
    },
    {
      icon: <Mountain size={20} strokeWidth={1.6} />,
      title: 'Sitúa',
      text: 'Haz clic en el punto exacto del globo o escribe las coordenadas. El recuerdo aparece al instante.',
      visual: (
        <div className="relative h-full min-h-44 overflow-hidden">
          <img src={PHOTOS.dolomites.replace('w=1800', 'w=700')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="absolute -inset-4 rounded-full border border-glacier/70" style={{ animation: 'pulse-ring 2s ease-out infinite' }} />
            <span className="block h-3 w-3 rounded-full bg-glacier shadow-[0_0_20px_#9fd8ff]" />
          </div>
          <p className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[10px] text-star/90 backdrop-blur">46.4102° N · 11.8440° E</p>
        </div>
      ),
    },
    {
      icon: <Sparkles size={20} strokeWidth={1.6} />,
      title: 'Revive',
      text: 'Gira tu planeta, entra en cada lugar y deja que el modo cine te lleve de un viaje a otro.',
      visual: (
        <div className="p-4">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0c1120]">
            <img src={TRIPS[1].photo.replace('w=1200', 'w=600')} alt="" className="h-24 w-full object-cover" />
            <div className="p-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-sun/80">Reikiavik, Islandia</p>
              <p className="mt-1 font-display text-xl leading-tight text-star">Auroras del norte</p>
              <p className="mt-1 font-display text-sm italic text-star/55">“Nadie habló durante veinte minutos.”</p>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <section id="como-funciona" className="relative border-y border-white/[0.06] bg-[linear-gradient(180deg,#05070f,#0a0f1f_50%,#05070f)] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <SectionHead eyebrow="Tres pasos · dos minutos" title="Del carrete al planeta." />
        <ol className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Rise key={s.title} delay={i * 0.1}>
              <li className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-white/[0.02]">
                <div className="h-56 border-b border-white/[0.06] bg-black/20">{s.visual}</div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-sun/10 text-sun">{s.icon}</span>
                    <span className="font-mono text-xs text-star/30">0{i + 1} / 03</span>
                  </div>
                  <h3 className="mt-5 font-display text-4xl text-star">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-star/60">{s.text}</p>
                </div>
              </li>
            </Rise>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ───────────────────────────── Zoom real ───────────────────────────── */

function ZoomSection() {
  const facts = [
    ['190 km', 'altitud mínima de vuelo sobre la superficie'],
    ['49', 'imágenes de satélite cargadas en cada vista'],
    ['5.642 m', 'la cumbre más alta etiquetada: el Elbrus'],
  ]
  return (
    <section id="zoom" className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-14 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-2">
      <div>
        <SectionHead
          eyebrow="Zoom real"
          title={
            <>
              Acércate hasta <em className="text-sun">nombrar</em> las montañas.
            </>
          }
          lede="Donde otros globos se vuelven una mancha borrosa, Orbis carga fotografía de satélite y dibuja cordilleras, picos con su altitud y los grandes ríos. Arrastra el tirador y compruébalo."
        />
        <Rise delay={0.15}>
          <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-3">
            {facts.map(([value, label]) => (
              <div key={label} className="bg-ink p-5">
                <dd className="font-display text-4xl leading-none text-star tabular-nums">{value}</dd>
                <dt className="mt-2 text-[12px] leading-snug text-star/50">{label}</dt>
              </div>
            ))}
          </dl>
        </Rise>
      </div>
      <Rise delay={0.1}>
        <ZoomCompare />
      </Rise>
    </section>
  )
}

/* ───────────────────────────── Modo cine ───────────────────────────── */

function CinemaSection({ onBoard }: { onBoard: () => void }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setIndex((i) => (i + 1) % CINEMA.length), 5000)
    return () => clearInterval(id)
  }, [])
  const scene = CINEMA[index]

  return (
    <section id="cine" className="relative bg-black py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHead
            eyebrow="Modo cinematográfico"
            title={
              <>
                Tu vida, en <em className="text-sun">pantalla grande</em>.
              </>
            }
            lede="Un botón y Orbis vuela de un destino a otro en orden cronológico, con barras de cine y una banda sonora ambiental generada al momento."
          />
          <Rise>
            <button onClick={onBoard} className="flex items-center gap-2 rounded-full border border-star/20 px-5 py-3 text-sm text-star transition hover:border-sun hover:text-sun">
              <Play size={15} fill="currentColor" /> Probar el modo cine
            </button>
          </Rise>
        </div>

        <Rise delay={0.1}>
          <div className="relative mt-14 aspect-[21/9] min-h-[320px] overflow-hidden rounded-[1.75rem] bg-night">
            {CINEMA.map((c, i) => (
              <img
                key={c.title}
                src={c.photo}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms]"
                style={{ opacity: i === index ? 1 : 0, animation: i === index ? 'kenburns 6s ease-out forwards' : 'none' }}
              />
            ))}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.75),transparent_60%)]" />
            <div className="absolute inset-x-0 top-0 h-[11%] bg-black" />
            <div className="absolute inset-x-0 bottom-0 h-[11%] bg-black" />
            <div className="absolute bottom-[16%] left-[5%] max-w-lg">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-sun/85">
                {String(index + 1).padStart(2, '0')} — {scene.place}
              </p>
              <motion.h3 key={scene.title} initial={{ y: 16, opacity: 0.001 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: EASE }} className="mt-3 font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.92] text-white">
                {scene.title}
              </motion.h3>
            </div>
            <div className="absolute bottom-[4%] left-[5%] right-[5%] flex gap-1.5">
              {CINEMA.map((c, i) => (
                <span key={c.title} className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/20">
                  <span className={`block h-full bg-white ${i < index ? 'w-full' : i === index ? 'w-full origin-left' : 'w-0'}`} style={i === index ? { animation: 'none' } : undefined} />
                </span>
              ))}
            </div>
            <Clapperboard size={18} className="absolute right-[4%] top-[15%] text-white/50" />
          </div>
        </Rise>
      </div>
    </section>
  )
}

/* ───────────────────────────── Galería ───────────────────────────── */

function Gallery() {
  const items = TRIPS.slice(0, 10)
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
      <SectionHead
        eyebrow="Memory Vault"
        title={
          <>
            Cada lugar guarda <em className="text-sun">su propia</em> historia.
          </>
        }
        lede="Fotos, vídeos, fechas y una nota que solo tú entenderás. Todo ordenado por lugar, a un clic del globo."
      />
      <div className="mt-14 columns-2 gap-3 md:columns-3 lg:columns-4">
        {items.map((t, i) => (
          <Rise key={t.place} delay={(i % 4) * 0.05} className="mb-3 break-inside-avoid">
            <figure className="group relative m-0 overflow-hidden rounded-2xl bg-night">
              <img
                src={t.photo.replace('w=1200', 'w=700')}
                alt={`${t.place}, ${t.country}`}
                loading="lazy"
                className={`w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105 ${i % 3 === 0 ? 'aspect-[3/4]' : i % 3 === 1 ? 'aspect-square' : 'aspect-[4/5]'}`}
              />
              <figcaption className="absolute inset-0 flex flex-col justify-end bg-[linear-gradient(0deg,rgba(0,0,0,0.85),transparent_55%)] p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-sun/85">
                  {t.lat.toFixed(2)}° · {t.lng.toFixed(2)}°
                </p>
                <p className="mt-1 font-display text-2xl leading-none text-white">{t.place}</p>
                <p className="mt-1.5 max-h-0 overflow-hidden font-display text-[15px] italic leading-snug text-white/75 transition-all duration-500 group-hover:max-h-20">“{t.caption}”</p>
              </figcaption>
            </figure>
          </Rise>
        ))}
      </div>
      <p className="mt-6 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-star/30">Fotografías de ejemplo · Unsplash</p>
    </section>
  )
}

/* ───────────────────────────── Ventajas ───────────────────────────── */

function Pillars() {
  const pillars = [
    { icon: <Lock size={20} strokeWidth={1.6} />, title: 'Privado por diseño', text: 'Tu cuenta es solo tuya. Contraseña cifrada y sesiones que puedes cerrar desde cualquier dispositivo.' },
    { icon: <Smartphone size={20} strokeWidth={1.6} />, title: 'En todas tus pantallas', text: 'Ordenador, tablet o móvil. Sin instalar nada: abre el navegador y tu planeta está ahí.' },
    { icon: <Download size={20} strokeWidth={1.6} />, title: 'Tus datos, siempre tuyos', text: 'Exporta todo en un clic cuando quieras. Sin permanencia y sin letra pequeña.' },
    { icon: <ShieldCheck size={20} strokeWidth={1.6} />, title: 'Sin anuncios, nunca', text: 'Orbis vive de sus suscriptores, no de vender tu atención ni tus recuerdos.' },
  ]
  return (
    <section className="relative overflow-hidden">
      <img src={PHOTOS.traveler} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" loading="lazy" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#05070f,rgba(5,7,15,0.7)_40%,#05070f)]" />
      <div className="relative mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
        <SectionHead eyebrow="Por qué Orbis" title="Hecho para durar tanto como tus recuerdos." align="center" />
        <div className="mt-16 grid gap-px overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <Rise key={p.title} delay={i * 0.06} className="bg-ink/90 p-7 backdrop-blur">
              <span className="text-sun">{p.icon}</span>
              <h3 className="mt-6 font-display text-2xl leading-tight text-star">{p.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-star/55">{p.text}</p>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── Precios ───────────────────────────── */

function Pricing({ onBoard }: { onBoard: () => void }) {
  const [yearly, setYearly] = useState(true)
  const plans = [
    {
      cls: 'Turista',
      code: 'Y',
      price: '0 €',
      period: 'para siempre',
      pitch: 'Para probar cómo se siente tener tu propio planeta.',
      features: ['Globo 3D interactivo', 'Hasta 5 lugares', 'Fotos de tus viajes', 'Cuenta privada'],
      cta: 'Empezar gratis',
      featured: false,
    },
    {
      cls: 'Business',
      code: 'J',
      price: yearly ? '3,25 €' : '4,99 €',
      period: yearly ? '/mes · 39 € al año' : '/mes',
      pitch: 'Para quien viaja y quiere guardarlo todo sin límites.',
      features: ['Lugares ilimitados', 'Fotos y vídeos', 'Zoom de satélite con relieve y ríos', 'Modo cine con música ambiental', 'Exportar tus datos'],
      cta: 'Elegir Business',
      featured: true,
    },
    {
      cls: 'Primera',
      code: 'F',
      price: yearly ? '6,58 €' : '9,99 €',
      period: yearly ? '/mes · 79 € al año' : '/mes',
      pitch: 'Para familias y grupos que comparten los mismos viajes.',
      features: ['Todo lo de Business', 'Hasta 5 cuentas', 'Globos compartidos', 'Soporte prioritario'],
      cta: 'Elegir Primera',
      featured: false,
    },
  ]

  return (
    <section id="precios" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <SectionHead
          eyebrow="Precios"
          title={
            <>
              Elige tu <em className="text-sun">clase</em> de viaje.
            </>
          }
          lede="Empieza gratis. Cambia de clase o cancela cuando quieras."
        />
        <Rise>
          <div role="radiogroup" aria-label="Periodo de facturación" className="flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-sm">
            {[
              [false, 'Mensual'],
              [true, 'Anual · −35 %'],
            ].map(([value, label]) => (
              <button
                key={String(value)}
                role="radio"
                aria-checked={yearly === value}
                onClick={() => setYearly(value as boolean)}
                className={`rounded-full px-4 py-2 transition ${yearly === value ? 'bg-star text-ink' : 'text-star/60 hover:text-star'}`}
              >
                {label as string}
              </button>
            ))}
          </div>
        </Rise>
      </div>

      <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-3">
        {plans.map((p, i) => (
          <Rise key={p.cls} delay={i * 0.08} className="h-full">
            <article
              className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] ${
                p.featured ? 'bg-paper text-[#1c1a16] shadow-[0_40px_100px_-40px_rgba(246,199,122,0.45)]' : 'border border-white/[0.08] bg-white/[0.025] text-star'
              }`}
            >
              {p.featured && <span className="absolute right-5 top-5 rounded-full bg-[#1c1a16] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-sun">El más elegido</span>}
              <div className="p-7">
                <p className={`font-mono text-[10px] uppercase tracking-[0.24em] ${p.featured ? 'text-[#1c1a16]/55' : 'text-star/45'}`}>Clase · {p.code}</p>
                <h3 className="mt-2 font-display text-5xl leading-none">{p.cls}</h3>
                <p className={`mt-3 text-[14px] leading-relaxed ${p.featured ? 'text-[#1c1a16]/65' : 'text-star/55'}`}>{p.pitch}</p>
                <p className="mt-7 flex items-baseline gap-2">
                  <span className="font-display text-6xl leading-none tabular-nums">{p.price}</span>
                  <span className={`text-[13px] ${p.featured ? 'text-[#1c1a16]/55' : 'text-star/45'}`}>{p.period}</span>
                </p>
              </div>
              <div className={`mx-7 border-t border-dashed ${p.featured ? 'border-[#1c1a16]/20' : 'border-white/10'}`} />
              <ul className="flex-1 space-y-3 p-7 text-[14px]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check size={16} className={`mt-0.5 shrink-0 ${p.featured ? 'text-[#b4642c]' : 'text-sun'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="p-7 pt-0">
                <button
                  onClick={onBoard}
                  className={`flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-medium transition ${
                    p.featured ? 'bg-[#1c1a16] text-paper hover:bg-black' : 'bg-star/[0.08] text-star hover:bg-star/15'
                  }`}
                >
                  {p.cta} <ArrowRight size={15} />
                </button>
              </div>
            </article>
          </Rise>
        ))}
      </div>
      <p className="mt-6 text-center text-[13px] text-star/40">Precios con IVA incluido. Sin permanencia.</p>
    </section>
  )
}

/* ───────────────────────────── Preguntas ───────────────────────────── */

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="preguntas" className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="relative">
        <SectionHead eyebrow="Preguntas frecuentes" title="Antes de despegar." />
        <Rise delay={0.1} className="mt-10 hidden overflow-hidden rounded-[1.75rem] lg:block">
          <img src={PHOTOS.airport} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
        </Rise>
      </div>
      <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
        {FAQ.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q}>
              <h3 className="m-0">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left font-display text-2xl leading-tight text-star transition hover:text-sun md:text-3xl"
                >
                  {item.q}
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15">{isOpen ? <Minus size={16} /> : <Plus size={16} />}</span>
                </button>
              </h3>
              <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden">
                <p className="max-w-xl pb-6 text-[16px] leading-relaxed text-star/60">{item.a}</p>
              </motion.div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ───────────────────────────── Llamada final ───────────────────────────── */

function FinalCta({ onLaunch }: { onLaunch: () => void }) {
  return (
    <section className="grain relative overflow-hidden border-t border-white/[0.06] py-28 md:py-40">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(246,199,122,0.22),transparent_60%)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-5 text-center md:px-10">
        <p className="eyebrow">Última llamada · Puerta ∞</p>
        <h2 className="mt-5 max-w-4xl font-display text-[clamp(3rem,8vw,7rem)] leading-[0.9] tracking-tight text-star">
          Tu planeta te está <em className="text-sun">esperando</em>.
        </h2>
        <p className="mt-6 max-w-md text-lg text-star/60">Mantén pulsado el billete y aterriza directamente en tu globo.</p>
        <div className="mt-12 flex w-full justify-center">
          <BoardingPass onLaunch={onLaunch} size="lg" />
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-10">
        <div>
          <p className="font-display text-4xl leading-none text-star">
            Orb<em className="text-sun">is</em>
          </p>
          <p className="mt-3 max-w-xs font-display text-lg italic text-star/55">Coleccionar viajes es archivar la memoria del alma.</p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-star/50">
          <a href="#como-funciona" className="hover:text-star">Cómo funciona</a>
          <a href="#precios" className="hover:text-star">Precios</a>
          <a href="#preguntas" className="hover:text-star">Preguntas</a>
          <a href={APP_URL} className="hover:text-star">Entrar</a>
        </nav>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-star/30">© {new Date().getFullYear()} Orbis · Hecho en España</p>
      </div>
    </footer>
  )
}

/* ───────────────────────────── Página ───────────────────────────── */

export function Landing() {
  const [launching, setLaunching] = useState(false)

  const launch = useCallback(() => setLaunching(true), [])
  const board = useCallback(() => {
    // Botones normales: salto directo con la transición de despegue
    setLaunching(true)
  }, [])
  const arrive = useCallback(() => window.location.assign(APP_URL), [])

  useEffect(() => {
    // Si el usuario vuelve atrás desde la app, la página no debe quedarse en pleno despegue
    const onShow = (e: PageTransitionEvent) => e.persisted && setLaunching(false)
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [])

  useEffect(() => {
    if (launching && window.matchMedia('(prefers-reduced-motion: reduce)').matches) arrive()
  }, [launching, arrive])

  return (
    <>
      <Nav onBoard={board} />
      <main>
        <Hero launching={launching} onLaunch={launch} />
        <Departures />
        <HowItWorks />
        <ZoomSection />
        <CinemaSection onBoard={board} />
        <Gallery />
        <Pillars />
        <Pricing onBoard={board} />
        <Faq />
        <FinalCta onLaunch={launch} />
      </main>
      <Footer />
      <WarpOverlay active={launching} onDone={arrive} />
    </>
  )
}
