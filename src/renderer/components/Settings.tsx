import React, { useState, useEffect } from 'react'
import { X, Sun, Moon, Monitor, Type, FileText, FolderOpen, Terminal, Check, AlertCircle, Volume2, Square, RefreshCw, Bug } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTTS } from '../contexts/TTSContext'

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
  const [isTestingVoice, setIsTestingVoice] = useState(false)
  const [checkingForUpdates, setCheckingForUpdates] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<{ type: 'success' | 'error' | 'info' | null; message: string }>({ type: null, message: '' })
  const [debugMode, setDebugMode] = useState(() => {
    return localStorage.getItem('debugMode') === 'true'
  })
  
  const { voices, settings: ttsSettings, updateSettings: updateTTSSettings } = useTTS()

  useEffect(() => {
    if (isOpen) {
      checkCLIStatus()
    }
  }, [isOpen])

  const checkCLIStatus = async () => {
    const result = await window.electronAPI.checkCLIInstalled()
    setCLIInstalled(result.installed)
  }
  
  const handleDebugModeChange = (enabled: boolean) => {
    setDebugMode(enabled)
    localStorage.setItem('debugMode', enabled.toString())
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent('debugModeChanged', { detail: enabled }))
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

  const handleCheckForUpdates = async () => {
    setCheckingForUpdates(true)
    setUpdateStatus({ type: null, message: '' })
    
    try {
      const result = await window.electronAPI.checkForUpdates()
      if (result.success) {
        if (result.result && result.result.updateInfo) {
          setUpdateStatus({ type: 'info', message: 'An update is available and will be downloaded in the background.' })
        } else {
          setUpdateStatus({ type: 'success', message: 'You are running the latest version.' })
        }
      } else {
        setUpdateStatus({ type: 'error', message: result.error || 'Failed to check for updates' })
      }
    } catch (error) {
      setUpdateStatus({ type: 'error', message: 'Failed to check for updates. Please try again later.' })
    }
    
    setCheckingForUpdates(false)
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

              {/* Text to Speech */}
              <div className="settings-section">
                <h3>Text to Speech</h3>
                <div className="tts-settings">
                  {voices.length === 0 ? (
                    <div className="tts-status-message">
                      <AlertCircle size={16} />
                      <span>KittenTTS models not found. Voice features will be unavailable.</span>
                      <p className="settings-muted">The models should be included with the app. Try reinstalling if this persists.</p>
                    </div>
                  ) : (
                  <>
                  <div className="setting-item">
                    <label>Voice</label>
                    <div className="voice-selector">
                      <select 
                        className="setting-select"
                        value={ttsSettings.voice || ''}
                        onChange={(e) => updateTTSSettings({ voice: e.target.value })}
                      >
                        {voices.map(voice => {
                          // Display voice names
                          let displayName = voice
                          
                          if (voice === 'natural') {
                            displayName = 'Natural Voice (Web TTS)'
                          } else if (voice === 'kitten-natural') {
                            displayName = 'KittenTTS Natural Voice'
                          } else if (voice.startsWith('expr-voice-')) {
                            // Format KittenTTS voice names nicely
                            const parts = voice.split('-')
                            const voiceNum = parts[2]
                            const gender = parts[3] === 'm' ? 'Male' : 'Female'
                            displayName = `KittenTTS Voice ${voiceNum} (${gender})`
                          }
                          
                          return (
                            <option key={voice} value={voice}>
                              {displayName}
                            </option>
                          )
                        })}
                      </select>
                      <button 
                        className={`test-voice-button ${isTestingVoice ? 'playing' : ''}`}
                        onClick={async () => {
                          if (isTestingVoice) {
                            // Stop the current test
                            window.electronAPI.piper.stop()
                            setIsTestingVoice(false)
                          } else {
                            // Stop any existing playback first
                            window.electronAPI.piper.stop()
                            
                            const sampleText = "Hello, this is a test of the text-to-speech voice. The quick brown fox jumps over the lazy dog."
                            try {
                              setIsTestingVoice(true)
                              const result = await window.electronAPI.piper.synthesize(sampleText, {
                                voice: ttsSettings.voice,
                                rate: ttsSettings.rate
                              })
                              // Reset state when playback completes
                              if (result === 'speech-completed') {
                                setIsTestingVoice(false)
                              }
                            } catch (error) {
                              console.error('Failed to test voice:', error)
                              setIsTestingVoice(false)
                            }
                          }
                        }}
                        title={isTestingVoice ? "Stop test" : "Test this voice"}
                      >
                        {isTestingVoice ? <Square size={16} /> : <Volume2 size={16} />}
                        {isTestingVoice ? 'Stop' : 'Test'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="setting-item">
                    <label>Speed</label>
                    <div className="slider-with-value">
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={ttsSettings.rate}
                        onChange={(e) => updateTTSSettings({ rate: parseFloat(e.target.value) })}
                        className="setting-slider"
                      />
                      <span className="slider-value">{ttsSettings.rate}x</span>
                    </div>
                  </div>
                  
                  <div className="setting-item">
                    <label>Pitch</label>
                    <div className="slider-with-value">
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={ttsSettings.pitch}
                        onChange={(e) => updateTTSSettings({ pitch: parseFloat(e.target.value) })}
                        className="setting-slider"
                      />
                      <span className="slider-value">{ttsSettings.pitch}</span>
                    </div>
                  </div>
                  
                  <div className="setting-item">
                    <label>Pause Between Sections</label>
                    <div className="slider-with-value">
                      <input
                        type="range"
                        min="100"
                        max="1000"
                        step="50"
                        value={ttsSettings.pauseDuration || 200}
                        onChange={(e) => updateTTSSettings({ pauseDuration: parseInt(e.target.value) })}
                        className="setting-slider"
                      />
                      <span className="slider-value">{ttsSettings.pauseDuration || 200}ms</span>
                    </div>
                  </div>
                  
                  <div className="tts-keyboard-info">
                    <p><kbd>⌘R</kbd> Read aloud</p>
                    <p><kbd>Space</kbd> Pause/Resume</p>
                    <p><kbd>Esc</kbd> Stop</p>
                  </div>
                  </>
                  )}
                </div>
              </div>

              {/* Developer */}
              <div className="settings-section">
                <h3>Developer</h3>
                <div className="setting-item">
                  <label>Debug Mode</label>
                  <p className="setting-description">
                    Show performance metrics and developer tools
                  </p>
                  <div className="setting-toggle">
                    <button
                      className={`toggle-button ${debugMode ? 'active' : ''}`}
                      onClick={() => handleDebugModeChange(!debugMode)}
                    >
                      <Bug size={18} />
                      {debugMode ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="settings-section">
                <h3>About</h3>
                <div className="settings-about">
                  <p>Markview v1.1.0</p>
                  <p className="settings-muted">Beautiful Markdown, at a glance.</p>
                </div>
              </div>

              {/* Updates */}
              <div className="settings-section">
                <h3>Updates</h3>
                <div className="update-settings">
                  <p className="update-description">
                    Markview automatically checks for updates in the background and notifies you when a new version is available.
                  </p>
                  <button
                    className="update-button-settings"
                    onClick={handleCheckForUpdates}
                    disabled={checkingForUpdates}
                  >
                    <RefreshCw size={18} className={checkingForUpdates ? 'spinning' : ''} />
                    {checkingForUpdates ? 'Checking...' : 'Check for Updates'}
                  </button>
                  {updateStatus.type && (
                    <div className={`update-status ${updateStatus.type}`}>
                      {updateStatus.type === 'error' && <AlertCircle size={14} />}
                      {updateStatus.type === 'success' && <Check size={14} />}
                      {updateStatus.type === 'info' && <RefreshCw size={14} />}
                      <span>{updateStatus.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Credits */}
              <div className="settings-section">
                <h3>Credits</h3>
                <div className="settings-credits">
                  <a href="https://www.electronjs.org/" target="_blank" rel="noopener noreferrer">Electron</a>
                  <span className="credit-separator">•</span>
                  <a href="https://react.dev/" target="_blank" rel="noopener noreferrer">React</a>
                  <span className="credit-separator">•</span>
                  <a href="https://github.com/remarkjs/react-markdown" target="_blank" rel="noopener noreferrer">react-markdown</a>
                  <span className="credit-separator">•</span>
                  <a href="https://github.com/PrismJS/prism" target="_blank" rel="noopener noreferrer">Prism.js</a>
                  <span className="credit-separator">•</span>
                  <a href="https://github.com/remarkjs/remark-gfm" target="_blank" rel="noopener noreferrer">remark-gfm</a>
                  <span className="credit-separator">•</span>
                  <a href="https://github.com/microsoft/onnxruntime" target="_blank" rel="noopener noreferrer">ONNX Runtime</a>
                  <span className="credit-separator">•</span>
                  <a href="https://github.com/KoljaB/KittenTTS" target="_blank" rel="noopener noreferrer">KittenTTS</a>
                  <span className="credit-separator">•</span>
                  <a href="https://github.com/bootphon/phonemizer" target="_blank" rel="noopener noreferrer">Phonemizer</a>
                  <span className="credit-separator">•</span>
                  <a href="https://github.com/framer/motion" target="_blank" rel="noopener noreferrer">Framer Motion</a>
                  <span className="credit-separator">•</span>
                  <a href="https://lucide.dev/" target="_blank" rel="noopener noreferrer">Lucide Icons</a>
                  <span className="credit-separator">•</span>
                  <a href="https://mermaid.js.org/" target="_blank" rel="noopener noreferrer">Mermaid</a>
                  <span className="credit-separator">•</span>
                  <a href="https://katex.org/" target="_blank" rel="noopener noreferrer">KaTeX</a>
                  <span className="credit-separator">•</span>
                  <a href="https://vitejs.dev/" target="_blank" rel="noopener noreferrer">Vite</a>
                  <span className="credit-separator">•</span>
                  <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer">TypeScript</a>
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