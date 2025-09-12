import { useState, useCallback, useRef } from 'react'

interface HistoryState {
  past: string[]
  present: string
  future: string[]
}

export function useHistory(initialContent: string) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialContent,
    future: []
  })

  const timeoutRef = useRef<NodeJS.Timeout>()

  const pushHistory = useCallback((content: string) => {
    clearTimeout(timeoutRef.current)
    
    timeoutRef.current = setTimeout(() => {
      setHistory(prev => {
        // Don't add if it's the same as current
        if (prev.present === content) return prev
        
        return {
          past: [...prev.past, prev.present],
          present: content,
          future: []
        }
      })
    }, 500) // Debounce to avoid too many history entries
  }, [])

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev
      
      const previous = prev.past[prev.past.length - 1]
      const newPast = prev.past.slice(0, prev.past.length - 1)
      
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev
      
      const next = prev.future[0]
      const newFuture = prev.future.slice(1)
      
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      }
    })
  }, [])

  const reset = useCallback((content: string) => {
    setHistory({
      past: [],
      present: content,
      future: []
    })
  }, [])

  return {
    content: history.present,
    pushHistory,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    reset
  }
}