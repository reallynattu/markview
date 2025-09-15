#!/bin/bash

# Setup Sherpa ONNX TTS for Markview

MODELS_DIR="resources/sherpa-models"

echo "🎙️ Setting up Sherpa ONNX TTS..."

# Create directories
mkdir -p "$MODELS_DIR"

cd "$MODELS_DIR"

# Download English TTS model (Piper)
echo "📥 Downloading English TTS model..."
MODEL_NAME="vits-piper-en_US-amy-low"
MODEL_URL="https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/${MODEL_NAME}.tar.bz2"

curl -SL -O "$MODEL_URL"
tar xf "${MODEL_NAME}.tar.bz2"
rm "${MODEL_NAME}.tar.bz2"

echo "✅ Model downloaded: $MODEL_NAME"

# Download another voice option
echo "📥 Downloading another English voice..."
MODEL_NAME2="vits-piper-en_US-libritts_r-medium"
MODEL_URL2="https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/${MODEL_NAME2}.tar.bz2"

curl -SL -O "$MODEL_URL2"
tar xf "${MODEL_NAME2}.tar.bz2"
rm "${MODEL_NAME2}.tar.bz2"

echo "✅ Model downloaded: $MODEL_NAME2"

cd ../..

echo ""
echo "✅ Sherpa ONNX setup complete!"
echo ""
echo "Available voices:"
echo "  - Amy (Female, natural)"
echo "  - LibriTTS (Male, natural)"
echo ""
echo "Models location: $MODELS_DIR/"