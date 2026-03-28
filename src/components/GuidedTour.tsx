import { useState, useEffect, useRef, useCallback } from 'react'
import type { Battle } from '../types/battle'
import { formatYear } from '../utils/format'
import erasData from '../data/eras.json'

export interface GuidedTourProps {
  battles: Battle[]
  isActive: boolean
  onBattleSelect: (battle: Battle) => void
  onClose: () => void
}

const AUTO_ADVANCE_DELAY = 6000 // ms between auto-advance

const ERA_META: Record<string, { name: string; color: string }> = {}
for (const era of erasData) {
  ERA_META[era.id] = { name: era.name, color: era.color }
}

/**
 * Glass-panel overlay that provides guided tour mode through a sequence of battles.
 * Auto-plays through battles with prev/next controls and a progress bar.
 */
export function GuidedTour({ battles, isActive, onBattleSelect, onClose }: GuidedTourProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [countdownProgress, setCountdownProgress] = useState(0)
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<number>(0)
  const countdownStartRef = useRef<number>(0)

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

  // Countdown ring animation
  useEffect(() => {
    if (countdownRef.current) cancelAnimationFrame(countdownRef.current)

    if (autoPlay && isActive && currentIndex < battles.length - 1) {
      countdownStartRef.current = performance.now()
      setCountdownProgress(0)

      const tick = () => {
        const elapsed = performance.now() - countdownStartRef.current
        const progress = Math.min(elapsed / AUTO_ADVANCE_DELAY, 1)
        setCountdownProgress(progress)
        if (progress < 1) {
          countdownRef.current = requestAnimationFrame(tick)
        }
      }
      countdownRef.current = requestAnimationFrame(tick)
    } else {
      setCountdownProgress(0)
    }

    return () => {
      if (countdownRef.current) cancelAnimationFrame(countdownRef.current)
    }
  }, [autoPlay, isActive, currentIndex, battles.length])

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
  const eraMeta = ERA_META[battle.era]

  // Progress dots: max 20 visible, with ellipsis in middle if more
  const totalDots = battles.length
  const MAX_DOTS = 20
  let dotIndices: (number | 'ellipsis')[]
  if (totalDots <= MAX_DOTS) {
    dotIndices = Array.from({ length: totalDots }, (_, i) => i)
  } else {
    const first = Array.from({ length: 10 }, (_, i) => i)
    const last = Array.from({ length: 10 }, (_, i) => totalDots - 10 + i)
    dotIndices = [...first, 'ellipsis' as const, ...last]
  }

  // SVG countdown ring params
  const ringRadius = 12
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference * (1 - countdownProgress)

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
        <div className="flex items-center justify-between mb-2">
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
            {/* Mini battle info */}
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs"
                style={{
                  fontFamily: 'var(--font-family-body)',
                  color: 'rgba(200, 200, 210, 0.6)',
                }}
              >
                {formatYear(battle.year)}
              </span>
              {eraMeta && (
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: eraMeta.color }}
                  />
                  <span
                    className="text-[10px]"
                    style={{ color: eraMeta.color }}
                  >
                    {eraMeta.name}
                  </span>
                </span>
              )}
            </div>
            {battle.belligerents && (
              <p
                className="text-[10px] mt-0.5 truncate"
                style={{ color: 'rgba(200, 200, 210, 0.4)' }}
              >
                {battle.belligerents[0]} vs {battle.belligerents[1]}
              </p>
            )}
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

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1 mb-3 flex-wrap" style={{ minHeight: 12 }}>
          {dotIndices.map((idx, i) => {
            if (idx === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${i}`}
                  className="text-[10px] px-0.5"
                  style={{ color: 'rgba(200, 200, 210, 0.3)' }}
                >
                  ...
                </span>
              )
            }
            const isCurrent = idx === currentIndex
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className="rounded-full transition-all duration-200 cursor-pointer"
                style={{
                  width: isCurrent ? 8 : 6,
                  height: isCurrent ? 8 : 6,
                  background: isCurrent
                    ? 'var(--color-war-gold)'
                    : 'rgba(200, 200, 210, 0.2)',
                  border: 'none',
                  padding: 0,
                  boxShadow: isCurrent ? '0 0 6px rgba(212, 160, 23, 0.5)' : 'none',
                }}
                aria-label={`Go to battle ${idx + 1}`}
              />
            )
          })}
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

            {/* Auto-play toggle with countdown ring */}
            <div className="relative" style={{ width: 32, height: 32 }}>
              {autoPlay && (
                <svg
                  className="absolute inset-0"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  <circle
                    cx="16"
                    cy="16"
                    r={ringRadius}
                    fill="none"
                    stroke="rgba(212, 160, 23, 0.15)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r={ringRadius}
                    fill="none"
                    stroke="var(--color-war-gold)"
                    strokeWidth="2"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                  />
                </svg>
              )}
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
            </div>

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

          {/* Battle counter */}
          <span
            className="text-xs"
            style={{
              fontFamily: 'var(--font-family-body)',
              color: 'rgba(212, 160, 23, 0.6)',
            }}
          >
            {currentIndex + 1} / {battles.length}
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
