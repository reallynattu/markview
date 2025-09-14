# Testing the Update System

## Quick Test in Development Mode

1. **Start the app in development mode:**
   ```bash
   npm run dev
   ```

2. **Look for the Developer Menu:**
   - You'll see a blue bug icon (🐛) in the bottom-left corner
   - Click it to open the Developer Menu

3. **Test Update Scenarios:**

   ### Test 1: Update Available
   - Click "Simulate Update Available"
   - An update notification will appear in the top-right
   - Shows version 1.2.0 with release notes

   ### Test 2: Download Progress
   - Click "Download Update" in the notification
   - Or click "Simulate Download Progress" in dev menu
   - Watch the progress bar fill up (simulates 50MB download)
   - Shows download speed and percentage

   ### Test 3: Update Ready
   - After download completes, see "Update Ready to Install"
   - "Restart & Install" button appears
   - Click "Later" to dismiss

   ### Test 4: Error Handling
   - Click "Simulate Update Error"
   - See error message with retry option

4. **Manual Update Check:**
   - Open Settings (⌘,)
   - Go to "Updates" section
   - Click "Check for Updates"

## Testing Production Updates

### Step 1: Build Current Version
```bash
# Build version 1.1.0
npm run dist:mac
```

### Step 2: Install the App
- Open `build/Markview-1.1.0.dmg`
- Drag to Applications
- Run the installed app

### Step 3: Create New Release
1. Update version in package.json to 1.2.0
2. Build and publish:
   ```bash
   export GH_TOKEN=your_github_token
   npm run publish:mac
   ```

### Step 4: Test Update Flow
1. Open the installed app (v1.1.0)
2. Wait 30 seconds for auto-check
3. Or go to Settings > Updates > Check for Updates
4. Update notification should appear
5. Download and install

## UI Elements to Test

### Update Notification
- ✓ Appears in top-right corner
- ✓ Shows version number
- ✓ Displays release notes
- ✓ Can be dismissed
- ✓ Shows download progress
- ✓ Has install/later buttons

### Download Progress
- ✓ Progress bar animation
- ✓ Percentage display
- ✓ Download speed (MB/s)
- ✓ File size (transferred/total)

### Settings Integration
- ✓ Manual check button
- ✓ Status messages (success/error/info)
- ✓ Loading state while checking

## Keyboard Testing
- No keyboard shortcuts for updates (intentional)
- All update actions require mouse clicks (safety)

## Error Scenarios
1. **No Internet** - Shows connection error
2. **Server Down** - Shows server error
3. **Download Fails** - Can retry download
4. **Install Fails** - Keeps current version

## Visual States
- **Idle** - No notification
- **Available** - Blue notification
- **Downloading** - Progress bar
- **Downloaded** - Green checkmark
- **Error** - Red error message

## Things to Verify
1. Notification doesn't block work
2. Can dismiss and ignore updates
3. Progress is smooth and accurate
4. Error messages are helpful
5. Settings page works correctly
6. Multiple update checks don't stack
7. Closing during download is safe

## Debugging

Enable update logs:
```javascript
// In main process console
require('electron-updater').autoUpdater.logger = console
```

Check update server:
```bash
curl https://api.github.com/repos/your-username/markdown-viewer/releases/latest
```