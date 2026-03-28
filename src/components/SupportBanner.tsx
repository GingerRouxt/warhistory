import { useState, useEffect } from 'react'

const DISMISSED_KEY = 'warhistory-support-dismissed'

interface SupportBannerProps {
  patreonUrl?: string
  youtubeUrl?: string
  donateUrl?: string
}

const DEFAULT_PATREON = 'https://patreon.com/warhistory'
const DEFAULT_YOUTUBE = 'https://youtube.com/@warhistory'
const DEFAULT_DONATE = 'https://warhistory.app/donate'

export function SupportBanner({
  patreonUrl = DEFAULT_PATREON,
  youtubeUrl = DEFAULT_YOUTUBE,
  donateUrl = DEFAULT_DONATE,
}: SupportBannerProps) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(DISMISSED_KEY)
    if (stored !== 'true') {
      setDismissed(false)
    }
  }, [])

  function handleDismiss() {
    setDismissed(true)
    localStorage.setItem(DISMISSED_KEY, 'true')
  }

  if (dismissed) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-xs w-72 rounded-xl p-4 shadow-2xl
        transition-all duration-500 ease-out animate-slide-up
        border border-white/[0.08] sm:w-72 w-[calc(100%-2rem)]"
      style={{
        background: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center
          text-white/40 hover:text-white/80 transition-colors duration-200 rounded-full
          hover:bg-white/10"
        aria-label="Dismiss support banner"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Shield icon + heading */}
      <div className="flex items-center gap-2 mb-2">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="text-[var(--color-war-gold)] shrink-0"
        >
          <path
            d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
            fill="currentColor"
            opacity="0.2"
          />
          <path
            d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M12 8v4M12 15h.01"
            stroke="var(--color-war-dark)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <h3
          className="text-sm font-semibold text-[var(--color-war-gold)] tracking-wide"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Support WarHistory
        </h3>
      </div>

      {/* Body text */}
      <p
        className="text-xs text-white/50 mb-3 leading-relaxed"
        style={{ fontFamily: 'var(--font-family-body)' }}
      >
        Help keep history free and interactive for everyone.
      </p>

      {/* Link row */}
      <div className="flex items-center gap-2">
        <a
          href={patreonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-white/60 hover:text-[var(--color-war-gold)]
            transition-colors duration-200"
          aria-label="Support on Patreon"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 2a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM2 2h3v20H2V2z" />
          </svg>
          Patreon
        </a>

        <span className="text-white/20">|</span>

        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-white/60 hover:text-[var(--color-war-gold)]
            transition-colors duration-200"
          aria-label="Watch on YouTube"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" />
          </svg>
          YouTube
        </a>

        <span className="flex-1" />

        <a
          href={donateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
            bg-[var(--color-war-gold)]/10 text-[var(--color-war-gold)]
            border border-[var(--color-war-gold)]/20
            hover:bg-[var(--color-war-gold)]/20 hover:border-[var(--color-war-gold)]/40
            transition-all duration-200"
          style={{ fontFamily: 'var(--font-family-body)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="opacity-80">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          Donate
        </a>
      </div>
    </div>
  )
}
