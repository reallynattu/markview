import React, { useState, useEffect, useMemo } from 'react'
import { ChevronRight, Hash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Heading {
  id: string
  text: string
  level: number
  line: number
}

interface TableOfContentsProps {
  content: string
  currentLine?: number
  onNavigate: (line: number) => void
}

const TableOfContents: React.FC<TableOfContentsProps> = ({
  content,
  currentLine,
  onNavigate
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [activeHeading, setActiveHeading] = useState<string | null>(null)

  // Parse headings from markdown content
  const headings = useMemo(() => {
    const lines = content.split('\n')
    const headingsList: Heading[] = []
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/)
      if (match) {
        const level = match[1].length
        const text = match[2].trim()
        const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
        
        headingsList.push({
          id,
          text,
          level,
          line: index + 1
        })
      }
    })
    
    return headingsList
  }, [content])

  // Update active heading based on current line
  useEffect(() => {
    if (!currentLine) return
    
    // Find the heading at or before the current line
    let activeId = null
    for (let i = headings.length - 1; i >= 0; i--) {
      if (headings[i].line <= currentLine) {
        activeId = headings[i].id
        break
      }
    }
    
    setActiveHeading(activeId)
  }, [currentLine, headings])

  // Build tree structure for nested headings
  const headingTree = useMemo(() => {
    const tree: Array<Heading & { children: Heading[] }> = []
    const stack: Array<Heading & { children: Heading[] }> = []

    headings.forEach(heading => {
      const item = { ...heading, children: [] }
      
      // Pop stack until we find a parent
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop()
      }
      
      if (stack.length === 0) {
        tree.push(item)
      } else {
        stack[stack.length - 1].children.push(item)
      }
      
      stack.push(item)
    })
    
    return tree
  }, [headings])

  const toggleCollapse = (headingId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(headingId)) {
        newSet.delete(headingId)
      } else {
        newSet.add(headingId)
      }
      return newSet
    })
  }

  const renderHeading = (heading: Heading & { children: Heading[] }, depth = 0) => {
    const hasChildren = heading.children.length > 0
    const isCollapsed = collapsedSections.has(heading.id)
    const isActive = activeHeading === heading.id
    
    return (
      <div key={heading.id} className="toc-item-wrapper">
        <div
          className={`toc-item level-${heading.level} ${isActive ? 'active' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onNavigate(heading.line)}
        >
          {hasChildren ? (
            <ChevronRight
              size={14}
              className={`toc-chevron ${!isCollapsed ? 'expanded' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleCollapse(heading.id)
              }}
            />
          ) : (
            <Hash size={12} className="toc-hash" />
          )}
          <span className="toc-text">{heading.text}</span>
        </div>
        
        {hasChildren && (
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="toc-children"
              >
                {heading.children.map(child => renderHeading(child, depth + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    )
  }

  if (headings.length === 0) {
    return (
      <div className="toc-container">
        <div className="toc-empty">
          No headings found
        </div>
      </div>
    )
  }

  return (
    <div className="toc-container">
      <div className="toc-header">
        <h3>Table of Contents</h3>
      </div>
      <div className="toc-content">
        {headingTree.map(heading => renderHeading(heading))}
      </div>
    </div>
  )
}

export default TableOfContents