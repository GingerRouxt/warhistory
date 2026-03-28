import { useState, useCallback, useRef, useEffect } from 'react'

const MIN_YEAR = -4000
const MAX_YEAR = 2026
const MIN_WINDOW = 50
const MAX_WINDOW = MAX_YEAR - MIN_YEAR // 6026

/**
 * Piecewise linear adaptive scale.
 * Maps year -> normalized position [0, 1].
 *
 * Breakpoints:
 *   -4000 -> 0.00   (ancient, compressed)
 *    -500 -> 0.20
 *     500 -> 0.35
 *    1500 -> 0.55
 *    1900 -> 0.75
 *    2026 -> 1.00
 */
const BREAKPOINTS: Array<[number, number]> = [
  [-4000, 0.0],
  [-500, 0.2],
  [500, 0.35],
  [1500, 0.55],
  [1900, 0.75],
  [2026, 1.0],
]

export function yearToPosition(year: number): number {
  if (year <= BREAKPOINTS[0][0]) return BREAKPOINTS[0][1]
  if (year >= BREAKPOINTS[BREAKPOINTS.length - 1][0])
    return BREAKPOINTS[BREAKPOINTS.length - 1][1]

  for (let i = 0; i < BREAKPOINTS.length - 1; i++) {
    const [y0, p0] = BREAKPOINTS[i]
    const [y1, p1] = BREAKPOINTS[i + 1]
    if (year >= y0 && year <= y1) {
      const t = (year - y0) / (y1 - y0)
      return p0 + t * (p1 - p0)
    }
  }
  return 0.5
}

export function positionToYear(pos: number): number {
  if (pos <= BREAKPOINTS[0][1]) return BREAKPOINTS[0][0]
  if (pos >= BREAKPOINTS[BREAKPOINTS.length - 1][1])
    return BREAKPOINTS[BREAKPOINTS.length - 1][0]

  for (let i = 0; i < BREAKPOINTS.length - 1; i++) {
    const [y0, p0] = BREAKPOINTS[i]
    const [y1, p1] = BREAKPOINTS[i + 1]
    if (pos >= p0 && pos <= p1) {
      const t = (pos - p0) / (p1 - p0)
      return Math.round(y0 + t * (y1 - y0))
    }
  }
  return 0
}

export interface TimelineState {
  currentYear: number
  timeWindow: { start: number; end: number }
  isPlaying: boolean
  playbackSpeed: number
}

export interface TimelineActions {
  setYear: (year: number) => void
  setTimeWindow: (window: { start: number; end: number }) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  setPlaybackSpeed: (speed: number) => void
  zoomIn: (centerYear?: number) => void
  zoomOut: (centerYear?: number) => void
  zoomToRange: (start: number, end: number) => void
}

export function useTimeline() {
  const [currentYear, setCurrentYear] = useState(MIN_YEAR)
  const [timeWindow, setTimeWindow] = useState({ start: MIN_YEAR, end: MAX_YEAR })
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  const animFrameRef = useRef<number>(0)
  const lastTickRef = useRef<number>(0)
  const currentYearRef = useRef(currentYear)
  const playbackSpeedRef = useRef(playbackSpeed)

  // Keep refs in sync
  currentYearRef.current = currentYear
  playbackSpeedRef.current = playbackSpeed

  const clampYear = useCallback((y: number) => {
    return Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(y)))
  }, [])

  const clampWindow = useCallback(
    (w: { start: number; end: number }) => {
      let { start, end } = w
      const span = end - start
      if (span < MIN_WINDOW) {
        const mid = (start + end) / 2
        start = mid - MIN_WINDOW / 2
        end = mid + MIN_WINDOW / 2
      }
      if (start < MIN_YEAR) {
        start = MIN_YEAR
        end = Math.min(MAX_YEAR, start + Math.max(span, MIN_WINDOW))
      }
      if (end > MAX_YEAR) {
        end = MAX_YEAR
        start = Math.max(MIN_YEAR, end - Math.max(span, MIN_WINDOW))
      }
      return { start: Math.round(start), end: Math.round(end) }
    },
    []
  )

  const setYear = useCallback(
    (year: number) => {
      setCurrentYear(clampYear(year))
    },
    [clampYear]
  )

  const setWindow = useCallback(
    (window: { start: number; end: number }) => {
      setTimeWindow(clampWindow(window))
    },
    [clampWindow]
  )

  const play = useCallback(() => setIsPlaying(true), [])
  const pause = useCallback(() => setIsPlaying(false), [])
  const togglePlay = useCallback(() => setIsPlaying((p) => !p), [])

  const zoomIn = useCallback(
    (centerYear?: number) => {
      setTimeWindow((prev) => {
        const center = centerYear ?? (prev.start + prev.end) / 2
        const span = prev.end - prev.start
        const newSpan = Math.max(MIN_WINDOW, span * 0.6)
        return clampWindow({
          start: center - newSpan / 2,
          end: center + newSpan / 2,
        })
      })
    },
    [clampWindow]
  )

  const zoomOut = useCallback(
    (centerYear?: number) => {
      setTimeWindow((prev) => {
        const center = centerYear ?? (prev.start + prev.end) / 2
        const span = prev.end - prev.start
        const newSpan = Math.min(MAX_WINDOW, span / 0.6)
        return clampWindow({
          start: center - newSpan / 2,
          end: center + newSpan / 2,
        })
      })
    },
    [clampWindow]
  )

  const zoomToRange = useCallback(
    (start: number, end: number) => {
      const padding = (end - start) * 0.05
      setTimeWindow(clampWindow({ start: start - padding, end: end + padding }))
    },
    [clampWindow]
  )

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      lastTickRef.current = 0
      return
    }

    const tick = (timestamp: number) => {
      if (!lastTickRef.current) {
        lastTickRef.current = timestamp
      }
      const delta = (timestamp - lastTickRef.current) / 1000 // seconds
      lastTickRef.current = timestamp

      const advance = delta * playbackSpeedRef.current
      const nextYear = currentYearRef.current + advance

      if (nextYear >= MAX_YEAR) {
        setCurrentYear(MAX_YEAR)
        setIsPlaying(false)
        return
      }

      setCurrentYear(Math.round(nextYear * 10) / 10) // sub-year precision during playback
      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isPlaying])

  return {
    // State
    currentYear,
    timeWindow,
    isPlaying,
    playbackSpeed,
    // Actions
    setYear,
    setTimeWindow: setWindow,
    play,
    pause,
    togglePlay,
    setPlaybackSpeed,
    zoomIn,
    zoomOut,
    zoomToRange,
    // Utilities
    yearToPosition,
    positionToYear,
  }
}
