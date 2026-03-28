import { useEffect, useRef } from 'react'
import { useGlobe } from './GlobeContext'
import { useCamera } from '../hooks/useCamera'
import type { Battle } from '../types/battle'

interface CameraDirectorProps {
  selectedBattle: Battle | null
  onFlightComplete: () => void
}

/**
 * Invisible controller component. Listens for battle selection
 * and triggers cinematic fly-in camera sequences.
 * Tier-1 battles get the dramatic profile with auto-orbit.
 * All others get a quick fly-in with no orbit.
 */
export function CameraDirector({ selectedBattle, onFlightComplete }: CameraDirectorProps) {
  const { viewer } = useGlobe()
  const { flyToBattle, flyToQuick, cancelFlight, startOrbit } = useCamera(viewer)
  const lastBattleIdRef = useRef<string | null>(null)
  const onFlightCompleteRef = useRef(onFlightComplete)
  onFlightCompleteRef.current = onFlightComplete

  useEffect(() => {
    if (!selectedBattle) {
      lastBattleIdRef.current = null
      return
    }

    // Only trigger if this is a new battle selection
    if (selectedBattle.id === lastBattleIdRef.current) return
    lastBattleIdRef.current = selectedBattle.id

    // Cancel any in-progress flight
    cancelFlight()

    const isTier1 = selectedBattle.tier === 1

    const run = async () => {
      if (isTier1) {
        // Tier-1: dramatic cinematic flight, then orbit
        await flyToBattle(
          selectedBattle.location.lat,
          selectedBattle.location.lng,
          'dramatic',
        )
        // Start slow orbit after dramatic flight completes
        startOrbit()
      } else {
        // Non-tier-1: quick jump, no orbit
        flyToQuick(
          selectedBattle.location.lat,
          selectedBattle.location.lng,
        )
      }
      onFlightCompleteRef.current()
    }

    run()
  }, [selectedBattle, flyToBattle, flyToQuick, cancelFlight, startOrbit])

  // Renders nothing — pure controller
  return null
}
