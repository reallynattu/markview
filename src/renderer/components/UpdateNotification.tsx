import React, { useState, useEffect } from 'react'
import { X, Download, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface UpdateInfo {
  version: string
  releaseNotes?: string
  releaseDate?: string
}

interface DownloadProgress {
  bytesPerSecond: number
  percent: number
  transferred: number
  total: number
}

const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  
  useEffect(() => {
    // Listen for update events
    window.electronAPI.onUpdateAvailable((info) => {
      setUpdateInfo(info)
      setUpdateAvailable(true)
      setDismissed(false)
      setError(null)
    })
    
    window.electronAPI.onDownloadProgress((progress) => {
      setDownloadProgress(progress)
    })
    
    window.electronAPI.onUpdateDownloaded((info) => {
      setUpdateInfo(info)
      setUpdateDownloaded(true)
      setDownloading(false)
    })
    
    window.electronAPI.onUpdateError((errorMessage) => {
      setError(errorMessage)
      setDownloading(false)
    })
  }, [])
  
  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    try {
      await window.electronAPI.downloadUpdate()
    } catch (err: any) {
      setError(err.message || 'Failed to download update')
      setDownloading(false)
    }
  }
  
  const handleInstallAndRestart = () => {
    window.electronAPI.quitAndInstall()
  }
  
  const handleDismiss = () => {
    setDismissed(true)
  }
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const formatSpeed = (bytesPerSecond: number) => {
    return formatBytes(bytesPerSecond) + '/s'
  }
  
  if (dismissed) return null
  if (!updateAvailable && !updateDownloaded) return null
  
  return (
    <AnimatePresence>
      <motion.div
        className="update-notification"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="update-notification-content">
          <div className="update-notification-header">
            <div className="update-notification-title">
              {updateDownloaded ? (
                <>
                  <CheckCircle size={20} className="update-icon success" />
                  <span>Update Ready to Install</span>
                </>
              ) : downloading ? (
                <>
                  <RefreshCw size={20} className="update-icon spinning" />
                  <span>Downloading Update...</span>
                </>
              ) : (
                <>
                  <Download size={20} className="update-icon" />
                  <span>Update Available</span>
                </>
              )}
            </div>
            <button className="update-dismiss" onClick={handleDismiss}>
              <X size={18} />
            </button>
          </div>
          
          {updateInfo && (
            <div className="update-notification-info">
              <p className="update-version">Version {updateInfo.version}</p>
              {updateInfo.releaseNotes && !downloading && (
                <div className="update-release-notes">
                  <p className="release-notes-title">What's New:</p>
                  <div className="release-notes-content">
                    {updateInfo.releaseNotes}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {downloading && downloadProgress && (
            <div className="update-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${downloadProgress.percent}%` }}
                />
              </div>
              <div className="progress-info">
                <span>{downloadProgress.percent.toFixed(0)}%</span>
                <span className="progress-details">
                  {formatBytes(downloadProgress.transferred)} / {formatBytes(downloadProgress.total)}
                  {' • '}
                  {formatSpeed(downloadProgress.bytesPerSecond)}
                </span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="update-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="update-notification-actions">
            {updateDownloaded ? (
              <>
                <button 
                  className="update-button primary"
                  onClick={handleInstallAndRestart}
                >
                  Restart & Install
                </button>
                <button 
                  className="update-button secondary"
                  onClick={handleDismiss}
                >
                  Later
                </button>
              </>
            ) : downloading ? (
              <button 
                className="update-button secondary"
                disabled
              >
                Downloading...
              </button>
            ) : (
              <>
                <button 
                  className="update-button primary"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  Download Update
                </button>
                <button 
                  className="update-button secondary"
                  onClick={handleDismiss}
                >
                  Not Now
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default UpdateNotification