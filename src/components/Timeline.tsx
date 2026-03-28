import { useRef, useEffect, useCallback, useMemo } from 'react'
import type { Battle, Era } from '../types/battle'
import { yearToPosition, positionToYear } from '../hooks/useTimeline'
import { formatYear } from '../utils/format'
import erasData from '../data/eras.json'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimelineProps {
  battles: Battle[]
  currentYear: number
  timeWindow: { start: number; end: number }
  onYearChange: (year: number) => void
  onTimeWindowChange: (window: { start: number; end: number }) => void
  isPlaying: boolean
  onPlayToggle: () => void
  playbackSpeed: number
  onSpeedChange: (speed: number) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_HEIGHT = 80
const CONTROLS_HEIGHT = 40
const TOTAL_HEIGHT = CANVAS_HEIGHT + CONTROLS_HEIGHT
const MIN_YEAR = -4000
const MAX_YEAR = 2026
const MIN_WINDOW = 50
const MAX_WINDOW = MAX_YEAR - MIN_YEAR

const GOLD = '#d4a017'
const GOLD_GLOW = 'rgba(212, 160, 23, 0.4)'
const GOLD_DIM = 'rgba(212, 160, 23, 0.6)'
const BG_TOP = 'rgba(10, 10, 18, 0.92)'
const BG_BOT = 'rgba(6, 6, 14, 0.96)'
const GRID_COLOR = 'rgba(255, 255, 255, 0.06)'
const GRID_LABEL = 'rgba(255, 255, 255, 0.35)'
const DENSITY_COLOR_LO = 'rgba(212, 160, 23, 0.15)'
const DENSITY_COLOR_HI = 'rgba(212, 160, 23, 0.7)'
const SCRUBBER_WIDTH = 2
const HANDLE_RADIUS = 7

const SPEED_OPTIONS = [1, 5, 10, 50]

const eras: Era[] = erasData as Era[]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// formatYear imported from utils/format

function getEraForYear(year: number): Era | undefined {
  return eras.find((e) => year >= e.startYear && year < e.endYear)
}

/** Bucket battles into year ranges and return density map */
function computeDensity(
  battles: Battle[],
  windowStart: number,
  windowEnd: number,
  bucketCount: number
): number[] {
  const span = windowEnd - windowStart
  const bucketSize = span / bucketCount
  const density = new Array<number>(bucketCount).fill(0)

  for (const b of battles) {
    const y = b.year
    if (y < windowStart || y > windowEnd) continue
    const idx = Math.min(
      bucketCount - 1,
      Math.floor((y - windowStart) / bucketSize)
    )
    density[idx]++
  }
  return density
}

/** Determine nice grid interval for year labels */
function gridInterval(span: number): number {
  if (span > 4000) return 1000
  if (span > 2000) return 500
  if (span > 800) return 200
  if (span > 300) return 100
  if (span > 100) return 50
  if (span > 40) return 20
  if (span > 15) return 10
  if (span > 5) return 5
  return 1
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Timeline({
  battles,
  currentYear,
  timeWindow,
  onYearChange,
  onTimeWindowChange,
  isPlaying,
  onPlayToggle,
  playbackSpeed,
  onSpeedChange,
}: TimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const dirtyRef = useRef(true)
  const isDraggingScrubber = useRef(false)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, windowStart: 0, windowEnd: 0 })

  // -----------------------------------------------------------------------
  // Coordinate transforms (window-aware)
  // -----------------------------------------------------------------------

  const yearToX = useCallback(
    (year: number, width: number): number => {
      const pStart = yearToPosition(timeWindow.start)
      const pEnd = yearToPosition(timeWindow.end)
      const p = yearToPosition(year)
      return ((p - pStart) / (pEnd - pStart)) * width
    },
    [timeWindow]
  )

  const xToYear = useCallback(
    (x: number, width: number): number => {
      const pStart = yearToPosition(timeWindow.start)
      const pEnd = yearToPosition(timeWindow.end)
      const p = pStart + (x / width) * (pEnd - pStart)
      return positionToYear(p)
    },
    [timeWindow]
  )

  // -----------------------------------------------------------------------
  // Density (memoized)
  // -----------------------------------------------------------------------

  const density = useMemo(() => {
    const canvas = canvasRef.current
    const buckets = canvas ? Math.floor(canvas.width / (window.devicePixelRatio || 1) / 3) : 400
    return computeDensity(battles, timeWindow.start, timeWindow.end, Math.max(1, buckets))
  }, [battles, timeWindow])

  // -----------------------------------------------------------------------
  // Canvas draw
  // -----------------------------------------------------------------------

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = CANVAS_HEIGHT

    // Resize backing store if needed
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // --- Layer 1: Background gradient ---
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
    bgGrad.addColorStop(0, BG_TOP)
    bgGrad.addColorStop(1, BG_BOT)
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    // Top edge glow
    const edgeGrad = ctx.createLinearGradient(0, 0, 0, 2)
    edgeGrad.addColorStop(0, 'rgba(212, 160, 23, 0.3)')
    edgeGrad.addColorStop(1, 'rgba(212, 160, 23, 0)')
    ctx.fillStyle = edgeGrad
    ctx.fillRect(0, 0, w, 2)

    // --- Layer 2: Era color bands ---
    for (const era of eras) {
      const x0 = yearToX(era.startYear, w)
      const x1 = yearToX(era.endYear, w)
      if (x1 < 0 || x0 > w) continue

      const clampX0 = Math.max(0, x0)
      const clampX1 = Math.min(w, x1)

      // Subtle band
      ctx.fillStyle = era.color + '18' // ~10% opacity via hex alpha
      ctx.fillRect(clampX0, 0, clampX1 - clampX0, h)

      // Bottom color strip
      ctx.fillStyle = era.color + '60'
      ctx.fillRect(clampX0, h - 4, clampX1 - clampX0, 4)
    }

    // --- Layer 3: Battle density heatmap ---
    if (density.length > 0) {
      const maxD = density.reduce((max, v) => Math.max(max, v), 1)
      const barW = w / density.length

      for (let i = 0; i < density.length; i++) {
        if (density[i] === 0) continue
        const ratio = density[i] / maxD
        const barH = ratio * (h * 0.55)

        // Gradient from bottom
        const x = i * barW
        const grad = ctx.createLinearGradient(0, h - barH, 0, h)
        grad.addColorStop(0, DENSITY_COLOR_HI)
        grad.addColorStop(1, DENSITY_COLOR_LO)
        ctx.fillStyle = grad
        ctx.fillRect(x, h - 4 - barH, barW - 0.5, barH)

        // Gold glow cap at top of each bar
        ctx.fillStyle = 'rgba(212, 160, 23, 0.8)'
        ctx.fillRect(x, h - 4 - barH, barW - 0.5, 2)
      }
    }

    // --- Layer 4: Grid lines & year labels ---
    const span = timeWindow.end - timeWindow.start
    const interval = gridInterval(span)
    const firstGrid =
      Math.ceil(timeWindow.start / interval) * interval

    ctx.font = '10px "Inter", "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    for (let y = firstGrid; y <= timeWindow.end; y += interval) {
      const x = yearToX(y, w)
      if (x < 0 || x > w) continue

      // Major grid lines (every 1000 years) get brighter
      const isMajor = y % 1000 === 0

      // Grid line
      ctx.strokeStyle = isMajor ? 'rgba(255, 255, 255, 0.12)' : GRID_COLOR
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()

      // Label — brighter for major grid lines
      ctx.fillStyle = isMajor ? 'rgba(255, 255, 255, 0.6)' : GRID_LABEL
      ctx.fillText(formatYear(y), x, 4)
    }

    // --- Layer 5: Era labels (centered in visible portion) ---
    ctx.font = '11px "Inter", "Segoe UI", sans-serif'
    ctx.textBaseline = 'bottom'
    for (const era of eras) {
      const x0 = Math.max(0, yearToX(era.startYear, w))
      const x1 = Math.min(w, yearToX(era.endYear, w))
      const eraW = x1 - x0
      if (eraW < 40) continue // too narrow to label

      const cx = x0 + eraW / 2
      const labelText = era.name
      const labelMetrics = ctx.measureText(labelText)
      const labelW = labelMetrics.width + 12
      const labelH = 16

      // Subtle background rectangle for era label
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.beginPath()
      const r = 3
      const lx = cx - labelW / 2
      const ly = h - 6 - labelH
      ctx.moveTo(lx + r, ly)
      ctx.lineTo(lx + labelW - r, ly)
      ctx.arcTo(lx + labelW, ly, lx + labelW, ly + r, r)
      ctx.lineTo(lx + labelW, ly + labelH - r)
      ctx.arcTo(lx + labelW, ly + labelH, lx + labelW - r, ly + labelH, r)
      ctx.lineTo(lx + r, ly + labelH)
      ctx.arcTo(lx, ly + labelH, lx, ly + labelH - r, r)
      ctx.lineTo(lx, ly + r)
      ctx.arcTo(lx, ly, lx + r, ly, r)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = era.color + 'aa'
      ctx.fillText(labelText, cx, h - 6)
    }

    // --- Layer 6: Bottom gold gradient separator ---
    const bottomGrad = ctx.createLinearGradient(0, 0, w, 0)
    bottomGrad.addColorStop(0, 'transparent')
    bottomGrad.addColorStop(0.5, 'rgba(212, 160, 23, 0.4)')
    bottomGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = bottomGrad
    ctx.fillRect(0, h - 1, w, 1)

    // --- Layer 7: Scrubber line ---
    const sx = yearToX(currentYear, w)
    if (sx >= -HANDLE_RADIUS && sx <= w + HANDLE_RADIUS) {
      // Glow
      ctx.shadowColor = GOLD_GLOW
      ctx.shadowBlur = isDraggingScrubber.current ? 20 : 12
      ctx.strokeStyle = GOLD
      ctx.lineWidth = SCRUBBER_WIDTH
      ctx.beginPath()
      ctx.moveTo(sx, HANDLE_RADIUS * 2)
      ctx.lineTo(sx, h)
      ctx.stroke()
      ctx.shadowBlur = 0

      // Drag glow ring (outer circle when dragging)
      if (isDraggingScrubber.current) {
        ctx.fillStyle = 'rgba(212, 160, 23, 0.2)'
        ctx.beginPath()
        ctx.arc(sx, HANDLE_RADIUS * 2, HANDLE_RADIUS + 4, 0, Math.PI * 2)
        ctx.fill()
      }

      // Handle (diamond)
      ctx.fillStyle = GOLD
      ctx.beginPath()
      ctx.moveTo(sx, HANDLE_RADIUS * 2 - HANDLE_RADIUS)
      ctx.lineTo(sx + HANDLE_RADIUS, HANDLE_RADIUS * 2)
      ctx.lineTo(sx, HANDLE_RADIUS * 2 + HANDLE_RADIUS)
      ctx.lineTo(sx - HANDLE_RADIUS, HANDLE_RADIUS * 2)
      ctx.closePath()
      ctx.fill()

      // Handle outline glow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }, [timeWindow, currentYear, density, yearToX])

  // -----------------------------------------------------------------------
  // Mark dirty when inputs change
  // -----------------------------------------------------------------------

  useEffect(() => {
    dirtyRef.current = true
  }, [timeWindow, currentYear, battles, isPlaying, isDraggingScrubber.current])

  // -----------------------------------------------------------------------
  // Animation loop
  // -----------------------------------------------------------------------

  useEffect(() => {
    let running = true
    const loop = () => {
      if (!running) return
      if (dirtyRef.current) {
        dirtyRef.current = false
        draw()
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [draw])

  // -----------------------------------------------------------------------
  // Mouse / pointer interactions
  // -----------------------------------------------------------------------

  const clampWindow = useCallback(
    (start: number, end: number) => {
      let s = start
      let e = end
      const span = e - s
      if (span < MIN_WINDOW) {
        const mid = (s + e) / 2
        s = mid - MIN_WINDOW / 2
        e = mid + MIN_WINDOW / 2
      }
      if (s < MIN_YEAR) {
        s = MIN_YEAR
        e = s + Math.max(span, MIN_WINDOW)
      }
      if (e > MAX_YEAR) {
        e = MAX_YEAR
        s = e - Math.max(span, MIN_WINDOW)
      }
      return { start: Math.round(s), end: Math.round(e) }
    },
    []
  )

  // Core pointer logic shared by mouse and touch handlers
  const pointerDown = useCallback(
    (clientX: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const w = rect.width

      // Check if near scrubber handle
      const sx = yearToX(currentYear, w)
      if (Math.abs(x - sx) < HANDLE_RADIUS + 4) {
        isDraggingScrubber.current = true
        return
      }

      // Otherwise start panning
      isPanning.current = true
      panStart.current = {
        x: clientX,
        windowStart: timeWindow.start,
        windowEnd: timeWindow.end,
      }
    },
    [currentYear, timeWindow, yearToX]
  )

  const pointerMove = useCallback(
    (clientX: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const w = rect.width

      if (isDraggingScrubber.current) {
        const x = clientX - rect.left
        const year = xToYear(Math.max(0, Math.min(w, x)), w)
        onYearChange(Math.max(MIN_YEAR, Math.min(MAX_YEAR, year)))
        dirtyRef.current = true
        return
      }

      if (isPanning.current) {
        const dx = clientX - panStart.current.x
        const pStart = yearToPosition(panStart.current.windowStart)
        const pEnd = yearToPosition(panStart.current.windowEnd)
        const pSpan = pEnd - pStart
        const pDelta = -(dx / w) * pSpan

        const newStart = positionToYear(pStart + pDelta)
        const newEnd = positionToYear(pEnd + pDelta)
        onTimeWindowChange(clampWindow(newStart, newEnd))
        dirtyRef.current = true
      }
    },
    [xToYear, onYearChange, onTimeWindowChange, clampWindow]
  )

  const pointerUp = useCallback(() => {
    isDraggingScrubber.current = false
    isPanning.current = false
  }, [])

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      pointerDown(e.clientX)
    },
    [pointerDown]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      pointerMove(e.clientX)
    },
    [pointerMove]
  )

  const handleMouseUp = useCallback(() => {
    pointerUp()
  }, [pointerUp])

  // Touch handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        pointerDown(e.touches[0].clientX)
      }
    },
    [pointerDown]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length > 0) {
        pointerMove(e.touches[0].clientX)
      }
    },
    [pointerMove]
  )

  const handleTouchEnd = useCallback(() => {
    pointerUp()
  }, [pointerUp])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Only jump on click if we weren't dragging/panning
      if (isDraggingScrubber.current || isPanning.current) return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const year = xToYear(x, rect.width)
      onYearChange(Math.max(MIN_YEAR, Math.min(MAX_YEAR, year)))
    },
    [xToYear, onYearChange]
  )

  // Wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const centerYear = xToYear(x, rect.width)

      const span = timeWindow.end - timeWindow.start
      const factor = e.deltaY > 0 ? 1.25 : 0.8 // zoom out / zoom in
      const newSpan = Math.max(MIN_WINDOW, Math.min(MAX_WINDOW, span * factor))

      // Keep mouse position anchored
      const ratio = x / rect.width
      const pCenter = yearToPosition(centerYear)
      const pStart = yearToPosition(timeWindow.start)
      const pEnd = yearToPosition(timeWindow.end)
      const pSpan = pEnd - pStart
      const newPSpan = pSpan * (newSpan / span)

      const newPStart = pCenter - ratio * newPSpan
      const newPEnd = newPStart + newPSpan

      onTimeWindowChange(
        clampWindow(positionToYear(newPStart), positionToYear(newPEnd))
      )
    },
    [timeWindow, xToYear, onTimeWindowChange, clampWindow]
  )

  // Double-click era jump
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const year = xToYear(x, rect.width)
      const era = getEraForYear(year)
      if (era) {
        const padding = (era.endYear - era.startYear) * 0.05
        onTimeWindowChange(
          clampWindow(era.startYear - padding, era.endYear + padding)
        )
        onYearChange(era.startYear)
      }
    },
    [xToYear, onTimeWindowChange, onYearChange, clampWindow]
  )

  // Attach global mouse and touch listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // Attach wheel listener (passive: false for preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // -----------------------------------------------------------------------
  // Current era display
  // -----------------------------------------------------------------------

  const currentEra = useMemo(() => getEraForYear(currentYear), [currentYear])

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: TOTAL_HEIGHT,
        zIndex: 1000,
        fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
        userSelect: 'none',
      }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{
          display: 'block',
          width: '100%',
          height: CANVAS_HEIGHT,
          cursor: isDraggingScrubber.current ? 'grabbing' : 'crosshair',
          touchAction: 'none',
        }}
      />

      {/* Controls bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: CONTROLS_HEIGHT,
          padding: '0 16px',
          background: 'rgba(6, 6, 14, 0.95)',
          borderTop: '1px solid rgba(212, 160, 23, 0.15)',
        }}
      >
        {/* Left: Play + Speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          {/* Play/Pause button */}
          <button
            onClick={onPlayToggle}
            title={isPlaying ? 'Pause' : 'Play'}
            style={{
              background: 'none',
              border: `1px solid ${GOLD_DIM}`,
              borderRadius: 4,
              color: GOLD,
              cursor: 'pointer',
              width: 32,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = GOLD)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = GOLD_DIM)
            }
          >
            {isPlaying ? (
              // Pause icon (two bars)
              <svg width="12" height="14" viewBox="0 0 12 14" fill={GOLD}>
                <rect x="1" y="0" width="3" height="14" rx="1" />
                <rect x="8" y="0" width="3" height="14" rx="1" />
              </svg>
            ) : (
              // Play icon (triangle)
              <svg width="12" height="14" viewBox="0 0 12 14" fill={GOLD}>
                <path d="M1 0.5 L11 7 L1 13.5 Z" />
              </svg>
            )}
          </button>

          {/* Speed selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                style={{
                  background:
                    playbackSpeed === s
                      ? 'rgba(212, 160, 23, 0.2)'
                      : 'transparent',
                  border:
                    playbackSpeed === s
                      ? `1px solid ${GOLD}`
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 3,
                  color:
                    playbackSpeed === s
                      ? GOLD
                      : 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  padding: '2px 7px',
                  fontSize: 11,
                  fontWeight: playbackSpeed === s ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Center: Current year + era */}
        <div
          style={{
            textAlign: 'center',
            flex: 1,
          }}
        >
          <span
            style={{
              fontFamily: '"Cinzel", "Palatino Linotype", serif',
              fontSize: 20,
              fontWeight: 700,
              color: GOLD,
              letterSpacing: '0.05em',
              textShadow: `0 0 12px ${GOLD_GLOW}`,
              transition: 'all 0.3s ease',
              display: 'inline-block',
            }}
          >
            {formatYear(currentYear)}
          </span>
          {currentEra && (
            <span
              style={{
                marginLeft: 10,
                fontSize: 11,
                color: currentEra.color,
                opacity: 0.8,
                fontStyle: 'italic',
              }}
            >
              {currentEra.name}
            </span>
          )}
        </div>

        {/* Right: Time window display */}
        <div
          style={{
            textAlign: 'right',
            flex: 1,
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.35)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatYear(timeWindow.start)} &mdash; {formatYear(timeWindow.end)}
          <span style={{ marginLeft: 8, color: 'rgba(255, 255, 255, 0.2)' }}>
            ({Math.round(timeWindow.end - timeWindow.start)} yrs)
          </span>
        </div>
      </div>
    </div>
  )
}
