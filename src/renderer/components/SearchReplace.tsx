import React, { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchReplaceProps {
  isOpen: boolean
  onClose: () => void
  content: string
  onReplace: (newContent: string) => void
  onNavigateToLine: (line: number, column: number) => void
}

interface Match {
  index: number
  length: number
  line: number
  column: number
  text: string
}

const SearchReplace: React.FC<SearchReplaceProps> = ({
  isOpen,
  onClose,
  content,
  onReplace,
  onNavigateToLine
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [matches, setMatches] = useState<Match[]>([])
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
      searchInputRef.current.select()
    }
  }, [isOpen])

  // Find all matches when search query changes
  useEffect(() => {
    if (!searchQuery) {
      setMatches([])
      setCurrentMatchIndex(0)
      return
    }

    const findMatches = () => {
      const matchList: Match[] = []
      const lines = content.split('\n')
      
      let searchPattern: RegExp
      try {
        if (useRegex) {
          searchPattern = new RegExp(searchQuery, caseSensitive ? 'g' : 'gi')
        } else {
          const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const pattern = wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery
          searchPattern = new RegExp(pattern, caseSensitive ? 'g' : 'gi')
        }
      } catch (e) {
        // Invalid regex
        return
      }

      let globalIndex = 0
      lines.forEach((line, lineIndex) => {
        let match
        while ((match = searchPattern.exec(line)) !== null) {
          matchList.push({
            index: globalIndex + match.index,
            length: match[0].length,
            line: lineIndex + 1,
            column: match.index + 1,
            text: match[0]
          })
        }
        globalIndex += line.length + 1 // +1 for newline
      })

      setMatches(matchList)
      if (matchList.length > 0 && currentMatchIndex >= matchList.length) {
        setCurrentMatchIndex(0)
      }
    }

    findMatches()
  }, [searchQuery, content, caseSensitive, wholeWord, useRegex])

  // Navigate to current match
  useEffect(() => {
    if (matches.length > 0 && matches[currentMatchIndex]) {
      const match = matches[currentMatchIndex]
      onNavigateToLine(match.line, match.column)
    }
  }, [currentMatchIndex, matches, onNavigateToLine])

  const handleNext = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % matches.length)
    }
  }

  const handlePrevious = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length)
    }
  }

  const handleReplace = () => {
    if (matches.length === 0 || !matches[currentMatchIndex]) return

    const match = matches[currentMatchIndex]
    const before = content.slice(0, match.index)
    const after = content.slice(match.index + match.length)
    const newContent = before + replaceQuery + after
    
    onReplace(newContent)
    // Stay on same match index but it will update when content changes
  }

  const handleReplaceAll = () => {
    if (matches.length === 0) return

    let newContent = content
    let offset = 0

    // Sort matches by index to replace from start to end
    const sortedMatches = [...matches].sort((a, b) => a.index - b.index)

    sortedMatches.forEach(match => {
      const adjustedIndex = match.index + offset
      const before = newContent.slice(0, adjustedIndex)
      const after = newContent.slice(adjustedIndex + match.length)
      newContent = before + replaceQuery + after
      
      // Adjust offset for length difference
      offset += replaceQuery.length - match.length
    })

    onReplace(newContent)
    setCurrentMatchIndex(0)
  }

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          e.preventDefault()
          handlePrevious()
        } else if (e.metaKey || e.ctrlKey) {
          e.preventDefault()
          handleReplace()
        } else {
          e.preventDefault()
          handleNext()
        }
      } else if (e.key === 'F3' || (e.key === 'g' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault()
        if (e.shiftKey) {
          handlePrevious()
        } else {
          handleNext()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, matches, currentMatchIndex])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="search-replace-container"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="search-replace-row">
            <div className="search-replace-input-group">
              <Search size={16} />
              <input
                ref={searchInputRef}
                type="text"
                className="search-replace-input"
                placeholder="Find"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="search-options">
                <button
                  className={`search-option ${caseSensitive ? 'active' : ''}`}
                  onClick={() => setCaseSensitive(!caseSensitive)}
                  title="Match Case"
                >
                  Aa
                </button>
                <button
                  className={`search-option ${wholeWord ? 'active' : ''}`}
                  onClick={() => setWholeWord(!wholeWord)}
                  title="Match Whole Word"
                >
                  W
                </button>
                <button
                  className={`search-option ${useRegex ? 'active' : ''}`}
                  onClick={() => setUseRegex(!useRegex)}
                  title="Use Regular Expression"
                >
                  .*
                </button>
              </div>
            </div>
            
            <div className="search-navigation">
              <span className="match-count">
                {matches.length > 0 
                  ? `${currentMatchIndex + 1} of ${matches.length}`
                  : 'No results'
                }
              </span>
              <button 
                className="search-nav-button"
                onClick={handlePrevious}
                disabled={matches.length === 0}
              >
                <ChevronUp size={16} />
              </button>
              <button 
                className="search-nav-button"
                onClick={handleNext}
                disabled={matches.length === 0}
              >
                <ChevronDown size={16} />
              </button>
            </div>

            <button className="search-close-button" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <div className="search-replace-row">
            <div className="search-replace-input-group">
              <RefreshCw size={16} />
              <input
                type="text"
                className="search-replace-input"
                placeholder="Replace"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
              />
            </div>
            
            <div className="replace-actions">
              <button 
                className="replace-button"
                onClick={handleReplace}
                disabled={matches.length === 0}
              >
                Replace
              </button>
              <button 
                className="replace-button"
                onClick={handleReplaceAll}
                disabled={matches.length === 0}
              >
                Replace All
              </button>
            </div>
          </div>

          <div className="search-replace-hints">
            <span><kbd>Enter</kbd> Next</span>
            <span><kbd>Shift+Enter</kbd> Previous</span>
            <span><kbd>⌘Enter</kbd> Replace</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SearchReplace