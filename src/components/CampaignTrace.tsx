import { useEffect, useRef } from 'react'
import {
  Cartesian3,
  Color,
  PolylineCollection,
  PointPrimitiveCollection,
  NearFarScalar,
} from 'cesium'
import { useGlobe } from './GlobeContext'
import type { Battle } from '../types/battle'

export interface CampaignTraceProps {
  battles: Battle[]
  isActive: boolean
  color?: string
}

/**
 * Draws an animated polyline on the globe connecting battles in a campaign.
 * The line grows from battle to battle like tracing a route on a map.
 */
export function CampaignTrace({ battles, isActive, color = '#d4a017' }: CampaignTraceProps) {
  const { viewer } = useGlobe()
  const polylineCollectionRef = useRef<PolylineCollection | null>(null)
  const pointCollectionRef = useRef<PointPrimitiveCollection | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const segmentIndexRef = useRef(0)
  const progressRef = useRef(0)

  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !isActive || battles.length < 2) return

    // Clean up any existing primitives
    cleanup()

    const cesiumColor = Color.fromCssColorString(color)
    const trailColor = cesiumColor.withAlpha(0.6)

    // Create collections
    const polylines = new PolylineCollection()
    const points = new PointPrimitiveCollection()
    viewer.scene.primitives.add(polylines)
    viewer.scene.primitives.add(points)
    polylineCollectionRef.current = polylines
    pointCollectionRef.current = points

    // Place a marker at the first battle
    const firstBattle = battles[0]
    points.add({
      position: Cartesian3.fromDegrees(firstBattle.location.lng, firstBattle.location.lat, 200),
      pixelSize: 8,
      color: cesiumColor,
      outlineColor: Color.BLACK,
      outlineWidth: 1,
      scaleByDistance: new NearFarScalar(1e4, 1.2, 5e6, 0.4),
    })

    // Completed segment lines (fully drawn)
    const completedSegments: { start: Battle; end: Battle }[] = []
    // The currently animating polyline reference
    let activePolyline: ReturnType<PolylineCollection['add']> | null = null

    segmentIndexRef.current = 0
    progressRef.current = 0

    const SEGMENT_DURATION_MS = 1200 // time per segment
    let lastTimestamp: number | null = null

    function animate(timestamp: number) {
      if (!viewer || viewer.isDestroyed()) return
      if (!polylineCollectionRef.current || !pointCollectionRef.current) return

      if (lastTimestamp === null) lastTimestamp = timestamp
      const dt = timestamp - lastTimestamp
      lastTimestamp = timestamp

      const segIdx = segmentIndexRef.current
      if (segIdx >= battles.length - 1) {
        // Animation complete
        return
      }

      const startBattle = battles[segIdx]
      const endBattle = battles[segIdx + 1]
      const startPos = Cartesian3.fromDegrees(startBattle.location.lng, startBattle.location.lat, 200)

      progressRef.current += dt / SEGMENT_DURATION_MS
      const t = Math.min(progressRef.current, 1)

      // Interpolate position
      const interpLng = startBattle.location.lng + (endBattle.location.lng - startBattle.location.lng) * t
      const interpLat = startBattle.location.lat + (endBattle.location.lat - startBattle.location.lat) * t
      const currentPos = Cartesian3.fromDegrees(interpLng, interpLat, 200)

      // Update or create the active segment polyline
      if (activePolyline) {
        polylines.remove(activePolyline)
      }
      activePolyline = polylines.add({
        positions: [startPos, currentPos],
        width: 2.5,
        material: trailColor as unknown as import('cesium').Material,
      })

      if (t >= 1) {
        // Segment complete - place a marker at the end battle
        points.add({
          position: Cartesian3.fromDegrees(endBattle.location.lng, endBattle.location.lat, 200),
          pixelSize: 8,
          color: cesiumColor,
          outlineColor: Color.BLACK,
          outlineWidth: 1,
          scaleByDistance: new NearFarScalar(1e4, 1.2, 5e6, 0.4),
        })

        completedSegments.push({ start: startBattle, end: endBattle })
        activePolyline = null

        // Move to next segment
        segmentIndexRef.current += 1
        progressRef.current = 0
        lastTimestamp = null

        // Small pause between segments
        setTimeout(() => {
          animFrameRef.current = requestAnimationFrame(animate)
        }, 300)
        return
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer, isActive, battles, color])

  function cleanup() {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (viewer && !viewer.isDestroyed()) {
      if (polylineCollectionRef.current) {
        viewer.scene.primitives.remove(polylineCollectionRef.current)
        polylineCollectionRef.current = null
      }
      if (pointCollectionRef.current) {
        viewer.scene.primitives.remove(pointCollectionRef.current)
        pointCollectionRef.current = null
      }
    }
  }

  // This component renders nothing to the DOM - it's all Cesium primitives
  return null
}
