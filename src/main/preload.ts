import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  readDirectory: (path: string) => ipcRenderer.invoke('read-directory', path),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
  isDirectory: (path: string) => ipcRenderer.invoke('is-directory', path),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  onThemeChanged: (callback: (theme: string) => void) => {
    ipcRenderer.on('theme-changed', (_, theme) => callback(theme))
  },
  onOpenFile: (callback: (filePath: string) => void) => {
    ipcRenderer.on('open-file', (_, filePath) => callback(filePath))
  },
  onOpenDirectory: (callback: (dirPath: string) => void) => {
    ipcRenderer.on('open-directory', (_, dirPath) => callback(dirPath))
  },
  onAutoStartTTS: (callback: () => void) => {
    ipcRenderer.on('auto-start-tts', () => callback())
  },
  installCLI: () => ipcRenderer.invoke('install-cli'),
  checkCLIInstalled: () => ipcRenderer.invoke('check-cli-installed'),
  uninstallCLI: () => ipcRenderer.invoke('uninstall-cli'),
  // Piper TTS API
  piper: {
    getVoices: () => ipcRenderer.invoke('piper-get-voices'),
    synthesize: (text: string, options: any) => ipcRenderer.invoke('piper-synthesize', text, options),
    pause: () => ipcRenderer.invoke('piper-pause'),
    resume: () => ipcRenderer.invoke('piper-resume'),
    stop: () => ipcRenderer.invoke('piper-stop')
  },
  // Export API
  exportToHTML: (content: string, filePath: string, options: any) => 
    ipcRenderer.invoke('export-html', content, filePath, options),
  exportToPDF: (content: string, filePath: string, options: any) => 
    ipcRenderer.invoke('export-pdf', content, filePath, options),
  exportToDOCX: (content: string, filePath: string, options: any) => 
    ipcRenderer.invoke('export-docx', content, filePath, options),
  batchExport: (files: string[], format: string, options: any) => 
    ipcRenderer.invoke('batch-export', files, format, options),
  showPrintPreview: (content: string, filePath: string, options: any) => 
    ipcRenderer.invoke('print-preview', content, filePath, options),
  // Update API
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_, info) => callback(info))
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_, info) => callback(info))
  },
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('download-progress', (_, progress) => callback(progress))
  },
  onUpdateError: (callback: (error: string) => void) => {
    ipcRenderer.on('update-error', (_, error) => callback(error))
  },
  // Test functions (only in development)
  testUpdateAvailable: () => ipcRenderer.invoke('test-update-available'),
  testDownloadProgress: () => ipcRenderer.invoke('test-download-progress'),
  testUpdateError: () => ipcRenderer.invoke('test-update-error')
})

export type ElectronAPI = {
  selectFolder: () => Promise<string>
  selectFile: () => Promise<string>
  readDirectory: (path: string) => Promise<Array<{ name: string; path: string }>>
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>
  isDirectory: (path: string) => Promise<boolean>
  getTheme: () => Promise<'light' | 'dark'>
  onThemeChanged: (callback: (theme: string) => void) => void
  onOpenFile: (callback: (filePath: string) => void) => void
  onAutoStartTTS: (callback: () => void) => void
  installCLI: () => Promise<{ success: boolean; error?: string; binDir?: string }>
  checkCLIInstalled: () => Promise<{ installed: boolean }>
  uninstallCLI: () => Promise<{ success: boolean; error?: string }>
  piper: {
    getVoices: () => Promise<string[]>
    synthesize: (text: string, options: any) => Promise<string>
    pause: () => Promise<void>
    resume: () => Promise<string>
    stop: () => Promise<void>
  }
  exportToHTML: (content: string, filePath: string, options: any) => 
    Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>
  exportToPDF: (content: string, filePath: string, options: any) => 
    Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>
  exportToDOCX: (content: string, filePath: string, options: any) => 
    Promise<{ success: boolean; path?: string; error?: string; canceled?: boolean }>
  batchExport: (files: string[], format: string, options: any) => 
    Promise<{ success: boolean; results?: any[]; exportFolder?: string; error?: string; canceled?: boolean }>
  showPrintPreview: (content: string, filePath: string, options: any) => 
    Promise<{ success: boolean; error?: string }>
  checkForUpdates: () => Promise<{ success: boolean; result?: any; error?: string }>
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>
  quitAndInstall: () => void
  onUpdateAvailable: (callback: (info: any) => void) => void
  onUpdateDownloaded: (callback: (info: any) => void) => void
  onDownloadProgress: (callback: (progress: any) => void) => void
  onUpdateError: (callback: (error: string) => void) => void
  testUpdateAvailable?: () => Promise<void>
  testDownloadProgress?: () => Promise<void>
  testUpdateError?: () => Promise<void>
}