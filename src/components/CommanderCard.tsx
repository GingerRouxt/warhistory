import { useEffect, useMemo } from 'react'
import type { Battle } from '../types/battle'
import { formatYear } from '../utils/format'

interface CommanderCardProps {
  commanderName: string | null
  allBattles: Battle[]
  onSelectBattle: (battle: Battle) => void
  onClose: () => void
}

export function CommanderCard({ commanderName, allBattles, onSelectBattle, onClose }: CommanderCardProps) {
  useEffect(() => {
    if (!commanderName) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [commanderName, onClose])

  const commanderBattles = useMemo(() => {
    if (!commanderName) return []
    const name = commanderName.toLowerCase()
    return allBattles.filter((b) => {
      if (b.commanders?.some((c) => c.toLowerCase().includes(name))) return true
      if (b.belligerents?.some((s) => s.toLowerCase().includes(name))) return true
      return false
    })
  }, [commanderName, allBattles])

  const victories = useMemo(() => {
    return commanderBattles.filter((b) => {
      if (!b.result) return false
      const r = b.result.toLowerCase()
      return r.includes('victory') || r.includes('decisive')
    }).length
  }, [commanderBattles])

  if (!commanderName) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingTop: '20vh' }}
    >
      <div
        className="pointer-events-auto glass-panel"
        style={{
          maxWidth: 400,
          width: 'calc(100vw - 48px)',
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          alignSelf: 'flex-start',
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between">
          <div>
            <h2
              className="text-base leading-tight"
              style={{
                fontFamily: 'var(--font-family-display)',
                color: 'var(--color-war-gold)',
                letterSpacing: '0.05em',
              }}
            >
              {commanderName}
            </h2>
            <p className="text-[10px] mt-1" style={{ color: 'rgba(200, 200, 210, 0.4)' }}>
              Commander Profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-200 cursor-pointer"
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
            aria-label="Close commander card"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(212, 160, 23, 0.3), transparent)',
          }}
        />

        {/* Battle list */}
        <div className="flex-1 overflow-y-auto px-5 py-3" style={{ minHeight: 0 }}>
          {commanderBattles.length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: 'rgba(200, 200, 210, 0.4)' }}>
              No battles found for this commander.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {commanderBattles.map((battle) => (
                <button
                  key={battle.id}
                  onClick={() => {
                    onSelectBattle(battle)
                    onClose()
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer"
                  style={{
                    background: 'transparent',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(212, 160, 23, 0.08)'
                    e.currentTarget.style.borderColor = 'rgba(212, 160, 23, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'transparent'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm truncate"
                      style={{
                        color: 'rgba(220, 220, 230, 0.9)',
                        fontFamily: 'var(--font-family-body)',
                      }}
                    >
                      {battle.name}
                    </span>
                    <span
                      className="text-[10px] flex-shrink-0 ml-2"
                      style={{ color: 'rgba(212, 160, 23, 0.5)' }}
                    >
                      {formatYear(battle.year)}
                    </span>
                  </div>
                  {battle.result && (
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(200, 200, 210, 0.4)' }}>
                      {battle.result}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3"
          style={{
            borderTop: '1px solid rgba(212, 160, 23, 0.1)',
          }}
        >
          <p className="text-[10px]" style={{ color: 'rgba(200, 200, 210, 0.4)' }}>
            {commanderBattles.length} battle{commanderBattles.length !== 1 ? 's' : ''}, {victories} victor{victories !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
