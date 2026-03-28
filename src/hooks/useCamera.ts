import { useCallback, useRef, useEffect } from 'react'
import { Cartesian3, Math as CesiumMath } from 'cesium'
import type { Viewer } from 'cesium'

export function useCamera(viewer: Viewer | null) {
  const isAnimatingRef = useRef(false)
  const cancelRef = useRef(false)
  const orbitHandleRef = useRef<(() => void) | null>(null)

  const flyToBattle = useCallback(async (lat: number, lng: number, _name?: string) => {
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

    try {
      // Phase 1 (2s): Pull back to show region from altitude ~500km
      await flyPhase(lng, lat, 500_000, 0, -60, 2)
      if (cancelRef.current) return

      // Phase 2 (3s): Sweep down to battle site at close range
      await flyPhase(lng, lat, 15_000, 30, -35, 3)
      if (cancelRef.current) return

      // Phase 3 (2s): Settle into orbit view
      await flyPhase(lng + 0.05, lat - 0.02, 8_000, 45, -25, 2)
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

    const rotationSpeed = CesiumMath.toRadians(0.05) // degrees per frame
    let lastTime = performance.now()
    let animId: number

    const tick = (time: number) => {
      if (!viewer || viewer.isDestroyed()) return
      const dt = (time - lastTime) / 16.67 // normalize to ~60fps
      lastTime = time
      viewer.camera.rotateRight(rotationSpeed * dt)
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)

    orbitHandleRef.current = () => {
      cancelAnimationFrame(animId)
    }
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
