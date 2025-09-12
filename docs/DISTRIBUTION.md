# Distribution Guide

## For Developers: Code Signing Setup

### Free Option: Ad-hoc Signing
This removes the "unidentified developer" warning for your friends:

```bash
# Sign the app with ad-hoc signature
codesign --force --deep --sign - "build/mac-arm64/Markdown Viewer.app"

# Then create the DMG
npm run dist:mac
```

### Paid Option: Apple Developer Certificate ($99/year)
1. Join Apple Developer Program
2. Create a Developer ID Application certificate
3. Build with signing:
   ```bash
   # With your certificate installed
   npm run dist:mac
   ```

## For Users: Installing Unsigned Apps

If you receive a "can't be opened" error:

1. **First time only**: Right-click the app and select "Open"
2. Click "Open" in the security dialog
3. The app will launch and be trusted going forward

Alternative:
1. Try to open the app normally
2. Go to System Settings > Privacy & Security
3. Click "Open Anyway" next to the app name

## Distribution Checklist

- [ ] Update version in package.json
- [ ] Build the app: `npm run dist:mac`
- [ ] Test the DMG on a clean Mac
- [ ] Create GitHub release with:
  - [ ] Version tag (e.g., v1.0.0)
  - [ ] Release notes
  - [ ] DMG file attachment
  - [ ] Installation instructions

## Homebrew Cask (Advanced)

For wider distribution, consider creating a Homebrew Cask:

```ruby
cask "markdown-viewer" do
  version "1.0.0"
  sha256 "YOUR_SHA_HERE"

  url "https://github.com/yourusername/markdown-viewer/releases/download/v#{version}/Markdown-Viewer-#{version}-arm64.dmg"
  name "Markdown Viewer"
  desc "Beautiful markdown viewer and editor for macOS"
  homepage "https://github.com/yourusername/markdown-viewer"

  app "Markdown Viewer.app"
end
```