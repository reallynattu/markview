import { useState, useEffect, useRef, useCallback } from 'react'

interface TTSSettings {
  voice: string
  rate: number
  pitch: number
  volume: number
}

export function useSherpaTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<string[]>([])
  const [settings, setSettings] = useState<TTSSettings>({
    voice: 'Amy (Female)',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  })
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioFile = useRef<string | null>(null)

  // Load available voices
  useEffect(() => {
    async function loadVoices() {
      try {
        const availableVoices = await window.electronAPI.piper.getVoices()
        setVoices(availableVoices)
        
        // Load saved settings
        const savedSettings = localStorage.getItem('sherpaTTSSettings')
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
        console.error('Failed to load Sherpa voices:', error)
      }
    }
    
    loadVoices()
  }, [])

  // Save settings when they change
  useEffect(() => {
    localStorage.setItem('sherpaTTSSettings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = useCallback((updates: Partial<TTSSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }, [])

  const speak = useCallback(async (text: string) => {
    try {
      // Stop any current speech
      stop()
      
      // Synthesize speech with Sherpa
      const audioFile = await window.electronAPI.piper.synthesize(text, {
        voice: settings.voice,
        rate: settings.rate
      })
      
      currentAudioFile.current = audioFile
      
      // Create audio element
      const audio = new Audio(`file://${audioFile}`)
      audio.volume = settings.volume
      // Note: pitch adjustment via playback rate may affect speech quality
      // For now, we'll keep pitch at 1.0 for best quality
      
      audioRef.current = audio
      
      // Set up event listeners
      audio.addEventListener('play', () => {
        setIsSpeaking(true)
        setIsPaused(false)
      })
      
      audio.addEventListener('pause', () => {
        setIsPaused(true)
      })
      
      audio.addEventListener('ended', () => {
        setIsSpeaking(false)
        setIsPaused(false)
        cleanup()
      })
      
      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e)
        setIsSpeaking(false)
        setIsPaused(false)
        cleanup()
      })
      
      // Start playback
      await audio.play()
    } catch (error) {
      console.error('Failed to speak with Sherpa:', error)
      setIsSpeaking(false)
      setIsPaused(false)
    }
  }, [settings])

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
    }
  }, [])

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play()
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsSpeaking(false)
    setIsPaused(false)
    cleanup()
    
    // Also stop Sherpa process (though it's synchronous)
    window.electronAPI.piper.stop()
  }, [])

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.removeEventListener('play', () => {})
      audioRef.current.removeEventListener('pause', () => {})
      audioRef.current.removeEventListener('ended', () => {})
      audioRef.current.removeEventListener('error', () => {})
      audioRef.current = null
    }
    currentAudioFile.current = null
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