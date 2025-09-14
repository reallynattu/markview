import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import EditableMarkdownViewer from './components/EditableMarkdownViewer'
import Toolbar from './components/Toolbar'
import Settings from './components/Settings'
import GlobalSearch from './components/GlobalSearch'
import QuickOpen from './components/QuickOpen'
import TableOfContents from './components/TableOfContents'
import SearchReplace from './components/SearchReplace'
import ExportDialog, { ExportFormat, ExportOptions } from './components/ExportDialog'
import WhatsNew from './components/WhatsNew'
import TabBar, { Tab } from './components/TabBar'
import UpdateNotification from './components/UpdateNotification'
import DevMenu from './components/DevMenu'
import PerformancePanel from './components/PerformancePanel'
import { ElectronAPI } from '../main/preload'
import { useHistory } from './hooks/useHistory'
import { useResizable } from './hooks/useResizable'
import { useOptimistic } from './hooks/useOptimistic'
import { useTTS } from './contexts/TTSContext'
import { markdownToText } from './utils/markdownToText'
import { perfMonitor, usePerformance } from './utils/performance'
import { fileCache } from './utils/fileCache'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

interface FileInfo {
  name: string
  path: string
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentFolder, setCurrentFolder] = useState<string>('')
  const [files, setFiles] = useState<FileInfo[]>([])
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [content, setContent] = useState<string>('')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')
  const [isEditing, setIsEditing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [defaultView, setDefaultView] = useState<'folder' | 'file'>('folder')
  const [colorTheme, setColorTheme] = useState<string>('default')
  const [shouldAutoStartTTS, setShouldAutoStartTTS] = useState(false)
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)
  const [isQuickOpenOpen, setIsQuickOpenOpen] = useState(false)
  const [isSearchReplaceOpen, setIsSearchReplaceOpen] = useState(false)
  const [showTableOfContents, setShowTableOfContents] = useState(false)
  const [recentFiles, setRecentFiles] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState<number | undefined>()
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false)
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')
  
  // Optimistic updates for tabs
  const {
    optimisticValue: optimisticTabs,
    update: updateTabsOptimistically
  } = useOptimistic(tabs, async (newTabs) => {
    setTabs(newTabs)
  })
  
  const editorRef = useRef<any>(null)
  
  // What's New content
  const getWhatsNewContent = () => `# What's New in Markview

We've been working hard to make Markview even better. Check out the latest features and improvements!

## 🚀 Performance Enhancements
**NEW** - Blazing fast performance with intelligent optimizations:
- **Instant File Switching** - Files are cached and preloaded for zero-delay switching
- **Virtual Scrolling** - Large files (>1000 lines) use virtual scrolling for smooth performance
- **Progressive Rendering** - Medium files render progressively for faster initial display
- **Optimistic UI Updates** - Instant feedback for all actions with smart rollback on errors
- **Performance Monitoring** - Built-in performance tracking (enable Debug Mode in settings)

## 🔧 Developer Tools
**NEW** - Debug mode for power users and developers:
- **Debug Mode Toggle** - Enable/disable performance metrics and developer tools in settings
- **Performance Panel** - Real-time performance metrics with color-coded indicators
- **Cache Statistics** - Monitor file cache usage and clear cache when needed
- **Test Tools** - Simulate updates and test various app states

## 🔍 Smart Document Search & Navigation
**NEW** - Navigate your documents with powerful search and navigation tools:
- **Global Search** (⌘⇧F) - Search across all markdown files in your folder with live preview
- **Fuzzy File Finder** (⌘P) - Quickly open files with fuzzy search, just like in VS Code
- **Table of Contents** (⌘⇧O) - Navigate through document sections with a collapsible sidebar
- **Search & Replace** (⌘F in edit mode) - Find and replace text with regex support

## 📥 Enhanced Export Options
**NEW** - Export your documents in multiple formats:
- **PDF Export** - Create beautiful PDFs with custom styling and page settings
- **HTML Export** - Generate standalone HTML files with embedded styles
- **Word/DOCX Export** - Export to Microsoft Word format with proper formatting
- **Batch Export** - Export multiple files at once to PDF or HTML
- **Print Preview** - Preview and print documents with print-specific styling

## 🎙️ Natural Text-to-Speech
KittenTTS integration brings natural-sounding voices to your documents:
- 8 different natural voices to choose from
- Adjustable speech speed (0.5x to 2x)
- Pause/resume functionality (Space key)
- Stop reading (Escape key)
- Keyboard shortcut (⌘R) to start reading

## 📝 Advanced Markdown Support
Full GitHub Flavored Markdown with extended features:
- Syntax highlighting for code blocks
- Mermaid diagram support
- KaTeX math expressions
- Tables with proper formatting
- Task lists and checkboxes

## 🎨 Improved UI Organization
**NEW** - Cleaner, more intuitive interface:
- **Smart Tab Bar** - Tabs only show when multiple files are open
- **Streamlined Interface** - Removed redundant breadcrumb bar for cleaner look
- **Settings in Sidebar** - Quick access to settings from the sidebar
- **Dropdown Menus** - Settings icon now shows dropdown with What's New and Settings
- **Consistent Styling** - All modals and dialogs have unified design
- **Dark Theme Improvements** - Better contrast and readability

## 🔄 Over-The-Air Updates
**NEW** - Automatic updates keep Markview fresh:
- **Background Updates** - Automatically checks for updates every 4 hours
- **Update Notifications** - Non-intrusive notifications when updates are available
- **One-Click Install** - Download and install updates without leaving the app
- **Manual Check** - Check for updates anytime from Settings

## ⌨️ Keyboard Shortcuts

### Navigation
- \`⌘P\` - Quick file open
- \`⌘⇧F\` - Global search
- \`⌘⇧O\` - Toggle table of contents
- \`⌘⌥S\` - Toggle sidebar

### Editing
- \`⌘E\` - Toggle edit mode
- \`⌘S\` - Save changes
- \`⌘Z\` - Undo
- \`⌘⇧Z\` - Redo
- \`⌘F\` - Find & replace (in edit mode)

### Export & Tools
- \`⌘⇧E\` - Export document
- \`⌘,\` - Open settings
- \`⌘R\` - Read aloud
- \`Space\` - Pause/resume reading
- \`Escape\` - Stop reading

## 🚀 Coming Soon
Stay tuned for more exciting features in future updates!`
  
  const {
    content: historyContent,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory
  } = useHistory(content)

  const {
    width: sidebarWidth,
    isResizing,
    handleMouseDown
  } = useResizable({
    initialWidth: 260,
    minWidth: 200,
    maxWidth: 500,
    storageKey: 'markdown-viewer-sidebar-width'
  })

  const {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused
  } = useTTS()

  useEffect(() => {
    // Load saved settings
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    const savedFontSize = localStorage.getItem('fontSize')
    const savedDefaultView = localStorage.getItem('defaultView') as 'folder' | 'file' | null
    const savedColorTheme = localStorage.getItem('colorTheme')
    const savedShowTOC = localStorage.getItem('showTableOfContents')
    const savedRecentFiles = localStorage.getItem('recentFiles')
    
    if (savedTheme) setTheme(savedTheme)
    if (savedFontSize) setFontSize(parseInt(savedFontSize))
    if (savedDefaultView) setDefaultView(savedDefaultView)
    if (savedColorTheme) setColorTheme(savedColorTheme)
    if (savedShowTOC) setShowTableOfContents(savedShowTOC === 'true')
    if (savedRecentFiles) {
      try {
        setRecentFiles(JSON.parse(savedRecentFiles))
      } catch (e) {
        console.error('Failed to parse recent files:', e)
      }
    }
    
    // Get system theme
    window.electronAPI.getTheme().then((systemTheme) => {
      setActualTheme(theme === 'system' ? systemTheme : theme as 'light' | 'dark')
    })
    
    window.electronAPI.onThemeChanged((newTheme) => {
      if (theme === 'system') {
        setActualTheme(newTheme as 'light' | 'dark')
      }
    })

    // Handle files opened from Finder
    window.electronAPI.onOpenFile(async (filePath) => {
      const fileContent = await window.electronAPI.readFile(filePath)
      const fileName = filePath.split('/').pop() || 'Untitled'
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'))
      
      setCurrentFolder(dirPath)
      setSelectedFile({ name: fileName, path: filePath })
      setContent(fileContent)
      resetHistory(fileContent)
      setHasChanges(false)
      setIsEditing(false)
      
      // Load other files in the same directory
      const fileList = await window.electronAPI.readDirectory(dirPath)
      setFiles(fileList)
    })
    
    // Handle auto-start TTS for testing
    window.electronAPI.onAutoStartTTS(() => {
      console.log('Auto-start TTS signal received')
      setShouldAutoStartTTS(true)
    })
  }, [])

  useEffect(() => {
    const themeToApply = theme === 'system' ? actualTheme : theme
    if (colorTheme === 'default') {
      document.documentElement.setAttribute('data-theme', themeToApply)
    } else {
      document.documentElement.setAttribute('data-theme', colorTheme)
    }
  }, [theme, actualTheme, colorTheme])

  useEffect(() => {
    document.documentElement.style.setProperty('--content-font-size', `${fontSize}px`)
  }, [fontSize])

  // Handle auto-start TTS
  useEffect(() => {
    if (shouldAutoStartTTS && content && !isEditing && !isSpeaking) {
      console.log('Auto-starting TTS with content')
      const textToSpeak = markdownToText(content)
      speak(textToSpeak)
      setShouldAutoStartTTS(false)
    }
  }, [shouldAutoStartTTS, content, isEditing, isSpeaking, speak])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global search: Cmd+Shift+F
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        setIsGlobalSearchOpen(true)
      }
      // Quick open: Cmd+P
      else if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        setIsQuickOpenOpen(true)
      }
      // Search & Replace: Cmd+F (in edit mode)
      else if ((e.metaKey || e.ctrlKey) && e.key === 'f' && isEditing) {
        e.preventDefault()
        setIsSearchReplaceOpen(true)
      }
      // Toggle table of contents: Cmd+Shift+O
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'O') {
        e.preventDefault()
        setShowTableOfContents(prev => {
          const newValue = !prev
          localStorage.setItem('showTableOfContents', String(newValue))
          return newValue
        })
      }
      // Export: Cmd+Shift+E
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault()
        if (selectedFile && content) {
          setIsExportDialogOpen(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, selectedFile, content])

  const handleSelectFolder = async () => {
    const folderPath = await window.electronAPI.selectFolder()
    if (folderPath) {
      setCurrentFolder(folderPath)
      const fileList = await window.electronAPI.readDirectory(folderPath)
      setFiles(fileList)
      if (fileList.length > 0) {
        handleSelectFile(fileList[0])
      }
    }
  }

  const handleOpenSingleFile = async () => {
    const filePath = await window.electronAPI.selectFile()
    if (filePath) {
      const fileName = filePath.split('/').pop() || 'Untitled'
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'))
      
      setCurrentFolder(dirPath)
      setSelectedFile({ name: fileName, path: filePath })
      const fileContent = await window.electronAPI.readFile(filePath)
      setContent(fileContent)
      resetHistory(fileContent)
      setHasChanges(false)
      setIsEditing(false)
      
      // Load other files in the same directory
      const fileList = await window.electronAPI.readDirectory(dirPath)
      setFiles(fileList)
    }
  }

  const handleSelectFile = async (file: FileInfo, line?: number) => {
    await perfMonitor.measureAsync('file.select', async () => {
      // Check if file is already open in a tab
      const existingTab = tabs.find(tab => tab.path === file.path)
      if (existingTab) {
        setActiveTabId(existingTab.id)
        return
      }
      
      if (hasChanges) {
        const confirm = window.confirm('You have unsaved changes. Do you want to discard them?')
        if (!confirm) return
      }
      
      setSelectedFile(file)
      
      let fileContent: string
      
      // Try to get from cache first
      const cachedContent = fileCache.get(file.path)
      if (cachedContent) {
        perfMonitor.start('cache.hit')
        fileContent = cachedContent
        perfMonitor.end('cache.hit', { 
          size: fileContent.length,
          path: file.path 
        })
        
        // Load fresh content in background to ensure cache is up to date
        window.electronAPI.readFile(file.path).then(freshContent => {
          if (freshContent !== cachedContent) {
            fileCache.set(file.path, freshContent)
            // Only update if this file is still selected
            if (selectedFile?.path === file.path) {
              setContent(freshContent)
              resetHistory(freshContent)
            }
          }
        }).catch(console.error)
      } else {
        perfMonitor.start('file.read')
        fileContent = await window.electronAPI.readFile(file.path)
        perfMonitor.end('file.read', { 
          size: fileContent.length,
          path: file.path 
        })
        
        // Cache the content
        fileCache.set(file.path, fileContent)
      }
      
      perfMonitor.start('content.set')
      setContent(fileContent)
      resetHistory(fileContent)
      setHasChanges(false)
      setIsEditing(false)
      perfMonitor.end('content.set', { 
        size: fileContent.length 
      })
      
      // Create new tab
      const newTab: Tab = {
        id: Date.now().toString(),
        title: file.name,
        path: file.path,
        hasChanges: false
      }
      setTabs(prev => [...prev, newTab])
      setActiveTabId(newTab.id)
      
      // Update recent files
      setRecentFiles(prev => {
        const updated = [file.path, ...prev.filter(p => p !== file.path)].slice(0, 10)
        localStorage.setItem('recentFiles', JSON.stringify(updated))
        return updated
      })
      
      // Navigate to line if specified
      if (line && editorRef.current) {
        setTimeout(() => {
          editorRef.current.scrollToLine(line)
        }, 100)
      }
      
      // Preload adjacent files in background
      fileCache.preloadAdjacent(file.path, files, window.electronAPI.readFile)
        .catch(console.error)
    }, { path: file.path })
  }

  const handleNavigateToFile = async (filePath: string, line?: number) => {
    const fileName = filePath.split('/').pop() || 'Untitled'
    const file: FileInfo = { name: fileName, path: filePath }
    await handleSelectFile(file, line)
  }

  const handleNavigateToLine = (line: number, column?: number) => {
    if (editorRef.current) {
      editorRef.current.scrollToLine(line, column)
    }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    // Optimistic theme update
    perfMonitor.measure('optimistic.theme', () => {
      setTheme(newTheme)
      
      // Immediately apply theme
      if (newTheme === 'system') {
        window.electronAPI.getTheme().then(setActualTheme)
      } else {
        setActualTheme(newTheme)
      }
    })
    
    // Save to localStorage (async operation)
    localStorage.setItem('theme', newTheme)
  }

  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
    localStorage.setItem('fontSize', size.toString())
  }

  const handleDefaultViewChange = (view: 'folder' | 'file') => {
    setDefaultView(view)
    localStorage.setItem('defaultView', view)
  }

  const handleColorThemeChange = (theme: string) => {
    setColorTheme(theme)
    localStorage.setItem('colorTheme', theme)
  }

  const handleToggleEdit = () => {
    // Don't allow editing What's New
    const activeTab = tabs.find(tab => tab.id === activeTabId)
    if (activeTab?.isWhatsNew) return
    
    setIsEditing(!isEditing)
  }

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    pushHistory(newContent)
    setHasChanges(true)
    
    // Update tab with unsaved changes
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, hasChanges: true } : tab
    ))
  }, [pushHistory, activeTabId])

  const handleSave = async () => {
    if (!selectedFile || !hasChanges) return
    
    // Don't save What's New
    const activeTab = tabs.find(tab => tab.id === activeTabId)
    if (activeTab?.isWhatsNew) return
    
    // Optimistic update - immediately show saved state
    perfMonitor.measure('optimistic.save', () => {
      setHasChanges(false)
      updateTabsOptimistically(tabs.map(tab => 
        tab.id === activeTabId ? { ...tab, hasChanges: false } : tab
      ))
    })
    
    try {
      const result = await window.electronAPI.writeFile(selectedFile.path, content)
      if (!result.success) {
        // Rollback on failure
        setHasChanges(true)
        setTabs(prev => prev.map(tab => 
          tab.id === activeTabId ? { ...tab, hasChanges: true } : tab
        ))
        alert(`Failed to save file: ${result.error}`)
      } else {
        // Update cache with saved content
        fileCache.set(selectedFile.path, content)
      }
    } catch (error) {
      // Rollback on error
      setHasChanges(true)
      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId ? { ...tab, hasChanges: true } : tab
      ))
      alert(`Failed to save file: ${error}`)
    }
  }

  const handleUndo = useCallback(() => {
    undo()
    setContent(historyContent)
    setHasChanges(true)
  }, [undo, historyContent])

  const handleRedo = useCallback(() => {
    redo()
    setContent(historyContent)
    setHasChanges(true)
  }, [redo, historyContent])

  const handleSpeak = useCallback(() => {
    console.log('=== handleSpeak START ===')
    console.log('Content length:', content?.length)
    try {
      const textToSpeak = markdownToText(content)
      console.log('Text to speak length:', textToSpeak.length)
      console.log('First 100 chars:', textToSpeak.substring(0, 100))
      console.log('Calling speak function...')
      speak(textToSpeak)
      console.log('=== handleSpeak END ===')
    } catch (error) {
      console.error('=== handleSpeak ERROR ===')
      console.error('Error in handleSpeak:', error)
    }
  }, [content, speak])

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      resume()
    } else {
      pause()
    }
  }, [isPaused, pause, resume])

  const handleStop = useCallback(() => {
    stop()
  }, [stop])

  const handleExport = useCallback(async (format: ExportFormat, options: ExportOptions) => {
    if (!selectedFile || !content) return

    // For What's New, use a default export path
    const activeTab = tabs.find(tab => tab.id === activeTabId)
    const exportPath = activeTab?.isWhatsNew ? 'WhatsNew.md' : selectedFile.path

    try {
      let result
      
      switch (format) {
        case 'pdf':
          result = await window.electronAPI.exportToPDF(content, exportPath, options)
          break
        case 'html':
          result = await window.electronAPI.exportToHTML(content, exportPath, options)
          break
        case 'docx':
          result = await window.electronAPI.exportToDOCX(content, exportPath, options)
          break
        case 'batch-pdf':
        case 'batch-html':
          const selectedFiles = options.selectedFiles || []
          const exportFormat = format === 'batch-pdf' ? 'pdf' : 'html'
          result = await window.electronAPI.batchExport(selectedFiles, exportFormat, options)
          break
        case 'print':
          result = await window.electronAPI.showPrintPreview(content, exportPath, options)
          break
      }

      if (result?.success) {
        console.log('Export successful:', result)
      } else if (result?.error) {
        console.error('Export failed:', result.error)
        alert(`Export failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert(`Export error: ${error}`)
    }
  }, [content, selectedFile, tabs, activeTabId])

  // Handle closing a tab
  const handleCloseTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return
    
    if (tab.hasChanges) {
      const confirm = window.confirm('You have unsaved changes. Do you want to discard them?')
      if (!confirm) return
    }
    
    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)
    
    // If closing the active tab, switch to another tab or clear content
    if (tabId === activeTabId) {
      if (newTabs.length > 0) {
        const newActiveTab = newTabs[newTabs.length - 1]
        setActiveTabId(newActiveTab.id)
        if (newActiveTab.isWhatsNew) {
          const fileContent = getWhatsNewContent()
          setContent(fileContent)
          resetHistory(fileContent)
          setHasChanges(false)
          setIsEditing(false)
          setSelectedFile({ name: newActiveTab.title, path: newActiveTab.path })
        } else {
          window.electronAPI.readFile(newActiveTab.path).then(fileContent => {
            setContent(fileContent)
            resetHistory(fileContent)
            setHasChanges(newActiveTab.hasChanges || false)
            setIsEditing(false)
            setSelectedFile({ name: newActiveTab.title, path: newActiveTab.path })
          })
        }
      } else {
        // No more tabs, clear everything
        setActiveTabId('')
        setSelectedFile(null)
        setContent('')
        resetHistory('')
        setHasChanges(false)
        setIsEditing(false)
      }
    }
  }, [tabs, activeTabId, hasChanges, resetHistory, getWhatsNewContent])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close current tab: Cmd+W
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault()
        if (activeTabId && tabs.length > 0) {
          handleCloseTab(activeTabId)
        }
      } 
      // Switch to specific tab: Cmd+1 through Cmd+9
      else if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const tabIndex = parseInt(e.key) - 1
        if (tabIndex < tabs.length) {
          const targetTab = tabs[tabIndex]
          if (targetTab && targetTab.id !== activeTabId) {
            // Use the same tab switching logic from onSelectTab
            if (hasChanges) {
              const confirm = window.confirm('You have unsaved changes. Do you want to discard them?')
              if (!confirm) return
            }
            
            setActiveTabId(targetTab.id)
            
            let fileContent = ''
            if (targetTab.isWhatsNew) {
              fileContent = getWhatsNewContent()
              setContent(fileContent)
              resetHistory(fileContent)
              setHasChanges(targetTab.hasChanges || false)
              setIsEditing(false)
              setSelectedFile({ name: targetTab.title, path: targetTab.path })
            } else {
              window.electronAPI.readFile(targetTab.path).then(content => {
                setContent(content)
                resetHistory(content)
                setHasChanges(targetTab.hasChanges || false)
                setIsEditing(false)
                setSelectedFile({ name: targetTab.title, path: targetTab.path })
              })
            }
          }
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) handleUndo()
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        if (canRedo) handleRedo()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault()
        handleToggleEdit()
      } else if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === 's') {
        e.preventDefault()
        setSidebarCollapsed(!sidebarCollapsed)
      } else if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setIsSettingsOpen(true)
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault()
        if (!isEditing && content) {
          if (isSpeaking) {
            handleStop()
          } else {
            handleSpeak()
          }
        }
      } else if (e.key === ' ' && isSpeaking) {
        e.preventDefault()
        handlePauseResume()
      } else if (e.key === 'Escape' && isSpeaking) {
        e.preventDefault()
        handleStop()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, handleUndo, handleRedo, canUndo, canRedo, sidebarCollapsed, isEditing, content, isSpeaking, handleSpeak, handleStop, handlePauseResume, activeTabId, tabs, handleCloseTab, hasChanges, resetHistory, getWhatsNewContent])

  // Update content from history when undo/redo
  useEffect(() => {
    if (historyContent !== content && (canUndo || canRedo)) {
      setContent(historyContent)
    }
  }, [historyContent, content, canUndo, canRedo])

  // Add resizing class to body
  useEffect(() => {
    if (isResizing) {
      document.body.classList.add('resizing')
    } else {
      document.body.classList.remove('resizing')
    }
    
    return () => {
      document.body.classList.remove('resizing')
    }
  }, [isResizing])

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only set dragging to false if we're leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const file = files[0]
    const filePath = (file as any).path // Electron provides the full path

    if (!filePath) return

    // Check if it's a directory or file
    const isDirectory = await window.electronAPI.isDirectory(filePath)
    
    if (isDirectory) {
      // It's a directory
      setCurrentFolder(filePath)
      const fileList = await window.electronAPI.readDirectory(filePath)
      setFiles(fileList)
      if (fileList.length > 0) {
        handleSelectFile(fileList[0])
      }
    } else {
      // It's a file
      if (filePath.endsWith('.md') || filePath.endsWith('.markdown')) {
        const fileName = filePath.split('/').pop() || 'Untitled'
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'))
        
        setCurrentFolder(dirPath)
        setSelectedFile({ name: fileName, path: filePath })
        const fileContent = await window.electronAPI.readFile(filePath)
        setContent(fileContent)
        resetHistory(fileContent)
        setHasChanges(false)
        setIsEditing(false)
        
        // Load other files in the same directory
        const fileList = await window.electronAPI.readDirectory(dirPath)
        setFiles(fileList)
      }
    }
  }

  return (
    <div 
      className={`app ${isDragging ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            className="sidebar-container"
            initial={{ width: 0 }}
            animate={{ width: sidebarWidth }}
            exit={{ width: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ width: sidebarCollapsed ? 0 : sidebarWidth }}
          >
            <div 
              className={`sidebar-resize-handle ${isResizing ? 'resizing' : ''}`}
              onMouseDown={handleMouseDown}
            />
            <div className="sidebar" style={{ width: sidebarWidth }}>
              <Sidebar
                currentFolder={currentFolder}
                files={files}
                selectedFile={selectedFile}
                onSelectFolder={handleSelectFolder}
                onOpenFile={handleOpenSingleFile}
                onSelectFile={handleSelectFile}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenWhatsNew={async () => {
                  // Close the modal approach
                  setIsWhatsNewOpen(false)
                  
                  // Open What's New as a tab
                  const whatsNewTab = tabs.find(tab => tab.isWhatsNew)
                  if (whatsNewTab) {
                    setActiveTabId(whatsNewTab.id)
                  } else {
                    // Use the What's New content
                    const whatsNewPath = 'whats-new'
                    const whatsNewContent = getWhatsNewContent()
                    
                    const newTab: Tab = {
                      id: 'whats-new-' + Date.now(),
                      title: "What's New",
                      path: whatsNewPath,
                      isWhatsNew: true,
                      hasChanges: false
                    }
                    
                    setTabs(prev => [...prev, newTab])
                    setActiveTabId(newTab.id)
                    setSelectedFile({ name: "What's New", path: whatsNewPath })
                    setContent(whatsNewContent)
                    resetHistory(whatsNewContent)
                    setHasChanges(false)
                    setIsEditing(false)
                  }
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table of Contents Sidebar */}
      <AnimatePresence>
        {showTableOfContents && content && (
          <motion.div
            className="toc-sidebar"
            initial={{ width: 0 }}
            animate={{ width: 250 }}
            exit={{ width: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ width: 250 }}
          >
            <TableOfContents
              content={content}
              currentLine={currentLine}
              onNavigate={handleNavigateToLine}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="content">
        <Toolbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          theme={actualTheme}
          onToggleTheme={() => {}}
          currentFileName={selectedFile?.name}
          isEditing={isEditing}
          onToggleEdit={handleToggleEdit}
          onSave={handleSave}
          onUndo={handleUndo}
          onRedo={handleRedo}
          hasChanges={hasChanges}
          canUndo={canUndo}
          canRedo={canRedo}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isSpeaking={isSpeaking}
          isPaused={isPaused}
          onSpeak={handleSpeak}
          onPauseResume={handlePauseResume}
          onStop={handleStop}
          showTableOfContents={showTableOfContents}
          onToggleTOC={() => setShowTableOfContents(prev => !prev)}
          onExport={() => setIsExportDialogOpen(true)}
        />
        
        {/* Tab Bar - show when there are multiple tabs */}
        {optimisticTabs.length > 1 && (
          <TabBar
            tabs={optimisticTabs}
            activeTabId={activeTabId}
            onSelectTab={async (tabId) => {
              const tab = tabs.find(t => t.id === tabId)
              if (!tab) return
              
              if (hasChanges && activeTabId !== tabId) {
                const confirm = window.confirm('You have unsaved changes. Do you want to discard them?')
                if (!confirm) return
              }
              
              setActiveTabId(tabId)
              
              let fileContent = ''
              if (tab.isWhatsNew) {
                // Use embedded What's New content
                fileContent = getWhatsNewContent()
              } else {
                // Try cache first for instant switching
                const cachedContent = fileCache.get(tab.path)
                if (cachedContent) {
                  fileContent = cachedContent
                  perfMonitor.measure('tab.switch.cached', () => {
                    setContent(fileContent)
                    resetHistory(fileContent)
                    setHasChanges(tab.hasChanges || false)
                    setIsEditing(false)
                    setSelectedFile({ name: tab.title, path: tab.path })
                  })
                  
                  // Verify cache is up to date in background
                  window.electronAPI.readFile(tab.path).then(freshContent => {
                    if (freshContent !== cachedContent) {
                      fileCache.set(tab.path, freshContent)
                      if (activeTabId === tabId) {
                        setContent(freshContent)
                        resetHistory(freshContent)
                      }
                    }
                  }).catch(console.error)
                  
                  return
                } else {
                  fileContent = await window.electronAPI.readFile(tab.path)
                  fileCache.set(tab.path, fileContent)
                }
              }
              
              perfMonitor.measure('tab.switch', () => {
                setContent(fileContent)
                resetHistory(fileContent)
                setHasChanges(tab.hasChanges || false)
                setIsEditing(false)
                setSelectedFile({ name: tab.title, path: tab.path })
              })
            }}
            onCloseTab={handleCloseTab}
          />
        )}
        
        
        <EditableMarkdownViewer 
          ref={editorRef}
          content={content}
          isEditing={isEditing}
          onChange={handleContentChange}
          onCursorChange={setCurrentLine}
        />
      </div>
      
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={handleThemeChange}
        colorTheme={colorTheme}
        onColorThemeChange={handleColorThemeChange}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        defaultView={defaultView}
        onDefaultViewChange={handleDefaultViewChange}
      />
      
      {/* Global Search */}
      <GlobalSearch
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        folderPath={currentFolder}
        onSelectFile={handleNavigateToFile}
      />
      
      {/* Quick Open */}
      <QuickOpen
        isOpen={isQuickOpenOpen}
        onClose={() => setIsQuickOpenOpen(false)}
        files={files}
        recentFiles={recentFiles}
        onSelectFile={(path) => {
          const file = files.find(f => f.path === path)
          if (file) handleSelectFile(file)
        }}
      />
      
      {/* Search & Replace (in edit mode) */}
      {isEditing && (
        <SearchReplace
          isOpen={isSearchReplaceOpen}
          onClose={() => setIsSearchReplaceOpen(false)}
          content={content}
          onReplace={(newContent) => {
            setContent(newContent)
            pushHistory(newContent)
            setHasChanges(true)
          }}
          onNavigateToLine={handleNavigateToLine}
        />
      )}
      
      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        currentFileName={selectedFile?.name || 'document'}
        content={content}
        files={files}
        onExport={handleExport}
      />
      
      {/* Update Notification */}
      <UpdateNotification />
      
      {/* Developer Menu (only in development) */}
      <DevMenu />
      
      {/* Performance Monitor (only in development) */}
      <PerformancePanel />
    </div>
  )
}

export default App