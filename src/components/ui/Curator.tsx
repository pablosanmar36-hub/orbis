import { AnimatePresence, motion } from 'framer-motion'
import { Crosshair, Film, Loader2, MapPin, Sparkles, UploadCloud, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { formatCoords } from '../../lib/geo'
import { useOrbis } from '../../store/useOrbis'
import { EASE } from './motion'

const today = () => new Date().toISOString().slice(0, 10)
const emptyForm = () => ({ title: '', place: '', lat: '', lng: '', startDate: today(), endDate: '', note: '' })

export function Curator() {
  const { curatorOpen, picking, pickedLocation, setCurator, setPicking, setPicked, addMemory, select, fly } = useOrbis()
  const [form, setForm] = useState(emptyForm)
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files])
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews])

  // Selección en el globo → rellena coordenadas
  useEffect(() => {
    if (!pickedLocation || !useOrbis.getState().picking) return
    setForm((f) => ({ ...f, lat: pickedLocation.lat.toFixed(5), lng: pickedLocation.lng.toFixed(5) }))
    setPicking(false)
  }, [pickedLocation, setPicking])

  useEffect(() => {
    if (!curatorOpen) {
      setForm(emptyForm())
      setFiles([])
      setError('')
    }
  }, [curatorOpen])

  const set = (k: keyof ReturnType<typeof emptyForm>) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const updateCoords = (lat: string, lng: string) => {
    const la = parseFloat(lat)
    const ln = parseFloat(lng)
    if (Math.abs(la) <= 90 && Math.abs(ln) <= 180) setPicked({ lat: la, lng: ln })
  }

  const addFiles = (list: FileList | null) => {
    if (!list) return
    const accepted = Array.from(list).filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))
    setFiles((prev) => [...prev, ...accepted])
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const lat = parseFloat(form.lat)
    const lng = parseFloat(form.lng)
    if (!form.title.trim()) return setError('Dale un título a este recuerdo.')
    if (!(Math.abs(lat) <= 90) || !(Math.abs(lng) <= 180)) return setError('Selecciona una ubicación válida en el globo o introduce coordenadas.')
    setSaving(true)
    try {
      const memory = await addMemory(
        {
          title: form.title.trim(),
          place: form.place.trim() || formatCoords({ lat, lng }),
          lat,
          lng,
          startDate: form.startDate || today(),
          endDate: form.endDate || undefined,
          note: form.note.trim() || undefined,
        },
        files,
      )
      setCurator(false)
      setTimeout(() => select(memory.id), 250)
    } catch (err) {
      setError('No se pudo guardar. ¿Hay espacio disponible en el navegador?')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {curatorOpen && !picking && (
          <motion.aside
            initial={{ opacity: 0, x: -40, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
            transition={{ duration: 0.6, ease: EASE }}
            className="glass fixed inset-x-3 bottom-3 top-16 z-40 flex flex-col overflow-hidden rounded-3xl md:inset-x-auto md:bottom-5 md:left-5 md:top-5 md:w-[420px]"
          >
            <div className="flex items-start justify-between p-6 pb-2">
              <div>
                <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-amber-200/70"><Sparkles size={11} /> The Curator</p>
                <h2 className="mt-2 font-display text-3xl text-white">Nuevo recuerdo</h2>
              </div>
              <button onClick={() => setCurator(false)} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="scroll-thin flex flex-1 flex-col gap-5 overflow-y-auto p-6 pt-4">
              <div>
                <label className="label" htmlFor="c-title">Título</label>
                <input id="c-title" className="field" placeholder="Atardecer en Santorini" value={form.title} onChange={set('title')} autoFocus />
              </div>
              <div>
                <label className="label" htmlFor="c-place">Lugar</label>
                <input id="c-place" className="field" placeholder="Oia, Grecia" value={form.place} onChange={set('place')} />
              </div>

              <div>
                <span className="label">Ubicación</span>
                <button
                  type="button"
                  onClick={() => setPicking(true)}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-3.5 text-left transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-cyan-300/15 text-cyan-200 transition group-hover:scale-110"><Crosshair size={17} /></span>
                  <span>
                    <span className="block text-sm text-white">Seleccionar en el globo</span>
                    <span className="block text-[11px] text-white/45">
                      {form.lat && form.lng ? formatCoords({ lat: +form.lat, lng: +form.lng }) : 'Gira y haz clic en el punto exacto'}
                    </span>
                  </span>
                </button>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input className="field tabular-nums" inputMode="decimal" placeholder="Latitud" value={form.lat} onChange={(e) => { set('lat')(e); updateCoords(e.target.value, form.lng) }} />
                  <input className="field tabular-nums" inputMode="decimal" placeholder="Longitud" value={form.lng} onChange={(e) => { set('lng')(e); updateCoords(form.lat, e.target.value) }} />
                </div>
                {form.lat && form.lng && (
                  <button type="button" onClick={() => fly({ lat: +form.lat, lng: +form.lng }, 1.6)} className="mt-2 flex items-center gap-1 text-[11px] text-cyan-200/70 hover:text-cyan-100">
                    <MapPin size={11} /> Ver en el globo
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label" htmlFor="c-start">Desde</label>
                  <input id="c-start" type="date" className="field" value={form.startDate} onChange={set('startDate')} />
                </div>
                <div>
                  <label className="label" htmlFor="c-end">Hasta</label>
                  <input id="c-end" type="date" className="field" value={form.endDate} min={form.startDate} onChange={set('endDate')} />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="c-note">Reflexión</label>
                <textarea id="c-note" rows={3} className="field resize-none font-display text-base italic" placeholder="Lo que no quieres olvidar…" value={form.note} onChange={set('note')} />
              </div>

              <div>
                <span className="label">Fotos y vídeos</span>
                <div
                  onClick={() => input.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-7 text-center transition ${
                    dragging ? 'scale-[1.01] border-amber-200/60 bg-amber-200/10' : 'border-white/12 hover:border-white/25 hover:bg-white/[0.03]'
                  }`}
                >
                  <UploadCloud size={22} className="text-white/50" strokeWidth={1.5} />
                  <p className="mt-2 text-sm text-white/75">Arrastra aquí o <span className="text-amber-200">explora</span></p>
                  <p className="mt-0.5 text-[11px] text-white/35">JPG, PNG, HEIC, MP4, MOV — múltiples archivos</p>
                  <input ref={input} type="file" multiple accept="image/*,video/*" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
                </div>

                {previews.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <AnimatePresence>
                      {previews.map((p, i) => (
                        <motion.div
                          key={p.url}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="group relative aspect-square overflow-hidden rounded-xl bg-white/5"
                        >
                          {p.file.type.startsWith('video') ? (
                            <>
                              <video src={p.url} muted className="h-full w-full object-cover" />
                              <Film size={12} className="absolute left-1.5 top-1.5 text-white drop-shadow" />
                            </>
                          ) : (
                            <img src={p.url} alt="" className="h-full w-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}
                            aria-label="Quitar"
                            className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <X size={11} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-300">
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={saving}
                className="mt-auto flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-amber-100 to-amber-300 text-sm font-medium text-black shadow-[0_0_40px_-8px_rgba(255,200,120,0.7)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={15} />}
                {saving ? 'Guardando…' : 'Guardar en el globo'}
              </button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Modo selección de ubicación */}
      <AnimatePresence>
        {curatorOpen && picking && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="glass fixed left-1/2 top-6 z-40 flex items-center gap-3 rounded-full py-2 pl-4 pr-2"
            style={{ x: '-50%' }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
            </span>
            <span className="text-sm text-white/85">Haz clic en el globo para fijar la ubicación</span>
            <button onClick={() => setPicking(false)} className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/20">Cancelar</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
