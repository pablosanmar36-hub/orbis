import { AlertTriangle, Bell, BellRing, Check, Download, Laptop, Loader2, Send, Share, Smartphone, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatDate } from '../../lib/geo'
import { currentSubscription, isIOS, isStandalone, promptInstall, pushSupported, subscribe, thisDeviceName, usePwa } from '../../lib/pwa'
import { useSession } from '../../store/useSession'
import { ActionButton, Panel, Toggle } from './AccountPage'

interface Device {
  id: number
  endpoint: string
  nombre: string
  seguridad: boolean
  recuerdos: boolean
  novedades: boolean
  creado_en: string
  ultimo_envio: string | null
}

type Kind = 'seguridad' | 'recuerdos' | 'novedades'

const KINDS: { key: Kind; label: string; description: string }[] = [
  { key: 'seguridad', label: 'Seguridad de la cuenta', description: 'Inicios de sesión, cambios de contraseña o de email. Recomendado.' },
  { key: 'recuerdos', label: 'Tal día como hoy', description: 'Por la mañana, cuando se cumple el aniversario de un viaje guardado en tu cuenta.' },
  { key: 'novedades', label: 'Novedades importantes de Orbis', description: 'Solo anuncios relevantes: nuevas funciones o cambios en tu plan.' },
]

