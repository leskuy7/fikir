import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './themes/gazete.css'
import './themes/kozmik.css'
import { initGA } from './services/analytics.js'
import HataSiniri from './components/HataSiniri.jsx'
import App from './App.jsx'

initGA()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HataSiniri>
      <App />
    </HataSiniri>
  </StrictMode>,
)
