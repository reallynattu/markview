import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog, app } from 'electron'
import * as path from 'path'

export class UpdateManager {
  private mainWindow: BrowserWindow | null = null
  private updateDownloaded = false
  
  constructor() {
    // Configure auto-updater
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true
    
    // For development, disable auto-updater
    if (process.env.NODE_ENV === 'development') {
      return
    }
    
    this.setupEventHandlers()
  }
  
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }
  
  private setupEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for updates...')
      this.sendToWindow('update-checking')
    })
    
    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info.version)
      this.sendToWindow('update-available', {
        version: info.version,
        releaseNotes: info.releaseNotes,
        releaseDate: info.releaseDate
      })
    })
    
    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available')
      this.sendToWindow('update-not-available')
    })
    
    autoUpdater.on('error', (err) => {
      console.error('Update error:', err)
      this.sendToWindow('update-error', err.message)
    })
    
    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = "Download speed: " + progressObj.bytesPerSecond
      log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
      log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
      console.log(log_message)
      
      this.sendToWindow('download-progress', {
        bytesPerSecond: progressObj.bytesPerSecond,
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total
      })
    })
    
    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded')
      this.updateDownloaded = true
      this.sendToWindow('update-downloaded', {
        version: info.version,
        releaseNotes: info.releaseNotes,
        releaseDate: info.releaseDate
      })
    })
  }
  
  private sendToWindow(channel: string, data?: any) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data)
    }
  }
  
  async checkForUpdates() {
    try {
      const result = await autoUpdater.checkForUpdates()
      return result
    } catch (error) {
      console.error('Failed to check for updates:', error)
      throw error
    }
  }
  
  async downloadUpdate() {
    try {
      await autoUpdater.downloadUpdate()
    } catch (error) {
      console.error('Failed to download update:', error)
      throw error
    }
  }
  
  quitAndInstall() {
    if (this.updateDownloaded) {
      autoUpdater.quitAndInstall(false, true)
    }
  }
  
  // Check for updates on app start (after a delay)
  scheduleUpdateCheck() {
    // Check 30 seconds after app start
    setTimeout(() => {
      this.checkForUpdates().catch(console.error)
    }, 30000)
    
    // Then check every 4 hours
    setInterval(() => {
      this.checkForUpdates().catch(console.error)
    }, 4 * 60 * 60 * 1000)
  }
}

// Export singleton instance
export const updateManager = new UpdateManager()