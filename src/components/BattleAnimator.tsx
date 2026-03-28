import { useEffect, useRef, useCallback } from 'react'
import {
  Cartesian3,
  Color,
  JulianDate,
  SampledPositionProperty,
  ClockRange,
  ClockStep,
  Entity,
  ConstantProperty,
  HeightReference,
  NearFarScalar,
} from 'cesium'
import type { Viewer } from 'cesium'
import type { Battle } from '../types/battle'
import { useGlobe } from './GlobeContext'

interface BattleAnimatorProps {
  battle: Battle | null
  isActive: boolean
}

/** Duration of the march animation in seconds. */
const MARCH_DURATION = 5
/** Offset in degrees from battle center for starting positions. */
const OFFSET_DEG = 0.1
/** How long the clash flash lasts in seconds. */
const CLASH_DURATION = 2

const SIDE1_COLOR = Color.fromCssColorString('#4488ff') // blue
const SIDE2_COLOR = Color.fromCssColorString('#ff4444') // red
const CLASH_COLOR = Color.fromCssColorString('#ffd700') // gold

/**
 * Animates two army markers converging on a battle location,
 * then triggers a clash flash at the meeting point.
 * Only activates for tier-1 battles.
 */
export default function BattleAnimator({ battle, isActive }: BattleAnimatorProps) {
  const { viewer } = useGlobe()
  const entitiesRef = useRef<Entity[]>([])
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const cleanup = useCallback((v: Viewer | null) => {
    // Remove all entities we added
    for (const entity of entitiesRef.current) {
      try {
        if (v && !v.isDestroyed()) {
          v.entities.remove(entity)
        }
      } catch {
        // entity may already be removed
      }
    }
    entitiesRef.current = []

    // Clear pending timeouts
    for (const t of timeoutsRef.current) {
      clearTimeout(t)
    }
    timeoutsRef.current = []
  }, [])

  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !battle || !isActive) {
      cleanup(viewer)
      return
    }

    // Only animate tier-1 battles
    if (battle.tier !== 1) {
      cleanup(viewer)
      return
    }

    const { lat, lng } = battle.location
    const entities: Entity[] = []

    // Clock setup: use simulation time starting from "now"
    const startTime = JulianDate.now()
    const endTime = JulianDate.addSeconds(startTime, MARCH_DURATION + CLASH_DURATION, new JulianDate())

    // Configure the viewer clock
    const clock = viewer.clock
    clock.startTime = JulianDate.clone(startTime)
    clock.stopTime = JulianDate.clone(endTime)
    clock.currentTime = JulianDate.clone(startTime)
    clock.clockRange = ClockRange.CLAMPED
    clock.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER
    clock.multiplier = 1.0
    clock.shouldAnimate = true

    // Calculate start positions offset from battle center
    // Side 1 approaches from the west, Side 2 from the east
    const side1Start = Cartesian3.fromDegrees(lng - OFFSET_DEG, lat, 0)
    const side2Start = Cartesian3.fromDegrees(lng + OFFSET_DEG, lat, 0)
    const center = Cartesian3.fromDegrees(lng, lat, 0)

    const marchEnd = JulianDate.addSeconds(startTime, MARCH_DURATION, new JulianDate())

    // --- Side 1 sampled position ---
    const side1Position = new SampledPositionProperty()
    side1Position.addSample(startTime, side1Start)
    side1Position.addSample(marchEnd, center)

    // --- Side 2 sampled position ---
    const side2Position = new SampledPositionProperty()
    side2Position.addSample(startTime, side2Start)
    side2Position.addSample(marchEnd, center)

    // Labels for belligerents
    const side1Name = battle.belligerents?.[0] ?? 'Side 1'
    const side2Name = battle.belligerents?.[1] ?? 'Side 2'

    // --- Side 1 entity (blue) ---
    const side1Entity = viewer.entities.add({
      name: side1Name,
      position: side1Position as unknown as Cartesian3,
      point: {
        pixelSize: 14,
        color: SIDE1_COLOR,
        outlineColor: Color.WHITE.withAlpha(0.8),
        outlineWidth: 2,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new NearFarScalar(1e3, 1.5, 1e7, 0.5),
      },
      label: {
        text: side1Name,
        font: '12px sans-serif',
        fillColor: SIDE1_COLOR,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        style: 2, // FILL_AND_OUTLINE
        pixelOffset: new Cartesian3(0, -20, 0) as unknown as import('cesium').Cartesian2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })
    entities.push(side1Entity)

    // --- Side 2 entity (red) ---
    const side2Entity = viewer.entities.add({
      name: side2Name,
      position: side2Position as unknown as Cartesian3,
      point: {
        pixelSize: 14,
        color: SIDE2_COLOR,
        outlineColor: Color.WHITE.withAlpha(0.8),
        outlineWidth: 2,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new NearFarScalar(1e3, 1.5, 1e7, 0.5),
      },
      label: {
        text: side2Name,
        font: '12px sans-serif',
        fillColor: SIDE2_COLOR,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        style: 2,
        pixelOffset: new Cartesian3(0, -20, 0) as unknown as import('cesium').Cartesian2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })
    entities.push(side2Entity)

    // --- Clash entity: appears after march completes ---
    const clashEntity = viewer.entities.add({
      name: `${battle.name} - Clash`,
      position: center,
      point: {
        pixelSize: 0, // starts invisible
        color: CLASH_COLOR.withAlpha(0),
        outlineColor: CLASH_COLOR.withAlpha(0),
        outlineWidth: 0,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      show: false,
    })
    entities.push(clashEntity)

    // After march duration, trigger the clash
    const clashTimeout = setTimeout(() => {
      if (!viewer || viewer.isDestroyed()) return
      if (!viewer.entities.contains(clashEntity)) return

      // Show clash
      clashEntity.show = new ConstantProperty(true) as unknown as boolean

      // Animate the clash: grow then shrink over CLASH_DURATION
      const STEPS = 20
      const stepMs = (CLASH_DURATION * 1000) / STEPS

      for (let i = 0; i <= STEPS; i++) {
        const t = setTimeout(() => {
          if (!viewer || viewer.isDestroyed()) return
          if (!viewer.entities.contains(clashEntity)) return

          const progress = i / STEPS
          // Grow to max at 0.3, then shrink and fade
          let size: number
          let alpha: number
          if (progress < 0.3) {
            size = 30 * (progress / 0.3)
            alpha = 1.0
          } else {
            const fade = (progress - 0.3) / 0.7
            size = 30 * (1 - fade * 0.5)
            alpha = 1.0 - fade
          }

          clashEntity.point = {
            pixelSize: size,
            color: CLASH_COLOR.withAlpha(alpha),
            outlineColor: Color.WHITE.withAlpha(alpha * 0.6),
            outlineWidth: 3 * alpha,
            heightReference: HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          } as unknown as typeof clashEntity.point

          viewer.scene.requestRender()
        }, i * stepMs)
        timeoutsRef.current.push(t)
      }

      viewer.scene.requestRender()
    }, MARCH_DURATION * 1000)

    timeoutsRef.current.push(clashTimeout)
    entitiesRef.current = entities

    // Ensure rendering updates during animation
    viewer.scene.requestRender()

    return () => {
      cleanup(viewer)
      // Reset clock animation
      if (viewer && !viewer.isDestroyed()) {
        clock.shouldAnimate = false
      }
    }
  }, [viewer, battle, isActive, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup(viewer)
    }
  }, [viewer, cleanup])

  // Imperative component - renders nothing to React tree
  return null
}
