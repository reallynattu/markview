declare module 'sherpa-onnx-node' {
  export interface OfflineTtsConfig {
    model: {
      vits: {
        model: string
        tokens?: string
        dataDir?: string
      }
      debug?: boolean
      numThreads?: number
      provider?: string
    }
    maxNumSentences?: number
  }

  export interface GenerateOptions {
    text: string
    sid?: number
    speed?: number
  }

  export interface AudioData {
    samples: Float32Array
    sampleRate: number
  }

  export class OfflineTts {
    constructor(config: OfflineTtsConfig)
    generate(options: GenerateOptions): AudioData
  }

  export function writeWave(filename: string, audio: AudioData): void
}