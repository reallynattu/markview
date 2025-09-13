import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import fetch from 'node-fetch'

interface KittenTTSOptions {
  voice?: string
  speed?: number
}

interface VoiceInfo {
  id: string
  name: string
}

class KittenTTSClient {
  private serverProcess: ChildProcess | null = null
  private serverPort: number = 8765
  private serverUrl: string
  private isInitialized: boolean = false
  private currentPlayProcess: ChildProcess | null = null
  private isPaused: boolean = false
  private pausedFile: string | null = null
  private currentText: string = ''
  private currentOptions: KittenTTSOptions = {}

  constructor() {
    this.serverUrl = `http://localhost:${this.serverPort}`
  }

  async init(): Promise<void> {
    console.log('Initializing KittenTTS Client...')
    
    // Check if server is already running
    if (await this.checkServerHealth()) {
      console.log('KittenTTS server already running')
      this.isInitialized = true
      return
    }
    
    // Start the Python server
    console.log('Starting KittenTTS server...')
    const serverScript = path.join(__dirname, 'kitten-server.py')
    
    this.serverProcess = spawn('python3', [serverScript], {
      env: { ...process.env, KITTEN_TTS_PORT: this.serverPort.toString() },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    
    this.serverProcess.stdout?.on('data', (data) => {
      console.log(`KittenTTS Server: ${data.toString().trim()}`)
    })
    
    this.serverProcess.stderr?.on('data', (data) => {
      console.error(`KittenTTS Server Error: ${data.toString().trim()}`)
    })
    
    this.serverProcess.on('error', (error) => {
      console.error('Failed to start KittenTTS server:', error)
      throw new Error('Failed to start KittenTTS server')
    })
    
    // Wait for server to be ready
    let retries = 30 // 30 seconds timeout
    while (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (await this.checkServerHealth()) {
        console.log('KittenTTS server ready!')
        this.isInitialized = true
        return
      }
      retries--
    }
    
    throw new Error('KittenTTS server failed to start within timeout')
  }

  private async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/health`)
      const data = await response.json()
      return data.status === 'ok' && data.model_loaded
    } catch (e) {
      return false
    }
  }

  async getAvailableVoices(): Promise<string[]> {
    if (!this.isInitialized) {
      throw new Error('KittenTTS not initialized')
    }
    
    try {
      const response = await fetch(`${this.serverUrl}/voices`)
      const voices: VoiceInfo[] = await response.json()
      return voices.map(v => v.id)
    } catch (error) {
      console.error('Failed to get voices:', error)
      return ['default']
    }
  }

  async getVoicesDetailed(): Promise<VoiceInfo[]> {
    if (!this.isInitialized) {
      throw new Error('KittenTTS not initialized')
    }
    
    try {
      const response = await fetch(`${this.serverUrl}/voices`)
      return await response.json()
    } catch (error) {
      console.error('Failed to get voices:', error)
      return [{ id: 'default', name: 'KittenTTS Natural Voice' }]
    }
  }

  async synthesize(text: string, options: KittenTTSOptions = {}): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('KittenTTS not initialized')
    }

    console.log('=== KittenTTS.synthesize START ===')
    console.log('Text length:', text?.length)
    console.log('Options:', options)

    // Store for pause/resume
    this.currentText = text
    this.currentOptions = options
    this.isPaused = false

    try {
      // Send synthesis request to server
      const response = await fetch(`${this.serverUrl}/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: options.voice || 'default',
          speed: options.speed || 1.0
        })
      })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.audio_file) {
        console.log('Audio file generated:', result.audio_file)
        
        // Play the audio file
        await this.playAudio(result.audio_file)
        
        // Clean up the file
        try {
          fs.unlinkSync(result.audio_file)
        } catch (e) {}
        
        return 'speech-completed'
      } else {
        throw new Error('Failed to generate audio')
      }
      
    } catch (error) {
      console.error('=== KittenTTS.synthesize ERROR ===')
      console.error('Error:', error)
      throw error
    }
  }

  private async playAudio(audioFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Playing audio file:', audioFile)
      
      // Use afplay on macOS to play the audio
      this.currentPlayProcess = spawn('afplay', [audioFile])
      
      this.currentPlayProcess.on('close', (code, signal) => {
        console.log(`Audio playback closed with code: ${code}, signal: ${signal}`)
        
        this.currentPlayProcess = null
        
        if (signal === 'SIGTERM' || signal === 'SIGKILL') {
          if (this.isPaused) {
            this.pausedFile = audioFile // Keep file for resume
          }
          resolve()
        } else if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Audio playback failed with code: ${code}`))
        }
      })
      
      this.currentPlayProcess.on('error', (err) => {
        console.error('Failed to play audio:', err)
        reject(err)
      })
    })
  }

  pause() {
    console.log('=== KittenTTS.pause called ===')
    this.isPaused = true
    
    if (this.currentPlayProcess) {
      console.log('Pausing audio playback...')
      this.currentPlayProcess.kill('SIGTERM')
    }
  }

  async resume() {
    console.log('=== KittenTTS.resume called ===')
    
    if (this.isPaused && this.currentText) {
      this.isPaused = false
      console.log('Re-synthesizing from beginning...')
      
      // Re-synthesize from beginning (simple approach)
      return this.synthesize(this.currentText, this.currentOptions)
    } else {
      console.log('Nothing to resume')
      return 'nothing-to-resume'
    }
  }

  stop() {
    console.log('=== KittenTTS.stop called ===')
    this.isPaused = false
    this.pausedFile = null
    this.currentText = ''
    
    if (this.currentPlayProcess) {
      console.log('Stopping audio playback...')
      this.currentPlayProcess.kill()
      this.currentPlayProcess = null
    }
  }

  cleanup() {
    this.stop()
    
    if (this.serverProcess) {
      console.log('Stopping KittenTTS server...')
      this.serverProcess.kill()
      this.serverProcess = null
    }
  }
}

export const kittenTTSClient = new KittenTTSClient()