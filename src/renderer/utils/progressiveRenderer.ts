import { perfMonitor } from './performance'

interface RenderChunk {
  id: string
  content: string
  startIndex: number
  endIndex: number
  rendered?: boolean
  priority: number
}

export class ProgressiveRenderer {
  private chunks: RenderChunk[] = []
  private renderQueue: RenderChunk[] = []
  private isRendering = false
  private onChunkReady: (chunk: RenderChunk) => void
  private chunkSize: number
  private renderDelay: number
  
  constructor(
    onChunkReady: (chunk: RenderChunk) => void,
    chunkSize = 2000, // characters per chunk
    renderDelay = 16 // ms between chunks (60fps)
  ) {
    this.onChunkReady = onChunkReady
    this.chunkSize = chunkSize
    this.renderDelay = renderDelay
  }
  
  setContent(content: string) {
    perfMonitor.measure('progressive.splitContent', () => {
      this.chunks = []
      this.renderQueue = []
      
      // Split content into chunks
      let startIndex = 0
      let chunkId = 0
      
      while (startIndex < content.length) {
        let endIndex = Math.min(startIndex + this.chunkSize, content.length)
        
        // Try to break at a paragraph boundary
        if (endIndex < content.length) {
          const nextNewline = content.indexOf('\n\n', endIndex)
          if (nextNewline !== -1 && nextNewline - endIndex < 500) {
            endIndex = nextNewline + 2
          }
        }
        
        const chunk: RenderChunk = {
          id: `chunk-${chunkId++}`,
          content: content.substring(startIndex, endIndex),
          startIndex,
          endIndex,
          rendered: false,
          priority: this.calculatePriority(startIndex, content.length)
        }
        
        this.chunks.push(chunk)
        startIndex = endIndex
      }
      
      // Sort by priority (render visible content first)
      this.renderQueue = [...this.chunks].sort((a, b) => b.priority - a.priority)
    })
  }
  
  private calculatePriority(startIndex: number, totalLength: number): number {
    // Higher priority for content at the beginning
    const position = startIndex / totalLength
    if (position < 0.1) return 100 // First 10% - highest priority
    if (position < 0.3) return 80  // Next 20%
    if (position < 0.5) return 60  // Next 20%
    return 40 // Rest of content
  }
  
  startRendering() {
    if (this.isRendering) return
    this.isRendering = true
    this.renderNext()
  }
  
  stopRendering() {
    this.isRendering = false
  }
  
  private renderNext() {
    if (!this.isRendering || this.renderQueue.length === 0) {
      this.isRendering = false
      return
    }
    
    perfMonitor.measure('progressive.renderChunk', () => {
      const chunk = this.renderQueue.shift()!
      chunk.rendered = true
      this.onChunkReady(chunk)
    })
    
    // Schedule next chunk
    requestAnimationFrame(() => {
      setTimeout(() => this.renderNext(), this.renderDelay)
    })
  }
  
  // Prioritize chunks in viewport
  prioritizeViewport(scrollTop: number, viewportHeight: number, lineHeight: number) {
    const startLine = Math.floor(scrollTop / lineHeight)
    const endLine = Math.ceil((scrollTop + viewportHeight) / lineHeight)
    
    // Re-prioritize chunks based on viewport
    this.renderQueue.forEach(chunk => {
      const chunkStartLine = this.estimateLineNumber(chunk.startIndex)
      const chunkEndLine = this.estimateLineNumber(chunk.endIndex)
      
      if (chunkStartLine <= endLine && chunkEndLine >= startLine) {
        chunk.priority = 200 // In viewport - highest priority
      }
    })
    
    // Re-sort queue
    this.renderQueue.sort((a, b) => b.priority - a.priority)
  }
  
  private estimateLineNumber(charIndex: number): number {
    // Rough estimate: 80 chars per line
    return Math.floor(charIndex / 80)
  }
  
  getProgress(): number {
    const rendered = this.chunks.filter(c => c.rendered).length
    return (rendered / this.chunks.length) * 100
  }
  
  isComplete(): boolean {
    return this.chunks.every(c => c.rendered)
  }
}