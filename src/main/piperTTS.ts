import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs/promises'
import { existsSync } from 'fs'
import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'

interface PiperOptions {
  voice?: string
  rate?: number
  volume?: number
}

class PiperTTS {
  private piperPath: string
  private modelsPath: string
  private tempDir: string
  private currentProcess: any = null

  constructor() {
    const resourcesPath = process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '../../resources')
      : process.resourcesPath

    this.piperPath = path.join(resourcesPath, 'piper/bin/piper')
    this.modelsPath = path.join(resourcesPath, 'piper/models')
    this.tempDir = path.join(app.getPath('temp'), 'markview-tts')
  }

  async init() {
    // Create temp directory
    await fs.mkdir(this.tempDir, { recursive: true })
    
    // Check if Piper is available
    if (!existsSync(this.piperPath)) {
      throw new Error('Piper TTS not found. Please run: npm run setup-piper')
    }
  }

  async getAvailableVoices(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.modelsPath)
      return files
        .filter(f => f.endsWith('.onnx'))
        .map(f => f.replace('.onnx', ''))
    } catch {
      return []
    }
  }

  async synthesize(text: string, options: PiperOptions = {}): Promise<string> {
    const voice = options.voice || 'en_US-libritts_r-medium'
    const modelPath = path.join(this.modelsPath, `${voice}.onnx`)
    
    if (!existsSync(modelPath)) {
      throw new Error(`Voice model not found: ${voice}`)
    }

    const outputFile = path.join(this.tempDir, `${uuidv4()}.wav`)
    
    return new Promise((resolve, reject) => {
      // Build command arguments
      const args = [
        '--model', modelPath,
        '--output_file', outputFile
      ]

      if (options.rate) {
        // Piper uses length_scale (inverse of rate)
        const lengthScale = 1 / options.rate
        args.push('--length_scale', lengthScale.toString())
      }

      // Spawn Piper process
      this.currentProcess = spawn(this.piperPath, args)
      
      // Send text to stdin
      this.currentProcess.stdin.write(text)
      this.currentProcess.stdin.end()

      // Handle errors
      this.currentProcess.on('error', (error: Error) => {
        reject(error)
      })

      // Handle completion
      this.currentProcess.on('close', (code: number) => {
        if (code === 0) {
          resolve(outputFile)
        } else {
          reject(new Error(`Piper exited with code ${code}`))
        }
        this.currentProcess = null
      })
    })
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

export const piperTTS = new PiperTTS()