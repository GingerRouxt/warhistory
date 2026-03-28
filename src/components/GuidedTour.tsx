import { useState, useEffect, useRef, useCallback } from 'react'
import type { Battle } from '../types/battle'

export interface GuidedTourProps {
  battles: Battle[]
  isActive: boolean
  onBattleSelect: (battle: Battle) => void
  onClose: () => void
}

const AUTO_ADVANCE_DELAY = 6000 // ms between auto-advance

/**
 * Glass-panel overlay that provides guided tour mode through a sequence of battles.
 * Auto-plays through battles with prev/next controls and a progress bar.
 */
export function GuidedTour({ battles, isActive, onBattleSelect, onClose }: GuidedTourProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Animate in
  useEffect(() => {
    if (isActive) {
      setCurrentIndex(0)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true))
      })
    } else {
      setIsVisible(false)
    }
  }, [isActive])

  // Navigate to battle when index changes
  useEffect(() => {
    if (isActive && battles.length > 0 && battles[currentIndex]) {
      onBattleSelect(battles[currentIndex])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isActive])

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= battles.length - 1) {
        setAutoPlay(false)
        return prev
      }
      return prev + 1
    })
  }, [battles.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }, [])

  // Auto-advance timer
  useEffect(() => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current)
      autoPlayTimerRef.current = null
    }

    if (autoPlay && isActive && currentIndex < battles.length - 1) {
      autoPlayTimerRef.current = setTimeout(goNext, AUTO_ADVANCE_DELAY)
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current)
      }
    }
  }, [autoPlay, isActive, currentIndex, battles.length, goNext])

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'Escape') {
        onClose()
      } else if (e.key === ' ') {
        e.preventDefault()
        setAutoPlay((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isActive, goNext, goPrev, onClose])

  if (!isActive || battles.length === 0) return null

  const battle = battles[currentIndex]
  const progress = battles.length > 1 ? currentIndex / (battles.length - 1) : 1

  return (
    <div
      className="fixed top-6 left-1/2 z-50 pointer-events-none"
      style={{
        transform: 'translateX(-50%)',
        width: 'min(520px, calc(100vw - 48px))',
      }}
    >
      <div
        className="pointer-events-auto glass-panel px-6 py-4"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h2
              className="text-base leading-tight truncate"
              style={{
                fontFamily: 'var(--font-family-display)',
                color: 'var(--color-war-gold)',
                letterSpacing: '0.05em',
              }}
            >
              {battle.name}
            </h2>
            <p
              className="text-xs mt-1"
              style={{
                fontFamily: 'var(--font-family-body)',
                color: 'rgba(200, 200, 210, 0.6)',
              }}
            >
              Battle {currentIndex + 1} of {battles.length}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-200 cursor-pointer ml-3"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(200, 200, 210, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.color = 'rgba(200, 200, 210, 0.5)'
            }}
            aria-label="Close tour"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div
          className="w-full rounded-full overflow-hidden mb-3"
          style={{
            height: 3,
            background: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: 'var(--color-war-gold)',
              transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 0 8px rgba(212, 160, 23, 0.4)',
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Previous */}
            <TourButton
              onClick={goPrev}
              disabled={currentIndex === 0}
              ariaLabel="Previous battle"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2L4 7l5 5" />
              </svg>
            </TourButton>

            {/* Auto-play toggle */}
            <TourButton
              onClick={() => setAutoPlay((prev) => !prev)}
              ariaLabel={autoPlay ? 'Pause auto-advance' : 'Start auto-advance'}
              active={autoPlay}
            >
              {autoPlay ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="2" y="1" width="3" height="10" rx="0.5" />
                  <rect x="7" y="1" width="3" height="10" rx="0.5" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2.5 1.5l8 4.5-8 4.5V1.5z" />
                </svg>
              )}
            </TourButton>

            {/* Next */}
            <TourButton
              onClick={goNext}
              disabled={currentIndex >= battles.length - 1}
              ariaLabel="Next battle"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 2l5 5-5 5" />
              </svg>
            </TourButton>
          </div>

          {/* Battle year */}
          <span
            className="text-xs"
            style={{
              fontFamily: 'var(--font-family-body)',
              color: 'rgba(212, 160, 23, 0.6)',
            }}
          >
            {battle.year < 0 ? `${Math.abs(battle.year)} BCE` : `${battle.year} CE`}
          </span>
        </div>
      </div>
    </div>
  )
}

/** Small control button used in the tour overlay */
function TourButton({
  onClick,
  disabled,
  ariaLabel,
  active,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  ariaLabel: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer disabled:cursor-default"
      style={{
        background: active ? 'rgba(212, 160, 23, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        color: disabled
          ? 'rgba(200, 200, 210, 0.2)'
          : active
            ? 'var(--color-war-gold)'
            : 'rgba(200, 200, 210, 0.7)',
        border: `1px solid ${active ? 'rgba(212, 160, 23, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = active
            ? 'rgba(212, 160, 23, 0.25)'
            : 'rgba(255, 255, 255, 0.1)'
          e.currentTarget.style.borderColor = active
            ? 'rgba(212, 160, 23, 0.5)'
            : 'rgba(255, 255, 255, 0.15)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active
          ? 'rgba(212, 160, 23, 0.15)'
          : 'rgba(255, 255, 255, 0.05)'
        e.currentTarget.style.borderColor = active
          ? 'rgba(212, 160, 23, 0.3)'
          : 'rgba(255, 255, 255, 0.08)'
      }}
    >
      {children}
    </button>
  )
}
