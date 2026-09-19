import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initPwa } from './lib/pwa'
import { useOrbis } from './store/useOrbis'
import { useSession } from './store/useSession'

initPwa()

// Enlaces de las notificaciones y accesos directos: /app/?cuenta=seguridad abre esa sección de la cuenta
if (new URLSearchParams(location.search).has('cuenta') && useSession.getState().token) useOrbis.getState().setAccountOpen(true)

// Solo en desarrollo: acceso al estado desde la consola del navegador
if (import.meta.env.DEV) Object.assign(window, { orbis: useOrbis })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
