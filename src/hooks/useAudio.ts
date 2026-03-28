import { useRef, useState, useCallback, useEffect } from 'react'
import { Howl } from 'howler'
import type { EraId } from '../types/battle'

interface AudioState {
  masterVolume: number
  ambientVolume: number
  narrationVolume: number
  isMuted: boolean
}

type AmbientEraGroup = 'ancient' | 'medieval' | 'modern' | 'contemporary'

function eraToGroup(era: EraId): AmbientEraGroup {
  switch (era) {
    case 'biblical':
    case 'classical':
      return 'ancient'
    case 'medieval':
    case 'early-modern':
      return 'medieval'
    case 'modern':
      return 'modern'
    case 'contemporary':
      return 'contemporary'
  }
}

const AMBIENT_PATHS: Record<AmbientEraGroup, string> = {
  ancient: '/audio/ambient/ancient.mp3',
  medieval: '/audio/ambient/medieval.mp3',
  modern: '/audio/ambient/modern.mp3',
  contemporary: '/audio/ambient/contemporary.mp3',
}

const CROSSFADE_MS = 500

export function useAudio() {
  const [state, setState] = useState<AudioState>({
    masterVolume: 1,
    ambientVolume: 0.1,
    narrationVolume: 0.8,
    isMuted: false,
  })
  const [narrationTime, setNarrationTime] = useState(0)
  const [narrationDuration, setNarrationDuration] = useState(0)
  const [isNarrationPlaying, setIsNarrationPlaying] = useState(false)

  const ambientRef = useRef<Howl | null>(null)
  const ambientGroupRef = useRef<AmbientEraGroup | null>(null)
  const narrationRef = useRef<Howl | null>(null)
  const sfxRef = useRef<Howl | null>(null)
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef(state)
  const hasInteractedRef = useRef(false)

  stateRef.current = state

  // Track user interaction for autoplay policy
  useEffect(() => {
    const handler = () => {
      hasInteractedRef.current = true
      document.removeEventListener('click', handler)
      document.removeEventListener('keydown', handler)
    }
    document.addEventListener('click', handler)
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('click', handler)
      document.removeEventListener('keydown', handler)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ambientRef.current?.unload()
      narrationRef.current?.unload()
      sfxRef.current?.unload()
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current)
    }
  }, [])

  // ---------- Ambient channel ----------

  const playAmbient = useCallback((era: EraId) => {
    if (!hasInteractedRef.current) return

    const group = eraToGroup(era)
    if (group === ambientGroupRef.current && ambientRef.current?.playing()) return

    const s = stateRef.current
    const effectiveVolume = s.isMuted ? 0 : s.ambientVolume * s.masterVolume

    // Fade out existing ambient
    if (ambientRef.current) {
      const old = ambientRef.current
      old.fade(old.volume(), 0, CROSSFADE_MS)
      setTimeout(() => old.unload(), CROSSFADE_MS + 50)
    }

    const howl = new Howl({
      src: [AMBIENT_PATHS[group]],
      loop: true,
      volume: 0,
      html5: true,
    })

    howl.play()
    howl.fade(0, effectiveVolume, CROSSFADE_MS)

    ambientRef.current = howl
    ambientGroupRef.current = group
  }, [])

  const stopAmbient = useCallback(() => {
    if (ambientRef.current) {
      const old = ambientRef.current
      old.fade(old.volume(), 0, CROSSFADE_MS)
      setTimeout(() => {
        old.unload()
      }, CROSSFADE_MS + 50)
      ambientRef.current = null
      ambientGroupRef.current = null
    }
  }, [])

  // ---------- Narration channel ----------

  const checkNarrationExists = useCallback(async (battleId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/audio/${battleId}.mp3`, { method: 'HEAD' })
      return res.ok
    } catch {
      return false
    }
  }, [])

  const playNarration = useCallback((battleId: string) => {
    if (!hasInteractedRef.current) return

    // Stop existing narration
    if (narrationRef.current) {
      narrationRef.current.unload()
      narrationRef.current = null
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current)
      timeIntervalRef.current = null
    }

    const s = stateRef.current
    const effectiveVolume = s.isMuted ? 0 : s.narrationVolume * s.masterVolume

    const howl = new Howl({
      src: [`/audio/${battleId}.mp3`],
      volume: effectiveVolume,
      html5: true,
      onplay: () => {
        setIsNarrationPlaying(true)
        setNarrationDuration(howl.duration())
        // Poll current time for sync
        timeIntervalRef.current = setInterval(() => {
          const seek = howl.seek()
          if (typeof seek === 'number') {
            setNarrationTime(seek)
          }
        }, 50)
      },
      onpause: () => {
        setIsNarrationPlaying(false)
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current)
          timeIntervalRef.current = null
        }
      },
      onend: () => {
        setIsNarrationPlaying(false)
        setNarrationTime(howl.duration())
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current)
          timeIntervalRef.current = null
        }
      },
      onstop: () => {
        setIsNarrationPlaying(false)
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current)
          timeIntervalRef.current = null
        }
      },
    })

    howl.play()
    narrationRef.current = howl
  }, [])

  const pauseNarration = useCallback(() => {
    narrationRef.current?.pause()
  }, [])

  const resumeNarration = useCallback(() => {
    if (!hasInteractedRef.current) return
    narrationRef.current?.play()
  }, [])

  const stopNarration = useCallback(() => {
    if (narrationRef.current) {
      narrationRef.current.unload()
      narrationRef.current = null
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current)
      timeIntervalRef.current = null
    }
    setIsNarrationPlaying(false)
    setNarrationTime(0)
    setNarrationDuration(0)
  }, [])

  // ---------- SFX channel ----------

  const loadSfx = useCallback((spriteSrc: string, spriteMap: Record<string, [number, number]>) => {
    if (sfxRef.current) sfxRef.current.unload()
    sfxRef.current = new Howl({
      src: [spriteSrc],
      sprite: spriteMap,
      volume: 0.3,
    })
  }, [])

  const playSfx = useCallback((spriteName: string) => {
    if (!hasInteractedRef.current) return
    if (!sfxRef.current) return

    const s = stateRef.current
    if (s.isMuted) return

    sfxRef.current.volume(0.3 * s.masterVolume)
    sfxRef.current.play(spriteName)
  }, [])

  // ---------- Volume / Mute controls ----------

  const setMuted = useCallback((muted: boolean) => {
    setState(prev => ({ ...prev, isMuted: muted }))

    if (muted) {
      ambientRef.current?.volume(0)
      narrationRef.current?.volume(0)
    } else {
      const s = stateRef.current
      if (ambientRef.current) {
        ambientRef.current.volume(s.ambientVolume * s.masterVolume)
      }
      if (narrationRef.current) {
        narrationRef.current.volume(s.narrationVolume * s.masterVolume)
      }
    }
  }, [])

  const setMasterVolume = useCallback((vol: number) => {
    setState(prev => {
      const next = { ...prev, masterVolume: vol }
      if (!next.isMuted) {
        ambientRef.current?.volume(next.ambientVolume * vol)
        narrationRef.current?.volume(next.narrationVolume * vol)
      }
      return next
    })
  }, [])

  const setAmbientVolume = useCallback((vol: number) => {
    setState(prev => {
      const next = { ...prev, ambientVolume: vol }
      if (!next.isMuted && ambientRef.current) {
        ambientRef.current.volume(vol * next.masterVolume)
      }
      return next
    })
  }, [])

  const setNarrationVolume = useCallback((vol: number) => {
    setState(prev => {
      const next = { ...prev, narrationVolume: vol }
      if (!next.isMuted && narrationRef.current) {
        narrationRef.current.volume(vol * next.masterVolume)
      }
      return next
    })
  }, [])

  // Expose the internal Howl for Web Audio API hookup (waveform viz)
  const getNarrationHowl = useCallback((): Howl | null => {
    return narrationRef.current
  }, [])

  return {
    // Ambient
    playAmbient,
    stopAmbient,
    // Narration
    checkNarrationExists,
    playNarration,
    pauseNarration,
    resumeNarration,
    stopNarration,
    narrationTime,
    narrationDuration,
    isNarrationPlaying,
    getNarrationHowl,
    // SFX
    loadSfx,
    playSfx,
    // Controls
    isMuted: state.isMuted,
    setMuted,
    masterVolume: state.masterVolume,
    setMasterVolume,
    ambientVolume: state.ambientVolume,
    setAmbientVolume,
    narrationVolume: state.narrationVolume,
    setNarrationVolume,
  }
}
