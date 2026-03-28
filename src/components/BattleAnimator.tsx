import { useEffect, useRef, useCallback } from 'react'
import {
  Cartesian3,
  Color,
  Entity,
  ConstantProperty,
  HeightReference,
  NearFarScalar,
} from 'cesium'
import type { Battle } from '../types/battle'
import { useGlobe } from './GlobeContext'
import { easeInOutCubic, easeOutExpo } from '../utils/easing'

interface BattleAnimatorProps {
  battle: Battle | null
  isActive: boolean
}

/** Phase durations in milliseconds */
const MARCH_MS = 5000
const CLASH_MS = 2000
const AFTERMATH_MS = 2000
const TOTAL_MS = MARCH_MS + CLASH_MS + AFTERMATH_MS

/** Offset in degrees from battle center for starting positions */
const OFFSET_DEG = 0.1

const SIDE1_COLOR = Color.fromCssColorString('#4488ff')
const SIDE2_COLOR = Color.fromCssColorString('#ff4444')
const CLASH_COLOR = Color.fromCssColorString('#ffd700')

/** Number of concentric ring entities for the clash effect */
const RING_COUNT = 4

/**
 * Animates two army markers converging on a battle location,
 * then triggers a clash with expanding rings, then aftermath fade.
 * Single RAF loop drives the entire animation. Only tier-1 battles.
 */
export default function BattleAnimator({ battle, isActive }: BattleAnimatorProps) {
  const { viewer } = useGlobe()
  const entitiesRef = useRef<Entity[]>([])
  const rafRef = useRef<number>(0)

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    const v = viewer
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
  }, [viewer])

  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !battle || !isActive) {
      cleanup()
      return
    }

    if (battle.tier !== 1) {
      cleanup()
      return
    }

    const { lat, lng } = battle.location

    // Precompute positions
    const side1Start = Cartesian3.fromDegrees(lng - OFFSET_DEG, lat, 0)
    const side2Start = Cartesian3.fromDegrees(lng + OFFSET_DEG, lat, 0)
    const center = Cartesian3.fromDegrees(lng, lat, 0)

    const side1Name = battle.belligerents?.[0] ?? 'Side 1'
    const side2Name = battle.belligerents?.[1] ?? 'Side 2'

    // Scratch Cartesian3 for interpolation
    const scratch1 = new Cartesian3()
    const scratch2 = new Cartesian3()

    // Create side 1 entity
    const side1Entity = viewer.entities.add({
      name: side1Name,
      position: side1Start,
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

    // Create side 2 entity
    const side2Entity = viewer.entities.add({
      name: side2Name,
      position: side2Start,
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

    // Create ring entities for clash phase (start hidden)
    const ringEntities: Entity[] = []
    for (let i = 0; i < RING_COUNT; i++) {
      const ring = viewer.entities.add({
        name: `${battle.name} - Ring ${i}`,
        position: center,
        point: {
          pixelSize: 0,
          color: CLASH_COLOR.withAlpha(0),
          outlineColor: CLASH_COLOR.withAlpha(0),
          outlineWidth: 3,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        show: false,
      })
      ringEntities.push(ring)
    }

    const allEntities = [side1Entity, side2Entity, ...ringEntities]
    entitiesRef.current = allEntities

    const startTimestamp = performance.now()

    const tick = () => {
      if (!viewer || viewer.isDestroyed()) return

      const elapsed = performance.now() - startTimestamp
      if (elapsed >= TOTAL_MS) {
        // Animation complete, clean up
        cleanup()
        return
      }

      if (elapsed < MARCH_MS) {
        // --- March phase ---
        const rawProgress = elapsed / MARCH_MS
        const progress = easeInOutCubic(rawProgress)

        // Interpolate side 1: start -> center
        Cartesian3.lerp(side1Start, center, progress, scratch1)
        side1Entity.position = new ConstantProperty(scratch1.clone()) as unknown as typeof side1Entity.position

        // Interpolate side 2: start -> center
        Cartesian3.lerp(side2Start, center, progress, scratch2)
        side2Entity.position = new ConstantProperty(scratch2.clone()) as unknown as typeof side2Entity.position

      } else if (elapsed < MARCH_MS + CLASH_MS) {
        // --- Clash phase ---
        const clashElapsed = elapsed - MARCH_MS
        const rawProgress = clashElapsed / CLASH_MS

        // Snap armies to center
        side1Entity.position = new ConstantProperty(center) as unknown as typeof side1Entity.position
        side2Entity.position = new ConstantProperty(center) as unknown as typeof side2Entity.position

        // Expanding concentric rings
        for (let i = 0; i < ringEntities.length; i++) {
          const ring = ringEntities[i]
          // Each ring starts slightly delayed
          const ringDelay = i * 0.15
          const ringProgress = Math.max(0, Math.min(1, (rawProgress - ringDelay) / (1 - ringDelay)))
          const easedProgress = easeOutExpo(ringProgress)

          const size = easedProgress * (30 + i * 12)
          const alpha = Math.max(0, 1 - easedProgress * 0.9)

          ring.show = new ConstantProperty(ringProgress > 0) as unknown as boolean
          ring.point = {
            pixelSize: size,
            color: CLASH_COLOR.withAlpha(alpha * 0.4),
            outlineColor: CLASH_COLOR.withAlpha(alpha),
            outlineWidth: Math.max(1, 3 * (1 - easedProgress)),
            heightReference: HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          } as unknown as typeof ring.point
        }

      } else {
        // --- Aftermath phase ---
        const afterElapsed = elapsed - MARCH_MS - CLASH_MS
        const rawProgress = afterElapsed / AFTERMATH_MS
        const progress = easeOutExpo(rawProgress)

        // Determine victor: side 1 grows, side 2 shrinks (or vice versa based on result)
        const side1Wins = battle.result
          ? battle.result.toLowerCase().includes(side1Name.toLowerCase())
          : true

        const victorEntity = side1Wins ? side1Entity : side2Entity
        const loserEntity = side1Wins ? side2Entity : side1Entity
        const victorColor = side1Wins ? SIDE1_COLOR : SIDE2_COLOR
        const loserColor = side1Wins ? SIDE2_COLOR : SIDE1_COLOR

        const victorSize = 14 + progress * 4
        const loserSize = Math.max(0, 14 * (1 - progress))
        const loserAlpha = Math.max(0, 1 - progress)

        victorEntity.point = {
          pixelSize: victorSize,
          color: victorColor,
          outlineColor: Color.WHITE.withAlpha(0.8),
          outlineWidth: 2,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e3, 1.5, 1e7, 0.5),
        } as unknown as typeof victorEntity.point

        loserEntity.point = {
          pixelSize: loserSize,
          color: loserColor.withAlpha(loserAlpha),
          outlineColor: Color.WHITE.withAlpha(loserAlpha * 0.8),
          outlineWidth: 2 * loserAlpha,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e3, 1.5, 1e7, 0.5),
        } as unknown as typeof loserEntity.point

        // Fade out rings
        for (const ring of ringEntities) {
          ring.show = new ConstantProperty(false) as unknown as boolean
        }
      }

      viewer.scene.requestRender()
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    viewer.scene.requestRender()

    return () => {
      cleanup()
    }
  }, [viewer, battle, isActive, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  // Imperative component - renders nothing to React tree
  return null
}
