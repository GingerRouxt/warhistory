import { useState, useEffect } from 'react'
import type { Battle } from '../types/battle'
import { formatYear } from '../utils/format'
import { useAppUI, useAppUIDispatch } from '../contexts/AppUIContext'

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

/** Small decorative cross SVG in gold */
function CrossIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <rect x="5" y="1" width="2" height="10" rx="0.5" fill="var(--color-war-gold)" />
      <rect x="2" y="3.5" width="8" height="2" rx="0.5" fill="var(--color-war-gold)" />
    </svg>
  )
}

/** Casualty visualization bar */
function CasualtyBar({ casualties, belligerents }: {
  casualties: { side1?: number; side2?: number; total?: number }
  belligerents?: [string, string]
}) {
  const s1 = casualties.side1 ?? 0
  const s2 = casualties.side2 ?? 0
  const total = casualties.total ?? (s1 + s2)
  if (total === 0) return null

  const s1Pct = total > 0 ? (s1 / total) * 100 : 50
  const s2Pct = total > 0 ? (s2 / total) * 100 : 50

  const formatNum = (n: number) => n.toLocaleString()

  return (
    <div>
      <SectionLabel>Casualties</SectionLabel>
      {(s1 > 0 || s2 > 0) && (
        <div className="flex gap-1 mb-2" style={{ height: 8, borderRadius: 4, overflow: 'hidden' }}>
          {s1 > 0 && (
            <div
              style={{
                width: `${s1Pct}%`,
                background: 'linear-gradient(90deg, rgba(60, 120, 200, 0.7), rgba(60, 120, 200, 0.4))',
                borderRadius: '4px 0 0 4px',
              }}
            />
          )}
          {s2 > 0 && (
            <div
              style={{
                width: `${s2Pct}%`,
                background: 'linear-gradient(90deg, rgba(200, 60, 60, 0.4), rgba(200, 60, 60, 0.7))',
                borderRadius: '0 4px 4px 0',
              }}
            />
          )}
        </div>
      )}
      <div className="flex justify-between text-xs" style={{ color: 'rgba(200, 200, 210, 0.6)' }}>
        {s1 > 0 && (
          <span style={{ color: 'rgba(140, 180, 240, 0.9)' }}>
            {belligerents?.[0] ?? 'Side 1'}: {formatNum(s1)}
          </span>
        )}
        {s2 > 0 && (
          <span style={{ color: 'rgba(240, 140, 140, 0.9)' }}>
            {belligerents?.[1] ?? 'Side 2'}: {formatNum(s2)}
          </span>
        )}
      </div>
      {casualties.total != null && (
        <div className="text-xs mt-1" style={{ color: 'rgba(200, 200, 210, 0.5)' }}>
          Total: {formatNum(total)}
        </div>
      )}
    </div>
  )
}

