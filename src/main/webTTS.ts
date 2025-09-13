import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { v4 as uuidv4 } from 'uuid'
import fetch from 'node-fetch'

interface TTSOptions {
  voice?: string
  rate?: number
  pitch?: number
}

class WebTTS {
  private tempDir: string
  private currentPlayProcess: ChildProcess | null = null
  private isPaused: boolean = false
  private currentText: string = ''
  private currentOptions: TTSOptions = {}
  private pausedFile: string | null = null

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'markview-web-tts')
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  async init(): Promise<void> {
    console.log('WebTTS initialized')
  }

  async getAvailableVoices(): Promise<string[]> {
    return ['natural']
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<string> {
    console.log('=== WebTTS.synthesize START ===')
    console.log('Text length:', text?.length)
    console.log('Options:', options)

    // Store for pause/resume
    this.currentText = text
    this.currentOptions = options
    this.isPaused = false

    try {
      // Clean the text
      const cleanedText = text
        .replace(/[^\w\s.,!?;:'"()-]/g, ' ') // Remove special characters except basic punctuation
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim()
      
      if (!cleanedText) {
        throw new Error('No speakable text found')
      }

      // Split into smaller chunks
      const textChunks = this.splitText(cleanedText, 150) // Smaller chunks for better reliability
      
      const audioFile = path.join(this.tempDir, `${uuidv4()}.mp3`)
      const audioBuffers: Buffer[] = []

      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i]
        if (!chunk.trim()) continue
        
        console.log(`Processing chunk ${i + 1}/${textChunks.length}: ${chunk.substring(0, 50)}...`)
        
        // Use alternative TTS endpoint
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&ttsspeed=${options.rate || 1.0}&q=${encodeURIComponent(chunk)}`
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'audio/mpeg',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://translate.google.com/'
          }
        })

        if (!response.ok) {
          console.error(`Failed chunk: "${chunk}"`)
          throw new Error(`TTS API error: ${response.status} ${response.statusText}`)
        }

        const buffer = await response.buffer()
        if (buffer.length > 0) {
          audioBuffers.push(buffer)
        }
        
        // Small delay between requests
        if (i < textChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      if (audioBuffers.length === 0) {
        throw new Error('No audio data generated')
      }

      // Combine audio buffers
      const combinedBuffer = Buffer.concat(audioBuffers)
      fs.writeFileSync(audioFile, combinedBuffer)

      console.log('Audio file generated:', audioFile, 'Size:', combinedBuffer.length)
      
      // Play the audio
      await this.playAudio(audioFile)
      
      // Clean up
      try {
        fs.unlinkSync(audioFile)
      } catch (e) {}
      
      return 'speech-completed'
    } catch (error) {
      console.error('=== WebTTS.synthesize ERROR ===')
      console.error('Error:', error)
      throw error
    }
  }

  private splitText(text: string, maxLength: number): string[] {
    const chunks: string[] = []
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    
    let currentChunk = ''
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += sentence
      } else {
        if (currentChunk) chunks.push(currentChunk.trim())
        currentChunk = sentence
      }
    }
    
    if (currentChunk) chunks.push(currentChunk.trim())
    return chunks
  }

  private async playAudio(audioFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Playing audio file:', audioFile)
      
      // Use afplay on macOS
      this.currentPlayProcess = spawn('afplay', [audioFile])
      
      this.currentPlayProcess.on('close', (code, signal) => {
        console.log(`Audio playback closed with code: ${code}, signal: ${signal}`)
        
        this.currentPlayProcess = null
        
        if (signal === 'SIGTERM' || signal === 'SIGKILL') {
          if (this.isPaused) {
            this.pausedFile = audioFile
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
    console.log('=== WebTTS.pause called ===')
    this.isPaused = true
    
    if (this.currentPlayProcess) {
      console.log('Pausing audio playback...')
      this.currentPlayProcess.kill('SIGTERM')
    }
  }

  async resume() {
    console.log('=== WebTTS.resume called ===')
    
    if (this.isPaused && this.currentText) {
      this.isPaused = false
      console.log('Re-synthesizing from beginning...')
      return this.synthesize(this.currentText, this.currentOptions)
    } else {
      console.log('Nothing to resume')
      return 'nothing-to-resume'
    }
  }

  stop() {
    console.log('=== WebTTS.stop called ===')
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
  }
}

export const webTTS = new WebTTS()