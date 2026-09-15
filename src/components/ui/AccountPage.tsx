import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Database,
  Download,
  KeyRound,
  Loader2,
  LogOut,
  MonitorSmartphone,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { formatDate } from '../../lib/geo'
import { DEFAULT_PREFS, useOrbis, type Preferences } from '../../store/useOrbis'
import { initialOf, tokenExpiry, useSession, type SessionUser } from '../../store/useSession'
import { FormMessage, PasswordField, TextField } from './fields'
import { EASE } from './motion'

type SectionId = 'perfil' | 'seguridad' | 'preferencias' | 'datos' | 'peligro'

const SECTIONS: { id: SectionId; label: string; icon: ReactNode; danger?: boolean }[] = [
  { id: 'perfil', label: 'Perfil', icon: <UserRound size={16} strokeWidth={1.7} /> },
  { id: 'seguridad', label: 'Seguridad', icon: <KeyRound size={16} strokeWidth={1.7} /> },
  { id: 'preferencias', label: 'Preferencias', icon: <SlidersHorizontal size={16} strokeWidth={1.7} /> },
  { id: 'datos', label: 'Datos y privacidad', icon: <Database size={16} strokeWidth={1.7} /> },
  { id: 'peligro', label: 'Cerrar cuenta', icon: <AlertTriangle size={16} strokeWidth={1.7} />, danger: true },
]

interface AccountInfo {
  usuario: SessionUser
  estadisticas: { elementos: number; lugares: number; primer_viaje: string | null; ultimo_viaje: string | null }
  sesion: { expira: string }
}

type Toast = { kind: 'ok' | 'error'; text: string } | null

