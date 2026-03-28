import { useState, useEffect } from 'react'
import type { Battle } from '../types/battle'

interface BattleCardProps {
  battle: Battle | null
  onClose: () => void
}

const ERA_LABELS: Record<string, string> = {
  biblical: 'Biblical Era',
  classical: 'Classical Antiquity',
  medieval: 'Medieval Period',
  'early-modern': 'Early Modern',
  modern: 'Modern Era',
  contemporary: 'Contemporary',
}

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`
  return `${year} CE`
}

function OutcomeBadge({ result }: { result: string }) {
  const lower = result.toLowerCase()
  let bg = 'rgba(112, 128, 144, 0.3)'
  let border = 'rgba(112, 128, 144, 0.5)'
  let color = '#b0b8c4'

  if (lower.includes('victory') || lower.includes('won') || lower.includes('decisive')) {
    bg = 'rgba(34, 139, 34, 0.15)'
    border = 'rgba(34, 139, 34, 0.4)'
    color = '#66bb6a'
  } else if (lower.includes('defeat') || lower.includes('lost')) {
    bg = 'rgba(139, 0, 0, 0.15)'
    border = 'rgba(139, 0, 0, 0.4)'
    color = '#ef5350'
  } else if (lower.includes('draw') || lower.includes('inconclusive') || lower.includes('stalemate')) {
    bg = 'rgba(212, 160, 23, 0.15)'
    border = 'rgba(212, 160, 23, 0.4)'
    color = '#d4a017'
  }

  return (
    <span
      className="inline-block px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-full"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      {result}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-[10px] uppercase tracking-[0.2em] mb-2"
      style={{ color: 'rgba(212, 160, 23, 0.6)' }}
    >
      {children}
    </h3>
  )
}

function Divider() {
  return (
    <div
      className="my-4"
      style={{
        height: 1,
        background: 'linear-gradient(to right, transparent, rgba(212, 160, 23, 0.3), transparent)',
      }}
    />
  )
}

export function BattleCard({ battle, onClose }: BattleCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (battle) {
      setShouldRender(true)
      // Trigger slide-in on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true))
      })
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => setShouldRender(false), 400)
      return () => clearTimeout(timer)
    }
  }, [battle])

  if (!shouldRender || !battle) return null

  return (
    <div
      className="fixed top-0 right-0 z-40 h-full pointer-events-none"
      style={{ width: 380 }}
    >
      <div
        className="h-full pointer-events-auto glass-panel overflow-y-auto"
        style={{
          transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          borderRadius: '12px 0 0 12px',
          borderRight: 'none',
          paddingBottom: 100, // space for timeline
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 pt-6 pb-4" style={{ background: 'linear-gradient(to bottom, rgba(10, 10, 20, 0.98), rgba(10, 10, 20, 0.85))' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h2
                className="text-xl leading-tight"
                style={{
                  fontFamily: 'var(--font-family-display)',
                  color: 'var(--color-war-gold)',
                }}
              >
                {battle.name}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-sm" style={{ color: 'rgba(200, 200, 210, 0.7)' }}>
                <span>{formatYear(battle.year)}</span>
                <span style={{ color: 'rgba(212, 160, 23, 0.3)' }}>|</span>
                <span>{ERA_LABELS[battle.era] || battle.era}</span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-200 cursor-pointer"
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
              aria-label="Close battle details"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6">
          <Divider />

          {/* Belligerents */}
          {battle.belligerents && battle.belligerents.length === 2 && (
            <div className="mb-4">
              <SectionLabel>Belligerents</SectionLabel>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 text-center">
                  <div
                    className="text-sm font-medium py-2 px-3 rounded-lg"
                    style={{
                      background: 'rgba(30, 60, 120, 0.2)',
                      border: '1px solid rgba(60, 120, 200, 0.2)',
                      color: 'rgba(140, 180, 240, 0.9)',
                    }}
                  >
                    {battle.belligerents[0]}
                  </div>
                </div>
                <div
                  className="text-xs font-bold flex-shrink-0"
                  style={{ color: 'rgba(212, 160, 23, 0.4)' }}
                >
                  VS
                </div>
                <div className="flex-1 text-center">
                  <div
                    className="text-sm font-medium py-2 px-3 rounded-lg"
                    style={{
                      background: 'rgba(120, 30, 30, 0.2)',
                      border: '1px solid rgba(200, 60, 60, 0.2)',
                      color: 'rgba(240, 140, 140, 0.9)',
                    }}
                  >
                    {battle.belligerents[1]}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Outcome */}
          {battle.result && (
            <div className="mb-4">
              <SectionLabel>Outcome</SectionLabel>
              <OutcomeBadge result={battle.result} />
            </div>
          )}

          <Divider />

          {/* Biblical section */}
          {battle.biblical && (
            <>
              <div className="mb-4">
                <SectionLabel>Scripture</SectionLabel>
                <div
                  className="rounded-lg p-4"
                  style={{
                    background: 'rgba(212, 160, 23, 0.06)',
                    border: '1px solid rgba(212, 160, 23, 0.15)',
                  }}
                >
                  {battle.scriptureRef && (
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider rounded font-medium"
                        style={{
                          background: 'rgba(212, 160, 23, 0.15)',
                          color: 'var(--color-war-gold)',
                        }}
                      >
                        {battle.scriptureRef.split(' ')[0]}
                      </span>
                      <span
                        className="text-sm italic"
                        style={{
                          color: 'var(--color-war-gold)',
                          fontFamily: 'var(--font-family-display)',
                        }}
                      >
                        {battle.scriptureRef}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Divider />
            </>
          )}

          {/* Description */}
          <div className="mb-4">
            <SectionLabel>Account</SectionLabel>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'rgba(220, 220, 230, 0.85)' }}
            >
              {battle.description}
            </p>
          </div>

          {/* Location */}
          <div className="mb-4">
            <SectionLabel>Coordinates</SectionLabel>
            <p className="text-xs font-mono" style={{ color: 'rgba(200, 200, 210, 0.5)' }}>
              {battle.location.lat.toFixed(3)}N, {battle.location.lng.toFixed(3)}E
            </p>
          </div>

          <Divider />

          {/* Tier indicator */}
          <div className="mb-4">
            <SectionLabel>Significance</SectionLabel>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((t) => (
                <div
                  key={t}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background:
                      t <= battle.tier
                        ? 'var(--color-war-gold)'
                        : 'rgba(255, 255, 255, 0.1)',
                    boxShadow:
                      t <= battle.tier
                        ? '0 0 6px rgba(212, 160, 23, 0.4)'
                        : 'none',
                  }}
                />
              ))}
              <span
                className="text-xs ml-2"
                style={{ color: 'rgba(200, 200, 210, 0.5)' }}
              >
                {battle.tier === 1 ? 'Major' : battle.tier === 2 ? 'Notable' : 'Minor'}
              </span>
            </div>
          </div>

          {/* Source attribution */}
          <div className="mt-8 pb-4">
            <p className="text-[10px]" style={{ color: 'rgba(200, 200, 210, 0.3)' }}>
              {battle.biblical
                ? 'Source: Holy Scripture (ESV). Dates approximate per conservative chronology.'
                : 'Source: Historical records. Dates based on scholarly consensus.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
