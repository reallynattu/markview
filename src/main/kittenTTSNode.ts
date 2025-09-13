import * as ort from 'onnxruntime-node'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { v4 as uuidv4 } from 'uuid'
import { spawn, ChildProcess } from 'child_process'
const { phonemize } = require('phonemizer')

interface TTSOptions {
  voice?: string
  rate?: number
  pitch?: number
  pauseDuration?: number
}

interface VoiceEmbeddings {
  [key: string]: number[][]
}

interface Tokenizer {
  model: {
    vocab: { [key: string]: number }
  }
}

class KittenTTSNode {
  private session: ort.InferenceSession | null = null
  private modelPath: string
  private tempDir: string
  private currentPlayProcess: ChildProcess | null = null
  private isPaused: boolean = false
  private currentText: string = ''
  private currentOptions: TTSOptions = {}
  private voiceEmbeddings: VoiceEmbeddings = {}
  private tokenizer: Tokenizer | null = null
  private vocab: { [key: string]: number } = {}

  constructor() {
    // In development, models are at the project root
    // In production, they would be in the app resources
    this.modelPath = process.env.NODE_ENV === 'development' 
      ? path.join(__dirname, '../../models/kitten_tts.onnx')
      : path.join(process.resourcesPath, 'models/kitten_tts.onnx')
    this.tempDir = path.join(os.tmpdir(), 'markview-kitten-tts')
    
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  async init(): Promise<void> {
    console.log('Initializing KittenTTS Node...')
    console.log('Model path:', this.modelPath)
    console.log('__dirname:', __dirname)
    try {
      // Check if model exists
      if (!fs.existsSync(this.modelPath)) {
        throw new Error(`Model not found at ${this.modelPath}`)
      }

      // Load voice embeddings
      const voicesPath = path.join(path.dirname(this.modelPath), 'voices.json')
      if (fs.existsSync(voicesPath)) {
        this.voiceEmbeddings = JSON.parse(fs.readFileSync(voicesPath, 'utf-8'))
        console.log('Loaded voice embeddings:', Object.keys(this.voiceEmbeddings))
      }

      // Load tokenizer
      const tokenizerPath = path.join(path.dirname(this.modelPath), 'tokenizer.json')
      if (fs.existsSync(tokenizerPath)) {
        this.tokenizer = JSON.parse(fs.readFileSync(tokenizerPath, 'utf-8'))
        this.vocab = this.tokenizer?.model?.vocab || {}
        console.log('Loaded tokenizer with vocab size:', Object.keys(this.vocab).length)
      }

      // Create inference session
      this.session = await ort.InferenceSession.create(this.modelPath, {
        executionProviders: ['cpu'],
        graphOptimizationLevel: 'all'
      })
      
      console.log('KittenTTS Node initialized successfully')
      console.log('Model inputs:', this.session.inputNames)
      console.log('Model outputs:', this.session.outputNames)
    } catch (error) {
      console.error('Failed to initialize KittenTTS:', error)
      throw error
    }
  }

  async getAvailableVoices(): Promise<string[]> {
    return Object.keys(this.voiceEmbeddings)
  }

  private async textToPhonemes(text: string): Promise<string> {
    try {
      // Use phonemizer to convert text to phonemes
      const phonemes = await phonemize(text, 'en-us')
      return phonemes
    } catch (error) {
      console.warn('Phonemizer failed, using fallback:', error)
      // Fallback: just return the text as-is
      return text
    }
  }

  private async tokenizeText(text: string): Promise<number[]> {
    const phonemes = await this.textToPhonemes(text)
    const tokensWithBoundaries = `$${phonemes}$`
    
    // Convert to token IDs
    const tokens = tokensWithBoundaries.split('').map(char => {
      const tokenId = this.vocab[char]
      if (tokenId === undefined) {
        console.warn(`Unknown character: "${char}", using $ token`)
        return this.vocab['$'] || 0 // Use $ token for unknown chars
      }
      return tokenId
    })
    
    return tokens
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<string> {
    console.log('=== KittenTTS Node.synthesize START ===')
    console.log('Text length:', text?.length)
    console.log('Options:', options)

    if (!this.session) {
      throw new Error('KittenTTS not initialized')
    }

    this.currentText = text
    this.currentOptions = options
    this.isPaused = false

    try {
      // Clean and prepare text, but preserve some structure
      const cleanedText = text
        // Replace multiple newlines with double periods for paragraph breaks
        .replace(/\n\n+/g, '.. ')
        // Replace single newlines with periods
        .replace(/\n/g, '. ')
        // Remove other special characters but keep punctuation
        .replace(/[^\w\s.,!?;:'"()-]/g, ' ')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Keep double periods for longer pauses, but clean up excessive periods
        .replace(/\.{3,}/g, '..')
        .replace(/\.\s*\.\s*\./g, '..')
        .trim()
      
      if (!cleanedText) {
        throw new Error('No speakable text found')
      }

      // First, split by double periods (our paragraph/heading markers)
      const paragraphs = cleanedText.split(/\.\.\s*/)
        .map(p => p.trim())
        .filter(p => p.length > 0)
      
      const MAX_CHUNK_SIZE = 300
      const chunks: string[] = []
      
      // Process each paragraph
      for (const paragraph of paragraphs) {
        if (paragraph.length <= MAX_CHUNK_SIZE) {
          chunks.push(paragraph)
        } else {
          // Split long paragraphs by sentences
          const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph]
          let currentChunk = ''
          
          for (const sentence of sentences) {
            if (sentence.length > MAX_CHUNK_SIZE) {
              // Flush current chunk first
              if (currentChunk) {
                chunks.push(currentChunk.trim())
                currentChunk = ''
              }
              
              // Split very long sentences by words
              const words = sentence.split(/\s+/)
              let wordChunk = ''
              
              for (const word of words) {
                if (wordChunk.length + word.length + 1 <= MAX_CHUNK_SIZE) {
                  wordChunk += (wordChunk ? ' ' : '') + word
                } else {
                  if (wordChunk) chunks.push(wordChunk.trim())
                  wordChunk = word
                }
              }
              if (wordChunk) chunks.push(wordChunk.trim())
            } else if (currentChunk.length + sentence.length <= MAX_CHUNK_SIZE) {
              currentChunk += sentence
            } else {
              if (currentChunk) chunks.push(currentChunk.trim())
              currentChunk = sentence
            }
          }
          if (currentChunk) chunks.push(currentChunk.trim())
        }
      }

      console.log(`Processing ${chunks.length} chunks`)

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        if (this.isPaused || !this.currentText) {
          console.log('Synthesis interrupted')
          break
        }

        const chunk = chunks[i]
        console.log(`Processing chunk ${i + 1}/${chunks.length}, length: ${chunk.length}`)

        // Get voice embedding
        const voice = options.voice || 'expr-voice-2-m'
        let voiceEmbedding = this.voiceEmbeddings[voice]?.[0]
        
        if (!voiceEmbedding) {
          console.warn(`Voice ${voice} not found, using default`)
          const defaultVoice = Object.keys(this.voiceEmbeddings)[0]
          voiceEmbedding = this.voiceEmbeddings[defaultVoice]?.[0]
        }

        // Tokenize text
        const tokenIds = await this.tokenizeText(chunk)
        console.log('Token IDs length:', tokenIds.length)
        
        // Skip if token length is too long (seems to fail around 500+ tokens)
        if (tokenIds.length > 450) {
          console.warn(`Skipping chunk ${i + 1} - too many tokens: ${tokenIds.length}`)
          continue
        }
        
        // Prepare inputs
        const inputIds = new ort.Tensor('int64', 
          new BigInt64Array(tokenIds.map(id => BigInt(id))), 
          [1, tokenIds.length]
        )
        
        const style = new ort.Tensor('float32', 
          new Float32Array(voiceEmbedding), 
          [1, voiceEmbedding.length]
        )
        
        const speed = new ort.Tensor('float32', 
          new Float32Array([options.rate || 1.0]), 
          [1]
        )
        
        // Run inference
        const feeds: { [key: string]: ort.Tensor } = {
          'input_ids': inputIds,
          'style': style,
          'speed': speed
        }
        
        console.log('Running inference...')
        const results = await this.session.run(feeds)
        
        // Extract audio data
        const waveform = results.waveform
        const audioData = waveform.data as Float32Array
        console.log('Generated audio length:', audioData.length)
        
        // Normalize audio
        let maxAmplitude = 0
        for (let j = 0; j < audioData.length; j++) {
          maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[j]))
        }
        
        if (maxAmplitude > 0 && maxAmplitude < 0.5) {
          const normalizationFactor = 0.5 / maxAmplitude
          for (let j = 0; j < audioData.length; j++) {
            audioData[j] *= normalizationFactor
          }
        }
        
        // Encode as WAV with 24kHz sample rate (KittenTTS output rate)
        const wavBuffer = this.encodeWAV(audioData, 24000)
        
        // Save to temp file
        const audioFile = path.join(this.tempDir, `${uuidv4()}.wav`)
        fs.writeFileSync(audioFile, wavBuffer)
        
        console.log('Audio file generated:', audioFile, 'Size:', wavBuffer.length)
        
        // Play the audio
        await this.playAudio(audioFile)
        
        // Clean up
        try {
          fs.unlinkSync(audioFile)
        } catch (e) {}
        
        // Add a natural pause between chunks (except for the last one)
        if (i < chunks.length - 1 && !this.isPaused && this.currentText) {
          // Natural pause between paragraphs/sections (default 200ms)
          const pauseDuration = options.pauseDuration || 200
          await new Promise(resolve => setTimeout(resolve, pauseDuration))
        }
      }
      
      return 'speech-completed'
    } catch (error) {
      console.error('=== KittenTTS Node.synthesize ERROR ===')
      console.error('Error:', error)
      throw error
    }
  }

