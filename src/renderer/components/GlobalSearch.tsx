import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, X, FileText, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchResult {
  file: string
  fileName: string
  matches: Array<{
    line: number
    text: string
    preview: string
  }>
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
  folderPath: string | null
  onSelectFile: (path: string, line?: number) => void
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  folderPath,
  onSelectFile
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())

  // Search files when query changes
  useEffect(() => {
    if (!searchQuery || !folderPath) {
      setResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true)
      try {
        const files = await window.electronAPI.readDirectory(folderPath)
        const searchResults: SearchResult[] = []

        for (const file of files) {
          const content = await window.electronAPI.readFile(file.path)
          const lines = content.split('\n')
          const matches: SearchResult['matches'] = []

          lines.forEach((line, index) => {
            if (line.toLowerCase().includes(searchQuery.toLowerCase())) {
              // Get context around the match
              const startLine = Math.max(0, index - 1)
              const endLine = Math.min(lines.length - 1, index + 1)
              const preview = lines.slice(startLine, endLine + 1).join('\n')

              matches.push({
                line: index + 1,
                text: line,
                preview
              })
            }
          })

          if (matches.length > 0) {
            searchResults.push({
              file: file.path,
              fileName: file.name,
              matches
            })
          }
        }

        setResults(searchResults)
        // Expand first file by default
        if (searchResults.length > 0) {
          setExpandedFiles(new Set([searchResults[0].file]))
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300) // Debounce search

    return () => clearTimeout(searchTimeout)
  }, [searchQuery, folderPath])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const totalResults = results.reduce((acc, r) => acc + r.matches.length, 0)
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % Math.max(1, totalResults))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + totalResults) % Math.max(1, totalResults))
          break
        case 'Enter':
          e.preventDefault()
          handleSelectResult()
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  const handleSelectResult = () => {
    let currentIndex = 0
    for (const result of results) {
      for (const match of result.matches) {
        if (currentIndex === selectedIndex) {
          onSelectFile(result.file, match.line)
          onClose()
          return
        }
        currentIndex++
      }
    }
  }

  const toggleFileExpansion = (file: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(file)) {
        newSet.delete(file)
      } else {
        newSet.add(file)
      }
      return newSet
    })
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="search-highlight">{part}</mark>
        : part
    )
  }

  let resultIndex = 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="global-search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className="global-search-modal"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="search-header">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search in all markdown files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button className="search-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="search-results">
              {isSearching && (
                <div className="search-loading">
                  Searching...
                </div>
              )}

              {!isSearching && searchQuery && results.length === 0 && (
                <div className="search-empty">
                  No results found for "{searchQuery}"
                </div>
              )}

              {!isSearching && results.map((result) => {
                const isExpanded = expandedFiles.has(result.file)
                const fileResultIndices: number[] = []
                
                // Track indices for keyboard navigation
                const startIndex = resultIndex
                for (let i = 0; i < result.matches.length; i++) {
                  fileResultIndices.push(resultIndex++)
                }

                return (
                  <div key={result.file} className="search-result-file">
                    <div 
                      className="search-result-header"
                      onClick={() => toggleFileExpansion(result.file)}
                    >
                      <ChevronRight 
                        size={16} 
                        className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                      />
                      <FileText size={16} />
                      <span className="file-name">{result.fileName}</span>
                      <span className="match-count">{result.matches.length} matches</span>
                    </div>

                    {isExpanded && (
                      <div className="search-result-matches">
                        {result.matches.map((match, index) => {
                          const currentIndex = startIndex + index
                          return (
                            <div
                              key={`${match.line}-${index}`}
                              className={`search-match ${selectedIndex === currentIndex ? 'selected' : ''}`}
                              onClick={() => {
                                onSelectFile(result.file, match.line)
                                onClose()
                              }}
                            >
                              <span className="line-number">Line {match.line}</span>
                              <div className="match-preview">
                                {highlightMatch(match.text, searchQuery)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {results.length > 0 && (
              <div className="search-footer">
                <span className="search-hint">
                  <kbd>↑↓</kbd> Navigate
                  <kbd>Enter</kbd> Open
                  <kbd>Esc</kbd> Close
                </span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default GlobalSearch