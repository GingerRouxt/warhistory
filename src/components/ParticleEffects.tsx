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
import { useGlobe } from './GlobeContext'

interface ParticleEffectsProps {
  battle: Battle | null
  isActive: boolean
  /** Seconds to wait before starting particles. Defaults to 5. */
  delay?: number
}

/** How long the particle system runs in seconds. */
const EFFECT_DURATION = 10

const SMOKE_COLORS = [
  Color.fromCssColorString('rgba(120, 110, 100, 0.6)'), // gray-brown
  Color.fromCssColorString('rgba(90, 85, 75, 0.5)'),    // darker gray
  Color.fromCssColorString('rgba(140, 120, 90, 0.4)'),  // dusty tan
]

/**
 * Creates a CesiumJS ParticleSystem at the battle location
 * that emits smoke/dust particles upward after a configurable delay.
 */
export default function ParticleEffects({
  battle,
  isActive,
  delay = 5,
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

    // Delay the particle effect
    const startTimeout = setTimeout(() => {
      if (!viewer || viewer.isDestroyed()) return

      // Model matrix positions the particle system at the battle location
      const position = Cartesian3.fromDegrees(lng, lat, 50) // slightly above ground
      const modelMatrix = Matrix4.fromTranslation(position)

      const particleSystem = new ParticleSystem({
        // Use a simple generated image for particles (white circle)
        image: createParticleCanvas(),
        startColor: SMOKE_COLORS[0],
        endColor: Color.fromCssColorString('rgba(60, 55, 50, 0.0)'),
        startScale: 1.0,
        endScale: 4.0,
        minimumParticleLife: 2.0,
        maximumParticleLife: 5.0,
        minimumSpeed: 1.0,
        maximumSpeed: 4.0,
        imageSize: new Cartesian2(20, 20),
        emissionRate: 15,
        emitter: new CircleEmitter(50.0),
        modelMatrix,
        lifetime: EFFECT_DURATION,
        loop: false,
        bursts: [
          // Initial burst when the clash happens
          new ParticleBurst({
            time: 0.0,
            minimum: 20,
            maximum: 40,
          }),
          // Secondary burst
          new ParticleBurst({
            time: 2.0,
            minimum: 10,
            maximum: 20,
          }),
        ],
        // Force particles upward
        updateCallback: (particle: { velocity: Cartesian3 }) => {
          // Nudge velocity upward (positive Z in local frame)
          particle.velocity = Cartesian3.add(
            particle.velocity,
            new Cartesian3(0, 0, 0.3),
            new Cartesian3(),
          )
        },
      })

      viewer.scene.primitives.add(particleSystem)
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
  }, [viewer, battle, isActive, delay, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup(viewer)
    }
  }, [viewer, cleanup])

  // Imperative component - renders nothing to React tree
  return null
}

/**
 * Creates a small canvas with a soft circular gradient for particle rendering.
 * Used as the particle image when no external texture is available.
 */
function createParticleCanvas(): HTMLCanvasElement {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const center = size / 2
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
  gradient.addColorStop(0.4, 'rgba(200, 190, 170, 0.8)')
  gradient.addColorStop(1, 'rgba(100, 90, 80, 0.0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  return canvas
}
