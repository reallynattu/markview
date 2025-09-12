#!/bin/bash

# Markview CLI Installation Script

echo "Installing Markview CLI..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CLI_SOURCE="$SCRIPT_DIR/mrkdwn"
CLI_TARGET="/usr/local/bin/mrkdwn"

# Check if CLI script exists
if [ ! -f "$CLI_SOURCE" ]; then
    echo "Error: CLI script not found at $CLI_SOURCE"
    exit 1
fi

# Create /usr/local/bin if it doesn't exist
echo "Creating /usr/local/bin directory if needed..."
sudo mkdir -p /usr/local/bin

# Copy the CLI script
echo "Installing mrkdwn command..."
sudo cp "$CLI_SOURCE" "$CLI_TARGET"

# Make it executable
echo "Making mrkdwn executable..."
sudo chmod +x "$CLI_TARGET"

echo ""
echo "✅ Installation complete!"
echo ""
echo "You can now use 'mrkdwn filename.md' to open markdown files."
echo ""
echo "Press Enter to close this window..."
read -r