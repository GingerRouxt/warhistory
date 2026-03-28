import { useState, useCallback } from 'react'
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
import { useBattles } from './hooks/useBattles'
import { useTimeline } from './hooks/useTimeline'
import type { Battle, EraId } from './types/battle'

export default function App() {
  const [hasEntered, setHasEntered] = useState(false)
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null)
  const [isNarrating, setIsNarrating] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const timeline = useTimeline()
  const { allBattles, filteredBattles, filters, updateFilters } = useBattles()

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

  return (
    <GlobeProvider>
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

        {/* Battle count */}
        {hasEntered && !filterOpen && (
          <div className="absolute top-4 left-14 glass-panel px-4 py-2 text-sm">
            <span className="text-war-gold font-semibold">{filteredBattles.length.toLocaleString()}</span>
            <span className="text-gray-400 ml-1">battles visible</span>
          </div>
        )}
      </div>
    </GlobeProvider>
  )
}
