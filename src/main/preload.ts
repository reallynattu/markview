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
  installCLI: () => ipcRenderer.invoke('install-cli'),
  checkCLIInstalled: () => ipcRenderer.invoke('check-cli-installed'),
  uninstallCLI: () => ipcRenderer.invoke('uninstall-cli')
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
  installCLI: () => Promise<{ success: boolean; error?: string; binDir?: string }>
  checkCLIInstalled: () => Promise<{ installed: boolean }>
  uninstallCLI: () => Promise<{ success: boolean; error?: string }>
}