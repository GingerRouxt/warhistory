import { useEffect, useRef, useCallback } from 'react'
import { useAudio } from '../hooks/useAudio'
import type { EraId } from '../types/battle'

interface AmbientAudioProps {
  era: EraId | null
}

/**
 * Background atmosphere that plays era-specific ambient loops.
 * Renders only a small mute/unmute button fixed in the bottom-left corner.
 * Starts on first user interaction to respect autoplay policies.
 */
export function AmbientAudio({ era }: AmbientAudioProps) {
  const audio = useAudio()
  const hasStartedRef = useRef(false)
  const pendingEraRef = useRef<EraId | null>(null)

  // Start ambient on first click anywhere in the document
  const startOnInteraction = useCallback(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    const eraToPlay = pendingEraRef.current
    if (eraToPlay) {
      audio.playAmbient(eraToPlay)
    }

    document.removeEventListener('click', startOnInteraction)
    document.removeEventListener('keydown', startOnInteraction)
  }, [audio])

  useEffect(() => {
    document.addEventListener('click', startOnInteraction)
    document.addEventListener('keydown', startOnInteraction)
    return () => {
      document.removeEventListener('click', startOnInteraction)
      document.removeEventListener('keydown', startOnInteraction)
    }
  }, [startOnInteraction])

  // React to era changes
  useEffect(() => {
    pendingEraRef.current = era

    if (!era) {
      audio.stopAmbient()
      return
    }

    if (hasStartedRef.current) {
      audio.playAmbient(era)
    }
    // pendingEraRef stores it for when interaction happens
  }, [era, audio])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audio.stopAmbient()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleMute() {
    audio.setMuted(!audio.isMuted)
  }

  return (
    <button
      onClick={toggleMute}
      className="fixed bottom-4 left-4 z-40 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200"
      style={{
        background: 'rgba(10, 10, 20, 0.7)',
        border: '1px solid rgba(212, 164, 71, 0.2)',
        color: audio.isMuted ? 'rgba(212, 164, 71, 0.3)' : 'rgba(212, 164, 71, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212, 164, 71, 0.5)'
        e.currentTarget.style.background = 'rgba(10, 10, 20, 0.85)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212, 164, 71, 0.2)'
        e.currentTarget.style.background = 'rgba(10, 10, 20, 0.7)'
      }}
      aria-label={audio.isMuted ? 'Unmute ambient audio' : 'Mute ambient audio'}
      title={audio.isMuted ? 'Unmute' : 'Mute'}
    >
      {audio.isMuted ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  )
}
