import { app, BrowserWindow, ipcMain, dialog, nativeTheme, shell, crashReporter } from 'electron'
import * as path from 'path'
import * as fs from 'fs/promises'
import { statSync, existsSync, chmodSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import { kittenTTSNode } from './kittenTTSNode'
import { exportToHTML, exportToPDF, exportToDOCX, batchExport, showPrintPreview } from './export'
import { updateManager } from './updater'
import { testUpdater } from './test-updater'

let mainWindow: BrowserWindow | null = null
let fileToOpen: string | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    title: 'Markview',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5555')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.once('ready-to-show', () => {
    if (fileToOpen) {
      mainWindow?.webContents.send('open-file', fileToOpen)
      fileToOpen = null
    }
    
    // Set up auto-updater
    updateManager.setMainWindow(mainWindow!)
    updateManager.scheduleUpdateCheck()
    
    // Set up test updater for development
    if (process.env.NODE_ENV === 'development') {
      testUpdater.setMainWindow(mainWindow!)
    }
  })
}

// Set up crash reporter
crashReporter.start({
  submitURL: '', // We're not submitting anywhere, just logging
  uploadToServer: false
})

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('=== UNCAUGHT EXCEPTION ===')
  console.error('Error:', error)
  console.error('Stack:', error.stack)
  console.error('========================')
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED REJECTION ===')
  console.error('Promise:', promise)
  console.error('Reason:', reason)
  console.error('========================')
})

// Log when app is about to quit
app.on('before-quit', (event) => {
  console.log('=== APP BEFORE QUIT ===')
  console.log('Event:', event)
})

app.on('will-quit', (event) => {
  console.log('=== APP WILL QUIT ===')
  console.log('Event:', event)
})

// Log renderer crashes
app.on('render-process-gone', (event, webContents, details) => {
  console.error('=== RENDERER PROCESS GONE ===')
  console.error('Details:', details)
  console.error('Reason:', details.reason)
  console.error('Exit code:', details.exitCode)
})

app.whenReady().then(async () => {
  // Initialize KittenTTS
  try {
    await kittenTTSNode.init()
    console.log('KittenTTS initialized')
  } catch (error) {
    console.error('Failed to initialize KittenTTS:', error)
  }
  
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  kittenTTSNode.cleanup()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.filePaths[0]
})

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return result.filePaths[0]
})

ipcMain.handle('read-directory', async (_, dirPath: string) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    const files = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => ({
        name: entry.name,
        path: path.join(dirPath, entry.name)
      }))
    return files
  } catch (error) {
    console.error('Error reading directory:', error)
    return []
  }
})

ipcMain.handle('read-file', async (_, filePath: string) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    console.error('Error reading file:', error)
    return ''
  }
})

ipcMain.handle('write-file', async (_, filePath: string, content: string) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8')
    return { success: true }
  } catch (error) {
    console.error('Error writing file:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('get-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
})

ipcMain.handle('is-directory', async (_, filePath: string) => {
  try {
    const stats = statSync(filePath)
    return stats.isDirectory()
  } catch (error) {
    return false
  }
})

nativeTheme.on('updated', () => {
  mainWindow?.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
})

// Handle file open events from macOS
app.on('will-finish-launching', () => {
  app.on('open-file', (event, filePath) => {
    event.preventDefault()
    if (mainWindow) {
      mainWindow.webContents.send('open-file', filePath)
    } else {
      fileToOpen = filePath
    }
  })
})

// Handle file passed as command line argument
if (process.argv.length > 1 && process.argv[1] !== '.' && !process.argv[1].startsWith('-')) {
  fileToOpen = process.argv[1]
}

const execAsync = promisify(exec)

