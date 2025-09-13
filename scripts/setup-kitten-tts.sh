#!/bin/bash

echo "🐱 Setting up KittenTTS..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Installing pip..."
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    python3 get-pip.py
    rm get-pip.py
fi

echo "✅ pip3 found"

# Install soundfile dependency
echo "📦 Installing soundfile..."
pip3 install soundfile

# Install KittenTTS
echo "📦 Installing KittenTTS..."
pip3 install https://github.com/KittenML/KittenTTS/releases/download/0.1/kittentts-0.1.0-py3-none-any.whl

# Verify installation
echo "🔍 Verifying installation..."
if python3 -c "import kittentts" 2>/dev/null; then
    echo "✅ KittenTTS installed successfully!"
    
    # Download the model on first run
    echo "📥 Downloading KittenTTS model (this may take a moment)..."
    python3 -c "from kittentts import KittenTTS; m = KittenTTS('KittenML/kitten-tts-nano-0.2'); print('✅ Model downloaded successfully!')"
else
    echo "❌ KittenTTS installation failed. Please check the error messages above."
    exit 1
fi

echo "🎉 KittenTTS setup complete!"
echo "You can now use KittenTTS in Markview for natural-sounding text-to-speech."