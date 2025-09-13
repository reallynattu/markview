import { useState, useEffect, useCallback, useRef } from 'react'

interface SpeechSettings {
  voice: string | null
  rate: number
  pitch: number
  volume: number
}

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [settings, setSettings] = useState<SpeechSettings>({
    voice: null,
    rate: 1,
    pitch: 1,
    volume: 1
  })
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices()
      setVoices(availableVoices)
      
      // Set default voice if not set
      if (!settings.voice && availableVoices.length > 0) {
        // Prefer English voices
        const englishVoice = availableVoices.find(v => v.lang.startsWith('en'))
        setSettings(prev => ({ ...prev, voice: englishVoice?.name || availableVoices[0].name }))
      }
    }

    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    }
  }, [settings.voice])

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('tts-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // Save settings
  useEffect(() => {
    localStorage.setItem('tts-settings', JSON.stringify(settings))
  }, [settings])

  const speak = useCallback((text: string) => {
    // Cancel any ongoing speech
    speechSynthesis.cancel()
    
    if (!text.trim()) return

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Apply settings
    const selectedVoice = voices.find(v => v.name === settings.voice)
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }
    
    utterance.rate = settings.rate
    utterance.pitch = settings.pitch
    utterance.volume = settings.volume

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
      utteranceRef.current = null
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      setIsSpeaking(false)
      setIsPaused(false)
      utteranceRef.current = null
    }

    utteranceRef.current = utterance
    speechSynthesis.speak(utterance)
  }, [voices, settings])

  const pause = useCallback(() => {
    if (isSpeaking && !isPaused) {
      speechSynthesis.pause()
      setIsPaused(true)
    }
  }, [isSpeaking, isPaused])

  const resume = useCallback(() => {
    if (isSpeaking && isPaused) {
      speechSynthesis.resume()
      setIsPaused(false)
    }
  }, [isSpeaking, isPaused])

  const stop = useCallback(() => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
    utteranceRef.current = null
  }, [])

  const updateSettings = useCallback((newSettings: Partial<SpeechSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    voices,
    settings,
    updateSettings
  }
}