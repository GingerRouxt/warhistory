import { useState, useCallback, useMemo, lazy, Suspense } from 'react'
import Globe from './components/Globe'
import { GlobeProvider } from './components/GlobeContext'
import BattleLayer from './components/BattleLayer'
import { CameraDirector } from './components/CameraDirector'
import Timeline from './components/Timeline'
import { LandingOverlay } from './components/LandingOverlay'
import { FilterPanel } from './components/FilterPanel'
import BattleAnimator from './components/BattleAnimator'
import ParticleEffects from './components/ParticleEffects'
import { CampaignTrace } from './components/CampaignTrace'
import { LoadingScreen } from './components/LoadingScreen'
import { SEOHead } from './components/SEOHead'
import { StructuredData } from './components/StructuredData'
import { SupportBanner } from './components/SupportBanner'
import { ShareButton } from './components/ShareButton'
import { MobileWarning } from './components/MobileWarning'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { BattleTooltip } from './components/BattleTooltip'
import BattleCluster from './components/BattleCluster'
import { HeatmapLayer } from './components/HeatmapLayer'
import { MinimapRadar } from './components/MinimapRadar'

// Lazy-loaded modal/overlay components (conditionally rendered, not needed in initial bundle)
const BattleCard = lazy(() => import('./components/BattleCard').then(m => ({ default: m.BattleCard })))
const BattleComparison = lazy(() => import('./components/BattleComparison').then(m => ({ default: m.BattleComparison })))
const CommanderCard = lazy(() => import('./components/CommanderCard').then(m => ({ default: m.CommanderCard })))
const TourSelector = lazy(() => import('./components/TourSelector').then(m => ({ default: m.TourSelector })))
const GuidedTour = lazy(() => import('./components/GuidedTour').then(m => ({ default: m.GuidedTour })))
const AudioNarrator = lazy(() => import('./components/AudioNarrator').then(m => ({ default: m.AudioNarrator })))
const Narrator = lazy(() => import('./components/Narrator').then(m => ({ default: m.Narrator })))
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
  const [hoveredBattle, setHoveredBattle] = useState<Battle | null>(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })
  const [heatmapActive, setHeatmapActive] = useState(false)
  const [compareBattle, setCompareBattle] = useState<Battle | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)
  const [selectedCommander, setSelectedCommander] = useState<string | null>(null)
  const [commander, setCommander] = useState<string>('')
  const [resultFilter, setResultFilter] = useState<string>('')
  const [nearMeActive, setNearMeActive] = useState(false)

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

  const handleCommanderChange = useCallback((value: string) => {
    setCommander(value)
    updateFilters({ commander: value || undefined })
  }, [updateFilters])

  const handleResultFilterChange = useCallback((value: string) => {
    setResultFilter(value)
    updateFilters({ resultFilter: value || undefined })
  }, [updateFilters])

  const handleNearMeToggle = useCallback(() => {
    setNearMeActive((prev) => {
      if (prev) {
        // Turning off
        updateFilters({ nearMeLocation: undefined })
        return false
      }
      // Turning on — request geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            updateFilters({ nearMeLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude } })
          },
          () => {
            // Geolocation denied — revert
            setNearMeActive(false)
          },
        )
      }
      return true
    })
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

  const handleHoverBattle = useCallback((battle: Battle | null, screenX: number, screenY: number) => {
    setHoveredBattle(battle)
    setHoverPos({ x: screenX, y: screenY })
  }, [])

  const handleZoomToCluster = useCallback((_lat: number, _lng: number) => {
    // Cluster zoom handled by BattleCluster internally via camera flyTo
  }, [])

  return (
    <GlobeProvider>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-war-gold focus:text-black">
        Skip to main content
      </a>
      <SEOHead />
      <StructuredData />
      <LoadingScreen isLoading={isLoading} />
      <MobileWarning />
      <div id="main-content" className="w-full h-full relative">
        {/* 3D Globe */}
        <Globe>
          <BattleLayer
            battles={filteredBattles}
            startYear={timeline.timeWindow.start}
            endYear={timeline.timeWindow.end}
            onSelectBattle={handleBattleSelect}
            onHoverBattle={handleHoverBattle}
          />
          <BattleCluster
            battles={filteredBattles}
            isActive={hasEntered}
            onZoomToCluster={handleZoomToCluster}
          />
          <HeatmapLayer
            battles={filteredBattles}
            isActive={heatmapActive}
            opacity={0.35}
          />
        </Globe>

        {/* React-managed tooltip */}
        <BattleTooltip
          battle={hoveredBattle}
          screenX={hoverPos.x}
          screenY={hoverPos.y}
        />

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
          era={selectedBattle?.era}
        />

        {/* Narrator text overlay + Battle detail card (lazy) */}
        <Suspense fallback={null}>
          {selectedBattle && isNarrating && (
            <Narrator
              battle={selectedBattle}
              isActive={isNarrating}
              onNarrationComplete={handleNarrationComplete}
            />
          )}

          {selectedBattle && (
            <BattleCard
              battle={selectedBattle}
              onClose={handleBattleClose}
            />
          )}
        </Suspense>

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
            allBattles={allBattles}
            commander={commander}
            onCommanderChange={handleCommanderChange}
            resultFilter={resultFilter}
            onResultFilterChange={handleResultFilterChange}
            nearMeActive={nearMeActive}
            onNearMeToggle={handleNearMeToggle}
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

        {/* Guided tour overlay + Tour selector modal (lazy) */}
        <Suspense fallback={null}>
          <GuidedTour
            battles={tourBattles}
            isActive={tourActive}
            onBattleSelect={handleBattleSelect}
            onClose={handleTourClose}
          />

          <TourSelector
            isOpen={tourSelectorOpen}
            onSelect={handleTourSelect}
            onClose={() => setTourSelectorOpen(false)}
          />
        </Suspense>

        {/* Battle count + Tour + Heatmap buttons */}
        {hasEntered && !filterOpen && (
          <div className="absolute top-4 left-14 flex items-center gap-2">
            <div className="glass-panel px-4 py-2 text-sm">
              <span className="text-war-gold font-semibold">{filteredBattles.length.toLocaleString()}</span>
              <span className="text-gray-400 ml-1">battles visible</span>
            </div>
            <button
              onClick={() => setTourSelectorOpen(true)}
              aria-label="Open guided tours"
              className="glass-panel px-4 py-2 text-sm text-war-gold hover:text-white transition-colors cursor-pointer"
              style={{ fontFamily: 'var(--font-family-display)', letterSpacing: '0.05em' }}
            >
              Guided Tours
            </button>
            <button
              onClick={() => setHeatmapActive((v) => !v)}
              aria-label={heatmapActive ? 'Hide battle heatmap' : 'Show battle heatmap'}
              className={`glass-panel px-4 py-2 text-sm transition-colors cursor-pointer ${heatmapActive ? 'text-white' : 'text-war-gold hover:text-white'}`}
              style={{ fontFamily: 'var(--font-family-display)', letterSpacing: '0.05em' }}
            >
              {heatmapActive ? 'Hide Heatmap' : 'Heatmap'}
            </button>
          </div>
        )}

        {/* Minimap radar */}
        {hasEntered && (
          <MinimapRadar
            battles={filteredBattles}
            isVisible={!tourSelectorOpen}
          />
        )}
        {/* Battle comparison + Commander card + Audio narrator (lazy) */}
        <Suspense fallback={null}>
          <BattleComparison
            battle1={selectedBattle}
            battle2={compareBattle}
            isOpen={compareOpen}
            onClose={() => { setCompareOpen(false); setCompareBattle(null) }}
          />

          <CommanderCard
            commanderName={selectedCommander}
            allBattles={allBattles}
            onSelectBattle={(b) => { handleBattleSelect(b); setSelectedCommander(null) }}
            onClose={() => setSelectedCommander(null)}
          />

          {selectedBattle && isNarrating && (
            <AudioNarrator
              battleId={selectedBattle.id}
              isActive={isNarrating}
            />
          )}
        </Suspense>

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
