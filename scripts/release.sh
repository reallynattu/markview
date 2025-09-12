#!/bin/bash

# Markview Release Script
# This script builds the app for distribution without code signing

echo "🚀 Building Markview for release..."
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist build

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the app
echo "🔨 Building application..."
npm run build

# Create distributables without signing
echo "📦 Creating distribution packages..."
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run dist:mac

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Distribution files created in ./build/"
echo ""
ls -la build/*.dmg build/*.zip 2>/dev/null

echo ""
echo "📝 To distribute:"
echo "1. Upload the .dmg file to GitHub Releases"
echo "2. Users should right-click and select 'Open' on first launch"
echo "3. This bypasses the macOS security warning for unsigned apps"