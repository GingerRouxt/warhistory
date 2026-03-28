import { useState, useMemo, useCallback, useEffect } from 'react'
import type { Battle, EraId } from '../types/battle'
import biblicalBattlesRaw from '../data/biblical-battles.json'

const biblicalBattles: Battle[] = biblicalBattlesRaw as Battle[]

// Lazy-load the large wikidata dataset
let wikidataBattlesCache: Battle[] | null = null
async function loadWikidataBattles(): Promise<Battle[]> {
  if (wikidataBattlesCache) return wikidataBattlesCache
  try {
    const mod = await import('../data/wikidata-battles.json')
    wikidataBattlesCache = (mod.default || mod) as Battle[]
    return wikidataBattlesCache
  } catch {
    return []
  }
}

export interface BattleFilters {
  timeWindow: { start: number; end: number }
  eras: EraId[]
  biblicalOnly: boolean
  searchQuery: string
}

const ERA_RANGES: Record<EraId, [number, number]> = {
  biblical: [-4000, -400],
  classical: [-400, 500],
  medieval: [500, 1500],
  'early-modern': [1500, 1800],
  modern: [1800, 1945],
  contemporary: [1945, 2100],
}

export function getEra(year: number): EraId {
  for (const [era, [start, end]] of Object.entries(ERA_RANGES)) {
    if (year >= start && year < end) {
      return era as EraId
    }
  }
  if (year < -4000) return 'biblical'
  return 'contemporary'
}

const defaultFilters: BattleFilters = {
  timeWindow: { start: -4000, end: 2100 },
  eras: ['biblical', 'classical', 'medieval', 'early-modern', 'modern', 'contemporary'],
  biblicalOnly: false,
  searchQuery: '',
}

export function useBattles() {
  const [filters, setFilters] = useState<BattleFilters>(defaultFilters)
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null)
  const [wikidataBattles, setWikidataBattles] = useState<Battle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load wikidata battles on mount
  useEffect(() => {
    loadWikidataBattles().then((battles) => {
      setWikidataBattles(battles)
      setIsLoading(false)
    })
  }, [])

  const allBattles = useMemo(() => {
    // Merge biblical + wikidata, deduplicate by id
    const seen = new Set<string>()
    const merged: Battle[] = []
    for (const b of biblicalBattles) {
      if (!seen.has(b.id)) {
        seen.add(b.id)
        merged.push(b)
      }
    }
    for (const b of wikidataBattles) {
      if (!seen.has(b.id)) {
        seen.add(b.id)
        merged.push(b)
      }
    }
    return merged.sort((a, b) => a.year - b.year)
  }, [wikidataBattles])

  const filteredBattles = useMemo(() => {
    return allBattles.filter((battle) => {
      // Time window filter
      if (battle.year < filters.timeWindow.start || battle.year > filters.timeWindow.end) {
        return false
      }

      // Era filter
      if (filters.eras.length > 0 && !filters.eras.includes(battle.era)) {
        return false
      }

      // Biblical-only filter
      if (filters.biblicalOnly && !battle.biblical) {
        return false
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matchesName = battle.name.toLowerCase().includes(query)
        const matchesDesc = battle.description.toLowerCase().includes(query)
        const matchesScripture = battle.scriptureRef?.toLowerCase().includes(query) ?? false
        const matchesBelligerents = battle.belligerents?.some((b) =>
          b.toLowerCase().includes(query),
        ) ?? false
        if (!matchesName && !matchesDesc && !matchesScripture && !matchesBelligerents) {
          return false
        }
      }

      return true
    })
  }, [allBattles, filters])

  const updateFilters = useCallback((partial: Partial<BattleFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }))
  }, [])

  const selectBattle = useCallback((battle: Battle | null) => {
    setSelectedBattle(battle)
  }, [])

  const getBattlesByIds = useCallback((ids: string[]): Battle[] => {
    const battleMap = new Map(allBattles.map((b) => [b.id, b]))
    return ids.map((id) => battleMap.get(id)).filter((b): b is Battle => !!b)
  }, [allBattles])

  return {
    allBattles,
    filteredBattles,
    filters,
    updateFilters,
    selectedBattle,
    selectBattle,
    getBattlesByIds,
    isLoading,
    getEra,
  }
}
