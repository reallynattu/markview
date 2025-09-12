import React, { useState, useEffect } from 'react'
import { X, Sun, Moon, Monitor, Type, FileText, FolderOpen, Terminal, Check, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
  theme: 'light' | 'dark' | 'system'
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void
  colorTheme?: string
  onColorThemeChange?: (theme: string) => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  defaultView: 'folder' | 'file'
  onDefaultViewChange: (view: 'folder' | 'file') => void
}

const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  colorTheme,
  onColorThemeChange,
  fontSize,
  onFontSizeChange,
  defaultView,
  onDefaultViewChange
}) => {
  const [cliInstalled, setCLIInstalled] = useState(false)
  const [cliInstalling, setCLIInstalling] = useState(false)
  const [cliStatus, setCLIStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })

  useEffect(() => {
    if (isOpen) {
      checkCLIStatus()
    }
  }, [isOpen])

  const checkCLIStatus = async () => {
    const result = await window.electronAPI.checkCLIInstalled()
    setCLIInstalled(result.installed)
  }

  const handleInstallCLI = async () => {
    setCLIInstalling(true)
    setCLIStatus({ type: null, message: '' })
    
    try {
      const result = await window.electronAPI.installCLI()
      if (result.success) {
        setCLIStatus({ type: 'success', message: 'Terminal opened for installation. Please enter your password when prompted.' })
        // Check for installation after a delay
        setTimeout(async () => {
          const checkResult = await window.electronAPI.checkCLIInstalled()
          setCLIInstalled(checkResult.installed)
        }, 5000)
      } else {
        setCLIStatus({ type: 'error', message: result.error || 'Failed to install CLI' })
      }
    } catch (error) {
      setCLIStatus({ type: 'error', message: 'Failed to install CLI. You may need to enter your password.' })
    }
    
    setCLIInstalling(false)
  }

  const handleUninstallCLI = async () => {
    setCLIInstalling(true)
    setCLIStatus({ type: null, message: '' })
    
    try {
      const result = await window.electronAPI.uninstallCLI()
      if (result.success) {
        setCLIStatus({ type: 'success', message: 'Terminal opened for uninstallation. Please enter your password when prompted.' })
        // Check for uninstallation after a delay
        setTimeout(async () => {
          const checkResult = await window.electronAPI.checkCLIInstalled()
          setCLIInstalled(checkResult.installed)
        }, 5000)
      } else {
        setCLIStatus({ type: 'error', message: result.error || 'Failed to uninstall CLI' })
      }
    } catch (error) {
      setCLIStatus({ type: 'error', message: 'Failed to uninstall CLI. You may need to enter your password.' })
    }
    
    setCLIInstalling(false)
  }

  const themes = [
    { id: 'light' as const, name: 'Light', icon: Sun },
    { id: 'dark' as const, name: 'Dark', icon: Moon },
    { id: 'system' as const, name: 'System', icon: Monitor }
  ]

  const colorThemes = [
    { id: 'default', name: 'Default', colors: ['#007AFF', '#ffffff', '#1a1a1a'] },
    { id: 'solarized-light', name: 'Solarized Light', colors: ['#268bd2', '#fdf6e3', '#657b83'] },
    { id: 'solarized-dark', name: 'Solarized Dark', colors: ['#268bd2', '#002b36', '#839496'] },
    { id: 'nord', name: 'Nord', colors: ['#88c0d0', '#2e3440', '#eceff4'] },
    { id: 'dracula', name: 'Dracula', colors: ['#bd93f9', '#282a36', '#f8f8f2'] },
    { id: 'rose-pine', name: 'Rosé Pine', colors: ['#c4a7e7', '#191724', '#e0def4'] },
    { id: 'rose-pine-dawn', name: 'Rosé Pine Dawn', colors: ['#907aa9', '#faf4ed', '#575279'] },
    { id: 'tokyo-night', name: 'Tokyo Night', colors: ['#7aa2f7', '#1a1b26', '#c0caf5'] },
    { id: 'one-dark', name: 'One Dark', colors: ['#61afef', '#282c34', '#abb2bf'] }
  ]


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="settings-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className="settings-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="settings-header">
              <h2>Settings</h2>
              <button className="icon-button" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
            
            <div className="settings-content">
              {/* Theme Selection */}
              <div className="settings-section">
                <h3>Theme</h3>
                <div className="settings-options">
                  {themes.map((t) => {
                    const Icon = t.icon
                    return (
                      <button
                        key={t.id}
                        className={`settings-option ${theme === t.id ? 'active' : ''}`}
                        onClick={() => onThemeChange(t.id)}
                      >
                        <Icon size={20} />
                        <span>{t.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Font Size */}
              <div className="settings-section">
                <h3>Font Size</h3>
                <div className="font-size-slider">
                  <div className="slider-info">
                    <Type size={16} />
                    <span className="font-size-label">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={fontSize}
                    onChange={(e) => onFontSizeChange(Number(e.target.value))}
                    className="font-slider"
                  />
                  <div className="slider-labels">
                    <span>12px</span>
                    <span>24px</span>
                  </div>
                  <div className="font-preview" style={{ fontSize: `${fontSize}px` }}>
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              </div>

              {/* Default View */}
              <div className="settings-section">
                <h3>Default View</h3>
                <div className="settings-options">
                  <button
                    className={`settings-option ${defaultView === 'folder' ? 'active' : ''}`}
                    onClick={() => onDefaultViewChange('folder')}
                  >
                    <FolderOpen size={20} />
                    <span>Folder Browser</span>
                  </button>
                  <button
                    className={`settings-option ${defaultView === 'file' ? 'active' : ''}`}
                    onClick={() => onDefaultViewChange('file')}
                  >
                    <FileText size={20} />
                    <span>Single File</span>
                  </button>
                </div>
              </div>

              {/* Color Themes */}
              <div className="settings-section">
                <h3>Color Theme</h3>
                <div className="color-themes-grid">
                  {colorThemes.map((ct) => (
                    <button
                      key={ct.id}
                      className={`color-theme-option ${colorTheme === ct.id ? 'active' : ''}`}
                      onClick={() => onColorThemeChange?.(ct.id)}
                      title={ct.name}
                    >
                      <div className="color-theme-preview">
                        {ct.colors.map((color, index) => (
                          <div
                            key={index}
                            className="color-swatch"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span className="color-theme-name">{ct.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CLI Support */}
              <div className="settings-section">
                <h3>Command Line Interface</h3>
                <div className="cli-settings">
                  <p className="cli-description">
                    Install the CLI to open markdown files directly from terminal using: <code>mrkdwn filename.md</code>
                  </p>
                  {cliInstalled ? (
                    <button
                      className="cli-button installed"
                      onClick={handleUninstallCLI}
                      disabled={cliInstalling}
                    >
                      <Check size={18} />
                      {cliInstalling ? 'Uninstalling...' : 'CLI Installed - Click to Uninstall'}
                    </button>
                  ) : (
                    <button
                      className="cli-button install"
                      onClick={handleInstallCLI}
                      disabled={cliInstalling}
                    >
                      <Terminal size={18} />
                      {cliInstalling ? 'Installing...' : 'Install CLI'}
                    </button>
                  )}
                  {cliStatus.type && (
                    <div className={`cli-status ${cliStatus.type}`}>
                      {cliStatus.type === 'error' && <AlertCircle size={14} />}
                      {cliStatus.type === 'success' && <Check size={14} />}
                      <span>{cliStatus.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* About */}
              <div className="settings-section">
                <h3>About</h3>
                <div className="settings-about">
                  <p>Markview v1.0.0</p>
                  <p className="settings-muted">Beautiful Markdown, at a glance.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Settings