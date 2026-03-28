import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Viewer } from 'cesium'

interface GlobeContextValue {
  viewer: Viewer | null
  setViewer: (viewer: Viewer | null) => void
}

const GlobeContext = createContext<GlobeContextValue>({
  viewer: null,
  setViewer: () => {},
})

export function GlobeProvider({ children }: { children: ReactNode }) {
  const [viewer, setViewer] = useState<Viewer | null>(null)

  return (
    <GlobeContext.Provider value={{ viewer, setViewer }}>
      {children}
    </GlobeContext.Provider>
  )
}

export function useGlobe(): GlobeContextValue {
  const context = useContext(GlobeContext)
  if (context === undefined) {
    throw new Error('useGlobe must be used within a GlobeProvider')
  }
  return context
}

export default GlobeContext
