#!/usr/bin/env python3
"""
KittenTTS Server for Markview
A simple HTTP server that provides TTS synthesis using KittenTTS
"""

import os
import sys
import json
import tempfile
import traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Force numpy 1.x behavior
os.environ["NPY_PROMOTION_STATE"] = "legacy"

# Suppress warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import warnings
warnings.filterwarnings('ignore')

# Import soundfile first
try:
    import soundfile as sf
except ImportError:
    print("ERROR: soundfile not installed. Please run: pip install soundfile")
    sys.exit(1)

# Import KittenTTS
try:
    from kittentts import KittenTTS
except ImportError:
    print("ERROR: KittenTTS not installed. Please run: pip install kittentts")
    sys.exit(1)

# Global model instance
model = None

class TTSHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "model_loaded": model is not None}).encode())
        
        elif parsed_path.path == '/voices':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            # For now, we'll use a single default voice
            voices = [{"id": "default", "name": "KittenTTS Natural Voice"}]
            self.wfile.write(json.dumps(voices).encode())
        
        else:
            self.send_error(404)
    
    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/synthesize':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                text = data.get('text', '')
                
                if not text:
                    self.send_error(400, "No text provided")
                    return
                
                # Limit text length
                text = text[:2000]  # Limit to 2000 characters
                
                # Generate audio
                print(f"Generating speech for text: {text[:100]}...")
                audio = model.generate(text)
                
                # Save to temporary file
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                    sf.write(tmp_file.name, audio, 24000)
                    audio_path = tmp_file.name
                
                # Send response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "audio_file": audio_path
                }).encode())
                
            except Exception as e:
                print(f"Error in synthesis: {e}")
                traceback.print_exc()
                self.send_error(500, str(e))
        
        else:
            self.send_error(404)
    
    def log_message(self, format, *args):
        """Suppress request logging"""
        pass

def initialize_model():
    """Initialize the KittenTTS model"""
    global model
    print("Initializing KittenTTS model...")
    try:
        model = KittenTTS("KittenML/kitten-tts-nano-0.1")
        print("Model loaded successfully!")
        
        # Test the model
        print("Testing model...")
        test_audio = model.generate("Hello world")
        print(f"Test successful! Generated audio shape: {test_audio.shape}")
        
    except Exception as e:
        print(f"Failed to initialize model: {e}")
        traceback.print_exc()
        sys.exit(1)

def main():
    """Start the TTS server"""
    port = int(os.environ.get('KITTEN_TTS_PORT', '8765'))
    
    # Initialize model
    initialize_model()
    
    # Start server
    server = HTTPServer(('localhost', port), TTSHandler)
    print(f"KittenTTS server running on http://localhost:{port}")
    print("Endpoints:")
    print(f"  GET  http://localhost:{port}/health - Check server status")
    print(f"  GET  http://localhost:{port}/voices - List available voices")
    print(f"  POST http://localhost:{port}/synthesize - Generate speech")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.shutdown()

if __name__ == '__main__':
    main()