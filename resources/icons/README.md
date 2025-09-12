# Icon Files

Place your icon files in this directory:

## Required Files:

### For macOS:
- `icon.icns` - macOS icon file (contains all sizes)

### For Windows:
- `icon.ico` - Windows icon file (contains multiple sizes)

### For Linux:
- `icon.png` - PNG icon (preferably 512x512 or 1024x1024)

## How to create these files:

1. Start with a 1024x1024 PNG file
2. Use one of these tools:
   - **macOS**: Icon Set Creator (free from App Store)
   - **Online**: https://cloudconvert.com/png-to-icns
   - **Cross-platform**: https://iconverticons.com/online/

## Notes:
- These files are referenced in `electron-builder.yml`
- The build process will use these icons automatically
- Don't put these in the `build/` folder as it gets cleaned