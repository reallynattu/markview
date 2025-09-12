#!/bin/bash

# Markview CLI Uninstallation Script

echo "Uninstalling Markview CLI..."
echo ""

CLI_TARGET="/usr/local/bin/mrkdwn"

# Remove the CLI script
echo "Removing mrkdwn command..."
sudo rm -f "$CLI_TARGET"

echo ""
echo "✅ Uninstallation complete!"
echo ""
echo "The mrkdwn command has been removed from your system."
echo ""
echo "Press Enter to close this window..."
read -r