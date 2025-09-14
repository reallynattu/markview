import React, { useState, useRef, useEffect } from 'react'
import { Folder, FileText, File, Settings, Sparkles } from 'lucide-react'

interface FileInfo {
  name: string
  path: string
}

interface SidebarProps {
  currentFolder: string
  files: FileInfo[]
  selectedFile: FileInfo | null
  onSelectFolder: () => void
  onOpenFile: () => void
  onSelectFile: (file: FileInfo) => void
  onOpenSettings?: () => void
  onOpenWhatsNew?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
  currentFolder,
  files,
  selectedFile,
  onSelectFolder,
  onOpenFile,
  onSelectFile,
  onOpenSettings,
  onOpenWhatsNew,
}) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getFolderName = (path: string) => {
    return path.split('/').pop() || 'Select Folder'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  return (
    <>
      <div className="sidebar-header">
        <div className="folder-path" title={currentFolder}>
          {currentFolder ? getFolderName(currentFolder) : 'No Folder Selected'}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="icon-button" onClick={onOpenFile} title="Open File">
            <File size={18} />
          </button>
          <button className="icon-button" onClick={onSelectFolder} title="Select Folder">
            <Folder size={18} />
          </button>
          {onOpenSettings && (
            <div className="settings-dropdown-container" ref={dropdownRef}>
              <button 
                className="icon-button" 
                onClick={() => setShowDropdown(!showDropdown)} 
                title="Settings"
              >
                <Settings size={18} />
              </button>
              {showDropdown && (
                <div className="settings-dropdown">
                  {onOpenWhatsNew && (
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        onOpenWhatsNew()
                        setShowDropdown(false)
                      }}
                    >
                      <Sparkles size={16} />
                      <span>What's new</span>
                    </button>
                  )}
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      onOpenSettings()
                      setShowDropdown(false)
                    }}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="file-list">
        {files.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '24px 16px',
            color: 'var(--text-muted)',
            fontSize: '13px'
          }}>
            {currentFolder ? 'No markdown files found' : 'Select a folder to view files'}
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.path}
              className={`file-item ${selectedFile?.path === file.path ? 'active' : ''}`}
              onClick={() => onSelectFile(file)}
            >
              <FileText size={16} />
              <span>{file.name}</span>
            </div>
          ))
        )}
      </div>
    </>
  )
}

export default Sidebar