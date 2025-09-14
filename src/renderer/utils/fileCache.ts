import { perfMonitor } from './performance'

interface CacheEntry {
  content: string
  timestamp: number
  size: number
}

export class FileCache {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize: number = 50 * 1024 * 1024 // 50MB
  private maxAge: number = 5 * 60 * 1000 // 5 minutes
  private currentSize: number = 0
  
  constructor(maxSize?: number, maxAge?: number) {
    if (maxSize) this.maxSize = maxSize
    if (maxAge) this.maxAge = maxAge
  }
  
  get(filePath: string): string | null {
    const entry = this.cache.get(filePath)
    if (!entry) return null
    
    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.remove(filePath)
      return null
    }
    
    // Update timestamp on access (LRU-like behavior)
    entry.timestamp = Date.now()
    
    return entry.content
  }
  
  set(filePath: string, content: string): void {
    perfMonitor.measure('cache.set', () => {
      const size = content.length
      
      // If adding this would exceed max size, evict oldest entries
      while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
        this.evictOldest()
      }
      
      // Remove existing entry if present
      if (this.cache.has(filePath)) {
        this.remove(filePath)
      }
      
      // Add new entry
      this.cache.set(filePath, {
        content,
        timestamp: Date.now(),
        size
      })
      
      this.currentSize += size
    }, { path: filePath, size: content.length })
  }
  
  has(filePath: string): boolean {
    const entry = this.cache.get(filePath)
    if (!entry) return false
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.remove(filePath)
      return false
    }
    
    return true
  }
  
  remove(filePath: string): void {
    const entry = this.cache.get(filePath)
    if (entry) {
      this.currentSize -= entry.size
      this.cache.delete(filePath)
    }
  }
  
  clear(): void {
    this.cache.clear()
    this.currentSize = 0
  }
  
  private evictOldest(): void {
    let oldestPath: string | null = null
    let oldestTime = Infinity
    
    // Find oldest entry
    for (const [path, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestPath = path
      }
    }
    
    if (oldestPath) {
      this.remove(oldestPath)
    }
  }
  
  // Get cache statistics
  getStats() {
    return {
      size: this.currentSize,
      maxSize: this.maxSize,
      entries: this.cache.size,
      utilization: (this.currentSize / this.maxSize) * 100
    }
  }
  
  // Preload adjacent files
  async preloadAdjacent(
    currentPath: string, 
    allFiles: { path: string }[], 
    readFile: (path: string) => Promise<string>
  ): Promise<void> {
    const currentIndex = allFiles.findIndex(f => f.path === currentPath)
    if (currentIndex === -1) return
    
    const adjacentIndexes = [
      currentIndex - 1, // Previous file
      currentIndex + 1, // Next file
    ].filter(i => i >= 0 && i < allFiles.length)
    
    // Preload adjacent files in parallel
    const preloadPromises = adjacentIndexes.map(async (index) => {
      const file = allFiles[index]
      if (!this.has(file.path)) {
        try {
          const content = await perfMonitor.measureAsync(
            'cache.preload',
            () => readFile(file.path),
            { path: file.path }
          )
          this.set(file.path, content)
        } catch (error) {
          console.error(`Failed to preload ${file.path}:`, error)
        }
      }
    })
    
    await Promise.all(preloadPromises)
  }
}

// Global cache instance
export const fileCache = new FileCache()