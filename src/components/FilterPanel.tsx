import { useRef, useEffect } from 'react'
import erasData from '../data/eras.json'

interface FilterPanelProps {
  eras: string[]
  onErasChange: (eras: string[]) => void
  biblicalOnly: boolean
  onBiblicalOnlyChange: (val: boolean) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  isOpen: boolean
  onToggle: () => void
  battleCount: number
}

const ERA_COLORS: Record<string, string> = {}
const ERA_NAMES: Record<string, string> = {}
for (const era of erasData) {
  ERA_COLORS[era.id] = era.color
  ERA_NAMES[era.id] = era.name
}

const ERA_IDS = erasData.map((e) => e.id)

function Divider() {
  return (
    <div
      className="my-4"
      style={{
        height: 1,
        background:
          'linear-gradient(to right, transparent, rgba(212, 160, 23, 0.3), transparent)',
      }}
    />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-[10px] uppercase tracking-[0.2em] mb-3"
      style={{ color: 'rgba(212, 160, 23, 0.6)' }}
    >
      {children}
    </h3>
  )
}

export function FilterPanel({
  eras,
  onErasChange,
  biblicalOnly,
  onBiblicalOnlyChange,
  searchQuery,
  onSearchChange,
  isOpen,
  onToggle,
  battleCount,
}: FilterPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 350)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  function handleEraToggle(eraId: string) {
    if (eras.includes(eraId)) {
      onErasChange(eras.filter((e) => e !== eraId))
    } else {
      onErasChange([...eras, eraId])
    }
  }

  function handleSelectAll() {
    if (eras.length === ERA_IDS.length) {
      onErasChange([])
    } else {
      onErasChange([...ERA_IDS])
    }
  }

  const allSelected = eras.length === ERA_IDS.length

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        onClick={onToggle}
        className="fixed top-5 left-5 z-50 w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-300"
        style={{
          background: isOpen
            ? 'rgba(212, 160, 23, 0.15)'
            : 'var(--color-war-panel)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${
            isOpen
              ? 'rgba(212, 160, 23, 0.4)'
              : 'var(--color-war-panel-border)'
          }`,
          color: isOpen ? 'var(--color-war-gold)' : 'rgba(200, 200, 210, 0.7)',
          boxShadow: isOpen
            ? '0 0 20px rgba(212, 160, 23, 0.15)'
            : '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(212, 160, 23, 0.5)'
          e.currentTarget.style.color = 'var(--color-war-gold)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = isOpen
            ? 'rgba(212, 160, 23, 0.4)'
            : 'rgba(212, 160, 23, 0.2)'
          e.currentTarget.style.color = isOpen
            ? 'var(--color-war-gold)'
            : 'rgba(200, 200, 210, 0.7)'
        }}
        aria-label={isOpen ? 'Close filters' : 'Open filters'}
      >
        {isOpen ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M2 2l12 12M14 2L2 14" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M1 3.5h14M1 8h10M1 12.5h7" />
          </svg>
        )}
      </button>

      {/* Panel */}
      <div
        className="fixed top-0 left-0 z-40 h-full pointer-events-none"
        style={{ width: 300 }}
      >
        <div
          className="h-full pointer-events-auto glass-panel overflow-y-auto"
          style={{
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            borderRadius: '0 12px 12px 0',
            borderLeft: 'none',
          }}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 px-5 pt-16 pb-4"
            style={{
              background:
                'linear-gradient(to bottom, rgba(10, 10, 20, 0.98), rgba(10, 10, 20, 0.85))',
            }}
          >
            <h2
              className="text-lg leading-tight"
              style={{
                fontFamily: 'var(--font-family-display)',
                color: 'var(--color-war-gold)',
              }}
            >
              Filters
            </h2>
            <p
              className="text-xs mt-1"
              style={{ color: 'rgba(200, 200, 210, 0.5)' }}
            >
              {battleCount} battle{battleCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="px-5 pb-8">
            {/* Search */}
            <div className="mb-5">
              <SectionLabel>Search</SectionLabel>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="rgba(200, 200, 210, 0.4)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <circle cx="6.5" cy="6.5" r="5.5" />
                  <path d="M10.5 10.5L15 15" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Battle, nation, location..."
                  className="w-full text-sm rounded-lg pl-9 pr-3 py-2 outline-none transition-colors duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(212, 160, 23, 0.15)',
                    color: 'rgba(220, 220, 230, 0.9)',
                    fontFamily: 'var(--font-family-body)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      'rgba(212, 160, 23, 0.4)'
                    e.currentTarget.style.boxShadow =
                      '0 0 12px rgba(212, 160, 23, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      'rgba(212, 160, 23, 0.15)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full cursor-pointer"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'rgba(200, 200, 210, 0.5)',
                    }}
                    aria-label="Clear search"
                  >
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M1 1l6 6M7 1L1 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <Divider />

            {/* Biblical Only toggle */}
            <div className="mb-5">
              <button
                onClick={() => onBiblicalOnlyChange(!biblicalOnly)}
                className="w-full flex items-center justify-between rounded-lg px-4 py-3 cursor-pointer transition-all duration-200"
                style={{
                  background: biblicalOnly
                    ? 'rgba(212, 160, 23, 0.12)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${
                    biblicalOnly
                      ? 'rgba(212, 160, 23, 0.35)'
                      : 'rgba(212, 160, 23, 0.1)'
                  }`,
                  boxShadow: biblicalOnly
                    ? '0 0 16px rgba(212, 160, 23, 0.08), inset 0 1px 0 rgba(212, 160, 23, 0.1)'
                    : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!biblicalOnly) {
                    e.currentTarget.style.borderColor =
                      'rgba(212, 160, 23, 0.25)'
                    e.currentTarget.style.background =
                      'rgba(212, 160, 23, 0.06)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!biblicalOnly) {
                    e.currentTarget.style.borderColor =
                      'rgba(212, 160, 23, 0.1)'
                    e.currentTarget.style.background =
                      'rgba(255, 255, 255, 0.03)'
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-base"
                    style={{
                      filter: biblicalOnly ? 'none' : 'grayscale(0.5)',
                      opacity: biblicalOnly ? 1 : 0.6,
                    }}
                  >
                    &#x2719;
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{
                      fontFamily: 'var(--font-family-display)',
                      color: biblicalOnly
                        ? 'var(--color-war-gold)'
                        : 'rgba(200, 200, 210, 0.7)',
                    }}
                  >
                    Biblical Only
                  </span>
                </div>
                {/* Toggle switch */}
                <div
                  className="relative w-9 h-5 rounded-full transition-colors duration-200"
                  style={{
                    background: biblicalOnly
                      ? 'rgba(212, 160, 23, 0.4)'
                      : 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
                    style={{
                      left: biblicalOnly ? 18 : 2,
                      background: biblicalOnly
                        ? 'var(--color-war-gold)'
                        : 'rgba(200, 200, 210, 0.4)',
                      boxShadow: biblicalOnly
                        ? '0 0 8px rgba(212, 160, 23, 0.5)'
                        : 'none',
                    }}
                  />
                </div>
              </button>
            </div>

            <Divider />

            {/* Era filters */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>Eras</SectionLabel>
                <button
                  onClick={handleSelectAll}
                  className="text-[10px] uppercase tracking-wider cursor-pointer transition-colors duration-200"
                  style={{
                    color: 'rgba(212, 160, 23, 0.5)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-war-gold)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(212, 160, 23, 0.5)'
                  }}
                >
                  {allSelected ? 'Clear All' : 'Select All'}
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {ERA_IDS.map((eraId) => {
                  const isActive = eras.includes(eraId)
                  const color = ERA_COLORS[eraId]
                  return (
                    <button
                      key={eraId}
                      onClick={() => handleEraToggle(eraId)}
                      className="flex items-center gap-3 w-full rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 text-left"
                      style={{
                        background: isActive
                          ? `rgba(${hexToRgb(color)}, 0.1)`
                          : 'transparent',
                        border: `1px solid ${
                          isActive
                            ? `rgba(${hexToRgb(color)}, 0.3)`
                            : 'transparent'
                        }`,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background =
                            'rgba(255, 255, 255, 0.03)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent'
                        }
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all duration-200"
                        style={{
                          background: isActive
                            ? color
                            : 'rgba(255, 255, 255, 0.06)',
                          border: `1.5px solid ${
                            isActive ? color : 'rgba(255, 255, 255, 0.15)'
                          }`,
                          boxShadow: isActive
                            ? `0 0 8px rgba(${hexToRgb(color)}, 0.4)`
                            : 'none',
                        }}
                      >
                        {isActive && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                            stroke={isLightColor(color) ? '#1a1a2e' : '#fff'}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2 5l2.5 2.5L8 3" />
                          </svg>
                        )}
                      </div>
                      {/* Era name */}
                      <span
                        className="text-sm"
                        style={{
                          color: isActive
                            ? color
                            : 'rgba(200, 200, 210, 0.6)',
                          fontFamily: 'var(--font-family-body)',
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        {ERA_NAMES[eraId]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Divider />

            {/* Footer attribution */}
            <p
              className="text-[10px] text-center mt-2"
              style={{ color: 'rgba(200, 200, 210, 0.25)' }}
            >
              Soli Deo Gloria
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

/** Convert hex color to r, g, b string for use in rgba() */
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

/** Determine if a hex color is light (for choosing check mark color) */
function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55
}