  private encodeWAV(samples: Float32Array, sampleRate: number = 24000): Buffer {
    const length = samples.length
    const arrayBuffer = new ArrayBuffer(44 + length * 2)
    const view = new DataView(arrayBuffer)
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * 2, true)
    
    // Convert float samples to 16-bit PCM
    let offset = 44
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]))
      view.setInt16(offset, sample * 0x7FFF, true)
      offset += 2
    }
    
    return Buffer.from(arrayBuffer)
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
            // Keep track for resume
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
    console.log('=== KittenTTS Node.pause called ===')
    this.isPaused = true
    
    if (this.currentPlayProcess) {
      console.log('Pausing audio playback...')
      this.currentPlayProcess.kill('SIGTERM')
    }
  }

  async resume() {
    console.log('=== KittenTTS Node.resume called ===')
    
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
    console.log('=== KittenTTS Node.stop called ===')
    this.isPaused = false
    this.currentText = ''
    
    if (this.currentPlayProcess) {
      console.log('Stopping audio playback...')
      this.currentPlayProcess.kill()
      this.currentPlayProcess = null
    }
  }

  cleanup() {
    this.stop()
    if (this.session) {
      this.session.release()
      this.session = null
    }
  }
}

export const kittenTTSNode = new KittenTTSNode()