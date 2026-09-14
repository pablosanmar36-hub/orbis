import { useEffect } from 'react'
import { useOrbis } from '../store/useOrbis'

/** Atajos globales: Esc cierra la capa superior, H oculta la interfaz, ←/→ en el lightbox. */
export function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea')) return
      const s = useOrbis.getState()
      if (e.key === 'Escape') {
        if (s.lightbox) s.closeLightbox()
        else if (s.picking) s.setPicking(false)
        else if (s.cinematic) s.setCinematic(false)
        else if (s.curatorOpen) s.setCurator(false)
        else if (s.selectedId) s.select(null)
        else if (s.uiHidden) s.toggleUi()
      } else if (s.lightbox && e.key === 'ArrowRight') s.stepLightbox(1)
      else if (s.lightbox && e.key === 'ArrowLeft') s.stepLightbox(-1)
      else if (e.key.toLowerCase() === 'h' && !s.lightbox) s.toggleUi()
      else if (e.key.toLowerCase() === 'n' && !s.lightbox) s.toggleNight()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
