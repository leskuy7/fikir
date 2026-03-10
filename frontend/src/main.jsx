import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './themes/gazete.css'
import './themes/kozmik.css'
import { initGA } from './services/analytics.js'
import App from './App.jsx'

initGA()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
