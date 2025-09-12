import React from 'react'
import { PanelRight, Moon, Sun, Save, Undo, Redo, Edit3, Eye, Settings as SettingsIcon } from 'lucide-react'

interface ToolbarProps {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  currentFileName?: string
  isEditing: boolean
  onToggleEdit: () => void
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
  hasChanges: boolean
  canUndo: boolean
  canRedo: boolean
  onOpenSettings: () => void
}

const Toolbar: React.FC<ToolbarProps> = ({
  sidebarCollapsed,
  onToggleSidebar,
  theme,
  onToggleTheme,
  currentFileName,
  isEditing,
  onToggleEdit,
  onSave,
  onUndo,
  onRedo,
  hasChanges,
  canUndo,
  canRedo,
  onOpenSettings,
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        {currentFileName && isEditing && (
          <>
            <button
              className="icon-button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (⌘Z)"
            >
              <Undo size={18} />
            </button>
            
            <button
              className="icon-button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (⌘⇧Z)"
            >
              <Redo size={18} />
            </button>
          </>
        )}
      </div>
      
      <div className="toolbar-center">
        {currentFileName || 'Markview'}
        {hasChanges && <span className="save-indicator unsaved">• Unsaved</span>}
      </div>
      
      <div className="toolbar-right">
        {currentFileName && (
          <>
            <button
              className="icon-button"
              onClick={onToggleEdit}
              title={isEditing ? 'View Mode (⌘E)' : 'Edit Mode (⌘E)'}
            >
              {isEditing ? <Eye size={18} /> : <Edit3 size={18} />}
            </button>
            
            {isEditing && (
              <button
                className="icon-button"
                onClick={onSave}
                disabled={!hasChanges}
                title="Save (⌘S)"
              >
                <Save size={18} />
              </button>
            )}
          </>
        )}
        
        <button 
          className="icon-button" 
          onClick={onOpenSettings}
          title="Settings (⌘,)"
        >
          <SettingsIcon size={18} />
        </button>
        
        <button 
          className="icon-button" 
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Show Sidebar (⌘⌥S)' : 'Hide Sidebar (⌘⌥S)'}
        >
          <PanelRight size={18} />
        </button>
      </div>
    </div>
  )
}

export default Toolbar