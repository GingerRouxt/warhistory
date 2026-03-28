import { useRef, useEffect, useState, useCallback } from 'react'

interface AudioNarratorProps {
  battleId: string | null
  isActive: boolean
}

export function AudioNarrator({ battleId, isActive }: AudioNarratorProps) {
  const [hasAudio, setHasAudio] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animFrameRef = useRef<number>(0)

  // Check if audio file exists
  useEffect(() => {
    setHasAudio(false)
    setIsPlaying(false)

    if (!battleId || !isActive) return

    const url = `/audio/${battleId}.mp3`
    let cancelled = false

    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled && res.ok) {
          setHasAudio(true)
        }
      })
      .catch(() => {
        // No audio available
      })

    return () => {
      cancelled = true
    }
  }, [battleId, isActive])

  // Setup audio element when available
  useEffect(() => {
    if (!hasAudio || !battleId) return

    const audio = new Audio(`/audio/${battleId}.mp3`)
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio

    audio.addEventListener('ended', () => setIsPlaying(false))
    audio.addEventListener('pause', () => setIsPlaying(false))
    audio.addEventListener('play', () => setIsPlaying(true))

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [hasAudio, battleId])

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

      ctx.fillStyle = `rgba(212, 160, 23, ${0.3 + value * 0.6})`
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, 1)
      ctx.fill()
    }

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(drawWaveform)
    }
  }, [isPlaying])

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(drawWaveform)
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isPlaying, drawWaveform])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      // Setup audio context on first play (requires user gesture)
      if (!audioCtxRef.current) {
        const audioCtx = new AudioContext()
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 128
        const source = audioCtx.createMediaElementSource(audio)
        source.connect(analyser)
        analyser.connect(audioCtx.destination)
        audioCtxRef.current = audioCtx
        analyserRef.current = analyser
        sourceRef.current = source
      }
      audio.play().catch(() => {
        // Playback blocked
      })
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
          background: isPlaying ? 'rgba(212, 160, 23, 0.2)' : 'rgba(212, 160, 23, 0.12)',
          border: '1px solid rgba(212, 160, 23, 0.3)',
          color: 'var(--color-war-gold)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(212, 160, 23, 0.3)'
          e.currentTarget.style.borderColor = 'rgba(212, 160, 23, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isPlaying ? 'rgba(212, 160, 23, 0.2)' : 'rgba(212, 160, 23, 0.12)'
          e.currentTarget.style.borderColor = 'rgba(212, 160, 23, 0.3)'
        }}
        aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
      >
        {isPlaying ? (
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
          opacity: isPlaying ? 1 : 0.4,
          transition: 'opacity 0.3s',
        }}
      />
    </div>
  )
}