function downloadJson(filename: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function AccountPage() {
  const open = useOrbis((s) => s.accountOpen)
  const token = useSession((s) => s.token)
  return <AnimatePresence>{open && token && <AccountShell key="account" />}</AnimatePresence>
}

function AccountShell() {
  const close = () => useOrbis.getState().setAccountOpen(false)
  const user = useSession((s) => s.user)
  const request = useSession((s) => s.request)
  const [section, setSection] = useState<SectionId>('perfil')
  const [info, setInfo] = useState<AccountInfo | null>(null)
  const [infoError, setInfoError] = useState('')
  const [toast, setToast] = useState<Toast>(null)
  const toastTimer = useRef<number>(0)

  const notify = useCallback((kind: 'ok' | 'error', text: string) => {
    setToast({ kind, text })
    clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3800)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const data = await request<AccountInfo>('/api/cuenta', { auth: true })
      setInfo(data)
      setInfoError('')
      useSession.getState().setSession(useSession.getState().token!, data.usuario)
    } catch (err) {
      setInfoError((err as Error).message)
    }
  }, [request])

  useEffect(() => {
    refresh()
    return () => clearTimeout(toastTimer.current)
  }, [refresh])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const memberSince = info?.usuario.creado_en ?? user?.creado_en

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="fixed inset-0 z-[70] overflow-y-auto bg-[#03050c]/85 backdrop-blur-2xl"
      onKeyDown={(e) => e.key !== 'Escape' && e.stopPropagation()}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="mx-auto w-full max-w-6xl px-5 pb-16 pt-6 md:px-10 md:pt-10"
      >
        {/* Cabecera */}
        <header className="flex items-start justify-between gap-6 border-b border-white/[0.07] pb-8">
          <div className="flex items-center gap-5">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-100/25 to-sky-300/10 font-display text-3xl text-amber-100 ring-1 ring-amber-100/25 md:h-20 md:w-20 md:text-4xl">
              {initialOf(user?.nombre)}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/80">Orbis · Ajustes</p>
              <h1 id="account-title" className="mt-1.5 font-display text-4xl leading-none text-white md:text-5xl">
                Tu cuenta
              </h1>
              <p className="mt-2 truncate text-sm text-white/55">
                {user?.nombre} · {user?.email}
                {memberSince && <span className="text-white/35"> · Miembro desde {formatDate(memberSince)}</span>}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Volver al globo"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white/[0.06] px-3 text-sm text-white/75 transition hover:bg-white/[0.12] hover:text-white md:px-4"
          >
            <X size={17} /> <span className="hidden md:inline">Volver al globo</span>
          </button>
        </header>

        <Summary info={info} />

        {infoError && (
          <p className="mt-6 flex items-start gap-2 rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] px-4 py-3 text-[13px] text-amber-100/90">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {infoError}
          </p>
        )}

        <div className="mt-8 grid gap-8 md:grid-cols-[220px_minmax(0,1fr)] md:gap-12">
          {/* Navegación */}
          <nav aria-label="Secciones de la cuenta" className="md:sticky md:top-8 md:self-start">
            <ul className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-col md:px-0">
              {SECTIONS.map((s) => {
                const active = section === s.id
                return (
                  <li key={s.id} className={s.danger ? 'md:mt-3 md:border-t md:border-white/[0.07] md:pt-3' : ''}>
                    <button
                      onClick={() => setSection(s.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        active
                          ? s.danger
                            ? 'bg-red-400/10 text-red-200'
                            : 'bg-white/[0.08] text-white'
                          : s.danger
                            ? 'text-red-300/70 hover:bg-red-400/[0.06] hover:text-red-200'
                            : 'text-white/55 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      {s.icon}
                      <span className="flex-1">{s.label}</span>
                      {active && <ChevronRight size={14} className="hidden opacity-50 md:block" />}
                    </button>
                  </li>
                )
              })}
              <li className="md:mt-1">
                <button
                  onClick={() => {
                    useOrbis.getState().setAccountOpen(false)
                    useSession.getState().logout()
                  }}
                  className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm text-white/55 transition hover:bg-white/[0.04] hover:text-white"
                >
                  <LogOut size={16} strokeWidth={1.7} /> Cerrar sesión
                </button>
              </li>
            </ul>
          </nav>

          {/* Contenido */}
          <main className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: EASE }}
                className="grid gap-6"
              >
                {section === 'perfil' && <ProfileSection notify={notify} />}
                {section === 'seguridad' && <SecuritySection notify={notify} info={info} />}
                {section === 'preferencias' && <PreferencesSection />}
                {section === 'datos' && <DataSection notify={notify} />}
                {section === 'peligro' && <DangerSection notify={notify} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`glass fixed bottom-6 left-1/2 z-[75] flex items-center gap-2 rounded-full px-4 py-2.5 text-sm ${toast.kind === 'ok' ? 'text-emerald-200' : 'text-red-200'}`}
            style={{ x: '-50%' }}
          >
            {toast.kind === 'ok' ? <Check size={15} /> : <AlertTriangle size={15} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─────────────────────────── Resumen ─────────────────────────── */

function Summary({ info }: { info: AccountInfo | null }) {
  const memories = useOrbis((s) => s.memories)
  const local = useMemo(() => {
    const media = memories.flatMap((m) => m.media)
    return { places: memories.length, photos: media.filter((m) => m.type === 'image').length, videos: media.filter((m) => m.type === 'video').length }
  }, [memories])

  const items = [
    { label: 'Recuerdos en este navegador', value: local.places },
    { label: 'Fotos', value: local.photos },
    { label: 'Vídeos', value: local.videos },
    { label: 'Elementos en tu cuenta', value: info ? info.estadisticas.elementos : '—' },
  ]
  return (
    <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] md:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="bg-[#070a14] px-5 py-4">
          <dd className="font-display text-3xl leading-none text-white tabular-nums">{it.value}</dd>
          <dt className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">{it.label}</dt>
        </div>
      ))}
    </dl>
  )
}

/* ─────────────────────────── Piezas comunes ─────────────────────────── */

