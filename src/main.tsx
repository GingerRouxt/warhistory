import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AnalyticsProvider } from './components/AnalyticsProvider'

// Set Cesium Ion access token (free tier)
import { Ion } from 'cesium'
Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN || ''

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AnalyticsProvider>
        <App />
      </AnalyticsProvider>
    </ErrorBoundary>
  </StrictMode>,
)
