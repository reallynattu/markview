import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { v4 as uuidv4 } from 'uuid'

interface KittenTTSOptions {
  voice?: string
  speed?: number
}

interface VoiceInfo {
  id: string
  name: string
  gender: 'male' | 'female'
}

class KittenTTS {
  private pythonProcess: ChildProcess | null = null
  private tempDir: string
  private isInitialized: boolean = false
  private currentAudioFile: string | null = null
  private currentPlayProcess: ChildProcess | null = null
  private isPaused: boolean = false
  private pausedFile: string | null = null

  private voices: VoiceInfo[] = [
    { id: 'default', name: 'KittenTTS Default', gender: 'female' },
  ]

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'markview-kitten-tts')
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  async init(): Promise<void> {
    console.log('Initializing KittenTTS...')
    
    // Check if Python is available
    try {
      const { exec } = require('child_process')
      const { promisify } = require('util')
      const execAsync = promisify(exec)
      
      await execAsync('python3 --version')
      console.log('Python3 is available')
      
      // Check if KittenTTS is installed
      try {
        await execAsync('python3 -c "import kittentts"')
        console.log('KittenTTS is installed')
        this.isInitialized = true
      } catch (e) {
        console.error('KittenTTS not installed. Please install with: pip install kittentts')
        throw new Error('KittenTTS not installed')
      }
    } catch (error) {
      console.error('Python3 not found:', error)
      throw new Error('Python3 is required for KittenTTS')
    }
  }

  async getAvailableVoices(): Promise<string[]> {
    return this.voices.map(v => v.id)
  }

  async getVoicesDetailed(): Promise<VoiceInfo[]> {
    return this.voices
  }

  async synthesize(text: string, options: KittenTTSOptions = {}): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('KittenTTS not initialized')
    }

    console.log('=== KittenTTS.synthesize START ===')
    console.log('Text length:', text?.length)
    console.log('Options:', options)

    const voice = options.voice || 'default'
    const speed = options.speed || 1.0
    const outputFile = path.join(this.tempDir, `${uuidv4()}.wav`)

    // Create Python script to generate speech
    const pythonScript = `
import sys
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow warnings

# Suppress numpy warnings
import warnings
warnings.filterwarnings('ignore', message='.*NumPy.*')

from kittentts import KittenTTS
import soundfile as sf

text = """${text.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"""
output_file = "${outputFile}"

try:
    m = KittenTTS("KittenML/kitten-tts-nano-0.1")
    # Use default voice - don't specify voice parameter
    audio = m.generate(text)
    sf.write(output_file, audio, 24000)
    print(f"SUCCESS:{output_file}")
except Exception as e:
    print(f"ERROR:{str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
`

    const scriptFile = path.join(this.tempDir, `${uuidv4()}.py`)
    fs.writeFileSync(scriptFile, pythonScript)

    return new Promise((resolve, reject) => {
      this.pythonProcess = spawn('python3', [scriptFile])
      
      let output = ''
      let error = ''

      this.pythonProcess.stdout?.on('data', (data) => {
        output += data.toString()
      })

      this.pythonProcess.stderr?.on('data', (data) => {
        error += data.toString()
      })

      this.pythonProcess.on('close', (code) => {
        // Clean up script file
        try {
          fs.unlinkSync(scriptFile)
        } catch (e) {}

        if (code === 0 && output.includes('SUCCESS:')) {
          const audioFile = output.split('SUCCESS:')[1].trim()
          this.currentAudioFile = audioFile
          console.log('=== KittenTTS.synthesize SUCCESS ===')
          console.log('Audio file:', audioFile)
          
          // Play the audio file
          this.playAudio(audioFile)
            .then(() => resolve('speech-completed'))
            .catch(reject)
        } else {
          console.error('=== KittenTTS.synthesize ERROR ===')
          console.error('Error:', error || output)
          reject(new Error(error || output || 'Unknown error'))
        }
      })

      this.pythonProcess.on('error', (err) => {
        console.error('Failed to start Python process:', err)
        reject(err)
      })
    })
  }

  private async playAudio(audioFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Playing audio file:', audioFile)
      
      // Use afplay on macOS to play the audio
      this.currentPlayProcess = spawn('afplay', [audioFile])
      
      this.currentPlayProcess.on('close', (code, signal) => {
        console.log(`Audio playback closed with code: ${code}, signal: ${signal}`)
        
        // Clean up audio file
        try {
          if (audioFile !== this.pausedFile) {
            fs.unlinkSync(audioFile)
          }
        } catch (e) {}
        
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
    
    if (this.isPaused && this.pausedFile && fs.existsSync(this.pausedFile)) {
      this.isPaused = false
      console.log('Resuming audio from:', this.pausedFile)
      
      // For now, replay from start (true pause/resume would require more complex audio handling)
      await this.playAudio(this.pausedFile)
      this.pausedFile = null
    } else {
      console.log('Nothing to resume')
    }
  }

  stop() {
    console.log('=== KittenTTS.stop called ===')
    this.isPaused = false
    this.pausedFile = null
    
    if (this.pythonProcess) {
      console.log('Killing Python process...')
      this.pythonProcess.kill()
      this.pythonProcess = null
    }
    
    if (this.currentPlayProcess) {
      console.log('Stopping audio playback...')
      this.currentPlayProcess.kill()
      this.currentPlayProcess = null
    }
    
    // Clean up any audio files
    if (this.currentAudioFile && fs.existsSync(this.currentAudioFile)) {
      try {
        fs.unlinkSync(this.currentAudioFile)
      } catch (e) {}
      this.currentAudioFile = null
    }
  }

  cleanup() {
    this.stop()
    
    // Clean up temp directory
    try {
      const files = fs.readdirSync(this.tempDir)
      for (const file of files) {
        fs.unlinkSync(path.join(this.tempDir, file))
      }
    } catch (e) {}
  }
}

export const kittenTTS = new KittenTTS()