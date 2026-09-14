import { AnimatePresence, motion } from 'framer-motion'
import { Clapperboard, Eye, EyeOff, Moon, Plus, RotateCcw, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { GLOBE } from '../../config'
import { useOrbis } from '../../store/useOrbis'
import { EASE } from './motion'

function DockButton({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`group relative grid h-11 w-11 place-items-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
        active ? 'bg-white text-black' : 'text-white/75 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
      <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-full bg-black/70 px-2.5 py-1 text-[10px] tracking-wide text-white/90 opacity-0 backdrop-blur transition-all duration-200 group-hover:-translate-y-0.5 group-hover:opacity-100">
        {label}
      </span>
    </button>
  )
}

export function ControlDock() {
  const s = useOrbis()
  const visible = !s.uiHidden && !s.cinematic && !s.selectedId && !s.curatorOpen

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.nav
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="glass fixed bottom-6 left-1/2 z-30 flex items-center gap-1 rounded-full p-1.5"
            style={{ x: '-50%' }}
          >
            <DockButton
              label="Recentrar"
              onClick={() => s.fly({ lat: 28, lng: -10 }, GLOBE.homeDistance, 2)}
            >
              <RotateCcw size={17} strokeWidth={1.6} />
            </DockButton>
            <DockButton label={s.night ? 'Luz de día' : 'Luces nocturnas (N)'} onClick={s.toggleNight} active={s.night}>
              {s.night ? <Sun size={17} strokeWidth={1.6} /> : <Moon size={17} strokeWidth={1.6} />}
            </DockButton>
            <DockButton label="Modo cinematográfico" onClick={() => s.memories.length && s.setCinematic(true)}>
              <Clapperboard size={17} strokeWidth={1.6} />
            </DockButton>
            <DockButton label="Ocultar interfaz (H)" onClick={s.toggleUi}>
              <EyeOff size={17} strokeWidth={1.6} />
            </DockButton>
            <span className="mx-1 h-6 w-px bg-white/10" />
            <button
              onClick={() => s.setCurator(true)}
              className="flex h-11 items-center gap-2 rounded-full bg-gradient-to-b from-amber-100 to-amber-300 px-4 text-sm font-medium text-black shadow-[0_0_30px_-4px_rgba(255,200,120,0.6)] transition-transform duration-300 hover:scale-[1.03] active:scale-95"
            >
              <Plus size={16} strokeWidth={2} />
              <span className="hidden sm:inline">Nuevo recuerdo</span>
            </button>
          </motion.nav>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {s.uiHidden && !s.cinematic && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            whileHover={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={s.toggleUi}
            aria-label="Mostrar interfaz"
            className="fixed bottom-6 right-6 z-30 grid h-10 w-10 place-items-center rounded-full text-white"
          >
            <Eye size={18} strokeWidth={1.6} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
