// ═══════════════════════════════════════════════════════════════
// useSpeechSynthesis — Web Speech API hook for Audio Overview
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react'

interface AudioSegment {
  speaker: 'host1' | 'host2'
  text: string
  emotion?: string
  citations?: number[]
}

type PlaybackState = 'stopped' | 'playing' | 'paused'

export function useSpeechSynthesis() {
  const [state, setState] = useState<PlaybackState>('stopped')
  const [currentSegment, setCurrentSegment] = useState(0)
  const [supported, setSupported] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const segmentsRef = useRef<AudioSegment[]>([])
  const indexRef = useRef(0)
  const maleVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const femaleVoiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSupported(false)
      return
    }
    setSupported(true)

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices()
      setVoices(allVoices)
      // Find Arabic voices
      const arabicVoices = allVoices.filter(v => v.lang.startsWith('ar'))
      // Heuristic: try to find male + female
      if (arabicVoices.length > 0) {
        // Some platforms have "female"/"male" in name
        const female = arabicVoices.find(v => /female|امراة|أنثى/i.test(v.name))
        const male = arabicVoices.find(v => /male|رجل|ذكر/i.test(v.name))
        femaleVoiceRef.current = female || arabicVoices[0]
        maleVoiceRef.current = male || arabicVoices[arabicVoices.length > 1 ? 1 : 0]
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      window.speechSynthesis.cancel()
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const speakSegment = useCallback((segment: AudioSegment) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(
      segment.text.replace(/\[\d+\]/g, '').trim()
    )
    utterance.lang = 'ar-SA'
    utterance.rate = 0.9
    utterance.volume = 1.0

    // Voice selection
    if (segment.speaker === 'host1' && maleVoiceRef.current) {
      utterance.voice = maleVoiceRef.current
    } else if (segment.speaker === 'host2' && femaleVoiceRef.current) {
      utterance.voice = femaleVoiceRef.current
    }

    // Emotion-based adjustments
    switch (segment.emotion) {
      case 'enthusiastic':
        utterance.rate = 1.0
        utterance.pitch = 1.2
        break
      case 'serious':
        utterance.rate = 0.85
        utterance.pitch = 0.9
        break
      case 'curious':
        utterance.rate = 0.95
        utterance.pitch = 1.1
        break
      default:
        utterance.pitch = 1.0
    }

    utterance.onend = () => {
      const nextIndex = indexRef.current + 1
      if (nextIndex < segmentsRef.current.length) {
        indexRef.current = nextIndex
        setCurrentSegment(nextIndex)
        speakSegment(segmentsRef.current[nextIndex])
      } else {
        setState('stopped')
        setCurrentSegment(0)
        indexRef.current = 0
      }
    }

    utterance.onerror = () => {
      setState('stopped')
    }

    window.speechSynthesis.speak(utterance)
  }, [])

  const loadScript = useCallback((segments: AudioSegment[]) => {
    window.speechSynthesis?.cancel()
    segmentsRef.current = segments
    indexRef.current = 0
    setCurrentSegment(0)
    setState('stopped')
  }, [])

  const play = useCallback(() => {
    if (!window.speechSynthesis || segmentsRef.current.length === 0) return
    if (indexRef.current >= segmentsRef.current.length) {
      indexRef.current = 0
      setCurrentSegment(0)
    }
    setState('playing')
    speakSegment(segmentsRef.current[indexRef.current])
  }, [speakSegment])

  const pause = useCallback(() => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.pause()
    setState('paused')
  }, [])

  const stop = useCallback(() => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    setState('stopped')
    setCurrentSegment(0)
    indexRef.current = 0
  }, [])

  const skipTo = useCallback((index: number) => {
    if (index < 0 || index >= segmentsRef.current.length) return
    window.speechSynthesis?.cancel()
    indexRef.current = index
    setCurrentSegment(index)
    if (state === 'playing') {
      speakSegment(segmentsRef.current[index])
    }
  }, [state, speakSegment])

  const skipNext = useCallback(() => {
    if (indexRef.current + 1 < segmentsRef.current.length) {
      skipTo(indexRef.current + 1)
    }
  }, [skipTo])

  const skipPrevious = useCallback(() => {
    if (indexRef.current > 0) {
      skipTo(indexRef.current - 1)
    }
  }, [skipTo])

  return {
    supported,
    state,
    currentSegment,
    totalSegments: segmentsRef.current.length,
    isPlaying: state === 'playing',
    voices,
    loadScript,
    play,
    pause,
    stop,
    skipTo,
    skipNext,
    skipPrevious,
  }
}
