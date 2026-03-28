import { useState, useEffect } from 'react'

const DISMISSED_KEY = 'warhistory-support-dismissed'
const PATREON_URL = 'https://patreon.com/warhistory'

const TIERS = [
  { price: '$3/mo', label: 'Ad-free experience, early access to new battles' },
  { price: '$10/mo', label: 'Audio narration, downloadable battle data' },
  { price: '$25/mo', label: 'Your name in credits, vote on next campaign' },
] as const

export function SupportBanner() {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem(DISMISSED_KEY)
    if (stored !== 'true') {
      setDismissed(false)
    }
  }, [])

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem(DISMISSED_KEY, 'true')
  }

  if (dismissed) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-xs w-80 rounded-xl p-4 shadow-2xl
        transition-all duration-500 ease-out animate-slide-up
        border border-white/[0.08] sm:w-80 w-[calc(100%-2rem)]"
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
      <div className="flex items-center gap-2 mb-3">
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
        </svg>
        <h3
          className="text-sm font-semibold text-[var(--color-war-gold)] tracking-wide"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          Support WarHistory
        </h3>
      </div>

      {/* Tier descriptions */}
      <ul className="space-y-1.5 mb-3">
        {TIERS.map((tier) => (
          <li key={tier.price} className="flex items-start gap-2 text-xs leading-relaxed">
            <span
              className="shrink-0 font-semibold text-[var(--color-war-gold)]"
              style={{ fontFamily: 'var(--font-family-body)', minWidth: '3.5rem' }}
            >
              {tier.price}
            </span>
            <span className="text-white/50" style={{ fontFamily: 'var(--font-family-body)' }}>
              {tier.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <a
        href={PATREON_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-xs font-medium
          bg-[var(--color-war-gold)]/10 text-[var(--color-war-gold)]
          border border-[var(--color-war-gold)]/20
          hover:bg-[var(--color-war-gold)]/20 hover:border-[var(--color-war-gold)]/40
          transition-all duration-200"
        style={{ fontFamily: 'var(--font-family-body)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 2a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM2 2h3v20H2V2z" />
        </svg>
        Join on Patreon
      </a>
    </div>
  )
}
