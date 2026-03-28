import { useNarrator } from '../hooks/useNarrator'
import type { Battle } from '../types/battle'

interface NarratorProps {
  battle: Battle | null
  isActive: boolean
  onNarrationComplete: () => void
}

/**
 * Cinematic narration bar at the bottom of the viewport.
 * Typewriter text reveal, scripture references in gold italic.
 */
export function Narrator({ battle, isActive, onNarrationComplete }: NarratorProps) {
  const { displayedText, isNarrating, isComplete, skip } = useNarrator(
    battle,
    isActive,
    onNarrationComplete,
  )

  if (!battle || !isActive) return null

  // Split displayed text to detect scripture reference line
  const lines = displayedText.split('\n\n')
  const mainText = lines[0] || ''
  const scriptureText = lines.length > 1 ? lines.slice(1).join('\n\n') : null

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-3xl px-6"
      style={{
        animation: 'narrator-fade-in 0.6s ease-out forwards',
      }}
    >
      <div
        className="glass-panel px-8 py-6 relative"
        style={{
          borderColor: 'rgba(212, 160, 23, 0.3)',
        }}
      >
        {/* Battle name label */}
        <div
          className="text-xs tracking-widest uppercase mb-3"
          style={{
            color: 'var(--color-war-gold)',
            fontFamily: 'var(--font-family-display)',
          }}
        >
          {battle.name}
        </div>

        {/* Main narration text */}
        <p
          className="text-base leading-relaxed"
          style={{
            color: 'rgba(235, 235, 235, 0.95)',
            fontFamily: 'var(--font-family-body)',
            fontWeight: 400,
          }}
        >
          {mainText}
          {isNarrating && (
            <span
              className="inline-block w-0.5 h-4 ml-0.5 align-text-bottom"
              style={{
                backgroundColor: 'var(--color-war-gold)',
                animation: 'blink-caret 1s step-end infinite',
              }}
            />
          )}
        </p>

        {/* Scripture reference */}
        {scriptureText && (
          <p
            className="mt-3 text-sm italic"
            style={{
              color: 'var(--color-war-gold)',
              fontFamily: 'var(--font-family-display)',
            }}
          >
            {scriptureText}
          </p>
        )}

        {/* Skip / Dismiss button */}
        <button
          onClick={isComplete ? onNarrationComplete : skip}
          className="absolute top-3 right-4 text-xs uppercase tracking-wider transition-colors duration-200 cursor-pointer"
          style={{
            color: 'rgba(212, 160, 23, 0.5)',
            fontFamily: 'var(--font-family-body)',
            background: 'none',
            border: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-war-gold)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(212, 160, 23, 0.5)'
          }}
        >
          {isComplete ? 'Dismiss' : 'Skip'}
        </button>
      </div>

      <style>{`
        @keyframes narrator-fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, 12px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  )
}
