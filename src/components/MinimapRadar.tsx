import { useRef, useEffect, useCallback, useState } from 'react'
import type { Battle } from '../types/battle'
import erasData from '../data/eras.json'

interface MinimapRadarProps {
  battles: Battle[]
  isVisible: boolean
}

const ERA_DOT_COLORS: Record<string, string> = {}
for (const era of erasData) {
  ERA_DOT_COLORS[era.id] = era.color
}

const RADAR_SIZE_DESKTOP = 160
const RADAR_SIZE_MOBILE = 120
const PADDING = 4

function getRadarSize() {
  return window.innerWidth < 768 ? RADAR_SIZE_MOBILE : RADAR_SIZE_DESKTOP
}

/** Simple equirectangular minimap showing battle positions and camera viewport. */
export function MinimapRadar({ battles, isVisible }: MinimapRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewRectRef = useRef<{ west: number; south: number; east: number; north: number } | null>(null)
  const animFrameRef = useRef<number>(0)
  const [radarSize, setRadarSize] = useState(getRadarSize)

  useEffect(() => {
    function handleResize() {
      setRadarSize(getRadarSize())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const lngToX = useCallback((lng: number) => {
    return PADDING + ((lng + 180) / 360) * (radarSize - PADDING * 2)
  }, [radarSize])

  const latToY = useCallback((lat: number) => {
    return PADDING + ((90 - lat) / 180) * (radarSize - PADDING * 2)
  }, [radarSize])

  const xToLng = useCallback((x: number) => {
    return ((x - PADDING) / (radarSize - PADDING * 2)) * 360 - 180
  }, [radarSize])

  const yToLat = useCallback((y: number) => {
    return 90 - ((y - PADDING) / (radarSize - PADDING * 2)) * 180
  }, [radarSize])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = radarSize * dpr
    canvas.height = radarSize * dpr
    ctx.scale(dpr, dpr)

    // Clear
    ctx.clearRect(0, 0, radarSize, radarSize)

    // Draw faint grid lines
    ctx.strokeStyle = 'rgba(200, 200, 210, 0.08)'
    ctx.lineWidth = 0.5
    // Horizontal (latitude) lines at 60N, 30N, eq, 30S, 60S
    for (const lat of [60, 30, 0, -30, -60]) {
      const y = latToY(lat)
      ctx.beginPath()
      ctx.moveTo(PADDING, y)
      ctx.lineTo(radarSize - PADDING, y)
      ctx.stroke()
    }
    // Vertical (longitude) lines
    for (const lng of [-120, -60, 0, 60, 120]) {
      const x = lngToX(lng)
      ctx.beginPath()
      ctx.moveTo(x, PADDING)
      ctx.lineTo(x, radarSize - PADDING)
      ctx.stroke()
    }

    // Draw battle dots
    for (const battle of battles) {
      const x = lngToX(battle.location.lng)
      const y = latToY(battle.location.lat)
      const color = ERA_DOT_COLORS[battle.era] || '#f5e6c8'
      ctx.fillStyle = color
      ctx.globalAlpha = 0.85
      ctx.beginPath()
      ctx.arc(x, y, battle.tier === 1 ? 2 : 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // Draw viewport rectangle
    const rect = viewRectRef.current
    if (rect) {
      const x1 = lngToX(rect.west)
      const y1 = latToY(rect.north)
      const x2 = lngToX(rect.east)
      const y2 = latToY(rect.south)
      const w = x2 - x1
      const h = y2 - y1
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 1
      ctx.strokeRect(x1, y1, w > 0 ? w : radarSize - PADDING * 2, h > 0 ? h : radarSize - PADDING * 2)
    }
  }, [battles, radarSize, lngToX, latToY])

  // Listen to Cesium camera changes
  useEffect(() => {
    if (!isVisible) return

    const viewer = (window as unknown as Record<string, unknown>).__cesiumViewer as
      | { camera: { changed: { addEventListener: (cb: () => void) => () => void }; computeViewRectangle: () => { west: number; south: number; east: number; north: number } | undefined } }
      | undefined

    function updateViewRect() {
      if (!viewer) return
      try {
        const rect = viewer.camera.computeViewRectangle()
        if (rect) {
          const toDeg = 180 / Math.PI
          viewRectRef.current = {
            west: rect.west * toDeg,
            south: rect.south * toDeg,
            east: rect.east * toDeg,
            north: rect.north * toDeg,
          }
        }
      } catch {
        // Camera may not be ready
      }
      draw()
    }

    updateViewRect()

    let removeListener: (() => void) | undefined
    if (viewer?.camera?.changed) {
      removeListener = viewer.camera.changed.addEventListener(updateViewRect)
    }

    // Also redraw periodically as fallback
    const interval = setInterval(updateViewRect, 2000)

    return () => {
      removeListener?.()
      clearInterval(interval)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isVisible, draw])

  // Redraw when battles change
  useEffect(() => {
    draw()
  }, [draw])

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = radarSize / rect.width
    const scaleY = radarSize / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const lng = xToLng(x)
    const lat = yToLat(y)

    const viewer = (window as unknown as Record<string, unknown>).__cesiumViewer as
      | { camera: { flyTo: (opts: unknown) => void }; scene: { globe: unknown } }
      | undefined

    if (viewer?.camera) {
      // Use Cesium if available
      const Cesium = (window as unknown as Record<string, unknown>).Cesium as
        | { Cartesian3: { fromDegrees: (lng: number, lat: number, h: number) => unknown } }
        | undefined
      if (Cesium) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lng, lat, 5_000_000),
          duration: 1.5,
        })
      }
    }
  }

  if (!isVisible) return null

  return (
    <div
      className="fixed z-40"
      style={{
        bottom: 16,
        right: 16,
        width: radarSize,
        height: radarSize,
        background: 'rgba(10, 10, 20, 0.7)',
        backdropFilter: 'blur(12px)',
        borderRadius: 8,
        border: '1px solid rgba(212, 160, 23, 0.2)',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      }}
    >
      <canvas
        ref={canvasRef}
        width={radarSize}
        height={radarSize}
        style={{ width: radarSize, height: radarSize, cursor: 'crosshair' }}
        onClick={handleClick}
      />
    </div>
  )
}
