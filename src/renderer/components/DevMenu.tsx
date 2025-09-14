import React, { useState, useEffect } from 'react'
import { Bug, Download, AlertCircle, CheckCircle, Database } from 'lucide-react'
import { fileCache } from '../utils/fileCache'

const DevMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [debugMode, setDebugMode] = useState(() => {
    return localStorage.getItem('debugMode') === 'true'
  })
  
  // Listen for debug mode changes
  useEffect(() => {
    const handleDebugModeChange = (event: CustomEvent) => {
      setDebugMode(event.detail)
    }
    
    window.addEventListener('debugModeChanged', handleDebugModeChange as EventListener)
    return () => {
      window.removeEventListener('debugModeChanged', handleDebugModeChange as EventListener)
    }
  }, [])
  
  useEffect(() => {
    if (isOpen && debugMode) {
      const updateCacheStats = () => {
        setCacheStats(fileCache.getStats())
      }
      updateCacheStats()
      const interval = setInterval(updateCacheStats, 1000)
      return () => clearInterval(interval)
    }
  }, [isOpen, debugMode])
  
  // Only show if debug mode is enabled
  if (!debugMode) return null
  
  const testUpdateAvailable = () => {
    window.electronAPI.testUpdateAvailable?.()
  }
  
  const testDownloadProgress = () => {
    window.electronAPI.testDownloadProgress?.()
  }
  
  const testUpdateError = () => {
    window.electronAPI.testUpdateError?.()
  }
  
  return (
    <>
      {/* Floating Dev Button */}
      <button
        className="dev-menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Developer Menu"
      >
        <Bug size={20} />
      </button>
      
      {/* Dev Menu */}
      {isOpen && (
        <div className="dev-menu">
          <h3>Developer Tools</h3>
          
          <div className="dev-menu-section">
            <h4>Test Updates</h4>
            <button 
              className="dev-menu-button"
              onClick={testUpdateAvailable}
            >
              <CheckCircle size={16} />
              Simulate Update Available
            </button>
            
            <button 
              className="dev-menu-button"
              onClick={testDownloadProgress}
            >
              <Download size={16} />
              Simulate Download Progress
            </button>
            
            <button 
              className="dev-menu-button"
              onClick={testUpdateError}
            >
              <AlertCircle size={16} />
              Simulate Update Error
            </button>
          </div>
          
          <div className="dev-menu-section">
            <h4><Database size={16} /> File Cache</h4>
            {cacheStats && (
              <div className="dev-menu-stats">
                <p>Entries: {cacheStats.entries}</p>
                <p>Size: {(cacheStats.size / 1024 / 1024).toFixed(2)} MB</p>
                <p>Utilization: {cacheStats.utilization.toFixed(1)}%</p>
                <button 
                  className="dev-menu-button"
                  onClick={() => {
                    fileCache.clear()
                    setCacheStats(fileCache.getStats())
                  }}
                >
                  Clear Cache
                </button>
              </div>
            )}
          </div>
          
          <div className="dev-menu-info">
            <p>Version: 1.1.0</p>
            <p>Development Mode</p>
          </div>
        </div>
      )}
    </>
  )
}

export default DevMenu