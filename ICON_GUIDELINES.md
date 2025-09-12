# App Icon Guidelines for Markdown Viewer

## macOS Icon Requirements

### Required Sizes
You need to create a single 1024x1024px icon, and macOS will generate all other sizes. However, for best results, you should provide these sizes in an `.icns` file:

- **1024x1024** (512x512@2x) - Required for App Store
- **512x512** (256x256@2x) - Retina display
- **256x256** - Large icon
- **128x128** - Standard icon
- **64x64** (32x32@2x) - Retina small
- **32x32** - Small icon
- **16x16** - Tiny icon (menu bar, lists)

### Design Guidelines

1. **Format**: PNG with transparency
2. **Color Space**: sRGB
3. **Bit Depth**: 24-bit color + 8-bit alpha (32-bit total)
4. **Shape**: Design within a rounded rectangle (macOS will apply the mask)
5. **Padding**: Leave about 10% padding around your design
6. **Shadows**: Don't add shadows - macOS adds them automatically

### Icon Design Suggestions for Markdown Viewer

Since this is a Markdown viewer with an iA Writer-inspired aesthetic, consider:

1. **Simple, Clean Design**: 
   - A stylized "M" or "MD" monogram
   - Markdown symbols like `#` or `**` 
   - A document icon with markdown formatting symbols

2. **Color Palette**:
   - Use the app's accent color (#007AFF)
   - White/light background for contrast
   - Consider a gradient from #007AFF to #0051D5

3. **Example Concepts**:
   - A document with visible markdown syntax
   - An "M" formed by markdown elements
   - A clean document icon with a small markdown badge

## Creating the Icon

### Step 1: Design the Icon
1. Create a 1024x1024px canvas in your design tool
2. Use a rounded rectangle (180px corner radius) as a guide
3. Design your icon within this shape
4. Export as PNG with transparency

### Step 2: Generate Icon Sizes

#### Option A: Using iconutil (Built-in macOS)
```bash
# Create iconset directory
mkdir MarkdownViewer.iconset

# Add your PNG files with these exact names:
# icon_16x16.png
# icon_16x16@2x.png (32x32)
# icon_32x32.png
# icon_32x32@2x.png (64x64)
# icon_128x128.png
# icon_128x128@2x.png (256x256)
# icon_256x256.png
# icon_256x256@2x.png (512x512)
# icon_512x512.png
# icon_512x512@2x.png (1024x1024)

# Convert to icns
iconutil -c icns MarkdownViewer.iconset
```

#### Option B: Using Icon Set Creator (Recommended)
1. Download "Icon Set Creator" from Mac App Store (free)
2. Drag your 1024x1024 PNG into the app
3. Export as `.icns` file

#### Option C: Using online tools
- [CloudConvert](https://cloudconvert.com/png-to-icns)
- [iConvert Icons](https://iconverticons.com/online/)

### Step 3: Add to Project
1. Save the `.icns` file as `build/icon.icns`
2. The electron-builder.yml already references this location

## Windows Icon Requirements (if needed later)

### Sizes needed for .ico file:
- 256x256
- 128x128
- 64x64
- 48x48
- 32x32
- 16x16

## Icon Design Tools

### Free Options:
- **Figma** - Great for icon design with export plugins
- **Inkscape** - Open source vector graphics
- **GIMP** - For raster graphics

### Paid Options:
- **Sketch** - Mac-specific, great for app icons
- **Affinity Designer** - One-time purchase
- **Adobe Illustrator** - Industry standard

## Quick Icon Template

Here's a simple SVG template you can use as a starting point:

```svg
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1024" height="1024" rx="180" fill="#ffffff"/>
  
  <!-- Gradient -->
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#007AFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0051D5;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Markdown M -->
  <text x="512" y="650" font-family="SF Mono, Monaco, monospace" font-size="500" font-weight="bold" text-anchor="middle" fill="url(#grad1)">M</text>
  
  <!-- Markdown asterisks -->
  <text x="300" y="400" font-family="SF Mono, Monaco, monospace" font-size="150" text-anchor="middle" fill="#007AFF" opacity="0.6">**</text>
  <text x="724" y="400" font-family="SF Mono, Monaco, monospace" font-size="150" text-anchor="middle" fill="#007AFF" opacity="0.6">**</text>
</svg>
```

Save this as an SVG, open in a design tool, and export as PNG at 1024x1024.

## Final Steps

1. Create your icon design at 1024x1024px
2. Export as PNG with transparency
3. Use one of the methods above to create the .icns file
4. Place it in the `build/` directory as `icon.icns`
5. Build your app - electron-builder will use the icon automatically

The icon will appear in:
- The dock when the app is running
- Finder when viewing the app
- The Applications folder
- Any `.md` files associated with your app