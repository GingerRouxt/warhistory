import { useState, useEffect } from 'react'
import campaignsData from '../data/campaigns.json'
import type { EraId } from '../types/battle'

export interface TourSelectorProps {
  isOpen: boolean
  onSelect: (campaignId: string) => void
  onClose: () => void
}

interface Campaign {
  id: string
  name: string
  commander: string
  era: EraId
  battles: string[]
  description: string
}

const campaigns = campaignsData as Campaign[]

const ERA_LABELS: Record<string, string> = {
  biblical: 'Biblical',
  classical: 'Classical',
  medieval: 'Medieval',
  'early-modern': 'Early Modern',
  modern: 'Modern',
  contemporary: 'Contemporary',
}

const ERA_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  biblical: {
    bg: 'rgba(212, 160, 23, 0.12)',
    border: 'rgba(212, 160, 23, 0.3)',
    text: '#d4a017',
  },
  classical: {
    bg: 'rgba(100, 160, 220, 0.12)',
    border: 'rgba(100, 160, 220, 0.3)',
    text: '#78b4e8',
  },
  medieval: {
    bg: 'rgba(160, 100, 60, 0.12)',
    border: 'rgba(160, 100, 60, 0.3)',
    text: '#c4865c',
  },
  'early-modern': {
    bg: 'rgba(120, 180, 120, 0.12)',
    border: 'rgba(120, 180, 120, 0.3)',
    text: '#88c488',
  },
  modern: {
    bg: 'rgba(180, 80, 80, 0.12)',
    border: 'rgba(180, 80, 80, 0.3)',
    text: '#d47070',
  },
  contemporary: {
    bg: 'rgba(140, 100, 200, 0.12)',
    border: 'rgba(140, 100, 200, 0.3)',
    text: '#b088e0',
  },
}

const CATEGORIES = ['biblical', 'classical', 'medieval', 'modern'] as const
type Category = (typeof CATEGORIES)[number]

const CATEGORY_LABELS: Record<Category, string> = {
  biblical: 'Biblical',
  classical: 'Classical',
  medieval: 'Medieval',
  modern: 'Modern',
}

function getCategoryForEra(era: string): Category {
  if (era === 'biblical') return 'biblical'
  if (era === 'classical') return 'classical'
  if (era === 'medieval') return 'medieval'
  return 'modern' // early-modern, modern, contemporary
}

/**
 * Modal overlay for choosing which guided tour (campaign) to take.
 * Displays a grid of tour cards organized by era category.
 */
