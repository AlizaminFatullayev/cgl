import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Initialises i18next before anything renders.
import './i18n'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
