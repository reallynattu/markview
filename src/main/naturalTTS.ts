import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs/promises'
import { existsSync } from 'fs'
import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'

interface TTSOptions {
  voice?: string
  rate?: number
  volume?: number
}

class NaturalTTS {
  private currentProcess: any = null
  private tempDir: string

  constructor() {
    this.tempDir = path.join(app.getPath('temp'), 'markview-tts')
  }

  async init() {
    // Create temp directory
    await fs.mkdir(this.tempDir, { recursive: true })
  }

  async getAvailableVoices(): Promise<string[]> {
    return new Promise((resolve) => {
      const process = spawn('say', ['-v', '?'])
      let output = ''
      
      process.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      process.on('close', () => {
        // Parse the voice list
        const voices = output.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const match = line.match(/^([^\s]+)\s+([a-z]{2}_[A-Z]{2})\s+/)
            if (match) {
              return {
                name: match[1],
                lang: match[2],
                displayName: `${match[1]} (${match[2]})`
              }
            }
            return null
          })
          .filter(voice => voice && voice.lang.startsWith('en_'))
          .map(voice => voice!.displayName)
        
        resolve(voices)
      })
      
      process.on('error', () => {
        resolve(['Samantha', 'Alex', 'Victoria', 'Karen'])
      })
    })
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputFile = path.join(this.tempDir, `${uuidv4()}.aiff`)
      
      // Build command arguments
      const args = ['-o', outputFile]
      
      if (options.voice) {
        // Extract voice name from display format
        const voiceName = options.voice.split(' (')[0]
        args.push('-v', voiceName)
      } else {
        // Use Samantha as default (most natural sounding)
        args.push('-v', 'Samantha')
      }
      
      if (options.rate) {
        // macOS say command uses words per minute
        // Default is ~175 wpm, so we scale from there
        const wpm = Math.round(175 * options.rate)
        args.push('-r', wpm.toString())
      }
      
      // Add the text
      args.push(text)
      
      // Spawn say process
      this.currentProcess = spawn('say', args)
      
      this.currentProcess.on('error', (error: Error) => {
        this.currentProcess = null
        reject(error)
      })
      
      this.currentProcess.on('close', (code: number | null) => {
        this.currentProcess = null
        if (code === 0 || code === null) {
          // Check if file was created
          if (existsSync(outputFile)) {
            resolve(outputFile)
          } else {
            reject(new Error('Failed to create audio file'))
          }
        } else {
          reject(new Error(`say command exited with code ${code}`))
        }
      })
    })
  }

  stop() {
    if (this.currentProcess) {
      this.currentProcess.kill()
      this.currentProcess = null
    }
    
    // Also kill any running say processes
    spawn('pkill', ['-f', 'say'])
  }

  async cleanup() {
    // Clean up old temp files
    try {
      const files = await fs.readdir(this.tempDir)
      const now = Date.now()
      const oneHourAgo = now - (60 * 60 * 1000)

      for (const file of files) {
        if (file.endsWith('.aiff')) {
          const filePath = path.join(this.tempDir, file)
          const stats = await fs.stat(filePath)
          if (stats.mtimeMs < oneHourAgo) {
            await fs.unlink(filePath)
          }
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

export const naturalTTS = new NaturalTTS()