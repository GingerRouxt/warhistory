import { useRef, useEffect, useState, useCallback } from 'react'
import { useAudio } from '../hooks/useAudio'

interface AudioNarratorProps {
  battleId: string | null
  isActive: boolean
  onNarrationTimeUpdate?: (time: number) => void
}

export function AudioNarrator({ battleId, isActive, onNarrationTimeUpdate }: AudioNarratorProps) {
  const [hasAudio, setHasAudio] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const connectedHowlRef = useRef<unknown>(null)

  const audio = useAudio()

  // Report narration time to parent
  useEffect(() => {
    if (onNarrationTimeUpdate) {
      onNarrationTimeUpdate(audio.narrationTime)
    }
  }, [audio.narrationTime, onNarrationTimeUpdate])

  // Check if audio file exists for this battle
  useEffect(() => {
    setHasAudio(false)

    if (!battleId || !isActive) return

    let cancelled = false
    audio.checkNarrationExists(battleId).then(exists => {
      if (!cancelled) setHasAudio(exists)
    })

    return () => {
      cancelled = true
    }
    // Only re-check when battle or active state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleId, isActive])

  // Cleanup narration on unmount or battle change
  useEffect(() => {
    return () => {
      audio.stopNarration()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleId])

  // Waveform visualization
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = 240
    const h = 40
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteFrequencyData(dataArray)

    ctx.clearRect(0, 0, w, h)

    const barCount = 32
    const barWidth = (w - barCount) / barCount
    const step = Math.floor(bufferLength / barCount)

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step] / 255
      const barHeight = Math.max(2, value * h * 0.85)
      const x = i * (barWidth + 1)
      const y = (h - barHeight) / 2

      ctx.fillStyle = `rgba(212, 164, 71, ${0.3 + value * 0.6})`
      ctx.fillRect(x, y, barWidth, barHeight)
    }

    if (audio.isNarrationPlaying) {
      animFrameRef.current = requestAnimationFrame(drawWaveform)
    }
  }, [audio.isNarrationPlaying])

  // Start/stop waveform animation loop
  useEffect(() => {
    if (audio.isNarrationPlaying) {
      animFrameRef.current = requestAnimationFrame(drawWaveform)
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [audio.isNarrationPlaying, drawWaveform])

  // Connect Web Audio API analyser to Howler's internal audio element
  const connectAnalyser = useCallback(() => {
    const howl = audio.getNarrationHowl()
    if (!howl) return

    // Avoid reconnecting the same Howl instance
    if (connectedHowlRef.current === howl) return

    // Access Howler's internal HTML5 audio node
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internalNode = (howl as any)._sounds?.[0]?._node as HTMLMediaElement | undefined
    if (!internalNode) return

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const audioCtx = audioCtxRef.current

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128

      // Disconnect old source if it exists
      if (sourceRef.current) {
        try { sourceRef.current.disconnect() } catch { /* already disconnected */ }
      }

      const source = audioCtx.createMediaElementSource(internalNode)
      source.connect(analyser)
      analyser.connect(audioCtx.destination)

      analyserRef.current = analyser
      sourceRef.current = source
      connectedHowlRef.current = howl
    } catch {
      // MediaElementSource may already be connected — that's fine
    }
  }, [audio])

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function togglePlay() {
    if (!battleId) return

    if (audio.isNarrationPlaying) {
      audio.pauseNarration()
    } else {
      if (audio.narrationTime > 0 && audio.narrationTime < audio.narrationDuration) {
        // Resume
        connectAnalyser()
        audio.resumeNarration()
      } else {
        // Start fresh
        audio.playNarration(battleId)
        // Defer analyser connection slightly to let Howl create its internal node
        setTimeout(connectAnalyser, 100)
      }
    }
  }

  if (!hasAudio || !isActive) return null

  return (
    <div className="flex items-center gap-3">
      {/* Play/pause button */}
      <button
        onClick={togglePlay}
        className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 flex-shrink-0"
        style={{
          background: audio.isNarrationPlaying
            ? 'rgba(212, 164, 71, 0.2)'
            : 'rgba(212, 164, 71, 0.12)',
          border: '1px solid rgba(212, 164, 71, 0.3)',
          color: 'var(--color-war-gold)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(212, 164, 71, 0.3)'
          e.currentTarget.style.borderColor = 'rgba(212, 164, 71, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = audio.isNarrationPlaying
            ? 'rgba(212, 164, 71, 0.2)'
            : 'rgba(212, 164, 71, 0.12)'
          e.currentTarget.style.borderColor = 'rgba(212, 164, 71, 0.3)'
        }}
        aria-label={audio.isNarrationPlaying ? 'Pause narration' : 'Play narration'}
      >
        {audio.isNarrationPlaying ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="2" y="1" width="3" height="10" rx="0.5" />
            <rect x="7" y="1" width="3" height="10" rx="0.5" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M3 1.5l7 4.5-7 4.5V1.5z" />
          </svg>
        )}
      </button>

      {/* Waveform canvas */}
      <canvas
        ref={canvasRef}
        width={240}
        height={40}
        style={{
          width: 240,
          height: 40,
          opacity: audio.isNarrationPlaying ? 1 : 0.4,
          transition: 'opacity 0.3s',
        }}
      />

      {/* Time display */}
      {audio.narrationDuration > 0 && (
        <span
          className="text-xs tabular-nums flex-shrink-0"
          style={{
            color: 'rgba(212, 164, 71, 0.6)',
            fontFamily: 'var(--font-family-body)',
            minWidth: 70,
          }}
        >
          {formatTime(audio.narrationTime)} / {formatTime(audio.narrationDuration)}
        </span>
      )}
    </div>
  )
}
