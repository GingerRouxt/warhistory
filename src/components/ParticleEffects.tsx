import { useEffect, useRef, useCallback } from 'react'
import {
  Cartesian3,
  Color,
  ParticleSystem,
  CircleEmitter,
  Matrix4,
  Cartesian2,
  ParticleBurst,
} from 'cesium'
import type { Viewer } from 'cesium'
import type { Battle } from '../types/battle'
import type { EraId } from '../types/battle'
import { useGlobe } from './GlobeContext'

interface ParticleEffectsProps {
  battle: Battle | null
  isActive: boolean
  /** Seconds to wait before starting particles. Defaults to 5. */
  delay?: number
  /** Era of the battle — controls particle color palette. */
  era?: EraId
}

/** How long the particle system runs in seconds. */
const EFFECT_DURATION = 10

/** Max active particle systems at once. Oldest gets removed if exceeded. */
const MAX_ACTIVE_SYSTEMS = 2

/** Era-specific color palettes. */
const ERA_COLORS: Record<EraId, Color[]> = {
  biblical: [
    new Color(212 / 255, 170 / 255, 60 / 255, 0.6),  // warm amber
    new Color(255 / 255, 240 / 255, 200 / 255, 0.5),  // white-gold
  ],
  classical: [
    new Color(140 / 255, 110 / 255, 70 / 255, 0.6),   // brown dust
    new Color(120 / 255, 120 / 255, 120 / 255, 0.5),   // gray
  ],
  medieval: [
    new Color(140 / 255, 110 / 255, 70 / 255, 0.6),   // brown dust
    new Color(120 / 255, 120 / 255, 120 / 255, 0.5),   // gray
  ],
  'early-modern': [
    new Color(140 / 255, 110 / 255, 70 / 255, 0.6),   // brown dust
    new Color(120 / 255, 120 / 255, 120 / 255, 0.5),   // gray
  ],
  modern: [
    new Color(80 / 255, 80 / 255, 80 / 255, 0.6),     // darker smoke
    new Color(200 / 255, 100 / 255, 30 / 255, 0.5),    // orange sparks
  ],
  contemporary: [
    new Color(100 / 255, 100 / 255, 110 / 255, 0.6),   // gray haze
  ],
}

/** Fallback colors if era not provided. */
const DEFAULT_COLORS = [
  Color.fromCssColorString('rgba(120, 110, 100, 0.6)'),
  Color.fromCssColorString('rgba(90, 85, 75, 0.5)'),
]

// Module-level cached particle canvas — created once, reused across all instances
let cachedParticleCanvas: HTMLCanvasElement | null = null

