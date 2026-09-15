import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useOrbis } from './store/useOrbis'

// Solo en desarrollo: acceso al estado desde la consola del navegador
if (import.meta.env.DEV) Object.assign(window, { orbis: useOrbis })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
