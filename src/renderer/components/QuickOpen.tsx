import React, { useState, useEffect, useMemo } from 'react'
import { FileText, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface QuickOpenProps {
  isOpen: boolean
  onClose: () => void
  files: Array<{ name: string; path: string }>
  recentFiles?: string[]
  onSelectFile: (path: string) => void
}

// Fuzzy search algorithm
const fuzzyMatch = (pattern: string, str: string): { matched: boolean; score: number } => {
  const patternLower = pattern.toLowerCase()
  const strLower = str.toLowerCase()
  
  let patternIdx = 0
  let score = 0
  let consecutive = 0
  
  for (let i = 0; i < strLower.length; i++) {
    if (patternLower[patternIdx] === strLower[i]) {
      score += 1 + consecutive
      consecutive++
      patternIdx++
      
      if (patternIdx === patternLower.length) {
        // Bonus for exact match
        if (patternLower === strLower) score += 100
        // Bonus for matching at word boundaries
        if (i === 0 || strLower[i - 1] === ' ' || strLower[i - 1] === '-' || strLower[i - 1] === '_') {
          score += 10
        }
        return { matched: true, score }
      }
    } else {
      consecutive = 0
    }
  }
  
  return { matched: false, score: 0 }
}

const QuickOpen: React.FC<QuickOpenProps> = ({
  isOpen,
  onClose,
  files,
  recentFiles = [],
  onSelectFile
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Filter and sort files based on search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery) {
      // Show recent files first when no search
      const recentSet = new Set(recentFiles)
      const recent = files.filter(f => recentSet.has(f.path))
      const others = files.filter(f => !recentSet.has(f.path))
      return [...recent, ...others].slice(0, 10)
    }

    // Fuzzy search
    const results = files
      .map(file => {
        const { matched, score } = fuzzyMatch(searchQuery, file.name)
        return { file, matched, score }
      })
      .filter(r => r.matched)
      .sort((a, b) => b.score - a.score)
      .map(r => r.file)

    return results.slice(0, 20) // Limit results for performance
  }, [searchQuery, files, recentFiles])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredFiles.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
          break
        case 'Enter':
          e.preventDefault()
          if (filteredFiles[selectedIndex]) {
            onSelectFile(filteredFiles[selectedIndex].path)
            onClose()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredFiles, selectedIndex, onSelectFile, onClose])

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    
    const chars = text.split('')
    const queryLower = query.toLowerCase()
    const textLower = text.toLowerCase()
    let queryIdx = 0
    
    const highlighted = chars.map((char, i) => {
      if (queryIdx < queryLower.length && textLower[i] === queryLower[queryIdx]) {
        queryIdx++
        return <mark key={i} className="fuzzy-match">{char}</mark>
      }
      return char
    })
    
    return highlighted
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="quick-open-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="quick-open-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              className="quick-open-input"
              placeholder="Search files by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedIndex(0)
              }}
              autoFocus
            />

            <div className="quick-open-results">
              {filteredFiles.length === 0 && searchQuery && (
                <div className="quick-open-empty">
                  No files matching "{searchQuery}"
                </div>
              )}

              {filteredFiles.map((file, index) => {
                const isRecent = recentFiles.includes(file.path) && !searchQuery
                
                return (
                  <div
                    key={file.path}
                    className={`quick-open-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectFile(file.path)
                      onClose()
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {isRecent ? (
                      <Clock size={16} className="file-icon recent" />
                    ) : (
                      <FileText size={16} className="file-icon" />
                    )}
                    <span className="file-name">
                      {searchQuery ? highlightMatch(file.name, searchQuery) : file.name}
                    </span>
                    {isRecent && <span className="recent-badge">Recent</span>}
                  </div>
                )
              })}
            </div>

            <div className="quick-open-footer">
              <span className="quick-open-hint">
                <kbd>↑↓</kbd> Navigate
                <kbd>Enter</kbd> Open
                <kbd>Esc</kbd> Close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default QuickOpen