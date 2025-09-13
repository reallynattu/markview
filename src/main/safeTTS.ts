import { exec, spawn, ChildProcess } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface TTSOptions {
  voice?: string
  rate?: number
}

class SafeTTS {
  private voices: string[] = ['Samantha', 'Alex', 'Victoria', 'Karen', 'Allison', 'Ava', 'Susan', 'Tom']
  private currentProcess: ChildProcess | null = null
  private isPaused: boolean = false
  private textQueue: string[] = []
  private currentText: string = ''
  private currentOptions: TTSOptions = {}
  private resumeFromPosition: number = 0

  async init() {
    console.log('SafeTTS initialized with default voices')
  }

  async getAvailableVoices(): Promise<string[]> {
    return this.voices
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<string> {
    console.log('=== SafeTTS.synthesize START ===')
    console.log('Input text length:', text?.length)
    console.log('Options:', JSON.stringify(options))
    
    // Store current text and options for pause/resume functionality
    this.currentText = text
    this.currentOptions = options
    this.resumeFromPosition = 0
    this.isPaused = false
    
    return this.speakFromPosition(text, 0, options)
  }

  private async speakFromPosition(text: string, startPosition: number, options: TTSOptions = {}): Promise<string> {
    try {
      // Get text from current position
      const remainingText = text.substring(startPosition)
      
      // More aggressive text sanitization
      console.log('Starting text sanitization...')
      let sanitizedText = remainingText
        .replace(/["""''`]/g, '') // Remove all quotes
        .replace(/[—–]/g, '-') // Replace em/en dashes
        .replace(/\s+/g, ' ') // Replace multiple spaces
        .replace(/[^\w\s.,!?-]/g, '') // Keep only safe characters
        .trim()
        .substring(0, 500) // Shorter text limit
      
      if (!sanitizedText) {
        sanitizedText = 'No text to speak'
      }
      
      console.log('Sanitized text length:', sanitizedText.length)
      console.log('Speaking from position:', startPosition)
      
      const voice = options.voice || 'Samantha'
      const rate = options.rate ? Math.round(175 * options.rate) : 175
      
      console.log('Voice:', voice)
      console.log('Rate:', rate)
      console.log('Sanitized text (first 100 chars):', sanitizedText.substring(0, 100))
      
      // Write text to temp file to avoid shell escaping issues
      console.log('Writing to temp file...')
      const fs = require('fs')
      const path = require('path')
      const os = require('os')
      const tempFile = path.join(os.tmpdir(), 'markview-tts-text.txt')
      
      try {
        fs.writeFileSync(tempFile, sanitizedText)
        console.log('Temp file written successfully:', tempFile)
        console.log('File exists:', fs.existsSync(tempFile))
        console.log('File size:', fs.statSync(tempFile).size)
      } catch (writeError) {
        console.error('Error writing temp file:', writeError)
        throw writeError
      }
      
      // Use spawn instead of exec for better control
      console.log('Spawning say process...')
      this.currentProcess = spawn('say', ['-v', voice, '-r', rate.toString(), '-f', tempFile])
      
      const result = await new Promise<void>((resolve, reject) => {
        this.currentProcess!.on('close', (code, signal) => {
          console.log(`Say process closed with code: ${code}, signal: ${signal}`)
          if (signal === 'SIGTERM' || signal === 'SIGKILL') {
            console.log('Say process was stopped by user')
            if (this.isPaused) {
              // Calculate approximate position when paused
              this.resumeFromPosition = startPosition + Math.floor(sanitizedText.length * 0.3) // Rough estimate
              console.log('Paused at estimated position:', this.resumeFromPosition)
            }
            resolve() // Don't treat user stop as error
          } else if (code === 0) {
            console.log('Say command completed successfully')
            resolve()
          } else {
            reject(new Error(`Say command failed with code: ${code}`))
          }
        })
        
        this.currentProcess!.on('error', (error) => {
          console.error('Say process error:', error)
          reject(error)
        })
      })
      
      this.currentProcess = null
      
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile)
        console.log('Temp file cleaned up')
      } catch (e) {
        console.log('Could not clean up temp file:', e)
      }
      
      console.log('=== SafeTTS.synthesize END SUCCESS ===')
      return 'speech-completed'
    } catch (error) {
      console.error('=== SafeTTS.synthesize ERROR ===')
      console.error('Error type:', (error as Error).constructor.name)
      console.error('Error message:', (error as Error).message)
      console.error('Error stack:', (error as Error).stack)
      throw error
    }
  }

  pause() {
    console.log('=== SafeTTS.pause called ===')
    this.isPaused = true
    if (this.currentProcess) {
      console.log('Pausing by killing current say process...')
      this.currentProcess.kill('SIGTERM')
      this.currentProcess = null
    } else {
      console.log('No current process to pause')
    }
  }

  async resume() {
    console.log('=== SafeTTS.resume called ===')
    if (this.isPaused && this.currentText) {
      console.log('Resuming from position:', this.resumeFromPosition)
      this.isPaused = false
      // Resume from where we paused with the same options
      return this.speakFromPosition(this.currentText, this.resumeFromPosition, this.currentOptions)
    } else {
      console.log('Nothing to resume')
      return 'nothing-to-resume'
    }
  }

  stop() {
    console.log('=== SafeTTS.stop called ===')
    this.isPaused = false
    this.currentText = ''
    this.resumeFromPosition = 0
    
    if (this.currentProcess) {
      console.log('Killing current say process...')
      this.currentProcess.kill('SIGTERM')
      this.currentProcess = null
    } else {
      console.log('No current process to stop')
      // Fallback: try to kill any running say processes
      exec('pkill -f "say"', (err) => {
        if (err) console.log('No say process to kill')
        else console.log('Killed say processes with pkill')
      })
    }
  }

  cleanup() {
    // Nothing to clean up
  }
}

export const safeTTS = new SafeTTS()