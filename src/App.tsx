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
import { AppUIProvider, useAppUI, useAppUIDispatch } from './contexts/AppUIContext'

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
  return (
    <GlobeProvider>
      <AppUIProvider>
        <AppInner />
      </AppUIProvider>
    </GlobeProvider>
  )
}

function AppInner() {
  const ui = useAppUI()
  const dispatch = useAppUIDispatch()

  const [hasEntered, setHasEntered] = useState(false)
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null)
  const [isNarrating, setIsNarrating] = useState(false)
  const [commander, setCommander] = useState('')
  const [resultFilter, setResultFilter] = useState('')
  const [nearMeActive, setNearMeActive] = useState(false)

  const timeline = useTimeline()
  const { allBattles, filteredBattles, filters, updateFilters, getBattlesByIds, isLoading } = useBattles()

  const activeCampaign = useMemo(() => {
    if (!ui.activeCampaignId) return null
    return (campaignsData as Campaign[]).find((c) => c.id === ui.activeCampaignId) || null
  }, [ui.activeCampaignId])

  const tourBattles = useMemo(() => {
    if (!activeCampaign) {
      if (ui.activeCampaignId === 'full-history') return allBattles
      return []
    }
    return getBattlesByIds(activeCampaign.battles)
  }, [activeCampaign, ui.activeCampaignId, allBattles, getBattlesByIds])

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

  const handleNarrationComplete = useCallback(() => { setIsNarrating(false) }, [])
  const handleFlightComplete = useCallback(() => {}, [])

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
        updateFilters({ nearMeLocation: undefined })
        return false
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => updateFilters({ nearMeLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
          () => setNearMeActive(false),
        )
      }
      return true
    })
  }, [updateFilters])

  const handleTourSelect = useCallback((campaignId: string) => {
    dispatch({ type: 'SET_CAMPAIGN', id: campaignId })
    dispatch({ type: 'SET_TOUR_SELECTOR_OPEN', open: false })
    dispatch({ type: 'SET_TOUR_ACTIVE', active: true })
    updateFilters({ timeWindow: { start: -4000, end: 2026 } })
  }, [dispatch, updateFilters])

  const handleTourClose = useCallback(() => {
    dispatch({ type: 'SET_TOUR_ACTIVE', active: false })
    dispatch({ type: 'SET_CAMPAIGN', id: null })
    setSelectedBattle(null)
    setIsNarrating(false)
  }, [dispatch])

  const handleHoverBattle = useCallback((battle: Battle | null, screenX: number, screenY: number) => {
    dispatch({ type: 'SET_HOVERED_BATTLE', battle, x: screenX, y: screenY })
  }, [dispatch])

  const handleZoomToCluster = useCallback((_lat: number, _lng: number) => {}, [])

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-war-gold focus:text-black">
        Skip to main content
      </a>
      <SEOHead />
      <StructuredData />
      <LoadingScreen isLoading={isLoading} />
      <MobileWarning />
      <div id="main-content" className="w-full h-full relative">
        <Globe>
          <BattleLayer battles={filteredBattles} startYear={timeline.timeWindow.start} endYear={timeline.timeWindow.end} onSelectBattle={handleBattleSelect} onHoverBattle={handleHoverBattle} />
          <BattleCluster battles={filteredBattles} isActive={hasEntered} onZoomToCluster={handleZoomToCluster} />
          <HeatmapLayer battles={filteredBattles} isActive={ui.heatmapActive} opacity={0.35} />
        </Globe>

        <BattleTooltip battle={ui.hoveredBattle} screenX={ui.hoverPos.x} screenY={ui.hoverPos.y} />
        <CameraDirector selectedBattle={selectedBattle} onFlightComplete={handleFlightComplete} />
        <BattleAnimator battle={selectedBattle} isActive={!!selectedBattle && selectedBattle.tier === 1} />
        <ParticleEffects battle={selectedBattle} isActive={!!selectedBattle && selectedBattle.tier === 1} delay={5} era={selectedBattle?.era} />

        <Suspense fallback={null}>
          {selectedBattle && isNarrating && <Narrator battle={selectedBattle} isActive={isNarrating} onNarrationComplete={handleNarrationComplete} />}
          {selectedBattle && <BattleCard battle={selectedBattle} onClose={handleBattleClose} />}
        </Suspense>

        {hasEntered && (
          <FilterPanel eras={filters.eras} onErasChange={handleErasChange} biblicalOnly={filters.biblicalOnly} onBiblicalOnlyChange={(val) => updateFilters({ biblicalOnly: val })} searchQuery={filters.searchQuery} onSearchChange={(q) => updateFilters({ searchQuery: q })} isOpen={ui.filterOpen} onToggle={() => dispatch({ type: 'SET_FILTER_OPEN', open: !ui.filterOpen })} battleCount={filteredBattles.length} allBattles={allBattles} commander={commander} onCommanderChange={handleCommanderChange} resultFilter={resultFilter} onResultFilterChange={handleResultFilterChange} nearMeActive={nearMeActive} onNearMeToggle={handleNearMeToggle} />
        )}

        {hasEntered && (
          <Timeline battles={allBattles} currentYear={timeline.currentYear} timeWindow={timeline.timeWindow} onYearChange={handleYearChange} onTimeWindowChange={handleTimeWindowChange} isPlaying={timeline.isPlaying} onPlayToggle={timeline.togglePlay} playbackSpeed={timeline.playbackSpeed} onSpeedChange={timeline.setPlaybackSpeed} />
        )}

        <LandingOverlay isVisible={!hasEntered} onEnter={handleEnter} />

        {ui.tourActive && tourBattles.length >= 2 && <CampaignTrace battles={tourBattles} isActive={ui.tourActive} />}

        <Suspense fallback={null}>
          <GuidedTour battles={tourBattles} isActive={ui.tourActive} onBattleSelect={handleBattleSelect} onClose={handleTourClose} />
          <TourSelector isOpen={ui.tourSelectorOpen} onSelect={handleTourSelect} onClose={() => dispatch({ type: 'SET_TOUR_SELECTOR_OPEN', open: false })} />
        </Suspense>

        {hasEntered && !ui.filterOpen && (
          <div className="absolute top-4 left-14 flex items-center gap-2">
            <div className="glass-panel px-4 py-2 text-sm">
              <span className="text-war-gold font-semibold">{filteredBattles.length.toLocaleString()}</span>
              <span className="text-gray-400 ml-1">battles visible</span>
            </div>
            <button onClick={() => dispatch({ type: 'SET_TOUR_SELECTOR_OPEN', open: true })} aria-label="Open guided tours" className="glass-panel px-4 py-2 text-sm text-war-gold hover:text-white transition-colors cursor-pointer" style={{ fontFamily: 'var(--font-family-display)', letterSpacing: '0.05em' }}>
              Guided Tours
            </button>
            <button onClick={() => dispatch({ type: 'TOGGLE_HEATMAP' })} aria-label={ui.heatmapActive ? 'Hide battle heatmap' : 'Show battle heatmap'} className={`glass-panel px-4 py-2 text-sm transition-colors cursor-pointer ${ui.heatmapActive ? 'text-white' : 'text-war-gold hover:text-white'}`} style={{ fontFamily: 'var(--font-family-display)', letterSpacing: '0.05em' }}>
              {ui.heatmapActive ? 'Hide Heatmap' : 'Heatmap'}
            </button>
          </div>
        )}

        {hasEntered && <MinimapRadar battles={filteredBattles} isVisible={!ui.tourSelectorOpen} />}

        <Suspense fallback={null}>
          <BattleComparison battle1={selectedBattle} battle2={ui.compareBattle} isOpen={ui.compareOpen} onClose={() => dispatch({ type: 'SET_COMPARE', open: false, battle: null })} />
          <CommanderCard commanderName={ui.selectedCommander} allBattles={allBattles} onSelectBattle={(b) => { handleBattleSelect(b); dispatch({ type: 'SET_COMMANDER', name: null }) }} onClose={() => dispatch({ type: 'SET_COMMANDER', name: null })} />
          {selectedBattle && isNarrating && <AudioNarrator battleId={selectedBattle.id} isActive={isNarrating} />}
        </Suspense>

        {hasEntered && (
          <>
            <SupportBanner />
            <ShareButton />
            <KeyboardShortcuts />
          </>
        )}

      </div>
    </>
  )
}
