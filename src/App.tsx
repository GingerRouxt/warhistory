import { useState, useCallback, useMemo } from 'react'
import Globe from './components/Globe'
import { GlobeProvider } from './components/GlobeContext'
import BattleLayer from './components/BattleLayer'
import { CameraDirector } from './components/CameraDirector'
import Timeline from './components/Timeline'
import { Narrator } from './components/Narrator'
import { BattleCard } from './components/BattleCard'
import { LandingOverlay } from './components/LandingOverlay'
import { FilterPanel } from './components/FilterPanel'
import BattleAnimator from './components/BattleAnimator'
import ParticleEffects from './components/ParticleEffects'
import { GuidedTour } from './components/GuidedTour'
import { TourSelector } from './components/TourSelector'
import { CampaignTrace } from './components/CampaignTrace'
import { LoadingScreen } from './components/LoadingScreen'
import { SEOHead } from './components/SEOHead'
import { StructuredData } from './components/StructuredData'
import { SupportBanner } from './components/SupportBanner'
import { ShareButton } from './components/ShareButton'
import { MobileWarning } from './components/MobileWarning'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import campaignsData from './data/campaigns.json'
import { useBattles } from './hooks/useBattles'
import { useTimeline } from './hooks/useTimeline'
import type { Battle, EraId } from './types/battle'

interface Campaign {
  id: string
  name: string
  commander: string
  era: EraId
  battles: string[]
  description: string
}

