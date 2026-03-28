import { useEffect, useMemo, useRef } from 'react'
import {
  SingleTileImageryProvider,
  Rectangle,
} from 'cesium'
import type { ImageryLayer } from 'cesium'
import type { Battle } from '../types/battle'
import { useGlobe } from './GlobeContext'

interface HeatmapLayerProps {
  battles: Battle[]
  isActive: boolean
  opacity?: number
}

const CANVAS_W = 720
const CANVAS_H = 360

/** Blob radius by tier */
const TIER_RADIUS: Record<1 | 2 | 3, number> = {
  1: 8,
  2: 5,
  3: 3,
}

/**
 * Plot a gaussian blob on a density buffer at the given pixel coordinates.
 */
function plotGaussian(
  density: Float32Array,
  cx: number,
  cy: number,
  radius: number,
) {
  const r2 = radius * radius
  const x0 = Math.max(0, Math.floor(cx - radius))
  const x1 = Math.min(CANVAS_W - 1, Math.ceil(cx + radius))
  const y0 = Math.max(0, Math.floor(cy - radius))
  const y1 = Math.min(CANVAS_H - 1, Math.ceil(cy + radius))

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx
      const dy = y - cy
      const dist2 = dx * dx + dy * dy
      if (dist2 <= r2) {
        const intensity = Math.exp(-dist2 / (r2 * 0.3))
        density[y * CANVAS_W + x] += intensity
      }
    }
  }
}

/**
 * Map a density value [0..max] to a warm gradient color.
 * transparent -> gold (#d4a017) -> orange (#ff6600) -> red (#cc0000)
 */
function densityToColor(value: number, maxDensity: number): [number, number, number, number] {
  if (value <= 0 || maxDensity <= 0) return [0, 0, 0, 0]

  const t = Math.min(value / maxDensity, 1)

  // Three-stop gradient: gold (0.0-0.33), orange (0.33-0.66), red (0.66-1.0)
  let r: number, g: number, b: number

  if (t < 0.33) {
    const s = t / 0.33
    // transparent -> gold
    r = 0xd4
    g = 0xa0
    b = 0x17
    return [r, g, b, Math.floor(s * 200)]
  } else if (t < 0.66) {
    const s = (t - 0.33) / 0.33
    // gold -> orange
    r = Math.round(0xd4 + (0xff - 0xd4) * s)
    g = Math.round(0xa0 + (0x66 - 0xa0) * s)
    b = Math.round(0x17 + (0x00 - 0x17) * s)
    return [r, g, b, 200]
  } else {
    const s = (t - 0.66) / 0.34
    // orange -> red
    r = Math.round(0xff + (0xcc - 0xff) * s)
    g = Math.round(0x66 * (1 - s))
    b = 0x00
    return [r, g, b, 220]
  }
}

function buildHeatmapCanvas(battles: Battle[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H

  const density = new Float32Array(CANVAS_W * CANVAS_H)

  for (const battle of battles) {
    // Convert lat/lng to pixel coordinates
    // lng: -180..180 -> 0..720
    // lat: 90..-90 -> 0..360 (y is inverted)
    const px = ((battle.location.lng + 180) / 360) * CANVAS_W
    const py = ((90 - battle.location.lat) / 180) * CANVAS_H
    const radius = TIER_RADIUS[battle.tier] ?? 3
    plotGaussian(density, px, py, radius)
  }

  // Find max density for normalization
  let maxDensity = 0
  for (let i = 0; i < density.length; i++) {
    if (density[i] > maxDensity) maxDensity = density[i]
  }

  // Render density to canvas
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(CANVAS_W, CANVAS_H)
  const pixels = imageData.data

  for (let i = 0; i < density.length; i++) {
    const [r, g, b, a] = densityToColor(density[i], maxDensity)
    const offset = i * 4
    pixels[offset] = r
    pixels[offset + 1] = g
    pixels[offset + 2] = b
    pixels[offset + 3] = a
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

export function HeatmapLayer({
  battles,
  isActive,
  opacity = 0.4,
}: HeatmapLayerProps) {
  const { viewer } = useGlobe()
  const layerRef = useRef<ImageryLayer | null>(null)

  // Memoize the canvas DataURL — only regenerate when battles change
  const dataUrl = useMemo(() => {
    if (battles.length === 0) return null
    const canvas = buildHeatmapCanvas(battles)
    return canvas.toDataURL('image/png')
  }, [battles])

  // Add/remove the imagery layer when viewer, dataUrl, or isActive change
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    // Remove existing layer
    if (layerRef.current) {
      viewer.imageryLayers.remove(layerRef.current, false)
      layerRef.current = null
    }

    if (!isActive || !dataUrl) {
      viewer.scene.requestRender()
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const provider = await SingleTileImageryProvider.fromUrl(dataUrl, {
          rectangle: Rectangle.fromDegrees(-180, -90, 180, 90),
        })

        if (cancelled || !viewer || viewer.isDestroyed()) return

        const layer = viewer.imageryLayers.addImageryProvider(provider)
        layer.alpha = opacity
        layerRef.current = layer
        viewer.scene.requestRender()
      } catch {
        // Provider creation failed — canvas data URL may be invalid
      }
    })()

    return () => {
      cancelled = true
      if (layerRef.current && viewer && !viewer.isDestroyed()) {
        viewer.imageryLayers.remove(layerRef.current, false)
        layerRef.current = null
      }
    }
  }, [viewer, dataUrl, isActive])

  // Apply opacity changes directly to the existing layer — no rebuild
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.alpha = opacity
      if (viewer && !viewer.isDestroyed()) {
        viewer.scene.requestRender()
      }
    }
  }, [opacity, viewer])

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      if (layerRef.current && viewer && !viewer.isDestroyed()) {
        viewer.imageryLayers.remove(layerRef.current, false)
        layerRef.current = null
      }
    }
  }, [viewer])

  return null
}
