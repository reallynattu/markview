# OTA Updates Implementation

This document describes the Over-The-Air (OTA) update system implemented in Markview using electron-updater and GitHub Releases.

## Features

✅ **Automatic Update Checking** - Checks for updates 30 seconds after app start and every 4 hours
✅ **Background Downloads** - Updates download in the background without interrupting the user
✅ **Progress Tracking** - Shows download progress with speed and percentage
✅ **User Notifications** - Non-intrusive notifications when updates are available
✅ **Manual Check** - Users can manually check for updates in Settings
✅ **Safe Installation** - Updates are verified and installed on app restart

## Architecture

### Components

1. **UpdateManager** (`src/main/updater.ts`)
   - Singleton class managing the update lifecycle
   - Configures electron-updater
   - Handles update events
   - Communicates with renderer process

2. **UpdateNotification** (`src/renderer/components/UpdateNotification.tsx`)
   - React component for update notifications
   - Shows update availability, progress, and actions
   - Dismissible with memory

3. **Settings Integration**
   - Manual update check button
   - Shows update status
   - Located in Settings > Updates section

### Update Flow

```
App Start
    ↓ (30s delay)
Check for Updates → No Update Available → Check again in 4 hours
    ↓
Update Available
    ↓
Show Notification → User clicks "Download"
    ↓
Download Update (with progress)
    ↓
Update Downloaded → User clicks "Restart & Install"
    ↓
App Quits and Installs Update
    ↓
App Restarts with New Version
```

## Setup Instructions

### 1. Configure GitHub Repository

1. Update `electron-builder.yml`:
```yaml
publish:
  provider: github
  owner: your-github-username  # Replace with your username
  repo: markdown-viewer        # Replace with your repo name
  releaseType: release
```

2. Create a GitHub personal access token:
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Create a token with `repo` scope
   - Set as environment variable: `export GH_TOKEN=your_token`

### 2. Code Signing (Required for Production)

#### macOS
- Requires Apple Developer ID certificate ($99/year)
- Set up in electron-builder configuration

#### Windows
- Requires code signing certificate (~$200/year)
- Configure in electron-builder

#### Linux
- Uses GPG signatures (free)
- Set up GPG key for signing

### 3. Publishing Releases

```bash
# Build and publish for all platforms
npm run publish

# Platform-specific publishing
npm run publish:mac
npm run publish:win
npm run publish:linux
```

### 4. Release Process

1. Update version in `package.json`
2. Create a git tag: `git tag v1.1.0`
3. Push tag: `git push origin v1.1.0`
4. Run publish command with GH_TOKEN set
5. electron-builder will create a GitHub release with artifacts

## Testing Updates

### Development Testing

1. Build the app: `npm run dist`
2. Install the built app
3. Create a new release with higher version
4. Run the installed app - it should detect the update

### Manual Testing

1. Open Settings (⌘,)
2. Go to Updates section
3. Click "Check for Updates"
4. Verify update detection/status

## Security Considerations

1. **HTTPS Only** - Updates are only downloaded over HTTPS
2. **Signature Verification** - electron-updater verifies signatures
3. **Code Signing** - Production apps must be code signed
4. **No Auto-Install** - User must approve installation

## Troubleshooting

### Common Issues

1. **"Cannot find module 'electron-updater'"**
   - Run `npm install electron-updater`

2. **Updates not detected**
   - Check GitHub release is published
   - Ensure version in release is higher than installed
   - Check network connectivity

3. **"Error: HttpError: 404"**
   - Repository might be private
   - Check owner/repo in electron-builder.yml

4. **Update downloaded but won't install**
   - Check code signing
   - Verify file permissions

### Debug Mode

Enable debug logging:
```javascript
// In main process
autoUpdater.logger = require('electron-log')
autoUpdater.logger.transports.file.level = 'debug'
```

## Future Enhancements

- [ ] Rollback mechanism for failed updates
- [ ] Beta/nightly release channels
- [ ] Differential updates to reduce size
- [ ] Update analytics
- [ ] Staged rollouts
- [ ] Silent background installation (Windows/Linux)

## API Reference

### Main Process

```typescript
updateManager.checkForUpdates()
updateManager.downloadUpdate()
updateManager.quitAndInstall()
```

### Renderer Process

```typescript
window.electronAPI.checkForUpdates()
window.electronAPI.downloadUpdate()
window.electronAPI.quitAndInstall()
window.electronAPI.onUpdateAvailable(callback)
window.electronAPI.onUpdateDownloaded(callback)
window.electronAPI.onDownloadProgress(callback)
window.electronAPI.onUpdateError(callback)
```