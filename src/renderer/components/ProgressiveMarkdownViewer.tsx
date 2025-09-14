import React, { useEffect, useRef, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import { ProgressiveRenderer } from '../utils/progressiveRenderer'
import { perfMonitor } from '../utils/performance'

interface ProgressiveMarkdownViewerProps {
  content: string
  onRenderComplete?: () => void
}

interface RenderedChunk {
  id: string
  content: string
  startIndex: number
  endIndex: number
}

const ProgressiveMarkdownViewer: React.FC<ProgressiveMarkdownViewerProps> = ({
  content,
  onRenderComplete
}) => {
  const [renderedChunks, setRenderedChunks] = useState<RenderedChunk[]>([])
  const [renderProgress, setRenderProgress] = useState(0)
  const rendererRef = useRef<ProgressiveRenderer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!content) return
    
    perfMonitor.measure('progressive.init', () => {
      // Reset state
      setRenderedChunks([])
      setRenderProgress(0)
      
      // Create new renderer
      const renderer = new ProgressiveRenderer(
        (chunk) => {
          setRenderedChunks(prev => [...prev, chunk])
          setRenderProgress(renderer.getProgress())
          
          if (renderer.isComplete() && onRenderComplete) {
            onRenderComplete()
          }
        },
        3000, // 3KB chunks
        8 // 8ms delay for smoother rendering
      )
      
      rendererRef.current = renderer
      renderer.setContent(content)
      renderer.startRendering()
    })
    
    return () => {
      rendererRef.current?.stopRendering()
    }
  }, [content, onRenderComplete])
  
  // Handle scroll to prioritize visible content
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !rendererRef.current) return
    
    const scrollTop = containerRef.current.scrollTop
    const viewportHeight = containerRef.current.clientHeight
    
    rendererRef.current.prioritizeViewport(scrollTop, viewportHeight, 24)
  }, [])
  
  // Sort chunks by position for correct ordering
  const sortedChunks = [...renderedChunks].sort((a, b) => a.startIndex - b.startIndex)
  
  return (
    <div 
      ref={containerRef}
      className="progressive-markdown-container"
      onScroll={handleScroll}
    >
      {renderProgress < 100 && (
        <div className="render-progress">
          <div className="render-progress-bar">
            <div 
              className="render-progress-fill"
              style={{ width: `${renderProgress}%` }}
            />
          </div>
          <span className="render-progress-text">
            Rendering... {renderProgress.toFixed(0)}%
          </span>
        </div>
      )}
      
      <div className="markdown-content">
        {sortedChunks.map(chunk => (
          <div key={chunk.id} className="markdown-chunk">
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
  )
}

export default ProgressiveMarkdownViewer