function Panel({ title, description, children, tone = 'default' }: { title: string; description?: string; children: ReactNode; tone?: 'default' | 'danger' }) {
  return (
    <section className={`rounded-3xl border p-6 md:p-7 ${tone === 'danger' ? 'border-red-400/20 bg-red-500/[0.04]' : 'border-white/[0.07] bg-white/[0.025]'}`}>
      <h2 className={`font-display text-2xl leading-tight ${tone === 'danger' ? 'text-red-100' : 'text-white'}`}>{title}</h2>
      {description && <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-white/50">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function ActionButton({
  children,
  busy,
  variant = 'primary',
  type = 'submit',
  onClick,
  disabled,
}: {
  children: ReactNode
  busy?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  type?: 'submit' | 'button'
  onClick?: () => void
  disabled?: boolean
}) {
  const styles = {
    primary: 'bg-gradient-to-b from-amber-100 to-amber-300 text-black hover:brightness-105',
    secondary: 'bg-white/[0.07] text-white hover:bg-white/[0.12]',
    danger: 'bg-red-500/85 text-white hover:bg-red-500',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={busy || disabled}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {busy && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  )
}

/* ─────────────────────────── Perfil ─────────────────────────── */

function ProfileSection({ notify }: { notify: (k: 'ok' | 'error', t: string) => void }) {
  const user = useSession((s) => s.user)
  const request = useSession((s) => s.request)
  const [nombre, setNombre] = useState(user?.nombre ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const emailChanged = email.trim().toLowerCase() !== (user?.email ?? '')
  const dirty = nombre.trim() !== (user?.nombre ?? '') || emailChanged

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return setError('Escribe tu nombre.')
    if (emailChanged && !password) return setError('Confirma tu contraseña para cambiar el email.')
    setBusy(true)
    setError('')
    try {
      const { usuario, token } = await request<{ usuario: SessionUser; token: string }>('/api/cuenta', {
        method: 'PATCH',
        auth: true,
        body: { nombre: nombre.trim(), email: email.trim(), ...(emailChanged ? { password } : {}) },
      })
      useSession.getState().setSession(token, usuario)
      setPassword('')
      notify('ok', 'Perfil actualizado')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel title="Información personal" description="Tu nombre aparece en la cabecera de tu archivo. El email es con el que inicias sesión.">
      <form method="post" action="#" onSubmit={submit} noValidate className="grid max-w-lg gap-4">
        <TextField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" maxLength={120} />
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={200} />
        <AnimatePresence initial={false}>
          {emailChanged && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <PasswordField label="Contraseña actual" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" hint="Por seguridad, cambiar el email requiere tu contraseña." />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-4">
          <ActionButton busy={busy} disabled={!dirty}>
            Guardar cambios
          </ActionButton>
          {!dirty && <span className="text-[12px] text-white/35">Sin cambios</span>}
        </div>
        <FormMessage kind="error">{error}</FormMessage>
      </form>
    </Panel>
  )
}

/* ─────────────────────────── Seguridad ─────────────────────────── */

function passwordStrength(pw: string) {
  if (!pw) return { score: 0, label: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte', 'Muy fuerte']
  return { score, label: labels[score] }
}

function SecuritySection({ notify, info }: { notify: (k: 'ok' | 'error', t: string) => void; info: AccountInfo | null }) {
  const request = useSession((s) => s.request)
  const token = useSession((s) => s.token)
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sessionsBusy, setSessionsBusy] = useState(false)
  const strength = passwordStrength(nueva)

  const expires = info?.sesion.expira ?? (token ? new Date(tokenExpiry(token) ?? 0).toISOString() : null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!actual) return setError('Escribe tu contraseña actual.')
    if (nueva.length < 8 || nueva.length > 72) return setError('La nueva contraseña debe tener entre 8 y 72 caracteres.')
    if (nueva !== repetir) return setError('Las contraseñas nuevas no coinciden.')
    setBusy(true)
    setError('')
    try {
      const { token: fresh } = await request<{ token: string }>('/api/cuenta/password', { method: 'POST', auth: true, body: { actual, nueva } })
      useSession.getState().setSession(fresh)
      setActual('')
      setNueva('')
      setRepetir('')
      notify('ok', 'Contraseña cambiada. Se cerró la sesión en tus otros dispositivos.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const closeOtherSessions = async () => {
    setSessionsBusy(true)
    try {
      const { token: fresh } = await request<{ token: string }>('/api/cuenta/sesiones', { method: 'POST', auth: true })
      useSession.getState().setSession(fresh)
      notify('ok', 'Sesión cerrada en todos los demás dispositivos')
    } catch (err) {
      notify('error', (err as Error).message)
    } finally {
      setSessionsBusy(false)
    }
  }

  const barColor = ['bg-red-400', 'bg-red-400', 'bg-amber-300', 'bg-lime-300', 'bg-emerald-400', 'bg-emerald-400'][strength.score]

  return (
    <>
      <Panel title="Cambiar contraseña" description="Al cambiarla, se cerrará la sesión en el resto de dispositivos donde hayas entrado.">
        <form method="post" action="#" onSubmit={submit} noValidate className="grid max-w-lg gap-4">
          {/* Campo oculto para que los gestores de contraseñas asocien la cuenta */}
          <input type="email" autoComplete="username" value={useSession.getState().user?.email ?? ''} readOnly hidden />
          <PasswordField label="Contraseña actual" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" />
          <div>
            <PasswordField label="Nueva contraseña" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" maxLength={72} />
            {nueva && (
              <div className="mt-2 flex items-center gap-3">
                <div className="flex flex-1 gap-1" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? barColor : 'bg-white/10'}`} />
                  ))}
                </div>
                <span className="w-20 text-right text-[11px] text-white/50">{strength.label}</span>
              </div>
            )}
          </div>
          <PasswordField label="Repite la nueva contraseña" value={repetir} onChange={(e) => setRepetir(e.target.value)} autoComplete="new-password" maxLength={72} />
          <div>
            <ActionButton busy={busy} disabled={!actual || !nueva || !repetir}>
              Actualizar contraseña
            </ActionButton>
          </div>
          <FormMessage kind="error">{error}</FormMessage>
        </form>
      </Panel>

      <Panel title="Sesiones" description="Si has iniciado sesión en un dispositivo que ya no usas, cierra todas las sesiones excepto esta.">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
              <MonitorSmartphone size={17} />
            </span>
            <div>
              <p className="text-sm text-white">Este dispositivo</p>
              <p className="text-[12px] text-white/45">{expires ? `Sesión activa hasta el ${formatDate(expires)}` : 'Sesión activa'}</p>
            </div>
          </div>
          <ActionButton type="button" variant="secondary" busy={sessionsBusy} onClick={closeOtherSessions}>
            Cerrar las demás sesiones
          </ActionButton>
        </div>
      </Panel>
    </>
  )
}

/* ─────────────────────────── Preferencias ─────────────────────────── */

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6 py-4">
      <span>
        <span className="block text-sm text-white">{label}</span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-white/45">{description}</span>
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="block h-6 w-11 rounded-full bg-white/15 transition peer-checked:bg-amber-300 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-200" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

function PreferencesSection() {
  const prefs = useOrbis((s) => s.prefs)
  const setPref = useOrbis((s) => s.setPref)
  const set = <K extends keyof Preferences>(k: K) => (v: Preferences[K]) => {
    setPref(k, v)
    if (k === 'nightDefault') useOrbis.setState({ night: v as boolean })
  }
  const isDefault = (Object.keys(DEFAULT_PREFS) as (keyof Preferences)[]).every((k) => prefs[k] === DEFAULT_PREFS[k])

  return (
    <>
      <Panel title="Globo" description="Los cambios se aplican al instante y se guardan en este navegador.">
        <div className="divide-y divide-white/[0.06]">
          <Toggle label="Imágenes de satélite al acercarse" description="Carga fotografía aérea de alta resolución para distinguir montañas, valles y ríos. Consume más datos." checked={prefs.detailImagery} onChange={set('detailImagery')} />
          <Toggle label="Relieve e hidrografía" description="Muestra cordilleras, picos con su altitud y los ríos principales al hacer zoom." checked={prefs.reliefLabels} onChange={set('reliefLabels')} />
          <Toggle label="Rotación automática" description="El globo gira lentamente cuando no lo estás usando." checked={prefs.autoRotate} onChange={set('autoRotate')} />
          <Toggle label="Luces nocturnas al abrir" description="Empieza cada visita con la cara nocturna y las luces de las ciudades." checked={prefs.nightDefault} onChange={set('nightDefault')} />
        </div>
      </Panel>

      <Panel title="Modo cinematográfico">
        <div className="divide-y divide-white/[0.06]">
          <Toggle label="Música ambiental" description="Activa la banda sonora generativa al iniciar el recorrido." checked={prefs.musicInTour} onChange={set('musicInTour')} />
          <div className="py-4">
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="tour-seconds" className="text-sm text-white">
                Tiempo en cada destino
              </label>
              <span className="text-sm text-amber-200 tabular-nums">{prefs.tourSeconds.toFixed(1)} s</span>
            </div>
            <input
              id="tour-seconds"
              type="range"
              min={4}
              max={15}
              step={0.5}
              value={prefs.tourSeconds}
              onChange={(e) => setPref('tourSeconds', Number(e.target.value))}
              className="mt-3 w-full accent-amber-300"
            />
            <div className="mt-1 flex justify-between text-[11px] text-white/35 tabular-nums">
              <span>4 s</span>
              <span>15 s</span>
            </div>
          </div>
        </div>
      </Panel>

      <div>
        <ActionButton
          type="button"
          variant="secondary"
          disabled={isDefault}
          onClick={() => (Object.keys(DEFAULT_PREFS) as (keyof Preferences)[]).forEach((k) => set(k)(DEFAULT_PREFS[k]))}
        >
          Restablecer valores predeterminados
        </ActionButton>
      </div>
    </>
  )
}

/* ─────────────────────────── Datos y privacidad ─────────────────────────── */

function DataSection({ notify }: { notify: (k: 'ok' | 'error', t: string) => void }) {
  const request = useSession((s) => s.request)
  const memories = useOrbis((s) => s.memories)
  const clearLocalMemories = useOrbis((s) => s.clearLocalMemories)
  const [exporting, setExporting] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const stamp = new Date().toISOString().slice(0, 10)

  const exportAccount = async () => {
    setExporting(true)
    try {
      downloadJson(`orbis-cuenta-${stamp}.json`, await request('/api/cuenta/exportar', { auth: true }))
      notify('ok', 'Descarga iniciada')
    } catch (err) {
      notify('error', (err as Error).message)
    } finally {
      setExporting(false)
    }
  }

  const exportLocal = () => {
    // Las fotos y vídeos locales son blobs del navegador: se exportan sus metadatos
    const data = memories.map((m) => ({ ...m, media: m.media.map(({ src, ...rest }) => ({ ...rest, src: rest.stored ? null : src })) }))
    downloadJson(`orbis-recuerdos-${stamp}.json`, { exportado_en: new Date().toISOString(), formato: 'orbis-local/1', recuerdos: data })
    notify('ok', 'Descarga iniciada')
  }

  return (
    <>
      <Panel title="Descargar tus datos" description="Obtén una copia de tu información en formato JSON, legible y fácil de importar en otras herramientas.">
        <div className="grid gap-3">
          <Row
            title="Datos de la cuenta"
            description="Perfil y todos los elementos guardados en el servidor."
            action={
              <ActionButton type="button" variant="secondary" busy={exporting} onClick={exportAccount}>
                <Download size={15} /> Exportar
              </ActionButton>
            }
          />
          <Row
            title="Recuerdos de este navegador"
            description={`${memories.length} ${memories.length === 1 ? 'recuerdo' : 'recuerdos'} con fechas, lugares y notas (sin los archivos multimedia).`}
            action={
              <ActionButton type="button" variant="secondary" onClick={exportLocal} disabled={!memories.length}>
                <Download size={15} /> Exportar
              </ActionButton>
            }
          />
        </div>
      </Panel>

      <Panel title="Almacenamiento local" description="Los recuerdos, fotos y vídeos del globo se guardan en este navegador. Borrarlos no afecta a tu cuenta.">
        {confirmClear ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/[0.06] px-4 py-3">
            <p className="flex-1 text-sm text-red-100">Se borrarán {memories.length} recuerdos y sus archivos de este navegador. No se puede deshacer.</p>
            <ActionButton type="button" variant="secondary" onClick={() => setConfirmClear(false)}>
              Cancelar
            </ActionButton>
            <ActionButton
              type="button"
              variant="danger"
              onClick={async () => {
                await clearLocalMemories()
                setConfirmClear(false)
                notify('ok', 'Recuerdos locales borrados')
              }}
            >
              <Trash2 size={15} /> Borrar
            </ActionButton>
          </div>
        ) : (
          <ActionButton type="button" variant="secondary" onClick={() => setConfirmClear(true)} disabled={!memories.length}>
            <Trash2 size={15} /> Borrar recuerdos de este navegador
          </ActionButton>
        )}
      </Panel>

      <Panel title="Privacidad">
        <ul className="grid gap-2.5 text-[13px] leading-relaxed text-white/60">
          {[
            'Tu contraseña se guarda cifrada con bcrypt: nadie, ni siquiera el administrador, puede leerla.',
            'Tus elementos solo son accesibles con tu sesión; ninguna otra cuenta puede consultarlos, tampoco los recuerdos guardados en este navegador.',
            'La sesión caduca a los 7 días y puedes revocarla en cualquier momento desde Seguridad.',
            'Las imágenes de satélite se solicitan a Esri solo cuando acercas el globo.',
          ].map((t) => (
            <li key={t} className="flex gap-2.5">
              <Check size={15} className="mt-0.5 shrink-0 text-emerald-300/80" /> {t}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  )
}

function Row({ title, description, action }: { title: string; description: string; action: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm text-white">{title}</p>
        <p className="mt-0.5 text-[12px] text-white/45">{description}</p>
      </div>
      {action}
    </div>
  )
}

/* ─────────────────────────── Cerrar cuenta ─────────────────────────── */

function DangerSection({ notify }: { notify: (k: 'ok' | 'error', t: string) => void }) {
  const request = useSession((s) => s.request)
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ready = password.length > 0 && confirmacion === 'ELIMINAR'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setBusy(true)
    setError('')
    try {
      await request('/api/cuenta', { method: 'DELETE', auth: true, body: { password, confirmacion } })
      // La cuenta ya no existe: sus fotos y recuerdos tampoco deben quedarse en este navegador
      await useOrbis.getState().clearLocalMemories().catch(() => {})
      useOrbis.getState().setAccountOpen(false)
      useSession.getState().logout('Tu cuenta se ha eliminado. Gracias por viajar con Orbis.')
    } catch (err) {
      setError((err as Error).message)
      notify('error', 'No se pudo eliminar la cuenta')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel
      tone="danger"
      title="Eliminar cuenta"
      description="Se borrarán de forma permanente tu perfil y todos los elementos guardados en tu cuenta. Los recuerdos de este navegador no se tocan. Esta acción no se puede deshacer."
    >
      <form method="post" action="#" onSubmit={submit} noValidate className="grid max-w-lg gap-4">
        <input type="email" autoComplete="username" value={useSession.getState().user?.email ?? ''} readOnly hidden />
        <PasswordField label="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        <TextField
          label="Escribe ELIMINAR para confirmar"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="font-mono uppercase tracking-widest"
        />
        <div>
          <ActionButton variant="danger" busy={busy} disabled={!ready}>
            <Trash2 size={15} /> Eliminar mi cuenta definitivamente
          </ActionButton>
        </div>
        <FormMessage kind="error">{error}</FormMessage>
      </form>
    </Panel>
  )
}
