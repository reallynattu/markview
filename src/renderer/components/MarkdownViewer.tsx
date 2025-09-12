import React, { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import mermaid from 'mermaid'
import { FileText } from 'lucide-react'

interface MarkdownViewerProps {
  content: string
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const mermaidRef = useRef<number>(0)

  useEffect(() => {
    mermaid.initialize({ 
      theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default',
      themeVariables: {
        darkMode: document.documentElement.getAttribute('data-theme') === 'dark'
      }
    })
  }, [])

  useEffect(() => {
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
  }, [content])

  if (!content) {
    return (
      <div className="empty-state">
        <FileText size={64} strokeWidth={1} />
        <h2>No File Selected</h2>
        <p>Select a markdown file from the sidebar to preview</p>
      </div>
    )
  }

  return (
    <div className="markdown-container">
      <div className="markdown-container-inner">
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
      </div>
    </div>
  )
}

export default MarkdownViewer