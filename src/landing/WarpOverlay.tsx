import { useEffect, useRef } from 'react'

/**
 * Transición de "despegue": estrellas que se estiran en líneas de luz hacia el espectador,
 * un destello cálido y, al terminar, se abre la app.
 */
export function WarpOverlay({ active, onDone }: { active: boolean; onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return
    const el = canvas.current!
    const ctx = el.getContext('2d')!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      el.width = window.innerWidth * dpr
      el.height = window.innerHeight * dpr
    }
    resize()

    const stars = Array.from({ length: 700 }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random() * 0.9 + 0.1,
      warm: Math.random() < 0.25,
    }))

    let raf = 0
    const t0 = performance.now()
    const DURATION = 2100
    let finished = false

    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION)
      const speed = 0.002 + t * t * 0.06
      const w = el.width
      const h = el.height
      const cx = w / 2
      const cy = h / 2

      ctx.fillStyle = `rgba(5,7,15,${0.35 + t * 0.4})`
      ctx.fillRect(0, 0, w, h)

      for (const s of stars) {
        const pz = s.z
        s.z -= speed
        if (s.z <= 0.02) {
          s.x = (Math.random() - 0.5) * 2
          s.y = (Math.random() - 0.5) * 2
          s.z = 1
          continue
        }
        const sx = cx + (s.x / s.z) * cx
        const sy = cy + (s.y / s.z) * cy
        const px = cx + (s.x / pz) * cx
        const py = cy + (s.y / pz) * cy
        const alpha = Math.min(1, (1 - s.z) * 1.4)
        ctx.strokeStyle = s.warm ? `rgba(246,199,122,${alpha})` : `rgba(244,239,230,${alpha})`
        ctx.lineWidth = (1 - s.z) * 2.6 * dpr
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(sx, sy)
        ctx.stroke()
      }

      // Destello final
      if (t > 0.72) {
        const f = (t - 0.72) / 0.28
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * (0.2 + f))
        g.addColorStop(0, `rgba(255,236,200,${f})`)
        g.addColorStop(1, `rgba(5,7,15,${f * 0.6})`)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }

      if (t < 1) raf = requestAnimationFrame(frame)
      else if (!finished) {
        finished = true
        onDone()
      }
    }
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [active, onDone])

  if (!active) return null
  return (
    <div className="fixed inset-0 z-[100]" role="status" aria-live="assertive">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      <p className="absolute inset-x-0 bottom-[12vh] text-center font-mono text-xs uppercase tracking-[0.4em] text-star/70">Rumbo a tu planeta…</p>
    </div>
  )
}
