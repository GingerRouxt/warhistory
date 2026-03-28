import { useState, useCallback, useRef, useEffect } from 'react'
import type { Battle } from '../types/battle'

const BASE_DELAY_MS = 28
const PAUSE_AFTER_SENTENCE = 140 // . ! ?
const PAUSE_AFTER_CLAUSE = 65   // , ; : —

function getCharDelay(char: string): number {
  if ('.!?'.includes(char)) return BASE_DELAY_MS + PAUSE_AFTER_SENTENCE
  if (',;:—'.includes(char)) return BASE_DELAY_MS + PAUSE_AFTER_CLAUSE
  return BASE_DELAY_MS
}

export interface NarratorState {
  fullText: string
  displayedText: string
  isNarrating: boolean
  isComplete: boolean
}

export function useNarrator(battle: Battle | null, isActive: boolean, onComplete: () => void) {
  const [fullText, setFullText] = useState('')
  const [charIndex, setCharIndex] = useState(0)
  const [isNarrating, setIsNarrating] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const rafRef = useRef<number>(0)
  const lastTickRef = useRef(0)
  const accumulatorRef = useRef(0)
  const charIndexRef = useRef(0)
  const fullTextRef = useRef('')
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const cancelAnimation = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  const buildNarration = useCallback((b: Battle): string => {
    const parts: string[] = [b.description]
    if (b.biblical && b.scriptureRef) {
      parts.push(`\n\n${b.scriptureRef}`)
    }
    return parts.join('')
  }, [])

  useEffect(() => {
    cancelAnimation()

    if (!battle || !isActive) {
      setFullText('')
      setCharIndex(0)
      setIsNarrating(false)
      setIsComplete(false)
      return
    }

    const text = buildNarration(battle)
    fullTextRef.current = text
    charIndexRef.current = 0
    accumulatorRef.current = 0
    lastTickRef.current = 0
    setFullText(text)
    setCharIndex(0)
    setIsNarrating(true)
    setIsComplete(false)

    const tick = (timestamp: number) => {
      if (!lastTickRef.current) lastTickRef.current = timestamp
      const dt = timestamp - lastTickRef.current
      lastTickRef.current = timestamp

      accumulatorRef.current += dt
      const idx = charIndexRef.current
      const char = fullTextRef.current[idx] || ''
      const delay = getCharDelay(char)

      if (accumulatorRef.current >= delay) {
        accumulatorRef.current -= delay
        charIndexRef.current++
        setCharIndex(charIndexRef.current)

        if (charIndexRef.current >= fullTextRef.current.length) {
          setIsNarrating(false)
          setIsComplete(true)
          onCompleteRef.current()
          return
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return cancelAnimation
  }, [battle?.id, isActive, buildNarration, cancelAnimation])

  const skip = useCallback(() => {
    cancelAnimation()
    setCharIndex(fullTextRef.current.length)
    setIsNarrating(false)
    setIsComplete(true)
    onCompleteRef.current()
  }, [cancelAnimation])

  const reset = useCallback(() => {
    cancelAnimation()
    setCharIndex(0)
    setIsNarrating(false)
    setIsComplete(false)
  }, [cancelAnimation])

  const displayedText = fullText.slice(0, charIndex)

  return { fullText, displayedText, isNarrating, isComplete, skip, reset }
}
