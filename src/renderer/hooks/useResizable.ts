import { useState, useCallback, useEffect, useRef } from 'react'

interface UseResizableOptions {
  initialWidth: number
  minWidth: number
  maxWidth: number
  storageKey?: string
}

export function useResizable({
  initialWidth,
  minWidth,
  maxWidth,
  storageKey
}: UseResizableOptions) {
  const [width, setWidth] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsedWidth = parseInt(stored, 10)
        if (!isNaN(parsedWidth)) {
          return Math.max(minWidth, Math.min(maxWidth, parsedWidth))
        }
      }
    }
    return initialWidth
  })
  
  const [isResizing, setIsResizing] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, width.toString())
    }
  }, [width, storageKey])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = width
  }, [width])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startXRef.current - e.clientX // Reversed for right sidebar
      const newWidth = startWidthRef.current + deltaX
      setWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, minWidth, maxWidth])

  return {
    width,
    isResizing,
    handleMouseDown
  }
}