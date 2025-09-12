# Installation Guide for Markview

## macOS Installation

### Quick Install (Recommended)

1. **Download the latest release**
   - Go to [Releases](https://github.com/reallynattu/markview/releases)
   - Download `Markview-vX.X.X-macOS-arm64.dmg` (for Apple Silicon Macs)
   - Or `Markview-vX.X.X-macOS-intel.dmg` (for Intel Macs)

2. **Install the app**
   - Open the downloaded `.dmg` file
   - Drag Markview to your Applications folder
   - Eject the disk image

3. **First Launch (Important!)**
   
   Since Markview is not notarized (to keep it free and open source), macOS will show a security warning. This is normal and safe to bypass:
   
   **Method 1: Right-click method**
   - Go to Applications folder
   - Right-click (or Control-click) on Markview
   - Select "Open" from the menu
   - Click "Open" in the dialog that appears
   - This only needs to be done once
   
   **Method 2: System Settings method**
   - Try to open Markview normally
   - When blocked, go to System Settings → Privacy & Security
   - Find the message about Markview being blocked
   - Click "Open Anyway"
   - Enter your password if prompted

### Troubleshooting

**"Markview is damaged and can't be opened"**
This happens sometimes with downloaded apps. Fix it by running:
```bash
xattr -cr /Applications/Markview.app
```

**"The application is from an unidentified developer"**
This is expected. Use the right-click → Open method described above.

**App doesn't open on M1/M2/M3 Macs**
Make sure you downloaded the `arm64` version, not the `intel` version.

## Setting as Default Markdown App

1. Right-click any `.md` file in Finder
2. Select "Get Info"
3. In "Open with:", select Markview
4. Click "Change All..."
5. Confirm the change

Now all `.md` files will open in Markview by default!

## CLI Installation

After installing Markview:

1. Open Markview
2. Press `⌘,` to open Settings
3. Find "Command Line Interface" section
4. Click "Install CLI"
5. Enter your password when Terminal prompts
6. Close and reopen Terminal

Now you can use:
```bash
mrkdwn README.md
mrkdwn /path/to/folder/
```

## Uninstallation

1. Quit Markview
2. Drag Markview from Applications to Trash
3. To remove CLI: Open Terminal and run:
   ```bash
   sudo rm -f /usr/local/bin/mrkdwn
   ```
4. To remove settings:
   ```bash
   rm -rf ~/Library/Application\ Support/Markview
   ```

## Building from Source

If you prefer to build from source:

```bash
# Clone the repository
git clone https://github.com/reallynattu/markview.git
cd markview

# Install dependencies
npm install

# Build for your platform
npm run dist:mac

# The .dmg will be in the build/ folder
```

## Security & Privacy

- Markview is open source and safe to use
- We don't collect any data or telemetry
- The app is not notarized to avoid Apple Developer fees
- All file operations are local only
- No network requests except for checking for updates (optional)

## Support

Having issues? Please [open an issue](https://github.com/reallynattu/markview/issues) on GitHub.