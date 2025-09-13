import { useState, useEffect, useCallback } from 'react'

interface TTSSettings {
  voice: string
  rate: number
  pitch: number
  volume: number
  pauseDuration: number
}

export function useSafeTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<string[]>([])
  
  // Load settings from localStorage
  const [settings, setSettings] = useState<TTSSettings>(() => {
    const savedSettings = localStorage.getItem('tts-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        // Validate that the voice is a KittenTTS voice
        if (parsed.voice && !parsed.voice.startsWith('expr-voice-')) {
          console.log('Migrating from old voice setting:', parsed.voice)
          parsed.voice = 'expr-voice-2-m'
        }
        return parsed
      } catch (e) {
        console.error('Failed to parse saved TTS settings:', e)
      }
    }
    return {
      voice: 'expr-voice-2-m',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      pauseDuration: 200
    }
  })

  // Load available voices
  useEffect(() => {
    async function loadVoices() {
      try {
        const availableVoices = await window.electronAPI.piper.getVoices()
        setVoices(availableVoices)
      } catch (error) {
        console.error('Failed to load voices:', error)
        // Fallback to WebTTS voices
        setVoices(['natural'])
      }
    }
    
    loadVoices()
  }, [])

  const updateSettings = useCallback((updates: Partial<TTSSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates }
      // Save to localStorage
      localStorage.setItem('tts-settings', JSON.stringify(newSettings))
      return newSettings
    })
  }, [])

  const speak = useCallback(async (text: string) => {
    console.log('useSafeTTS.speak called')
    console.log('Current settings:', settings)
    try {
      if (!text || text.trim().length === 0) {
        console.warn('No text to speak')
        return
      }
      
      setIsSpeaking(true)
      setIsPaused(false)
      
      // Call the TTS synthesis
      const result = await window.electronAPI.piper.synthesize(text, {
        voice: settings.voice,
        rate: settings.rate,
        pauseDuration: settings.pauseDuration
      })
      
      console.log('TTS result:', result)
      
      // If synthesis completed successfully, reset states
      if (result === 'speech-completed') {
        setIsSpeaking(false)
        setIsPaused(false)
      }
      
    } catch (error) {
      console.error('Failed to speak:', error)
      setIsSpeaking(false)
      setIsPaused(false)
      alert(`TTS Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [settings])

  const pause = useCallback(() => {
    console.log('useSafeTTS.pause called')
    setIsPaused(true)
    window.electronAPI.piper.pause()
  }, [])

  const resume = useCallback(async () => {
    console.log('useSafeTTS.resume called')
    setIsPaused(false)
    try {
      const result = await window.electronAPI.piper.resume()
      console.log('Resume result:', result)
      
      // If resume returns a result, handle completion
      if (result === 'speech-completed') {
        setIsSpeaking(false)
        setIsPaused(false)
      } else if (result === 'nothing-to-resume') {
        setIsSpeaking(false)
        setIsPaused(false)
      }
    } catch (error) {
      console.error('Failed to resume:', error)
      setIsSpeaking(false)
      setIsPaused(false)
    }
  }, [])

  const stop = useCallback(() => {
    window.electronAPI.piper.stop()
    setIsSpeaking(false)
    setIsPaused(false)
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