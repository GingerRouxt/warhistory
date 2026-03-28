import { useState, useCallback, useRef, useEffect } from 'react'
import type { Battle } from '../types/battle'

const CHAR_DELAY_MS = 30

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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fullTextRef = useRef('')
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Build narration text from battle data
  const buildNarration = useCallback((b: Battle): string => {
    const parts: string[] = []
    parts.push(b.description)

    if (b.biblical && b.scriptureRef) {
      parts.push(`\n\n${b.scriptureRef}`)
    }

    return parts.join('')
  }, [])

  // Start narration when battle changes and isActive
  useEffect(() => {
    clearTimer()

    if (!battle || !isActive) {
      setFullText('')
      setCharIndex(0)
      setIsNarrating(false)
      setIsComplete(false)
      return
    }

    const text = buildNarration(battle)
    fullTextRef.current = text
    setFullText(text)
    setCharIndex(0)
    setIsNarrating(true)
    setIsComplete(false)

    let idx = 0
    timerRef.current = setInterval(() => {
      idx += 1
      if (idx >= fullTextRef.current.length) {
        setCharIndex(fullTextRef.current.length)
        setIsNarrating(false)
        setIsComplete(true)
        clearTimer()
        onCompleteRef.current()
        return
      }
      setCharIndex(idx)
    }, CHAR_DELAY_MS)

    return clearTimer
  }, [battle?.id, isActive, buildNarration, clearTimer])

  const skip = useCallback(() => {
    clearTimer()
    setCharIndex(fullTextRef.current.length)
    setIsNarrating(false)
    setIsComplete(true)
    onCompleteRef.current()
  }, [clearTimer])

  const reset = useCallback(() => {
    clearTimer()
    setCharIndex(0)
    setIsNarrating(false)
    setIsComplete(false)
  }, [clearTimer])

  const displayedText = fullText.slice(0, charIndex)

  return {
    fullText,
    displayedText,
    isNarrating,
    isComplete,
    skip,
    reset,
  }
}
