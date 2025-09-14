export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private marks: Map<string, number> = new Map()
  
  // Start measuring
  start(name: string) {
    this.marks.set(name, performance.now())
  }
  
  // End measuring and record
  end(name: string, metadata?: Record<string, any>): number {
    const startTime = this.marks.get(name)
    if (!startTime) {
      console.warn(`No start mark found for: ${name}`)
      return 0
    }
    
    const duration = performance.now() - startTime
    this.marks.delete(name)
    
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata
    }
    
    this.metrics.push(metric)
    
    // Log if debug mode is enabled
    if (localStorage.getItem('debugMode') === 'true') {
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`, metadata || '')
    }
    
    return duration
  }
  
  // Measure a function execution
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name)
    try {
      const result = fn()
      if (result instanceof Promise) {
        return result.then(value => {
          this.end(name, metadata)
          return value
        }) as any
      }
      this.end(name, metadata)
      return result
    } catch (error) {
      this.end(name, { ...metadata, error: true })
      throw error
    }
  }
  
  // Measure async function
  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name)
    try {
      const result = await fn()
      this.end(name, metadata)
      return result
    } catch (error) {
      this.end(name, { ...metadata, error: true })
      throw error
    }
  }
  
  // Get average duration for a metric
  getAverage(name: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === name)
    if (relevantMetrics.length === 0) return 0
    
    const sum = relevantMetrics.reduce((acc, m) => acc + m.duration, 0)
    return sum / relevantMetrics.length
  }
  
  // Get metrics summary
  getSummary() {
    const summary: Record<string, { count: number; avg: number; min: number; max: number }> = {}
    
    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          avg: 0,
          min: Infinity,
          max: -Infinity
        }
      }
      
      const stat = summary[metric.name]
      stat.count++
      stat.min = Math.min(stat.min, metric.duration)
      stat.max = Math.max(stat.max, metric.duration)
    })
    
    // Calculate averages
    Object.keys(summary).forEach(name => {
      const relevantMetrics = this.metrics.filter(m => m.name === name)
      const sum = relevantMetrics.reduce((acc, m) => acc + m.duration, 0)
      summary[name].avg = sum / relevantMetrics.length
    })
    
    return summary
  }
  
  // Clear metrics
  clear() {
    this.metrics = []
    this.marks.clear()
  }
  
  // Export metrics for analysis
  exportMetrics() {
    return {
      metrics: this.metrics,
      summary: this.getSummary(),
      timestamp: Date.now()
    }
  }
}

// Global instance
export const perfMonitor = new PerformanceMonitor()

import { useRef, useEffect } from 'react'

// React hook for performance monitoring
export function usePerformance(componentName: string) {
  const mountTime = useRef(performance.now())
  
  useEffect(() => {
    const mountDuration = performance.now() - mountTime.current
    perfMonitor.end(`${componentName}.mount`, { duration: mountDuration })
    
    return () => {
      perfMonitor.start(`${componentName}.unmount`)
      // Unmount timing will be recorded when component actually unmounts
    }
  }, [componentName])
  
  return {
    measure: (operation: string, fn: () => any, metadata?: Record<string, any>) => 
      perfMonitor.measure(`${componentName}.${operation}`, fn, metadata),
    measureAsync: (operation: string, fn: () => Promise<any>, metadata?: Record<string, any>) => 
      perfMonitor.measureAsync(`${componentName}.${operation}`, fn, metadata)
  }
}

// Export for use in DevTools
if (typeof window !== 'undefined') {
  (window as any).__PERF__ = perfMonitor
}