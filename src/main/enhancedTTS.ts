import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs/promises'
import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'

interface TTSOptions {
  voice?: string
  rate?: number
  volume?: number
}

interface VoiceInfo {
  name: string
  displayName: string
  lang: string
  quality: 'enhanced' | 'standard'
}

class EnhancedTTS {
  private currentProcess: any = null
  private tempDir: string
  private voices: VoiceInfo[] = []

  constructor() {
    this.tempDir = path.join(app.getPath('temp'), 'markview-tts')
  }

  async init() {
    try {
      // Create temp directory
      await fs.mkdir(this.tempDir, { recursive: true })
      
      // Get available voices
      await this.loadVoices()
    } catch (error) {
      console.error('Error in TTS init:', error)
      // Continue with default voices even if init fails
      this.voices = [
        { name: 'Samantha', displayName: 'Samantha (en_US)', lang: 'en_US', quality: 'enhanced' },
        { name: 'Alex', displayName: 'Alex (en_US)', lang: 'en_US', quality: 'enhanced' }
      ]
    }
  }

  private async loadVoices(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const process = spawn('say', ['-v', '?'])
        let output = ''
        
        process.stdout.on('data', (data) => {
          output += data.toString()
        })
        
        process.stderr.on('data', (data) => {
          console.error('say command stderr:', data.toString())
        })
        
        process.on('close', () => {
        // Parse the voice list
        const voiceList = output.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const match = line.match(/^([^\s]+)\s+([a-z]{2}_[A-Z]{2})\s+(.*)$/)
            if (match) {
              const name = match[1]
              const lang = match[2]
              const description = match[3]
              
              // Identify enhanced quality voices
              const isEnhanced = description.includes('Premium') || 
                               description.includes('Enhanced') ||
                               description.includes('Neural') ||
                               ['Samantha', 'Alex', 'Nicky', 'Allison', 'Ava', 'Susan', 'Tom', 'Zoe'].includes(name)
              
              return {
                name,
                displayName: `${name} (${lang})`,
                lang,
                quality: isEnhanced ? 'enhanced' : 'standard'
              } as VoiceInfo
            }
            return null
          })
          .filter(voice => voice && voice.lang.startsWith('en_'))
          .sort((a, b) => {
            // Sort enhanced voices first
            if (a!.quality !== b!.quality) {
              return a!.quality === 'enhanced' ? -1 : 1
            }
            return a!.name.localeCompare(b!.name)
          }) as VoiceInfo[]
        
        this.voices = voiceList
        
        // If no voices found, use defaults
        if (this.voices.length === 0) {
          this.voices = [
            { name: 'Samantha', displayName: 'Samantha (en_US)', lang: 'en_US', quality: 'enhanced' },
            { name: 'Alex', displayName: 'Alex (en_US)', lang: 'en_US', quality: 'enhanced' },
            { name: 'Nicky', displayName: 'Nicky (en_US)', lang: 'en_US', quality: 'enhanced' },
            { name: 'Allison', displayName: 'Allison (en_US)', lang: 'en_US', quality: 'enhanced' },
            { name: 'Ava', displayName: 'Ava (en_US)', lang: 'en_US', quality: 'enhanced' },
            { name: 'Susan', displayName: 'Susan (en_US)', lang: 'en_US', quality: 'enhanced' },
            { name: 'Tom', displayName: 'Tom (en_US)', lang: 'en_US', quality: 'enhanced' },
            { name: 'Victoria', displayName: 'Victoria (en_US)', lang: 'en_US', quality: 'standard' },
            { name: 'Karen', displayName: 'Karen (en_AU)', lang: 'en_AU', quality: 'standard' }
          ]
        }
        
        resolve()
      })
      
      process.on('error', (error) => {
        console.error('Error spawning say command:', error)
        // Use default voices on error
        this.voices = [
          { name: 'Samantha', displayName: 'Samantha (en_US)', lang: 'en_US', quality: 'enhanced' },
          { name: 'Alex', displayName: 'Alex (en_US)', lang: 'en_US', quality: 'enhanced' }
        ]
        resolve()
      })
      } catch (error) {
        console.error('Error in loadVoices:', error)
        // Use default voices on error
        this.voices = [
          { name: 'Samantha', displayName: 'Samantha (en_US)', lang: 'en_US', quality: 'enhanced' },
          { name: 'Alex', displayName: 'Alex (en_US)', lang: 'en_US', quality: 'enhanced' }
        ]
        resolve()
      }
    })
  }

  async getAvailableVoices(): Promise<string[]> {
    return this.voices.map(v => `${v.displayName}${v.quality === 'enhanced' ? ' ⭐' : ''}`)
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<string> {
    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new Error('No text provided for synthesis')
      }
      
      const outputFile = path.join(this.tempDir, `${uuidv4()}.aiff`)
      
      return new Promise((resolve, reject) => {
        // Build command arguments
        const args = ['-o', outputFile]
        
        if (options.voice) {
          // Extract voice name from display format
          const voiceName = options.voice.split(' (')[0].replace(' ⭐', '')
          args.push('-v', voiceName)
        } else {
          // Use Samantha as default (most natural sounding enhanced voice)
          args.push('-v', 'Samantha')
        }
        
        if (options.rate) {
          // macOS say command uses words per minute
          // Default is ~175 wpm, so we scale from there
          const wpm = Math.round(175 * options.rate)
          args.push('-r', wpm.toString())
        }
        
        // Add the text (escape quotes)
        const escapedText = text.replace(/"/g, '\\"')
        args.push(escapedText)
        
        console.log('TTS synthesize command:', 'say', args.join(' '))
        
        // Spawn say process
        this.currentProcess = spawn('say', args)
        
        this.currentProcess.on('error', (error: Error) => {
          console.error('Say process error:', error)
          this.currentProcess = null
          reject(error)
        })
        
        this.currentProcess.stderr.on('data', (data: Buffer) => {
          console.error('Say stderr:', data.toString())
        })
        
        this.currentProcess.on('close', (code: number | null) => {
          this.currentProcess = null
          if (code === 0 || code === null) {
            // Verify file was created
            if (require('fs').existsSync(outputFile)) {
              resolve(outputFile)
            } else {
              reject(new Error('Audio file was not created'))
            }
          } else {
            reject(new Error(`say command exited with code ${code}`))
          }
        })
      })
    } catch (error) {
      console.error('Error in synthesize:', error)
      throw error
    }
  }

  stop() {
    if (this.currentProcess) {
      this.currentProcess.kill()
      this.currentProcess = null
    }
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

  getVoiceInfo(): { enhanced: string[]; standard: string[] } {
    const enhanced = this.voices
      .filter(v => v.quality === 'enhanced')
      .map(v => v.displayName)
    
    const standard = this.voices
      .filter(v => v.quality === 'standard')
      .map(v => v.displayName)
    
    return { enhanced, standard }
  }
}

export const enhancedTTS = new EnhancedTTS()