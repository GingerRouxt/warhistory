import { useState, useEffect, useCallback } from 'react'

interface Shortcut {
  key: string
  label: string
}

const SHORTCUTS: Shortcut[] = [
  { key: 'Space', label: 'Play / Pause timeline' },
  { key: '← →', label: 'Step through timeline' },
  { key: 'F', label: 'Toggle filter panel' },
  { key: 'T', label: 'Toggle tours' },
  { key: 'Esc', label: 'Close panels' },
  { key: '?', label: 'Toggle this help' },
]

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault()
      setIsOpen((prev) => !prev)
    }

    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false)
    }
  }, [isOpen])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9996] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(5, 5, 8, 0.7)' }}
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <div
        className="glass-panel relative z-10 w-full max-w-md px-8 py-8"
        style={{ fontFamily: 'var(--font-family-body, Inter, sans-serif)' }}
      >
        <h2
          className="mb-6 text-center text-lg tracking-wider"
          style={{
            fontFamily: 'var(--font-family-display, Cinzel, serif)',
            color: 'var(--color-war-gold, #d4a017)',
          }}
        >
          Keyboard Shortcuts
        </h2>

        <div className="space-y-3">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-gray-400">{shortcut.label}</span>
              <kbd
                className="rounded px-3 py-1 text-xs tracking-wider"
                style={{
                  fontFamily: 'var(--font-family-body, Inter, sans-serif)',
                  color: 'var(--color-war-gold, #d4a017)',
                  background: 'rgba(212, 160, 23, 0.1)',
                  border: '1px solid rgba(212, 160, 23, 0.25)',
                }}
              >
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Press <span style={{ color: 'var(--color-war-gold, #d4a017)' }}>?</span> or{' '}
          <span style={{ color: 'var(--color-war-gold, #d4a017)' }}>Esc</span> to close
        </p>
      </div>
    </div>
  )
}
