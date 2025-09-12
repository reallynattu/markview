import React from 'react'
import { Folder, FileText, File } from 'lucide-react'

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
}

const Sidebar: React.FC<SidebarProps> = ({
  currentFolder,
  files,
  selectedFile,
  onSelectFolder,
  onOpenFile,
  onSelectFile,
}) => {
  const getFolderName = (path: string) => {
    return path.split('/').pop() || 'Select Folder'
  }

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