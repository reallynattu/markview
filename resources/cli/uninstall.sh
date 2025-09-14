#!/bin/bash

# Markview CLI Uninstallation Script

echo "Uninstalling Markview CLI..."
echo ""

CLI_TARGET="/usr/local/bin/markview"

# Remove the CLI script
echo "Removing markview command..."
sudo rm -f "$CLI_TARGET"

echo ""
echo "✅ Uninstallation complete!"
echo ""
echo "The markview command has been removed from your system."
echo ""
echo "Press Enter to close this window..."
read -r