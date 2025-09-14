import { BrowserWindow } from 'electron'

// Test module to simulate update events
export class TestUpdater {
  private mainWindow: BrowserWindow | null = null
  
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }
  
  // Simulate update available
  simulateUpdateAvailable() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-available', {
        version: '1.2.0',
        releaseNotes: `## What's New in v1.2.0

### New Features
- 🎯 Smart tab management with VS Code shortcuts
- 🔄 Over-the-air updates with GitHub Releases
- 📊 Improved performance for large files

### Bug Fixes
- Fixed dark theme syntax highlighting
- Fixed table of contents scrolling
- Improved modal centering

### Improvements
- Better keyboard navigation
- Smoother animations
- Reduced memory usage`,
        releaseDate: new Date().toISOString()
      })
    }
  }
  
  // Simulate download progress
  simulateDownloadProgress() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return
    
    let progress = 0
    const totalSize = 50 * 1024 * 1024 // 50MB
    const downloadSpeed = 1.5 * 1024 * 1024 // 1.5MB/s
    
    const interval = setInterval(() => {
      progress += 5
      
      const transferred = (totalSize * progress) / 100
      
      this.mainWindow!.webContents.send('download-progress', {
        bytesPerSecond: downloadSpeed + Math.random() * 500000,
        percent: progress,
        transferred: transferred,
        total: totalSize
      })
      
      if (progress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          this.simulateUpdateDownloaded()
        }, 500)
      }
    }, 300)
  }
  
  // Simulate update downloaded
  simulateUpdateDownloaded() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-downloaded', {
        version: '1.2.0',
        releaseNotes: 'Update is ready to install!',
        releaseDate: new Date().toISOString()
      })
    }
  }
  
  // Simulate error
  simulateUpdateError() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-error', 'Network connection failed. Please check your internet connection and try again.')
    }
  }
}

export const testUpdater = new TestUpdater()