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
        className="glass-panel elevation-3 px-8 py-6 relative"
        style={{
          borderColor: 'rgba(212, 160, 23, 0.3)',
          animation: isNarrating ? 'narrator-bg-pulse 3s ease-in-out infinite' : undefined,
        }}
      >
        {/* Gold gradient top line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(to right, transparent, var(--color-war-gold), transparent)',
            borderRadius: '12px 12px 0 0',
          }}
        />

        {/* Battle name label */}
        <div
          className="text-xs tracking-widest uppercase mb-3"
          style={{
            color: 'var(--color-war-gold)',
            fontFamily: 'var(--font-family-display)',
            animation: 'narrator-label-in 0.6s ease-out forwards',
          }}
        >
          {battle.name}
        </div>

        {/* Main narration text */}
        <p
          style={{
            color: 'rgba(235, 235, 235, 0.95)',
            fontFamily: 'var(--font-family-body)',
            fontWeight: 400,
            fontSize: '1rem',
            lineHeight: 1.8,
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

        {/* Scripture reference with animated gold underline */}
        {scriptureText && (
          <p
            className="mt-3 text-sm italic relative inline-block"
            style={{
              color: 'var(--color-war-gold)',
              fontFamily: 'var(--font-family-display)',
            }}
          >
            {scriptureText}
            <span
              style={{
                position: 'absolute',
                bottom: -2,
                left: 0,
                width: '100%',
                height: 1,
                backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(212, 160, 23, 0.6) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s linear infinite',
              }}
            />
          </p>
        )}

        {/* Skip / Dismiss button */}
        <button
          onClick={isComplete ? onNarrationComplete : skip}
          className="absolute top-3 right-4 text-xs uppercase tracking-wider cursor-pointer"
          style={{
            color: 'rgba(212, 160, 23, 0.5)',
            fontFamily: 'var(--font-family-body)',
            background: 'none',
            border: 'none',
            transition: 'color 0.3s ease, opacity 0.3s ease',
            opacity: isComplete ? 1 : 0.7,
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
        @keyframes narrator-label-in {
          from {
            letter-spacing: 0.3em;
            opacity: 0;
          }
          to {
            letter-spacing: 0.15em;
            opacity: 1;
          }
        }
        @keyframes narrator-bg-pulse {
          0%, 100% {
            background-color: rgba(10, 10, 20, 0.85);
          }
          50% {
            background-color: rgba(10, 10, 20, 0.92);
          }
        }
      `}</style>
    </div>
  )
}
