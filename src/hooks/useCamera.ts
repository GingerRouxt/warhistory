import { useCallback, useRef, useEffect } from 'react'
import { Cartesian3, Math as CesiumMath } from 'cesium'
import type { Viewer } from 'cesium'

type FlightProfile = 'dramatic' | 'quick' | 'overview'

interface FlightPhase {
  readonly altitude: number
  readonly heading: number
  readonly pitch: number
  readonly duration: number
}

const FLIGHT_PROFILES = {
  dramatic: { // For tier-1 battle selection
    phases: [
      { altitude: 500_000, heading: 0, pitch: -60, duration: 2.5 },
      { altitude: 15_000, heading: 25, pitch: -35, duration: 3.5 },
      { altitude: 6_000, heading: 45, pitch: -20, duration: 2.0 },
    ] as readonly FlightPhase[],
  },
  quick: { // For tour navigation, fast jumps
    phases: [
      { altitude: 50_000, heading: 0, pitch: -45, duration: 1.5 },
    ] as readonly FlightPhase[],
  },
  overview: { // For zooming out to see region
    phases: [
      { altitude: 2_000_000, heading: 0, pitch: -90, duration: 2.0 },
    ] as readonly FlightPhase[],
  },
} as const

export function useCamera(viewer: Viewer | null) {
  const isAnimatingRef = useRef(false)
  const cancelRef = useRef(false)
  const orbitHandleRef = useRef<(() => void) | null>(null)

  const flyToBattle = useCallback(async (
    lat: number,
    lng: number,
    profile: FlightProfile = 'dramatic',
  ) => {
    if (!viewer || viewer.isDestroyed()) return
    cancelRef.current = false
    isAnimatingRef.current = true

    // Stop any active orbit
    if (orbitHandleRef.current) {
      orbitHandleRef.current()
      orbitHandleRef.current = null
    }

    const flyPhase = (
      lng: number,
      lat: number,
      altitude: number,
      heading: number,
      pitch: number,
      duration: number,
    ): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        if (cancelRef.current) {
          reject('cancelled')
          return
        }
        if (!viewer || viewer.isDestroyed()) {
          reject('destroyed')
          return
        }
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(lng, lat, altitude),
          orientation: {
            heading: CesiumMath.toRadians(heading),
            pitch: CesiumMath.toRadians(pitch),
            roll: 0,
          },
          duration,
          complete: resolve,
          cancel: () => reject('cancelled'),
        })
      })
    }

    const phases = FLIGHT_PROFILES[profile].phases

    try {
      for (let i = 0; i < phases.length; i++) {
        if (cancelRef.current) return
        const phase = phases[i]
        await flyPhase(lng, lat, phase.altitude, phase.heading, phase.pitch, phase.duration)
      }
    } catch (e) {
      if (e !== 'cancelled' && e !== 'destroyed') throw e
    } finally {
      isAnimatingRef.current = false
    }
  }, [viewer])

  const cancelFlight = useCallback(() => {
    cancelRef.current = true
    if (viewer && !viewer.isDestroyed()) {
      viewer.camera.cancelFlight()
    }
  }, [viewer])

  const flyToQuick = useCallback((lat: number, lng: number, altitude = 50_000) => {
    if (!viewer || viewer.isDestroyed()) return
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(lng, lat, altitude),
      duration: 1.5,
    })
  }, [viewer])

  const startOrbit = useCallback(() => {
    if (!viewer || viewer.isDestroyed()) return

    // Stop existing orbit
    if (orbitHandleRef.current) {
      orbitHandleRef.current()
      orbitHandleRef.current = null
    }

    const rotationSpeed = CesiumMath.toRadians(0.03) // degrees per frame
    let lastTime = performance.now()
    let animId: number
    let stopped = false

    const stop = () => {
      if (stopped) return
      stopped = true
      cancelAnimationFrame(animId)
      // Remove the camera change listener
      if (viewer && !viewer.isDestroyed()) {
        viewer.camera.changed.removeEventListener(onUserInteraction)
      }
    }

    // Detect user camera interaction and auto-cancel orbit
    const onUserInteraction = () => {
      // The orbit itself triggers changed events, so we use a flag
      // to distinguish user interaction from our own rotation.
      // If orbit is stopped externally, this listener is already removed.
      if (!orbitDriving) {
        stop()
        orbitHandleRef.current = null
      }
    }

    let orbitDriving = false

    const tick = (time: number) => {
      if (!viewer || viewer.isDestroyed() || stopped) return
      const dt = (time - lastTime) / 16.67 // normalize to ~60fps
      lastTime = time
      orbitDriving = true
      viewer.camera.rotateRight(rotationSpeed * dt)
      orbitDriving = false
      animId = requestAnimationFrame(tick)
    }

    // Set up user interaction detection
    viewer.camera.changed.addEventListener(onUserInteraction)

    animId = requestAnimationFrame(tick)

    orbitHandleRef.current = stop
  }, [viewer])

  const stopOrbit = useCallback(() => {
    if (orbitHandleRef.current) {
      orbitHandleRef.current()
      orbitHandleRef.current = null
    }
  }, [])

  // Clean up orbit on unmount
  useEffect(() => {
    return () => {
      if (orbitHandleRef.current) {
        orbitHandleRef.current()
      }
    }
  }, [])

  return {
    flyToBattle,
    flyToQuick,
    cancelFlight,
    startOrbit,
    stopOrbit,
    isAnimating: isAnimatingRef.current,
  }
}
