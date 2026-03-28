import { useEffect, useState } from 'react'
import type { Battle } from '../types/battle'
import { formatYear, formatNumber } from '../utils/format'
import erasData from '../data/eras.json'

interface BattleComparisonProps {
  battle1: Battle | null
  battle2: Battle | null
  isOpen: boolean
  onClose: () => void
}

const ERA_META: Record<string, { name: string; color: string }> = {}
for (const era of erasData) {
  ERA_META[era.id] = { name: era.name, color: era.color }
}

export function BattleComparison({ battle1, battle2, isOpen, onClose }: BattleComparisonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen && battle1 && battle2) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true))
      })
    } else {
      setIsVisible(false)
    }
  }, [isOpen, battle1, battle2])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen || !battle1 || !battle2) return null

  return (
    <div
      className="fixed left-0 right-0 z-50"
      style={{
        bottom: 80,
        pointerEvents: 'none',
      }}
    >
      <div
        className="mx-auto pointer-events-auto glass-panel"
        style={{
          maxWidth: 900,
          width: 'calc(100vw - 48px)',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
          transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          padding: '24px 28px',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-200 cursor-pointer"
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
          aria-label="Close comparison"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>

        <h3
          className="text-xs uppercase tracking-[0.2em] mb-4"
          style={{ color: 'rgba(212, 160, 23, 0.6)' }}
        >
          Battle Comparison
        </h3>

        <div className="grid grid-cols-2 gap-6">
          <BattleColumn battle={battle1} />
          <BattleColumn battle={battle2} />
        </div>

        {/* Casualty comparison bars */}
        {(battle1.casualties || battle2.casualties) && (
          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-[0.15em] mb-2" style={{ color: 'rgba(200, 200, 210, 0.4)' }}>
              Casualties
            </p>
            <ComparisonBars
              label1={battle1.name}
              label2={battle2.name}
              value1={battle1.casualties?.total ?? (battle1.casualties?.side1 ?? 0) + (battle1.casualties?.side2 ?? 0)}
              value2={battle2.casualties?.total ?? (battle2.casualties?.side1 ?? 0) + (battle2.casualties?.side2 ?? 0)}
              color1="#4a90d9"
              color2="#d94a4a"
            />
          </div>
        )}

        {/* Troop strength comparison bars */}
        {(battle1.troopStrength || battle2.troopStrength) && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-[0.15em] mb-2" style={{ color: 'rgba(200, 200, 210, 0.4)' }}>
              Troop Strength
            </p>
            <ComparisonBars
              label1={battle1.name}
              label2={battle2.name}
              value1={(battle1.troopStrength?.side1 ?? 0) + (battle1.troopStrength?.side2 ?? 0)}
              value2={(battle2.troopStrength?.side1 ?? 0) + (battle2.troopStrength?.side2 ?? 0)}
              color1="#4a90d9"
              color2="#d94a4a"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function BattleColumn({ battle }: { battle: Battle }) {
  const era = ERA_META[battle.era]
  return (
    <div>
      <h4
        className="text-base leading-tight mb-1"
        style={{
          fontFamily: 'var(--font-family-display)',
          color: 'var(--color-war-gold)',
          letterSpacing: '0.04em',
        }}
      >
        {battle.name}
      </h4>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs" style={{ color: 'rgba(200, 200, 210, 0.6)', fontFamily: 'var(--font-family-body)' }}>
          {formatYear(battle.year)}
        </span>
        {era && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{
              background: `${era.color}20`,
              color: era.color,
              border: `1px solid ${era.color}40`,
            }}
          >
            {era.name}
          </span>
        )}
      </div>

      {battle.belligerents && (
        <p className="text-xs mb-1" style={{ color: 'rgba(200, 200, 210, 0.7)' }}>
          <span style={{ color: 'rgba(212, 160, 23, 0.5)' }}>Sides: </span>
          {battle.belligerents[0]} vs {battle.belligerents[1]}
        </p>
      )}
      {battle.commanders && (
        <p className="text-xs mb-1" style={{ color: 'rgba(200, 200, 210, 0.7)' }}>
          <span style={{ color: 'rgba(212, 160, 23, 0.5)' }}>Commanders: </span>
          {battle.commanders[0]} vs {battle.commanders[1]}
        </p>
      )}
      {battle.result && (
        <p className="text-xs" style={{ color: 'rgba(200, 200, 210, 0.7)' }}>
          <span style={{ color: 'rgba(212, 160, 23, 0.5)' }}>Result: </span>
          {battle.result}
        </p>
      )}
    </div>
  )
}

function ComparisonBars({
  label1,
  label2,
  value1,
  value2,
  color1,
  color2,
}: {
  label1: string
  label2: string
  value1: number
  value2: number
  color1: string
  color2: string
}) {
  const maxVal = Math.max(value1, value2, 1)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-[10px] w-20 truncate text-right" style={{ color: 'rgba(200, 200, 210, 0.5)' }}>
          {label1}
        </span>
        <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
          <div
            className="h-full rounded-sm transition-all duration-700"
            style={{
              width: `${(value1 / maxVal) * 100}%`,
              background: color1,
              opacity: 0.7,
            }}
          />
        </div>
        <span className="text-[10px] w-14 text-right" style={{ color: 'rgba(200, 200, 210, 0.6)', fontFamily: 'var(--font-family-body)' }}>
          {formatNumber(value1)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] w-20 truncate text-right" style={{ color: 'rgba(200, 200, 210, 0.5)' }}>
          {label2}
        </span>
        <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
          <div
            className="h-full rounded-sm transition-all duration-700"
            style={{
              width: `${(value2 / maxVal) * 100}%`,
              background: color2,
              opacity: 0.7,
            }}
          />
        </div>
        <span className="text-[10px] w-14 text-right" style={{ color: 'rgba(200, 200, 210, 0.6)', fontFamily: 'var(--font-family-body)' }}>
          {formatNumber(value2)}
        </span>
      </div>
    </div>
  )
}