export function BattleCard({ battle, onClose }: BattleCardProps) {
  const ui = useAppUI()
  const dispatch = useAppUIDispatch()
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const isComparing = ui.compareOpen && ui.compareBattle?.id === battle?.id

  useEffect(() => {
    if (battle) {
      setShouldRender(true)
      setShowDetails(false)
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

  const mapsUrl = `https://www.google.com/maps/@${battle.location.lat},${battle.location.lng},12z`

  return (
    <div
      className="fixed top-0 right-0 z-40 h-full pointer-events-none"
      style={{ width: 380, maxWidth: '90vw' }}
    >
      <div
        className="h-full pointer-events-auto glass-panel elevation-2 overflow-y-auto smooth-scroll"
        style={{
          transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          borderRadius: '12px 0 0 12px',
          borderRight: 'none',
          paddingBottom: 100,
        }}
      >
        {/* Gold top line */}
        <div
          style={{
            height: 2,
            background: 'linear-gradient(to right, transparent, var(--color-war-gold), transparent)',
          }}
        />

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
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(200, 200, 210, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = '#fff'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.color = 'rgba(200, 200, 210, 0.5)'
                e.currentTarget.style.transform = 'scale(1)'
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
                    className="text-sm font-medium py-2 px-3 rounded-lg cursor-default"
                    style={{
                      background: 'rgba(30, 60, 120, 0.2)',
                      border: '1px solid rgba(60, 120, 200, 0.2)',
                      color: 'rgba(140, 180, 240, 0.9)',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(212, 160, 23, 0.5)'
                      e.currentTarget.style.textDecoration = 'underline'
                      e.currentTarget.style.textDecorationColor = 'rgba(212, 160, 23, 0.4)'
                      e.currentTarget.style.textUnderlineOffset = '3px'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(60, 120, 200, 0.2)'
                      e.currentTarget.style.textDecoration = 'none'
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
                    className="text-sm font-medium py-2 px-3 rounded-lg cursor-default"
                    style={{
                      background: 'rgba(120, 30, 30, 0.2)',
                      border: '1px solid rgba(200, 60, 60, 0.2)',
                      color: 'rgba(240, 140, 140, 0.9)',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(212, 160, 23, 0.5)'
                      e.currentTarget.style.textDecoration = 'underline'
                      e.currentTarget.style.textDecorationColor = 'rgba(212, 160, 23, 0.4)'
                      e.currentTarget.style.textUnderlineOffset = '3px'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(200, 60, 60, 0.2)'
                      e.currentTarget.style.textDecoration = 'none'
                    }}
                  >
                    {battle.belligerents[1]}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Commanders */}
          {battle.commanders && (
            <div className="mb-4">
              <SectionLabel>Commanders</SectionLabel>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 text-center">
                  <span className="text-sm" style={{ color: 'rgba(140, 180, 240, 0.9)' }}>
                    {battle.commanders[0]}
                  </span>
                </div>
                <div
                  className="text-xs flex-shrink-0"
                  style={{ color: 'rgba(212, 160, 23, 0.3)' }}
                >
                  vs
                </div>
                <div className="flex-1 text-center">
                  <span className="text-sm" style={{ color: 'rgba(240, 140, 140, 0.9)' }}>
                    {battle.commanders[1]}
                  </span>
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

          {/* Casualties */}
          {battle.casualties && (
            <div className="mb-4">
              <CasualtyBar casualties={battle.casualties} belligerents={battle.belligerents} />
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
                      <CrossIcon />
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

          {/* Compare button */}
          <div className="mb-4">
            <button
              onClick={() => {
                if (isComparing) {
                  dispatch({ type: 'SET_COMPARE', open: false, battle: null })
                } else {
                  dispatch({ type: 'SET_COMPARE', open: true, battle })
                }
              }}
              className="text-xs uppercase tracking-wider cursor-pointer px-3 py-1.5 rounded-full transition-all duration-200"
              style={{
                color: isComparing ? '#fff' : 'var(--color-war-gold)',
                background: isComparing ? 'rgba(212, 160, 23, 0.25)' : 'rgba(212, 160, 23, 0.08)',
                border: `1px solid ${isComparing ? 'rgba(212, 160, 23, 0.5)' : 'rgba(212, 160, 23, 0.2)'}`,
                fontFamily: 'var(--font-family-body)',
              }}
              aria-label={isComparing ? 'Clear battle comparison' : 'Compare this battle'}
            >
              {isComparing ? 'Clear Compare' : 'Compare'}
            </button>
          </div>

          {/* Expandable Details */}
          <div className="mb-4">
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="text-xs uppercase tracking-wider cursor-pointer"
              style={{
                color: 'rgba(212, 160, 23, 0.6)',
                background: 'none',
                border: 'none',
                fontFamily: 'var(--font-family-body)',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-war-gold)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(212, 160, 23, 0.6)'
              }}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
              <span style={{ marginLeft: 4, display: 'inline-block', transform: showDetails ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                &#9662;
              </span>
            </button>

            {showDetails && (
              <div
                className="mt-3 rounded-lg p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  animation: 'slide-up 0.3s ease-out',
                }}
              >
                <div className="mb-3">
                  <SectionLabel>Precise Location</SectionLabel>
                  <p className="text-xs font-mono" style={{ color: 'rgba(200, 200, 210, 0.6)' }}>
                    Latitude: {battle.location.lat.toFixed(6)}<br />
                    Longitude: {battle.location.lng.toFixed(6)}
                  </p>
                </div>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs uppercase tracking-wider mt-2"
                  style={{
                    color: 'var(--color-war-gold)',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(212, 160, 23, 0.3)',
                    paddingBottom: 1,
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderBottomColor = 'var(--color-war-gold)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderBottomColor = 'rgba(212, 160, 23, 0.3)'
                  }}
                >
                  View on Google Maps &rarr;
                </a>

                <Divider />

                <div>
                  <SectionLabel>Source</SectionLabel>
                  <p className="text-[10px]" style={{ color: 'rgba(200, 200, 210, 0.4)' }}>
                    {battle.biblical
                      ? 'Holy Scripture (ESV). Dates approximate per conservative chronology.'
                      : 'Historical records. Dates based on scholarly consensus.'}
                  </p>
                </div>
              </div>
            )}
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
