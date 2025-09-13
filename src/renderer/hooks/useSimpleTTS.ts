import { useState, useEffect, useCallback } from 'react'

interface TTSSettings {
  voice: string
  rate: number
  pitch: number
  volume: number
}

export function useSimpleTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<string[]>([])
  const [settings, setSettings] = useState<TTSSettings>({
    voice: 'Samantha (en_US)',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  })

  // Load available voices
  useEffect(() => {
    async function loadVoices() {
      try {
        const availableVoices = await window.electronAPI.piper.getVoices()
        setVoices(availableVoices)
        
        // Load saved settings
        const savedSettings = localStorage.getItem('ttsSettings')
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          setSettings(prev => ({
            ...prev,
            ...parsed,
            // Ensure voice exists in available voices
            voice: availableVoices.includes(parsed.voice) ? parsed.voice : prev.voice
          }))
        }
      } catch (error) {
        console.error('Failed to load voices:', error)
      }
    }
    
    loadVoices()
  }, [])

  // Save settings when they change
  useEffect(() => {
    localStorage.setItem('ttsSettings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = useCallback((updates: Partial<TTSSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }, [])

  const speak = useCallback(async (text: string) => {
    try {
      // Stop any current speech
      await stop()
      
      // Start speech synthesis
      setIsSpeaking(true)
      setIsPaused(false)
      
      const result = await window.electronAPI.piper.synthesize(text, {
        voice: settings.voice,
        rate: settings.rate
      })
      
      // If speech started successfully, wait for completion
      if (result === 'speech-started') {
        // The speech is running in the background
        // We'll need to poll or have a different mechanism to know when it's done
        // For now, we'll keep the speaking state
      } else if (result === 'speech-completed' || result === 'speech-stopped') {
        setIsSpeaking(false)
        setIsPaused(false)
      }
    } catch (error) {
      console.error('Failed to speak:', error)
      setIsSpeaking(false)
      setIsPaused(false)
    }
  }, [settings])

  const pause = useCallback(async () => {
    if (isSpeaking && !isPaused) {
      await window.electronAPI.piper.pause()
      setIsPaused(true)
    }
  }, [isSpeaking, isPaused])

  const resume = useCallback(async () => {
    if (isSpeaking && isPaused) {
      await window.electronAPI.piper.resume()
      setIsPaused(false)
    }
  }, [isSpeaking, isPaused])

  const stop = useCallback(async () => {
    await window.electronAPI.piper.stop()
    setIsSpeaking(false)
    setIsPaused(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

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