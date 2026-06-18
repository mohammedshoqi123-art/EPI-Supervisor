// ═══════════════════════════════════════════════════════════════
// Arabic Voice Input Hook — Web Speech API
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react'

interface VoiceInputState {
  isListening: boolean
  transcript: string
  error: string | null
  isSupported: boolean
}

export function useVoiceInput(lang: string = 'ar-SA') {
  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    transcript: '',
    error: null,
    isSupported: typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
  })

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (!state.isSupported) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const text = result[0].transcript
      setState(prev => ({
        ...prev,
        transcript: text,
        isListening: !result.isFinal,
      }))
    }

    recognition.onerror = (event: any) => {
      let errorMsg = 'حدث خطأ في التعرف الصوتي'
      if (event.error === 'no-speech') errorMsg = 'لم يتم التقاط صوت. حاول مرة أخرى.'
      else if (event.error === 'not-allowed') errorMsg = 'يرجى السماح بالوصول للميكروفون.'
      else if (event.error === 'network') errorMsg = 'مشكلة في الشبكة.'

      setState(prev => ({
        ...prev,
        error: errorMsg,
        isListening: false,
      }))
    }

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }))
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [lang, state.isSupported])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    setState(prev => ({ ...prev, transcript: '', error: null, isListening: true }))
    try {
      recognitionRef.current.start()
    } catch {
      // Already running
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
    setState(prev => ({ ...prev, isListening: false }))
  }, [])

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [state.isListening, startListening, stopListening])

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
  }
}