export default function App() {
  const [hasEntered, setHasEntered] = useState(false)
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null)
  const [isNarrating, setIsNarrating] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [tourSelectorOpen, setTourSelectorOpen] = useState(false)
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null)
  const [tourActive, setTourActive] = useState(false)

  const timeline = useTimeline()
  const { allBattles, filteredBattles, filters, updateFilters, getBattlesByIds, isLoading } = useBattles()

  // Resolve campaign battles
  const activeCampaign = useMemo(() => {
    if (!activeCampaignId) return null
    return (campaignsData as Campaign[]).find((c) => c.id === activeCampaignId) || null
  }, [activeCampaignId])

  const tourBattles = useMemo(() => {
    if (!activeCampaign) {
      // Full history tour — all battles chronologically
      if (activeCampaignId === 'full-history') return allBattles
      return []
    }
    return getBattlesByIds(activeCampaign.battles)
  }, [activeCampaign, activeCampaignId, allBattles, getBattlesByIds])

  const handleYearChange = useCallback((year: number) => {
    timeline.setYear(year)
    updateFilters({ timeWindow: { start: year - 500, end: year + 500 } })
  }, [timeline, updateFilters])

  const handleTimeWindowChange = useCallback((window: { start: number; end: number }) => {
    timeline.setTimeWindow(window)
    updateFilters({ timeWindow: window })
  }, [timeline, updateFilters])

  const handleEnter = useCallback(() => {
    setHasEntered(true)
    timeline.setYear(-4000)
    // Show all battles on first enter
    updateFilters({ timeWindow: { start: -4000, end: 2026 } })
  }, [timeline, updateFilters])

  const handleBattleSelect = useCallback((battle: Battle) => {
    setSelectedBattle(battle)
    setIsNarrating(true)
    timeline.setYear(battle.year)
  }, [timeline])

  const handleBattleClose = useCallback(() => {
    setSelectedBattle(null)
    setIsNarrating(false)
  }, [])

  const handleNarrationComplete = useCallback(() => {
    setIsNarrating(false)
  }, [])

  const handleFlightComplete = useCallback(() => {
    // Camera arrived — animation begins
  }, [])

  const handleErasChange = useCallback((eras: string[]) => {
    updateFilters({ eras: eras as EraId[] })
  }, [updateFilters])

  const handleTourSelect = useCallback((campaignId: string) => {
    setActiveCampaignId(campaignId)
    setTourSelectorOpen(false)
    setTourActive(true)
    // Expand time window for the tour
    updateFilters({ timeWindow: { start: -4000, end: 2026 } })
  }, [updateFilters])

  const handleTourClose = useCallback(() => {
    setTourActive(false)
    setActiveCampaignId(null)
    setSelectedBattle(null)
    setIsNarrating(false)
  }, [])

  return (
    <GlobeProvider>
      <SEOHead />
      <StructuredData />
      <LoadingScreen isLoading={isLoading} />
      <MobileWarning />
      <div className="w-full h-full relative">
        {/* 3D Globe */}
        <Globe>
          <BattleLayer
            battles={filteredBattles}
            startYear={timeline.timeWindow.start}
            endYear={timeline.timeWindow.end}
            onSelectBattle={handleBattleSelect}
          />
        </Globe>

        {/* Camera controller */}
        <CameraDirector
          selectedBattle={selectedBattle}
          onFlightComplete={handleFlightComplete}
        />

        {/* Battle animation - army movements on terrain */}
        <BattleAnimator
          battle={selectedBattle}
          isActive={!!selectedBattle && selectedBattle.tier === 1}
        />

        {/* Particle effects - smoke/dust at battle site */}
        <ParticleEffects
          battle={selectedBattle}
          isActive={!!selectedBattle && selectedBattle.tier === 1}
          delay={5}
        />

        {/* Narrator text overlay */}
        {selectedBattle && isNarrating && (
          <Narrator
            battle={selectedBattle}
            isActive={isNarrating}
            onNarrationComplete={handleNarrationComplete}
          />
        )}

        {/* Battle detail card */}
        {selectedBattle && (
          <BattleCard
            battle={selectedBattle}
            onClose={handleBattleClose}
          />
        )}

        {/* Filter panel */}
        {hasEntered && (
          <FilterPanel
            eras={filters.eras}
            onErasChange={handleErasChange}
            biblicalOnly={filters.biblicalOnly}
            onBiblicalOnlyChange={(val) => updateFilters({ biblicalOnly: val })}
            searchQuery={filters.searchQuery}
            onSearchChange={(q) => updateFilters({ searchQuery: q })}
            isOpen={filterOpen}
            onToggle={() => setFilterOpen(!filterOpen)}
            battleCount={filteredBattles.length}
          />
        )}

        {/* Timeline */}
        {hasEntered && (
          <Timeline
            battles={allBattles}
            currentYear={timeline.currentYear}
            timeWindow={timeline.timeWindow}
            onYearChange={handleYearChange}
            onTimeWindowChange={handleTimeWindowChange}
            isPlaying={timeline.isPlaying}
            onPlayToggle={timeline.togglePlay}
            playbackSpeed={timeline.playbackSpeed}
            onSpeedChange={timeline.setPlaybackSpeed}
          />
        )}

        {/* Landing overlay */}
        <LandingOverlay
          isVisible={!hasEntered}
          onEnter={handleEnter}
        />

        {/* Campaign trace on globe */}
        {tourActive && tourBattles.length >= 2 && (
          <CampaignTrace
            battles={tourBattles}
            isActive={tourActive}
          />
        )}

        {/* Guided tour overlay */}
        <GuidedTour
          battles={tourBattles}
          isActive={tourActive}
          onBattleSelect={handleBattleSelect}
          onClose={handleTourClose}
        />

        {/* Tour selector modal */}
        <TourSelector
          isOpen={tourSelectorOpen}
          onSelect={handleTourSelect}
          onClose={() => setTourSelectorOpen(false)}
        />

        {/* Battle count + Tour button */}
        {hasEntered && !filterOpen && (
          <div className="absolute top-4 left-14 flex items-center gap-2">
            <div className="glass-panel px-4 py-2 text-sm">
              <span className="text-war-gold font-semibold">{filteredBattles.length.toLocaleString()}</span>
              <span className="text-gray-400 ml-1">battles visible</span>
            </div>
            <button
              onClick={() => setTourSelectorOpen(true)}
              className="glass-panel px-4 py-2 text-sm text-war-gold hover:text-white transition-colors cursor-pointer"
              style={{ fontFamily: 'var(--font-family-display)', letterSpacing: '0.05em' }}
            >
              Guided Tours
            </button>
          </div>
        )}
        {/* Support + Share + Keyboard help */}
        {hasEntered && (
          <>
            <SupportBanner />
            <ShareButton />
            <KeyboardShortcuts />
          </>
        )}
      </div>
    </GlobeProvider>
  )
}
