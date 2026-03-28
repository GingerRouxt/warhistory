import { useState, useEffect } from 'react'

const STORAGE_KEY = 'warhistory-mobile-dismissed'
const MOBILE_BREAKPOINT = 768

export function MobileWarning() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY)
    if (!dismissed && window.innerWidth < MOBILE_BREAKPOINT) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = (): void => {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[9997] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(5, 5, 8, 0.8)' }}
      />

      {/* Panel */}
      <div
        className="glass-panel relative z-10 max-w-sm px-8 py-10 text-center"
        style={{ fontFamily: 'var(--font-family-body, Inter, sans-serif)' }}
      >
        <h2
          className="mb-4 text-lg tracking-wider"
          style={{
            fontFamily: 'var(--font-family-display, Cinzel, serif)',
            color: 'var(--color-war-gold, #d4a017)',
          }}
        >
          Desktop Recommended
        </h2>

        <p className="mb-8 text-sm leading-relaxed text-gray-400">
          WarHistory is best experienced on desktop for full 3D globe interaction
          and timeline control.
        </p>

        <button
          onClick={handleDismiss}
          className="cursor-pointer rounded-lg px-6 py-2.5 text-sm tracking-wider uppercase transition-all duration-300 hover:scale-105"
          style={{
            fontFamily: 'var(--font-family-display, Cinzel, serif)',
            color: 'var(--color-war-gold, #d4a017)',
            border: '1px solid var(--color-war-gold, #d4a017)',
            background: 'rgba(212, 160, 23, 0.08)',
          }}
        >
          Continue Anyway
        </button>
      </div>
    </div>
  )
}
