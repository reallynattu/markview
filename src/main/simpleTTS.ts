import { spawn } from 'child_process'

interface TTSOptions {
  voice?: string
  rate?: number
  volume?: number
}

class SimpleTTS {
  private currentProcess: any = null
  private isPaused: boolean = false

  async init() {
    // No initialization needed for macOS say command
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
              return `${match[1]} (${match[2]})`
            }
            return null
          })
          .filter(voice => voice)
        
        // If parsing failed, return default voices
        if (voices.length === 0) {
          resolve(['Samantha (en_US)', 'Alex (en_US)', 'Victoria (en_US)', 'Karen (en_AU)'])
        } else {
          resolve(voices as string[])
        }
      })
      
      process.on('error', () => {
        // Return default voices on error
        resolve(['Samantha (en_US)', 'Alex (en_US)', 'Victoria (en_US)', 'Karen (en_AU)'])
      })
    })
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      // For simplicity, we'll just return a success message
      // The actual speech will be handled by the say command directly
      
      // Build command arguments
      const args = []
      
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
      this.isPaused = false
      
      this.currentProcess.on('error', (error: Error) => {
        this.currentProcess = null
        reject(error)
      })
      
      this.currentProcess.on('close', (code: number | null) => {
        this.currentProcess = null
        if (code === 0 || code === null) {
          resolve('speech-completed')
        } else if (code === 15) {
          // Process was terminated (stopped)
          resolve('speech-stopped')
        } else {
          reject(new Error(`say command exited with code ${code}`))
        }
      })
      
      // Return immediately with a placeholder
      // The actual speech is happening in the background
      setTimeout(() => resolve('speech-started'), 100)
    })
  }

  stop() {
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM')
      this.currentProcess = null
    }
    this.isPaused = false
  }

  pause() {
    if (this.currentProcess && !this.isPaused) {
      this.currentProcess.kill('SIGSTOP')
      this.isPaused = true
    }
  }

  resume() {
    if (this.currentProcess && this.isPaused) {
      this.currentProcess.kill('SIGCONT')
      this.isPaused = false
    }
  }

  async cleanup() {
    // No cleanup needed for direct say command
  }
}

export const simpleTTS = new SimpleTTS()