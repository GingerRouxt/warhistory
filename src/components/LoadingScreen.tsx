import { useState, useEffect } from 'react'

interface LoadingScreenProps {
  isLoading: boolean
}

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [shouldRender, setShouldRender] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setIsFadingOut(true)
      const timer = setTimeout(() => setShouldRender(false), 800)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!shouldRender) return null

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center"
      style={{
        background: 'var(--color-war-dark, #0a0a0f)',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.8s ease-out',
        pointerEvents: isFadingOut ? 'none' : 'auto',
      }}
    >
      <h1
        className="mb-3 text-4xl tracking-[0.3em] sm:text-5xl"
        style={{
          fontFamily: 'var(--font-family-display, Cinzel, serif)',
          color: 'var(--color-war-gold, #d4a017)',
          animation: 'loading-pulse 2s ease-in-out infinite',
        }}
      >
        WARHISTORY
      </h1>

      <p
        className="mb-16 text-sm tracking-wider"
        style={{
          fontFamily: 'var(--font-family-body, Inter, sans-serif)',
          color: 'rgba(255, 255, 255, 0.35)',
        }}
      >
        Loading the world...
      </p>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full overflow-hidden bg-transparent">
        <div
          className="h-full"
          style={{
            background: 'var(--color-war-gold, #d4a017)',
            animation: 'loading-bar 1.8s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes loading-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 40%; margin-left: 30%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}
