# Changelog

All notable changes to Markview will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-09-14

### Added
- **Typography Customization** - Choose from 10 curated font pairings for headings and body text
- **Google Fonts Integration** - Automatic loading of web fonts with fallbacks
- **Performance Monitoring** - Real-time performance metrics and benchmarking system
- **File Cache System** - Instant file switching with intelligent preloading
- **Virtual Scrolling** - Efficient rendering for large files (>1000 lines)
- **Progressive Rendering** - Faster initial display for medium-sized files
- **Optimistic UI Updates** - Instant feedback with smart rollback on errors
- **Debug Mode** - Toggle performance tools and metrics from settings
- **Smart Tab Bar** - Tabs only show when multiple files are open

### Changed
- Improved UI organization with cleaner interface
- Settings moved to sidebar for easier access
- Removed redundant breadcrumb navigation
- Updated What's New to changelog format

### Fixed
- React hooks error when toggling debug mode
- Screenshots not being tracked in version control
- Tab visibility issues with single file

## [1.0.0] - 2024-09-12

### Added
- **Over-The-Air Updates** - Automatic update checking and installation
- **Global Search** - Search across all markdown files in folder
- **Quick Open** - Fuzzy file finder with VS Code-like experience
- **Table of Contents** - Collapsible document outline navigation
- **Search & Replace** - Find and replace with regex support
- **Export System** - Export to PDF, HTML, and DOCX formats
- **Batch Export** - Export multiple files at once
- **Print Preview** - Preview documents before printing
- **Text-to-Speech** - Natural voices powered by KittenTTS
- **Voice Controls** - Speed adjustment and keyboard shortcuts
- **Tab System** - Multi-document interface
- **What's New Dialog** - Accessible from settings dropdown

### Core Features
- Full GitHub Flavored Markdown support
- Syntax highlighting for code blocks
- Mermaid diagram rendering
- KaTeX math expressions
- Multiple color themes
- Live preview with synchronized scrolling
- Keyboard shortcuts for all major functions
- Drag and drop file support
- Auto-save functionality
- Command line integration

## [0.9.0] - 2024-09-01

### Initial Beta Release
- Basic markdown viewing and editing
- Light and dark themes
- File browser sidebar
- Settings panel
- KittenTTS integration for text-to-speech