import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import EditableMarkdownViewer from './components/EditableMarkdownViewer'
import Toolbar from './components/Toolbar'
import Settings from './components/Settings'
import { ElectronAPI } from '../main/preload'
import { useHistory } from './hooks/useHistory'
import { useResizable } from './hooks/useResizable'

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

  useEffect(() => {
    // Load saved settings
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    const savedFontSize = localStorage.getItem('fontSize')
    const savedDefaultView = localStorage.getItem('defaultView') as 'folder' | 'file' | null
    const savedColorTheme = localStorage.getItem('colorTheme')
    
    if (savedTheme) setTheme(savedTheme)
    if (savedFontSize) setFontSize(parseInt(savedFontSize))
    if (savedDefaultView) setDefaultView(savedDefaultView)
    if (savedColorTheme) setColorTheme(savedColorTheme)
    
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
      
      // Load other files in the same directory
      const fileList = await window.electronAPI.readDirectory(dirPath)
      setFiles(fileList)
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

  const handleSelectFile = async (file: FileInfo) => {
    if (hasChanges) {
      const confirm = window.confirm('You have unsaved changes. Do you want to discard them?')
      if (!confirm) return
    }
    
    setSelectedFile(file)
    const fileContent = await window.electronAPI.readFile(file.path)
    setContent(fileContent)
    resetHistory(fileContent)
    setHasChanges(false)
    setIsEditing(false)
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    if (newTheme === 'system') {
      window.electronAPI.getTheme().then(setActualTheme)
    } else {
      setActualTheme(newTheme)
    }
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
    setIsEditing(!isEditing)
  }

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    pushHistory(newContent)
    setHasChanges(true)
  }, [pushHistory])

  const handleSave = async () => {
    if (!selectedFile || !hasChanges) return
    
    const result = await window.electronAPI.writeFile(selectedFile.path, content)
    if (result.success) {
      setHasChanges(false)
    } else {
      alert(`Failed to save file: ${result.error}`)
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
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
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, handleUndo, handleRedo, canUndo, canRedo, sidebarCollapsed])

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
              />
            </div>
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
        />
        <EditableMarkdownViewer 
          content={content}
          isEditing={isEditing}
          onChange={handleContentChange}
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
    </div>
  )
}

export default App