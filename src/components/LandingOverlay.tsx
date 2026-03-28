import { useState, useEffect } from 'react'

interface LandingOverlayProps {
  onEnter: () => void
  isVisible: boolean
}

export function LandingOverlay({ onEnter, isVisible }: LandingOverlayProps) {
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [shouldRender, setShouldRender] = useState(true)
  const [contentReady, setContentReady] = useState(false)

  // Stagger in the content after mount
  useEffect(() => {
    const timer = setTimeout(() => setContentReady(true), 300)
    return () => clearTimeout(timer)
  }, [])

  // Handle fade-out when isVisible becomes false
  useEffect(() => {
    if (!isVisible && shouldRender) {
      setIsFadingOut(true)
      const timer = setTimeout(() => setShouldRender(false), 1200)
      return () => clearTimeout(timer)
    }
  }, [isVisible, shouldRender])

  const handleEnter = () => {
    setIsFadingOut(true)
    setTimeout(() => {
      onEnter()
    }, 800)
  }

  if (!shouldRender) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isFadingOut ? 'none' : 'auto',
      }}
    >
      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(8, 8, 15, 0.75) 0%, rgba(5, 5, 8, 0.92) 100%)',
        }}
      />

      {/* Subtle vignette border */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 200px rgba(0, 0, 0, 0.6)',
        }}
      />

      {/* Center content */}
      <div className="relative z-10 text-center px-6 select-none">
        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--font-family-display)',
            fontSize: 'clamp(36px, 8vw, 72px)',
            color: 'var(--color-war-gold)',
            letterSpacing: '0.3em',
            lineHeight: 1,
            textShadow: '0 0 60px rgba(212, 160, 23, 0.3), 0 0 120px rgba(212, 160, 23, 0.1)',
            opacity: contentReady ? 1 : 0,
            transform: contentReady ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1.2s ease-out, transform 1.2s ease-out',
          }}
        >
          WARHISTORY
        </h1>

        {/* Subtitle */}
        <p
          className="mt-6 text-lg"
          style={{
            fontFamily: 'var(--font-family-body)',
            color: 'rgba(235, 235, 235, 0.8)',
            fontWeight: 300,
            letterSpacing: '0.05em',
            opacity: contentReady ? 1 : 0,
            transform: contentReady ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 1.2s ease-out 0.3s, transform 1.2s ease-out 0.3s',
          }}
        >
          Every battle ever fought. From Genesis to today.
        </p>

        {/* Gold separator */}
        <div
          className="mx-auto mt-8"
          style={{
            width: 120,
            height: 1,
            background: 'linear-gradient(to right, transparent, var(--color-war-gold), transparent)',
            opacity: contentReady ? 1 : 0,
            transition: 'opacity 1.4s ease-out 0.6s',
          }}
        />

        {/* Enter button */}
        <button
          onClick={handleEnter}
          className="mt-10 px-10 py-3 text-sm uppercase tracking-[0.25em] font-medium cursor-pointer"
          style={{
            fontFamily: 'var(--font-family-display)',
            color: 'var(--color-war-gold)',
            background: 'transparent',
            border: '1px solid rgba(212, 160, 23, 0.5)',
            borderRadius: 2,
            transition: 'all 0.4s ease, opacity 1.2s ease-out 0.9s, transform 1.2s ease-out 0.9s',
            opacity: contentReady ? 1 : 0,
            transform: contentReady ? 'translateY(0)' : 'translateY(12px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-war-gold)'
            e.currentTarget.style.color = '#08080f'
            e.currentTarget.style.borderColor = 'var(--color-war-gold)'
            e.currentTarget.style.boxShadow = '0 0 30px rgba(212, 160, 23, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-war-gold)'
            e.currentTarget.style.borderColor = 'rgba(212, 160, 23, 0.5)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Enter
        </button>

        {/* Tagline below button */}
        <p
          className="mt-8 text-xs"
          style={{
            fontFamily: 'var(--font-family-body)',
            color: 'rgba(200, 200, 210, 0.35)',
            fontWeight: 300,
            letterSpacing: '0.04em',
            opacity: contentReady ? 1 : 0,
            transition: 'opacity 1.4s ease-out 1.2s',
          }}
        >
          Starting at 4000 BCE &mdash; The first blood spilled on earth
        </p>
      </div>
    </div>
  )
}
