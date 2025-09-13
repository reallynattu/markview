import * as path from 'path'
import * as fs from 'fs/promises'
import { existsSync } from 'fs'
import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'

// Dynamic import for ESM module
let sherpaOnnx: any = null

interface TTSOptions {
  voice?: string
  rate?: number
  volume?: number
}

interface VoiceInfo {
  name: string
  displayName: string
  model: string
  gender: string
}

class SherpaTTS {
  private tts: any = null
  private tempDir: string
  private modelsPath: string
  private currentProcess: any = null
  private voices: VoiceInfo[] = []
  private initialized = false

  constructor() {
    const resourcesPath = process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '../../resources')
      : process.resourcesPath

    this.modelsPath = path.join(resourcesPath, 'sherpa-models')
    this.tempDir = path.join(app.getPath('temp'), 'markview-tts')
  }

  async init() {
    try {
      // Create temp directory
      await fs.mkdir(this.tempDir, { recursive: true })
      
      // Dynamically import sherpa-onnx-node
      sherpaOnnx = await import('sherpa-onnx-node')
      
      // Define available voices
      this.voices = [
        {
          name: 'amy',
          displayName: 'Amy (Female)',
          model: 'vits-piper-en_US-amy-low',
          gender: 'female'
        },
        {
          name: 'libritts',
          displayName: 'Ryan (Male)',
          model: 'vits-piper-en_US-libritts_r-medium',
          gender: 'male'
        }
      ]
      
      // Initialize with the first available model
      await this.initializeModel(this.voices[0].model)
      
      this.initialized = true
      console.log('Sherpa TTS initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Sherpa TTS:', error)
      throw error
    }
  }

  private async initializeModel(modelName: string) {
    const modelPath = path.join(this.modelsPath, modelName)
    
    if (!existsSync(modelPath)) {
      throw new Error(`Model not found: ${modelPath}`)
    }
    
    const modelFile = path.join(modelPath, `${modelName}.onnx`)
    const tokensFile = path.join(modelPath, 'tokens.txt')
    const dataDir = path.join(modelPath, 'espeak-ng-data')
    
    // Check if all required files exist
    if (!existsSync(modelFile)) {
      throw new Error(`Model file not found: ${modelFile}`)
    }
    
    const ttsConfig = {
      model: {
        vits: {
          model: modelFile,
          tokens: tokensFile,
          dataDir: existsSync(dataDir) ? dataDir : undefined,
        },
        debug: false,
        numThreads: 1,
        provider: 'cpu',
      },
      maxNumSentences: 1,
    }
    
    if (this.tts) {
      // Clean up previous TTS instance
      this.tts = null
    }
    
    this.tts = new sherpaOnnx.OfflineTts(ttsConfig)
  }

  async getAvailableVoices(): Promise<string[]> {
    return this.voices.map(v => v.displayName)
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<string> {
    if (!this.initialized || !this.tts) {
      throw new Error('Sherpa TTS not initialized')
    }
    
    // Find the voice model
    let selectedVoice = this.voices[0]
    if (options.voice) {
      const voice = this.voices.find(v => v.displayName === options.voice)
      if (voice) {
        selectedVoice = voice
        // Switch model if different
        if (this.tts && selectedVoice.model !== this.voices[0].model) {
          await this.initializeModel(selectedVoice.model)
        }
      }
    }
    
    const outputFile = path.join(this.tempDir, `${uuidv4()}.wav`)
    
    try {
      // Generate audio with Sherpa ONNX
      const audio = this.tts.generate({
        text: text,
        sid: 0, // Speaker ID
        speed: options.rate || 1.0,
      })
      
      // Save to file
      await sherpaOnnx.writeWave(outputFile, {
        samples: audio.samples,
        sampleRate: audio.sampleRate,
      })
      
      return outputFile
    } catch (error) {
      console.error('Failed to synthesize speech:', error)
      throw error
    }
  }

  stop() {
    // Sherpa ONNX generates synchronously, so there's no process to stop
    // This is kept for API compatibility
  }

  async cleanup() {
    // Clean up old temp files
    try {
      const files = await fs.readdir(this.tempDir)
      const now = Date.now()
      const oneHourAgo = now - (60 * 60 * 1000)

      for (const file of files) {
        if (file.endsWith('.wav')) {
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

export const sherpaTTS = new SherpaTTS()