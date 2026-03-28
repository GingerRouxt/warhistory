import { useMemo } from 'react'
import type { Battle } from '../types/battle'
import { formatYear } from '../utils/format'

interface BattleTooltipProps {
  battle: Battle | null
  screenX: number
  screenY: number
}

const TOOLTIP_MAX_WIDTH = 280
const TOOLTIP_MARGIN = 12

function clampPosition(x: number, y: number): { left: number; top: number } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080

  let left = x + 16
  let top = y - 12

  // Clamp right edge
  if (left + TOOLTIP_MAX_WIDTH > vw - TOOLTIP_MARGIN) {
    left = x - TOOLTIP_MAX_WIDTH - 16
  }
  // Clamp left edge
  if (left < TOOLTIP_MARGIN) {
    left = TOOLTIP_MARGIN
  }
  // Clamp bottom (rough estimate of tooltip height ~80px)
  if (top + 80 > vh - TOOLTIP_MARGIN) {
    top = vh - TOOLTIP_MARGIN - 80
  }
  // Clamp top
  if (top < TOOLTIP_MARGIN) {
    top = TOOLTIP_MARGIN
  }

  return { left, top }
}

const GoldStar = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="#d4a017"
    style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }}
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

export function BattleTooltip({ battle, screenX, screenY }: BattleTooltipProps) {
  const position = useMemo(
    () => clampPosition(screenX, screenY),
    [screenX, screenY],
  )

  if (!battle) {
    return (
      <div
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.15s',
          zIndex: 10000,
        }}
      />
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        pointerEvents: 'none',
        background: 'rgba(10, 10, 15, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(212, 160, 23, 0.25)',
        borderRadius: 8,
        padding: '8px 14px',
        zIndex: 10000,
        maxWidth: TOOLTIP_MAX_WIDTH,
        opacity: 1,
        transition: 'opacity 0.15s',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: '#f5e6c8',
          lineHeight: 1.3,
        }}
      >
        {battle.tier === 1 && <GoldStar />}
        {battle.name}
      </div>

      <div
        style={{
          fontSize: 12,
          color: 'rgba(212, 160, 23, 0.7)',
          marginTop: 2,
        }}
      >
        {formatYear(battle.year)}
      </div>

      {battle.belligerents && (
        <div
          style={{
            fontSize: 11,
            color: 'rgba(245, 230, 200, 0.5)',
            marginTop: 3,
          }}
        >
          {battle.belligerents[0]} vs {battle.belligerents[1]}
        </div>
      )}
    </div>
  )
}
