import { useState, useEffect, useRef } from 'react'

const SHARE_TEXT = 'Explore every battle in human history on an interactive 3D globe — WarHistory'

export function ShareButton() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return

    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function shareUrl(): string {
    return window.location.href
  }

  function handleTwitter() {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(shareUrl())}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function handleFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl())}&quote=${encodeURIComponent(SHARE_TEXT)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function handleReddit() {
    const url = `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl())}&title=${encodeURIComponent(SHARE_TEXT)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(shareUrl()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div ref={panelRef} className="fixed bottom-4 left-4 z-50">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full flex items-center justify-center
          border border-white/[0.08] shadow-lg
          text-white/60 hover:text-[var(--color-war-gold)]
          transition-all duration-200 hover:border-[var(--color-war-gold)]/30"
        style={{
          background: 'rgba(10, 10, 15, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        aria-label="Share WarHistory"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute bottom-14 left-0 w-48 rounded-xl p-3 shadow-2xl
            border border-white/[0.08]
            transition-all duration-200 animate-fade-in"
          style={{
            background: 'rgba(10, 10, 15, 0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <p
            className="text-xs text-[var(--color-war-gold)] font-semibold mb-2 tracking-wide"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            Share
          </p>

          <div className="flex flex-col gap-1">
            <ShareOption label="Twitter / X" onClick={handleTwitter}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </ShareOption>

            <ShareOption label="Facebook" onClick={handleFacebook}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </ShareOption>

            <ShareOption label="Reddit" onClick={handleReddit}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 00.029-.463.33.33 0 00-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 00-.232-.094z" />
              </svg>
            </ShareOption>

            <div className="border-t border-white/[0.06] my-1" />

            <ShareOption label={copied ? 'Copied!' : 'Copy Link'} onClick={handleCopyLink}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {copied ? (
                  <path d="M20 6L9 17l-5-5" />
                ) : (
                  <>
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </>
                )}
              </svg>
            </ShareOption>
          </div>
        </div>
      )}
    </div>
  )
}

interface ShareOptionProps {
  label: string
  onClick: () => void
  children: React.ReactNode
}

function ShareOption({ label, onClick, children }: ShareOptionProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-xs text-white/60
        hover:text-[var(--color-war-gold)] hover:bg-white/[0.04]
        transition-all duration-150"
      style={{ fontFamily: 'var(--font-family-body)' }}
    >
      <span className="shrink-0">{children}</span>
      {label}
    </button>
  )
}