// CLI Installation handlers
ipcMain.handle('install-cli', async () => {
  try {
    const installScript = process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '../../resources/cli/install.sh')
      : path.join(process.resourcesPath, 'cli/install.sh')
    
    // Check if install script exists
    if (!existsSync(installScript)) {
      return { success: false, error: 'Installation script not found' }
    }
    
    // Make the install script executable
    chmodSync(installScript, 0o755)
    
    // Open Terminal and run the install script
    const command = `osascript -e 'tell app "Terminal" to do script "clear && bash \\"${installScript}\\""'`
    await execAsync(command)
    
    return { success: true }
  } catch (error) {
    console.error('Error installing CLI:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('check-cli-installed', async () => {
  try {
    const { stdout } = await execAsync('which markview')
    return { installed: stdout.trim().length > 0 }
  } catch {
    return { installed: false }
  }
})

ipcMain.handle('uninstall-cli', async () => {
  try {
    const uninstallScript = process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '../../resources/cli/uninstall.sh')
      : path.join(process.resourcesPath, 'cli/uninstall.sh')
    
    // Check if uninstall script exists
    if (!existsSync(uninstallScript)) {
      return { success: false, error: 'Uninstallation script not found' }
    }
    
    // Make the uninstall script executable
    chmodSync(uninstallScript, 0o755)
    
    // Open Terminal and run the uninstall script
    const command = `osascript -e 'tell app "Terminal" to do script "clear && bash \"${uninstallScript}\""'`
    await execAsync(command)
    
    return { success: true }
  } catch (error) {
    console.error('Error uninstalling CLI:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

// Enhanced TTS handlers
ipcMain.handle('piper-get-voices', async () => {
  console.log('IPC: piper-get-voices called')
  try {
    const voices = await kittenTTSNode.getAvailableVoices()
    console.log('IPC: returning voices:', voices.length)
    return voices
  } catch (error) {
    console.error('IPC: Error getting voices:', error)
    throw error
  }
})

ipcMain.handle('piper-synthesize', async (_, text: string, options: any) => {
  console.log('IPC: piper-synthesize called')
  console.log('IPC: Text length:', text?.length)
  console.log('IPC: Options:', options)
  try {
    const result = await kittenTTSNode.synthesize(text, options)
    console.log('IPC: Synthesis result:', result)
    return result
  } catch (error) {
    console.error('IPC: Error in synthesis:', error)
    throw error
  }
})

ipcMain.handle('piper-pause', async () => {
  console.log('IPC: piper-pause called')
  kittenTTSNode.pause()
})

ipcMain.handle('piper-resume', async () => {
  console.log('IPC: piper-resume called')
  const result = await kittenTTSNode.resume()
  console.log('IPC: Resume result:', result)
  return result
})

ipcMain.handle('piper-stop', async () => {
  console.log('IPC: piper-stop called')
  kittenTTSNode.stop()
})

// Export handlers
ipcMain.handle('export-html', async (_, content: string, filePath: string, options: any) => {
  return await exportToHTML(content, filePath, options)
})

ipcMain.handle('export-pdf', async (_, content: string, filePath: string, options: any) => {
  return await exportToPDF(mainWindow!, content, filePath, options)
})

ipcMain.handle('export-docx', async (_, content: string, filePath: string, options: any) => {
  return await exportToDOCX(content, filePath, options)
})

ipcMain.handle('batch-export', async (_, files: string[], format: string, options: any) => {
  return await batchExport(mainWindow!, files, format as 'pdf' | 'html', options)
})

ipcMain.handle('print-preview', async (_, content: string, filePath: string, options: any) => {
  return await showPrintPreview(mainWindow!, content, filePath, options)
})

// Update handlers
ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await updateManager.checkForUpdates()
    return { success: true, result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('download-update', async () => {
  try {
    await updateManager.downloadUpdate()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('quit-and-install', () => {
  updateManager.quitAndInstall()
})

// Test handlers for development
if (process.env.NODE_ENV === 'development') {
  ipcMain.handle('test-update-available', () => {
    testUpdater.simulateUpdateAvailable()
  })
  
  ipcMain.handle('test-download-progress', () => {
    testUpdater.simulateDownloadProgress()
  })
  
  ipcMain.handle('test-update-error', () => {
    testUpdater.simulateUpdateError()
  })
}