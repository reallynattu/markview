# Changelog

All notable changes to Markview will be documented in this file.

## [1.0.0] - 2024-09-12

### 🎉 Initial Release

#### Features
- **Beautiful Reading Experience** - Clean, distraction-free markdown viewing with iA Writer-inspired typography
- **In-Place Editing** - Toggle between view and edit modes with `⌘E`
- **Multiple Themes** - 9 beautiful color themes:
  - Default (Light/Dark)
  - Solarized (Light/Dark)
  - Nord
  - Dracula
  - Rosé Pine (Regular/Dawn)
  - Tokyo Night
  - One Dark
- **Font Size Control** - Adjustable font size from 12px to 24px with smooth slider
- **File Management**:
  - Built-in file browser with collapsible sidebar
  - Drag & drop support for files and folders
  - File association for `.md` and `.markdown` files
  - Recent files memory
- **Markdown Support**:
  - GitHub Flavored Markdown
  - LaTeX math equations (KaTeX)
  - Mermaid diagrams
  - Syntax highlighting for code blocks
  - Tables, task lists, and more
- **CLI Support** - `mrkdwn` command for opening files from terminal
- **Auto-save** with undo/redo functionality
- **Keyboard shortcuts** for all major functions
- **Settings panel** with theme, font, and view preferences

#### Technical
- Built with Electron 38 + React 19 + TypeScript
- Fast Vite-based build system
- Responsive and performant design
- Cross-architecture support (Apple Silicon + Intel)

#### Known Issues
- App requires right-click → "Open" on first launch (unsigned app)
- Mermaid diagrams may take a moment to render on first load

---

For more information, visit [markview.app](https://github.com/reallynattu/markview)