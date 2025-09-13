import React, { createContext, useContext } from 'react'
import { useSafeTTS } from '../hooks/useSafeTTS'

interface TTSContextType {
  speak: (text: string) => Promise<void>
  pause: () => void
  resume: () => Promise<void>
  stop: () => void
  isSpeaking: boolean
  isPaused: boolean
  voices: string[]
  settings: {
    voice: string
    rate: number
    pitch: number
    volume: number
  }
  updateSettings: (updates: Partial<{
    voice: string
    rate: number
    pitch: number
    volume: number
  }>) => void
}

const TTSContext = createContext<TTSContextType | undefined>(undefined)

export function TTSProvider({ children }: { children: React.ReactNode }) {
  const tts = useSafeTTS()
  
  return (
    <TTSContext.Provider value={tts}>
      {children}
    </TTSContext.Provider>
  )
}

export function useTTS() {
  const context = useContext(TTSContext)
  if (!context) {
    throw new Error('useTTS must be used within a TTSProvider')
  }
  return context
}