/** Sección "App y notificaciones" de Tu cuenta: instalar Orbis y elegir en qué dispositivos llegan los avisos. */
export function NotificationsSection({ notify }: { notify: (k: 'ok' | 'error', t: string) => void }) {
  const request = useSession((s) => s.request)
  const installEvent = usePwa((s) => s.installEvent)
  const installed = usePwa((s) => s.installed)
  const [devices, setDevices] = useState<Device[] | null>(null)
  const [publicKey, setPublicKey] = useState('')
  const [serverError, setServerError] = useState('')
  const [mine, setMine] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const supported = pushSupported()
  const standalone = isStandalone()
  const permission = supported ? Notification.permission : 'denied'

  useEffect(() => {
    let alive = true
    currentSubscription().then((s) => alive && setMine(s?.endpoint ?? null))
    request<{ clave: string; dispositivos: Device[] }>('/api/notificaciones', { auth: true })
      .then((d) => {
        if (!alive) return
        setPublicKey(d.clave)
        setDevices(d.dispositivos)
      })
      .catch((err) => {
        if (!alive) return
        setServerError((err as Error).message)
        setDevices([])
      })
    return () => {
      alive = false
    }
  }, [request])

  const thisDevice = devices?.find((d) => d.endpoint === mine)

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    try {
      await fn()
    } catch (err) {
      notify('error', (err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const enable = () =>
    run('enable', async () => {
      const sub = await subscribe(publicKey)
      const { dispositivos } = await request<{ dispositivos: Device[] }>('/api/notificaciones', {
        method: 'POST',
        auth: true,
        body: { suscripcion: sub.toJSON(), nombre: thisDeviceName() },
      })
      setMine(sub.endpoint)
      setDevices(dispositivos)
      await request('/api/notificaciones', { method: 'POST', auth: true, body: { accion: 'probar', endpoint: sub.endpoint } }).catch(() => {})
      notify('ok', 'Notificaciones activadas en este dispositivo')
    })

  const test = (endpoint: string) =>
    run(`test-${endpoint}`, async () => {
      await request('/api/notificaciones', { method: 'POST', auth: true, body: { accion: 'probar', endpoint } })
      notify('ok', 'Notificación de prueba enviada')
    })

  const update = (endpoint: string, patch: Partial<Record<Kind, boolean>>) =>
    run(`upd-${endpoint}`, async () => {
      setDevices((ds) => ds?.map((d) => (d.endpoint === endpoint ? { ...d, ...patch } : d)) ?? null)
      const { dispositivos } = await request<{ dispositivos: Device[] }>('/api/notificaciones', { method: 'PATCH', auth: true, body: { endpoint, ...patch } })
      setDevices(dispositivos)
    })

  const remove = (endpoint: string) =>
    run(`del-${endpoint}`, async () => {
      const { dispositivos } = await request<{ dispositivos: Device[] }>('/api/notificaciones', { method: 'DELETE', auth: true, body: { endpoint } })
      if (endpoint === mine) {
        await (await currentSubscription())?.unsubscribe()
        setMine(null)
      }
      setDevices(dispositivos)
      notify('ok', 'Ese dispositivo ya no recibirá notificaciones')
    })

  const install = () =>
    run('install', async () => {
      if (await promptInstall()) notify('ok', 'Orbis se ha instalado como aplicación')
    })

  const strong = 'font-medium text-white'

  return (
    <>
      <Panel title="Orbis como aplicación" description="Instálala y tendrás Orbis con su propio icono, en pantalla completa y sin la barra del navegador, como una app de la tienda.">
        {standalone || installed ? (
          <p className="flex items-center gap-2.5 rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-100">
            <Check size={16} /> {standalone ? 'Estás usando Orbis como aplicación.' : 'Orbis ya está instalada en este dispositivo.'}
          </p>
        ) : installEvent ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <img src="/icons/icon-192.png" alt="" className="h-11 w-11 rounded-xl" />
              <div>
                <p className="text-sm text-white">Orbis</p>
                <p className="text-[12px] text-white/45">Se abre desde el escritorio, la barra de tareas o la pantalla de inicio.</p>
              </div>
            </div>
            <ActionButton type="button" busy={busy === 'install'} onClick={install}>
              <Download size={15} /> Instalar Orbis
            </ActionButton>
          </div>
        ) : isIOS ? (
          <ol className="grid gap-2.5 text-[13px] leading-relaxed text-white/65">
            <li className="flex gap-3">
              <Step n={1} /> <span>Abre esta página en <strong className={strong}>Safari</strong>.</span>
            </li>
            <li className="flex gap-3">
              <Step n={2} />
              <span>
                Pulsa <Share size={14} className="mx-0.5 inline -translate-y-px text-sky-300" /> <strong className={strong}>Compartir</strong> y elige <strong className={strong}>«Añadir a pantalla de inicio»</strong>.
              </span>
            </li>
            <li className="flex gap-3">
              <Step n={3} /> <span>Abre Orbis desde su icono y vuelve aquí para activar las notificaciones: en iPhone y iPad solo llegan a la app instalada.</span>
            </li>
          </ol>
        ) : (
          <p className="text-[13px] leading-relaxed text-white/55">
            Usa el icono de instalar de la barra de direcciones (Chrome o Edge) o el menú del navegador → <strong className="font-medium text-white/85">«Instalar Orbis»</strong> o{' '}
            <strong className="font-medium text-white/85">«Añadir a pantalla de inicio»</strong>.
          </p>
        )}
      </Panel>

      <Panel title="Notificaciones en este dispositivo" description="Orbis solo te avisa de lo importante. Tú eliges en qué dispositivos y qué tipo de avisos.">
        {serverError ? (
          <p className="flex items-start gap-2 rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] px-4 py-3 text-[13px] text-amber-100/90">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {serverError}
          </p>
        ) : !supported ? (
          <p className="text-[13px] leading-relaxed text-white/55">
            {isIOS && !standalone
              ? 'En iPhone y iPad las notificaciones solo funcionan con Orbis instalada en la pantalla de inicio (sigue los pasos de arriba).'
              : 'Este navegador no admite notificaciones. Prueba con Chrome, Edge, Firefox o Safari actualizados.'}
          </p>
        ) : thisDevice ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.05] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
                <BellRing size={17} />
              </span>
              <div>
                <p className="text-sm text-white">Activadas en {thisDevice.nombre}</p>
                <p className="text-[12px] text-white/45">Te llegarán aunque Orbis esté cerrada.</p>
              </div>
            </div>
            <ActionButton type="button" variant="secondary" busy={busy === `test-${thisDevice.endpoint}`} onClick={() => test(thisDevice.endpoint)}>
              <Send size={15} /> Enviar prueba
            </ActionButton>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-200/10 text-amber-200">
                <Bell size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-white">{thisDeviceName()}</p>
                <p className="text-[12px] text-white/45">
                  {permission === 'denied' ? 'Bloqueadas en el navegador: permítelas desde el icono del candado junto a la dirección.' : 'Todavía no recibe notificaciones.'}
                </p>
              </div>
            </div>
            <ActionButton type="button" busy={busy === 'enable'} disabled={!devices || !publicKey} onClick={enable}>
              <Bell size={15} /> Activar notificaciones
            </ActionButton>
          </div>
        )}
      </Panel>

      {devices && devices.length > 0 && (
        <Panel title="Tus dispositivos" description="Elige qué avisos recibe cada uno. Los cambios se guardan al momento.">
          <ul className="grid gap-4">
            {devices.map((d) => (
              <li key={d.id} className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 pt-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white/70">
                      {/iPhone|iPad|Android/.test(d.nombre) ? <Smartphone size={16} /> : <Laptop size={16} />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">
                        {d.nombre}
                        {d.endpoint === mine && <span className="ml-2 rounded-full bg-amber-200/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-200">Este</span>}
                      </p>
                      <p className="text-[12px] text-white/40">
                        Desde el {formatDate(d.creado_en)}
                        {d.ultimo_envio && ` · último aviso el ${formatDate(d.ultimo_envio)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <IconButton label={`Enviar una prueba a ${d.nombre}`} busy={busy === `test-${d.endpoint}`} disabled={busy !== null} onClick={() => test(d.endpoint)}>
                      <Send size={15} />
                    </IconButton>
                    <IconButton label={`Quitar ${d.nombre}`} danger busy={busy === `del-${d.endpoint}`} disabled={busy !== null} onClick={() => remove(d.endpoint)}>
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                </div>
                <div className="mt-2 divide-y divide-white/[0.06] border-t border-white/[0.06]">
                  {KINDS.map((k) => (
                    <Toggle key={k.key} label={k.label} description={k.description} checked={d[k.key]} onChange={(v) => update(d.endpoint, { [k.key]: v })} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  )
}

function Step({ n }: { n: number }) {
  return <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] text-white/80">{n}</span>
}

function IconButton({ label, busy, disabled, danger, onClick, children }: { label: string; busy: boolean; disabled: boolean; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-white/70 transition disabled:opacity-40 ${danger ? 'hover:bg-red-500/20 hover:text-red-200' : 'hover:bg-white/[0.12] hover:text-white'}`}
    >
      {busy ? <Loader2 size={15} className="animate-spin" /> : children}
    </button>
  )
}
