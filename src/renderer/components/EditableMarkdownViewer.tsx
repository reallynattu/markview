import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import mermaid from 'mermaid'
import { FileText, Zap } from 'lucide-react'
import VirtualMarkdownViewer from './VirtualMarkdownViewer'
import ProgressiveMarkdownViewer from './ProgressiveMarkdownViewer'
import { perfMonitor } from '../utils/performance'

interface EditableMarkdownViewerProps {
  content: string
  isEditing: boolean
  onChange: (content: string) => void
  onCursorChange?: (line: number | undefined) => void
}

export interface EditableMarkdownViewerHandle {
  scrollToLine: (line: number, column?: number) => void
}

const EditableMarkdownViewer = forwardRef<EditableMarkdownViewerHandle, EditableMarkdownViewerProps>(({ 
  content, 
  isEditing,
  onChange,
  onCursorChange 
}, ref) => {
  const [localContent, setLocalContent] = useState(content)
  const [containerHeight, setContainerHeight] = useState(600)
  const [debugMode, setDebugMode] = useState(() => {
    return localStorage.getItem('debugMode') === 'true'
  })
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mermaidRef = useRef<number>(0)
  
  // Determine rendering strategy based on content size
  const renderingStrategy = useMemo(() => {
    const lineCount = content.split('\n').length
    const charCount = content.length
    
    if (lineCount > 1000 || charCount > 100000) {
      return 'virtual' // Use virtual scrolling for very large files
    } else if (lineCount > 300 || charCount > 30000) {
      return 'progressive' // Use progressive rendering for medium files
    }
    return 'normal' // Use normal rendering for small files
  }, [content])

  const handleCursorChange = useCallback(() => {
    if (!editorRef.current || !onCursorChange) return
    
    const textarea = editorRef.current
    const text = textarea.value
    const cursorPosition = textarea.selectionStart
    
    // Count line number
    let line = 1
    for (let i = 0; i < cursorPosition; i++) {
      if (text[i] === '\n') line++
    }
    
    onCursorChange(line)
  }, [onCursorChange])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setLocalContent(newContent)
    onChange(newContent)
  }

  useEffect(() => {
    setLocalContent(content)
  }, [content])
  
  // Listen for debug mode changes
  useEffect(() => {
    const handleDebugModeChange = (event: CustomEvent) => {
      setDebugMode(event.detail)
    }
    
    window.addEventListener('debugModeChanged', handleDebugModeChange as EventListener)
    return () => {
      window.removeEventListener('debugModeChanged', handleDebugModeChange as EventListener)
    }
  }, [])
  
  // Track container height for virtual scrolling
  useEffect(() => {
    if (!containerRef.current) return
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!isEditing) {
      mermaid.initialize({ 
        theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default',
        themeVariables: {
          darkMode: document.documentElement.getAttribute('data-theme') === 'dark'
        }
      })

      const renderMermaid = async () => {
        const elements = document.querySelectorAll('.language-mermaid')
        elements.forEach(async (elem, index) => {
          try {
            const graphId = `mermaid-${mermaidRef.current}-${index}`
            const { svg } = await mermaid.render(graphId, elem.textContent || '')
            
            const div = document.createElement('div')
            div.className = 'mermaid'
            div.innerHTML = svg
            
            elem.parentNode?.replaceChild(div, elem)
          } catch (error) {
            console.error('Mermaid rendering error:', error)
          }
        })
        mermaidRef.current += 1
      }

      setTimeout(renderMermaid, 100)
    }
  }, [content, isEditing])

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.focus()
      handleCursorChange()
    }
  }, [isEditing, handleCursorChange])

  useEffect(() => {
    if (isEditing && editorRef.current) {
      const textarea = editorRef.current
      textarea.addEventListener('click', handleCursorChange)
      textarea.addEventListener('keyup', handleCursorChange)
      
      return () => {
        textarea.removeEventListener('click', handleCursorChange)
        textarea.removeEventListener('keyup', handleCursorChange)
      }
    }
  }, [isEditing, handleCursorChange])


  // Expose scrollToLine method
  useImperativeHandle(ref, () => ({
    scrollToLine: (line: number, column?: number) => {
      if (isEditing && editorRef.current) {
        // For editor mode
        const textarea = editorRef.current
        const lines = textarea.value.split('\n')
        let position = 0
        
        for (let i = 0; i < Math.min(line - 1, lines.length); i++) {
          position += lines[i].length + 1 // +1 for newline
        }
        
        if (column && line <= lines.length) {
          position += Math.min(column - 1, lines[line - 1].length)
        }
        
        textarea.setSelectionRange(position, position)
        textarea.focus()
        
        // Scroll to make the line visible
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
        const scrollTop = (line - 1) * lineHeight - textarea.clientHeight / 2
        textarea.scrollTop = Math.max(0, scrollTop)
      } else if (!isEditing && containerRef.current) {
        // For preview mode - find the heading and scroll to it
        const headings = containerRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
        const lines = content.split('\n')
        let currentLine = 1
        
        for (let i = 0; i < lines.length && currentLine < line; i++) {
          currentLine++
        }
        
        // Find the heading that corresponds to this line
        let targetHeading: Element | null = null
        let lineCounter = 1
        
        for (let i = 0; i < lines.length; i++) {
          if (lineCounter >= line) {
            // Check if this line is a heading
            const headingMatch = lines[i].match(/^#{1,6}\s+(.+)$/)
            if (headingMatch) {
              const headingText = headingMatch[1].trim()
              // Find the heading element with matching text
              headings.forEach(heading => {
                if (heading.textContent?.trim() === headingText) {
                  targetHeading = heading
                }
              })
              break
            }
          }
          lineCounter++
        }
        
        if (targetHeading) {
          targetHeading.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }
  }), [isEditing, content])

  if (!content && !isEditing) {
    return (
      <div className="empty-state">
        <FileText size={64} strokeWidth={1} />
        <h2>Welcome to Markview</h2>
        <p>Beautiful Markdown, at a glance.</p>
        <p>Select a file from the sidebar or drop one here to begin</p>
      </div>
    )
  }

  return (
    <div className="markdown-container" ref={containerRef}>
      {renderingStrategy !== 'normal' && !isEditing && debugMode && (
        <div className="virtual-scroll-indicator">
          <Zap size={16} />
          <span>
            {renderingStrategy === 'virtual' 
              ? 'Virtual scrolling active for large file'
              : 'Progressive rendering active for better performance'}
          </span>
        </div>
      )}
      <div className="markdown-container-inner">
        {isEditing ? (
          <textarea
            ref={editorRef}
            className="markdown-editor"
            value={localContent}
            onChange={handleChange}
            placeholder="Start typing your markdown..."
            spellCheck={false}
          />
        ) : renderingStrategy === 'virtual' ? (
          <VirtualMarkdownViewer
            content={content}
            height={containerHeight}
            estimatedLineHeight={24}
            overscan={10}
          />
        ) : renderingStrategy === 'progressive' ? (
          <ProgressiveMarkdownViewer
            content={content}
            onRenderComplete={() => {
              perfMonitor.measure('progressive.complete', () => {
                // Trigger mermaid rendering after progressive render completes
                setTimeout(() => {
                  const event = new Event('progressiveRenderComplete')
                  window.dispatchEvent(event)
                }, 100)
              })
            }}
          />
        ) : (
          <div className="markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
              components={{
                code({ inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const isMermaid = match && match[1] === 'mermaid'
                  
                  if (isMermaid && !inline) {
                    return (
                      <pre className={className} {...props}>
                        <code className={className}>{children}</code>
                      </pre>
                    )
                  }
                  
                  return inline ? (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
})

EditableMarkdownViewer.displayName = 'EditableMarkdownViewer'

export default EditableMarkdownViewer