export function TourSelector({ isOpen, onSelect, onClose }: TourSelectorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true))
      })
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => setShouldRender(false), 400)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!shouldRender) return null

  const filteredCampaigns =
    activeCategory === 'all'
      ? campaigns
      : campaigns.filter((c) => getCategoryForEra(c.era) === activeCategory)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(5, 5, 10, 0.8)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 glass-panel px-8 py-6 overflow-y-auto"
        style={{
          width: 'min(860px, calc(100vw - 48px))',
          maxHeight: 'calc(100vh - 80px)',
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-xl"
              style={{
                fontFamily: 'var(--font-family-display)',
                color: 'var(--color-war-gold)',
                letterSpacing: '0.1em',
              }}
            >
              Guided Tours
            </h2>
            <p
              className="text-sm mt-1"
              style={{
                fontFamily: 'var(--font-family-body)',
                color: 'rgba(200, 200, 210, 0.5)',
              }}
            >
              Follow the path of history's greatest campaigns
            </p>
          </div>

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
            aria-label="Close tour selector"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <CategoryTab
            label="All"
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          />
          {CATEGORIES.map((cat) => (
            <CategoryTab
              key={cat}
              label={CATEGORY_LABELS[cat]}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          ))}
        </div>

        {/* Gold separator */}
        <div
          className="mb-6"
          style={{
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(212, 160, 23, 0.3), transparent)',
          }}
        />

        {/* Full History card */}
        {activeCategory === 'all' && (
          <button
            onClick={() => onSelect('full-history')}
            className="w-full text-left mb-6 rounded-xl p-5 transition-all duration-300 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.08), rgba(212, 160, 23, 0.03))',
              border: '1px solid rgba(212, 160, 23, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212, 160, 23, 0.6)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(212, 160, 23, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212, 160, 23, 0.25)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--color-war-gold)' }}>
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 5v5l3.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <h3
                className="text-base"
                style={{
                  fontFamily: 'var(--font-family-display)',
                  color: 'var(--color-war-gold)',
                  letterSpacing: '0.06em',
                }}
              >
                Full History Tour
              </h3>
            </div>
            <p
              className="text-sm"
              style={{
                fontFamily: 'var(--font-family-body)',
                color: 'rgba(200, 200, 210, 0.6)',
              }}
            >
              Every battle, chronologically. From the earliest biblical conflicts to the modern age.
            </p>
          </button>
        )}

        {/* Campaign grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onSelect={() => onSelect(campaign.id)}
            />
          ))}
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <p
              className="text-sm"
              style={{
                fontFamily: 'var(--font-family-body)',
                color: 'rgba(200, 200, 210, 0.4)',
              }}
            >
              No campaigns in this category yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 text-xs uppercase tracking-wider rounded-md transition-all duration-200 cursor-pointer"
      style={{
        fontFamily: 'var(--font-family-body)',
        fontWeight: 500,
        background: active ? 'rgba(212, 160, 23, 0.15)' : 'rgba(255, 255, 255, 0.03)',
        color: active ? 'var(--color-war-gold)' : 'rgba(200, 200, 210, 0.5)',
        border: `1px solid ${active ? 'rgba(212, 160, 23, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
          e.currentTarget.style.color = 'rgba(200, 200, 210, 0.8)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
          e.currentTarget.style.color = 'rgba(200, 200, 210, 0.5)'
        }
      }}
    >
      {label}
    </button>
  )
}

function CampaignCard({
  campaign,
  onSelect,
}: {
  campaign: Campaign
  onSelect: () => void
}) {
  const eraStyle = ERA_COLORS[campaign.era] || ERA_COLORS.modern
  const battleCount = campaign.battles.length

  return (
    <button
      onClick={onSelect}
      className="text-left rounded-xl p-5 transition-all duration-300 cursor-pointer"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212, 160, 23, 0.5)'
        e.currentTarget.style.background = 'rgba(212, 160, 23, 0.04)'
        e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 160, 23, 0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Era badge + battle count */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="inline-block px-2.5 py-0.5 text-[10px] uppercase tracking-wider rounded-full font-medium"
          style={{
            background: eraStyle.bg,
            border: `1px solid ${eraStyle.border}`,
            color: eraStyle.text,
          }}
        >
          {ERA_LABELS[campaign.era] || campaign.era}
        </span>
        {battleCount > 0 && (
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{ color: 'rgba(200, 200, 210, 0.4)' }}
          >
            {battleCount} battle{battleCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Campaign name */}
      <h3
        className="text-sm leading-tight mb-1"
        style={{
          fontFamily: 'var(--font-family-display)',
          color: 'rgba(240, 240, 245, 0.9)',
          letterSpacing: '0.02em',
        }}
      >
        {campaign.name}
      </h3>

      {/* Commander */}
      <p
        className="text-xs mb-2"
        style={{
          fontFamily: 'var(--font-family-body)',
          color: 'var(--color-war-gold)',
          opacity: 0.7,
        }}
      >
        {campaign.commander}
      </p>

      {/* Description */}
      <p
        className="text-xs leading-relaxed"
        style={{
          fontFamily: 'var(--font-family-body)',
          color: 'rgba(200, 200, 210, 0.5)',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {campaign.description}
      </p>
    </button>
  )
}
