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
 */
export function CameraDirector({ selectedBattle, onFlightComplete }: CameraDirectorProps) {
  const { viewer } = useGlobe()
  const { flyToBattle, cancelFlight } = useCamera(viewer)
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

    const run = async () => {
      await flyToBattle(
        selectedBattle.location.lat,
        selectedBattle.location.lng,
        selectedBattle.name,
      )
      onFlightCompleteRef.current()
    }

    run()
  }, [selectedBattle, flyToBattle, cancelFlight])

  // Renders nothing — pure controller
  return null
}
