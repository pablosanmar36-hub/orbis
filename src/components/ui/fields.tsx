import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: ReactNode
}

export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField({ label, hint, className = '', ...props }, ref) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input ref={ref} id={id} className={`field ${className}`} {...props} />
      {hint && <p className="mt-1.5 text-[11px] text-white/40">{hint}</p>}
    </div>
  )
})

/**
 * Campo de contraseña: el texto va oculto por defecto (puntos) y solo se muestra
 * mientras el usuario lo pide con el botón del ojo. Nunca se guarda ni se autocompleta a la vista.
 */
export const PasswordField = forwardRef<HTMLInputElement, Omit<FieldProps, 'type'>>(function PasswordField(
  { label, hint, className = '', ...props },
  ref,
) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? 'text' : 'password'}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className={`field pr-11 ${visible ? '' : 'tracking-[0.18em]'} ${className}`}
          onBlur={() => setVisible(false)}
          {...props}
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()} // no quitar el foco del campo
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-white/45 transition hover:bg-white/5 hover:text-white/85"
        >
          {visible ? <EyeOff size={16} strokeWidth={1.7} /> : <Eye size={16} strokeWidth={1.7} />}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-white/40">{hint}</p>}
    </div>
  )
})

export function FormMessage({ kind, children }: { kind: 'error' | 'ok' | null; children?: ReactNode }) {
  return (
    <p role="status" aria-live="polite" className={`min-h-[1.1rem] text-[13px] ${kind === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
      {children}
    </p>
  )
}
