import { spawn } from 'child_process'
import * as path from 'path'
import { app } from 'electron'

export async function testTTS(): Promise<void> {
  console.log('=== Testing TTS ===')
  
  try {
    // Test 1: Simple say command
    console.log('Test 1: Simple say command')
    const result1 = await new Promise<string>((resolve, reject) => {
      const proc = spawn('say', ['Hello world'])
      proc.on('close', (code) => {
        resolve(`Say command exited with code: ${code}`)
      })
      proc.on('error', (err) => {
        reject(err)
      })
    })
    console.log(result1)
    
    // Test 2: Say command with file output
    console.log('Test 2: Say command with file output')
    const tempFile = path.join(app.getPath('temp'), 'test-tts.aiff')
    const result2 = await new Promise<string>((resolve, reject) => {
      const proc = spawn('say', ['-o', tempFile, 'Testing file output'])
      proc.on('close', (code) => {
        resolve(`Say with file output exited with code: ${code}`)
      })
      proc.on('error', (err) => {
        reject(err)
      })
    })
    console.log(result2)
    
    // Check if file exists
    const fs = require('fs')
    console.log('File exists:', fs.existsSync(tempFile))
    if (fs.existsSync(tempFile)) {
      console.log('File size:', fs.statSync(tempFile).size)
    }
    
  } catch (error) {
    console.error('TTS Test Error:', error)
  }
  
  console.log('=== TTS Test Complete ===')
}

// Export for use in main process
export const runTTSTest = testTTS