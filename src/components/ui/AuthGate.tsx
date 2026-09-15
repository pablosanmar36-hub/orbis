import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSession } from '../../store/useSession'
import { FormMessage, PasswordField, TextField } from './fields'
import { EASE } from './motion'

type View = 'choose' | 'login' | 'register'

/** Pantalla de entrada: se muestra mientras no haya un token válido guardado. */
export function AuthGate() {
  const token = useSession((s) => s.token)
  const notice = useSession((s) => s.notice)
  const [view, setView] = useState<View>(notice ? 'login' : 'choose')

  useEffect(() => {
    if (!token) setView(useSession.getState().notice ? 'login' : 'choose')
  }, [token])

  return (
    <AnimatePresence>
      {!token && (
        <motion.section
          key="gate"
          aria-labelledby="gate-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="fixed inset-0 z-[80] grid items-center gap-10 overflow-y-auto bg-[linear-gradient(90deg,rgba(1,2,8,0.88),rgba(1,2,8,0.35)_55%,rgba(1,2,8,0.75))] p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,440px)] md:p-16"
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-amber-200/85 tabular-nums">40.4168° N · 3.7038° O</p>
            <h1 className="mt-4 font-display text-[clamp(4rem,12vw,9.5rem)] leading-[0.85] tracking-tight text-white">
              Orb<em className="text-amber-200">is</em>
            </h1>
            <p className="mt-6 max-w-md font-display text-2xl italic leading-snug text-white/70 [text-wrap:balance]">
              Coleccionar viajes es archivar la memoria del alma.
            </p>
          </div>

          <div className="glass rounded-[1.75rem] p-7 md:p-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                {view === 'choose' && <Choose onPick={setView} />}
                {view === 'login' && <LoginForm onSwitch={setView} notice={notice} />}
                {view === 'register' && <RegisterForm onSwitch={setView} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

function Choose({ onPick }: { onPick: (v: View) => void }) {
  const options = [
    { view: 'login' as const, title: 'Iniciar Sesión', sub: 'Ya tengo una cuenta', primary: true },
    { view: 'register' as const, title: 'Crear Cuenta', sub: 'Es la primera vez que vengo', primary: false },
  ]
  return (
    <>
      <h2 id="gate-title" className="font-display text-4xl leading-none text-white">
        Bienvenido
      </h2>
      <p className="mt-2 text-sm text-white/55">Entra en tu archivo o empieza uno nuevo.</p>
      <div className="mt-7 grid gap-3">
        {options.map((o) => (
          <button
            key={o.view}
            type="button"
            onClick={() => onPick(o.view)}
            className={`group flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition hover:translate-x-1 ${
              o.primary ? 'border-amber-200/30 bg-amber-200/10 hover:bg-amber-200/15' : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
            }`}
          >
            <span>
              <span className="block font-medium text-white">{o.title}</span>
              <span className="mt-0.5 block text-[13px] text-white/50">{o.sub}</span>
            </span>
            <ArrowRight size={18} className="text-amber-200 transition group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </>
  )
}

function Header({ title, sub, onBack }: { title: string; sub: string; onBack: () => void }) {
  return (
    <>
      <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1.5 text-[13px] text-white/55 transition hover:text-white">
        <ArrowLeft size={14} /> Volver
      </button>
      <h2 id="gate-title" className="font-display text-4xl leading-none text-white">
        {title}
      </h2>
      <p className="mt-2 text-sm text-white/55">{sub}</p>
    </>
  )
}

function SubmitButton({ busy, label, busyLabel }: { busy: boolean; label: string; busyLabel: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-1 flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-amber-100 to-amber-300 text-sm font-medium text-black shadow-[0_0_40px_-10px_rgba(252,211,77,0.7)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
    >
      {busy && <Loader2 size={16} className="animate-spin" />}
      {busy ? busyLabel : label}
    </button>
  )
}

function LoginForm({ onSwitch, notice }: { onSwitch: (v: View) => void; notice: string | null }) {
  const login = useSession((s) => s.login)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(notice ?? '')
  const email = useRef<HTMLInputElement>(null)
  const password = useRef<HTMLInputElement>(null)

  useEffect(() => email.current?.focus(), [])

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const em = email.current!.value.trim()
    const pw = password.current!.value
    if (!em || !email.current!.checkValidity()) return setError('Escribe un email válido.'), email.current!.focus()
    if (!pw) return setError('Escribe tu contraseña.'), password.current!.focus()
    setBusy(true)
    setError('')
    try {
      await login(em, pw)
    } catch (err) {
      setError((err as Error).message)
      password.current!.value = ''
      password.current!.focus()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Header title="Iniciar Sesión" sub="Con el email y la contraseña de tu cuenta." onBack={() => onSwitch('choose')} />
      {/* method="post": si el JavaScript fallase, la contraseña nunca acabaría en la URL */}
      <form method="post" action="#" onSubmit={submit} noValidate className="mt-6 grid gap-4">
        <TextField ref={email} label="Email" name="email" type="email" autoComplete="email" required placeholder="pablo@ejemplo.com" />
        <PasswordField ref={password} label="Contraseña" name="password" autoComplete="current-password" required />
        <SubmitButton busy={busy} label="Iniciar Sesión" busyLabel="Entrando…" />
        <FormMessage kind="error">{error}</FormMessage>
      </form>
      <p className="mt-2 text-[13px] text-white/55">
        ¿No tienes cuenta?{' '}
        <button type="button" onClick={() => onSwitch('register')} className="text-amber-200 underline underline-offset-4">
          Crear Cuenta
        </button>
      </p>
    </>
  )
}

function RegisterForm({ onSwitch }: { onSwitch: (v: View) => void }) {
  const register = useSession((s) => s.register)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const nombre = useRef<HTMLInputElement>(null)
  const email = useRef<HTMLInputElement>(null)
  const password = useRef<HTMLInputElement>(null)

  useEffect(() => nombre.current?.focus(), [])

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const n = nombre.current!.value.trim()
    const em = email.current!.value.trim()
    const pw = password.current!.value
    if (!n) return setError('Escribe tu nombre.'), nombre.current!.focus()
    if (!em || !email.current!.checkValidity()) return setError('Escribe un email válido.'), email.current!.focus()
    if (pw.length < 8 || pw.length > 72) return setError('La contraseña debe tener entre 8 y 72 caracteres.'), password.current!.focus()
    setBusy(true)
    setError('')
    try {
      await register(n, em, pw)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Header title="Crear Cuenta" sub="Tu archivo quedará vinculado solo a esta cuenta." onBack={() => onSwitch('choose')} />
      <form method="post" action="#" onSubmit={submit} noValidate className="mt-6 grid gap-4">
        <TextField ref={nombre} label="Nombre" name="nombre" autoComplete="name" required maxLength={120} placeholder="Pablo Sánchez" />
        <TextField ref={email} label="Email" name="email" type="email" autoComplete="email" required maxLength={200} placeholder="pablo@ejemplo.com" />
        <PasswordField ref={password} label="Contraseña" name="password" autoComplete="new-password" required minLength={8} maxLength={72} hint="Entre 8 y 72 caracteres." />
        <SubmitButton busy={busy} label="Crear Cuenta" busyLabel="Creando cuenta…" />
        <FormMessage kind="error">{error}</FormMessage>
      </form>
      <p className="mt-2 text-[13px] text-white/55">
        ¿Ya tienes cuenta?{' '}
        <button type="button" onClick={() => onSwitch('login')} className="text-amber-200 underline underline-offset-4">
          Iniciar Sesión
        </button>
      </p>
    </>
  )
}
