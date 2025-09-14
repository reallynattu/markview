import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import { perfMonitor } from '../utils/performance'

interface VirtualMarkdownViewerProps {
  content: string
  height: number
  estimatedLineHeight?: number
  overscan?: number
}

interface Chunk {
  id: string
  startLine: number
  endLine: number
  content: string
  height: number
  top: number
}

const VirtualMarkdownViewer: React.FC<VirtualMarkdownViewerProps> = ({
  content,
  height,
  estimatedLineHeight = 24,
  overscan = 10
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [visibleChunks, setVisibleChunks] = useState<Chunk[]>([])
  const [chunkHeights, setChunkHeights] = useState<Map<string, number>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Split content into chunks (paragraphs/sections)
  const chunks = useMemo(() => {
    return perfMonitor.measure('virtual.splitChunks', () => {
      const lines = content.split('\n')
      const chunks: Chunk[] = []
      let currentChunk: string[] = []
      let startLine = 0
      let totalHeight = 0
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        currentChunk.push(line)
        
        // Create chunk at headers or every 50 lines
        const isHeader = /^#{1,6}\s/.test(line)
        const isChunkBoundary = currentChunk.length >= 50 || isHeader
        const isLastLine = i === lines.length - 1
        
        if ((isChunkBoundary && i > startLine) || isLastLine) {
          const chunkContent = currentChunk.join('\n')
          const chunkId = `chunk-${startLine}-${i}`
          const estimatedHeight = currentChunk.length * estimatedLineHeight
          
          chunks.push({
            id: chunkId,
            startLine,
            endLine: i,
            content: chunkContent,
            height: chunkHeights.get(chunkId) || estimatedHeight,
            top: totalHeight
          })
          
          totalHeight += chunkHeights.get(chunkId) || estimatedHeight
          
          if (!isLastLine) {
            currentChunk = isHeader ? [] : [line]
            startLine = isHeader ? i + 1 : i
          }
        }
      }
      
      return chunks
    }, { lines: content.split('\n').length })
  }, [content, chunkHeights, estimatedLineHeight])
  
  // Calculate total height
  const totalHeight = useMemo(() => {
    if (chunks.length === 0) return 0
    const lastChunk = chunks[chunks.length - 1]
    return lastChunk.top + lastChunk.height
  }, [chunks])
  
  // Calculate visible chunks based on scroll position
  useEffect(() => {
    perfMonitor.measure('virtual.calculateVisible', () => {
      const viewportTop = scrollTop - overscan * estimatedLineHeight
      const viewportBottom = scrollTop + height + overscan * estimatedLineHeight
      
      const visible = chunks.filter(chunk => {
        const chunkBottom = chunk.top + chunk.height
        return chunkBottom >= viewportTop && chunk.top <= viewportBottom
      })
      
      setVisibleChunks(visible)
    })
  }, [scrollTop, chunks, height, overscan, estimatedLineHeight])
  
  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    setScrollTop(target.scrollTop)
  }, [])
  
  // Measure chunk heights after render
  useEffect(() => {
    if (!contentRef.current) return
    
    const observer = new ResizeObserver(entries => {
      const newHeights = new Map(chunkHeights)
      let hasChanges = false
      
      entries.forEach(entry => {
        const chunkEl = entry.target as HTMLElement
        const chunkId = chunkEl.getAttribute('data-chunk-id')
        if (!chunkId) return
        
        const height = entry.contentRect.height
        const currentHeight = newHeights.get(chunkId)
        
        if (currentHeight !== height) {
          newHeights.set(chunkId, height)
          hasChanges = true
        }
      })
      
      if (hasChanges) {
        setChunkHeights(newHeights)
      }
    })
    
    // Observe all chunk elements
    const chunkElements = contentRef.current.querySelectorAll('[data-chunk-id]')
    chunkElements.forEach(el => observer.observe(el))
    
    return () => observer.disconnect()
  }, [visibleChunks, chunkHeights])
  
  return (
    <div
      ref={containerRef}
      className="virtual-markdown-container"
      style={{ height, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div
        className="virtual-markdown-content"
        style={{ height: totalHeight, position: 'relative' }}
      >
        <div ref={contentRef}>
          {visibleChunks.map(chunk => (
            <div
              key={chunk.id}
              data-chunk-id={chunk.id}
              className="virtual-markdown-chunk"
              style={{
                position: 'absolute',
                top: chunk.top,
                left: 0,
                right: 0,
                minHeight: chunk.height
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
              >
                {chunk.content}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VirtualMarkdownViewer