function getParticleCanvas(): HTMLCanvasElement {
  if (cachedParticleCanvas) return cachedParticleCanvas

  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const center = size / 2
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
    gradient.addColorStop(0.4, 'rgba(200, 190, 170, 0.8)')
    gradient.addColorStop(1, 'rgba(100, 90, 80, 0.0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }

  cachedParticleCanvas = canvas
  return canvas
}

// Pool tracking: active particle systems with their creation order
const activePool: { system: ParticleSystem; viewer: Viewer; createdAt: number }[] = []

function addToPool(system: ParticleSystem, v: Viewer) {
  // If pool is full, remove the oldest
  while (activePool.length >= MAX_ACTIVE_SYSTEMS) {
    const oldest = activePool.shift()
    if (oldest && !oldest.viewer.isDestroyed()) {
      try {
        oldest.viewer.scene.primitives.remove(oldest.system)
      } catch {
        // already removed
      }
    }
  }
  activePool.push({ system, viewer: v, createdAt: Date.now() })
}

function removeFromPool(system: ParticleSystem) {
  const idx = activePool.findIndex(entry => entry.system === system)
  if (idx !== -1) {
    activePool.splice(idx, 1)
  }
}

/**
 * Creates a CesiumJS ParticleSystem at the battle location
 * that emits smoke/dust particles upward after a configurable delay.
 * Supports era-specific colors and tier-1 boosted emission.
 */
export default function ParticleEffects({
  battle,
  isActive,
  delay = 5,
  era,
}: ParticleEffectsProps) {
  const { viewer } = useGlobe()
  const particleSystemRef = useRef<ParticleSystem | null>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const cleanup = useCallback((v: Viewer | null) => {
    // Clear timeouts
    for (const t of timeoutsRef.current) {
      clearTimeout(t)
    }
    timeoutsRef.current = []

    // Remove particle system
    if (particleSystemRef.current && v && !v.isDestroyed()) {
      try {
        v.scene.primitives.remove(particleSystemRef.current)
      } catch {
        // primitive may already be removed
      }
      removeFromPool(particleSystemRef.current)
      particleSystemRef.current = null
      v.scene.requestRender()
    }
  }, [])

  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !battle || !isActive) {
      cleanup(viewer)
      return
    }

    const { lat, lng } = battle.location
    const battleEra = era ?? battle.era
    const colors = battleEra ? (ERA_COLORS[battleEra] ?? DEFAULT_COLORS) : DEFAULT_COLORS
    const startColor = colors[0]
    const endColor = colors.length > 1
      ? colors[1].withAlpha(0.0)
      : colors[0].withAlpha(0.0)

    const isTier1 = battle.tier === 1
    const baseEmissionRate = 15
    const emissionRate = isTier1 ? Math.round(baseEmissionRate * 1.5) : baseEmissionRate

    // Delay the particle effect — staggers with camera flight
    const startTimeout = setTimeout(() => {
      if (!viewer || viewer.isDestroyed()) return

      // Model matrix positions the particle system at the battle location
      const position = Cartesian3.fromDegrees(lng, lat, 50) // slightly above ground
      const modelMatrix = Matrix4.fromTranslation(position)

      const particleSystem = new ParticleSystem({
        image: getParticleCanvas(),
        startColor,
        endColor,
        startScale: 1.0,
        endScale: 4.0,
        minimumParticleLife: 2.0,
        maximumParticleLife: 5.0,
        minimumSpeed: 1.0,
        maximumSpeed: 4.0,
        imageSize: new Cartesian2(20, 20),
        emissionRate,
        emitter: new CircleEmitter(50.0),
        modelMatrix,
        lifetime: EFFECT_DURATION,
        loop: false,
        bursts: [
          new ParticleBurst({
            time: 0.0,
            minimum: isTier1 ? 30 : 20,
            maximum: isTier1 ? 60 : 40,
          }),
          new ParticleBurst({
            time: 2.0,
            minimum: isTier1 ? 15 : 10,
            maximum: isTier1 ? 30 : 20,
          }),
        ],
        // Force particles upward
        updateCallback: (particle: { velocity: Cartesian3 }) => {
          particle.velocity = Cartesian3.add(
            particle.velocity,
            new Cartesian3(0, 0, 0.3),
            new Cartesian3(),
          )
        },
      })

      viewer.scene.primitives.add(particleSystem)
      addToPool(particleSystem, viewer)
      particleSystemRef.current = particleSystem
      viewer.scene.requestRender()

      // Auto-cleanup after effect duration
      const cleanupTimeout = setTimeout(() => {
        if (particleSystemRef.current && viewer && !viewer.isDestroyed()) {
          try {
            viewer.scene.primitives.remove(particleSystemRef.current)
          } catch {
            // already removed
          }
          removeFromPool(particleSystemRef.current)
          particleSystemRef.current = null
          viewer.scene.requestRender()
        }
      }, EFFECT_DURATION * 1000)

      timeoutsRef.current.push(cleanupTimeout)
    }, delay * 1000)

    timeoutsRef.current.push(startTimeout)

    return () => {
      cleanup(viewer)
    }
  }, [viewer, battle, isActive, delay, era, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup(viewer)
    }
  }, [viewer, cleanup])

  // Imperative component - renders nothing to React tree
  return null
}
