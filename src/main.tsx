import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Set Cesium Ion access token (free tier)
import { Ion } from 'cesium'
Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN || ''

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
