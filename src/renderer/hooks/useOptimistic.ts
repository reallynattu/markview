import { useState, useCallback, useRef } from 'react'
import { perfMonitor } from '../utils/performance'

interface OptimisticUpdate<T> {
  id: string
  value: T
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
}

export function useOptimistic<T>(
  initialValue: T,
  onUpdate: (value: T) => Promise<void>
) {
  const [value, setValue] = useState<T>(initialValue)
  const [optimisticValue, setOptimisticValue] = useState<T>(initialValue)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const updateQueueRef = useRef<OptimisticUpdate<T>[]>([])
  
  const update = useCallback(async (newValue: T) => {
    const updateId = Date.now().toString()
    
    perfMonitor.measure('optimistic.update', () => {
      // Immediately update the optimistic value
      setOptimisticValue(newValue)
      setIsUpdating(true)
      setError(null)
      
      // Add to update queue
      updateQueueRef.current.push({
        id: updateId,
        value: newValue,
        timestamp: Date.now(),
        status: 'pending'
      })
    })
    
    try {
      // Perform the actual update
      await perfMonitor.measureAsync('optimistic.confirm', async () => {
        await onUpdate(newValue)
        
        // Update confirmed
        setValue(newValue)
        
        // Mark as confirmed in queue
        updateQueueRef.current = updateQueueRef.current.map(u =>
          u.id === updateId ? { ...u, status: 'confirmed' } : u
        )
      })
    } catch (err) {
      perfMonitor.measure('optimistic.rollback', () => {
        // Rollback on error
        setError(err as Error)
        setOptimisticValue(value)
        
        // Mark as failed in queue
        updateQueueRef.current = updateQueueRef.current.map(u =>
          u.id === updateId ? { ...u, status: 'failed' } : u
        )
      })
      
      throw err
    } finally {
      setIsUpdating(false)
      
      // Clean up old updates
      const now = Date.now()
      updateQueueRef.current = updateQueueRef.current.filter(
        u => now - u.timestamp < 60000 // Keep for 1 minute
      )
    }
  }, [value, onUpdate])
  
  const reset = useCallback(() => {
    setValue(initialValue)
    setOptimisticValue(initialValue)
    setError(null)
    updateQueueRef.current = []
  }, [initialValue])
  
  return {
    value,
    optimisticValue,
    update,
    reset,
    isUpdating,
    error
  }
}