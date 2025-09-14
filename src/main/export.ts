import { BrowserWindow, dialog, app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { marked } from 'marked'

export type ExportFormat = 'pdf' | 'html' | 'docx' | 'batch-pdf' | 'batch-html' | 'print'

export interface ExportOptions {
  includeStyles: boolean
  pageBreaks: boolean
  tableOfContents: boolean
  pageNumbers: boolean
  customCSS?: string
  selectedFiles?: string[]
}

// Initialize marked with options
marked.setOptions({
  gfm: true,
  breaks: true
})

// Create HTML template
const createHTMLTemplate = (content: string, title: string, options: ExportOptions) => {
  const html = marked(content)
  const styles = options.includeStyles ? `
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.7;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px 20px;
      }
      h1, h2, h3, h4, h5, h6 {
        margin-top: 24px;
        margin-bottom: 16px;
        font-weight: 600;
        line-height: 1.25;
      }
      h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
      h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
      h3 { font-size: 1.25em; }
      code {
        background-color: #f6f8fa;
        padding: 0.2em 0.4em;
        margin: 0;
        font-size: 85%;
        border-radius: 3px;
        font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
      }
      pre {
        background-color: #f6f8fa;
        padding: 16px;
        overflow: auto;
        font-size: 85%;
        line-height: 1.45;
        border-radius: 6px;
      }
      pre code {
        background-color: transparent;
        padding: 0;
        margin: 0;
        font-size: 100%;
      }
      blockquote {
        margin: 0;
        padding: 0 1em;
        color: #6a737d;
        border-left: 0.25em solid #dfe2e5;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 16px 0;
      }
      table th, table td {
        padding: 6px 13px;
        border: 1px solid #ddd;
      }
      table tr:nth-child(even) {
        background-color: #f8f8f8;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      a {
        color: #0969da;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      ${options.customCSS || ''}
    </style>
  ` : ''

  const pageBreakStyle = options.pageBreaks ? `
    <style>
      h1 { page-break-before: always; }
      h1:first-child { page-break-before: avoid; }
    </style>
  ` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${styles}
  ${pageBreakStyle}
</head>
<body>
  ${html}
</body>
</html>`
}

// Generate table of contents
const generateTOC = (content: string): string => {
  const lines = content.split('\n')
  const toc: string[] = ['# Table of Contents\n']
  
  lines.forEach(line => {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2]
      const indent = '  '.repeat(level - 1)
      toc.push(`${indent}- ${text}`)
    }
  })
  
  return toc.join('\n') + '\n\n'
}

// Export to HTML
export const exportToHTML = async (
  content: string,
  filePath: string,
  options: ExportOptions
) => {
  try {
    const title = path.basename(filePath, path.extname(filePath))
    const htmlContent = createHTMLTemplate(content, title, options)
    
    const savePath = await dialog.showSaveDialog({
      title: 'Export to HTML',
      defaultPath: `${title}.html`,
      filters: [
        { name: 'HTML Files', extensions: ['html'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (!savePath.canceled && savePath.filePath) {
      await fs.writeFile(savePath.filePath, htmlContent, 'utf-8')
      return { success: true, path: savePath.filePath }
    }
    
    return { success: false, canceled: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Export to PDF using Electron's built-in PDF generation
export const exportToPDF = async (
  window: BrowserWindow,
  content: string,
  filePath: string,
  options: ExportOptions
) => {
  try {
    const title = path.basename(filePath, path.extname(filePath))
    
    // Add TOC if requested
    let finalContent = content
    if (options.tableOfContents) {
      finalContent = generateTOC(content) + content
    }
    
    // Create a hidden window for PDF generation
    const pdfWindow = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    const htmlContent = createHTMLTemplate(finalContent, title, options)
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

    const savePath = await dialog.showSaveDialog({
      title: 'Export to PDF',
      defaultPath: `${title}.pdf`,
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (!savePath.canceled && savePath.filePath) {
      const pdfData = await pdfWindow.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        landscape: false,
        displayHeaderFooter: options.pageNumbers,
        headerTemplate: options.pageNumbers ? '<div style="font-size: 10px; text-align: center; width: 100%;"><span class="title"></span></div>' : '',
        footerTemplate: options.pageNumbers ? '<div style="font-size: 10px; text-align: center; width: 100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>' : '',
        margins: {
          marginType: 'default'
        }
      })

      await fs.writeFile(savePath.filePath, pdfData)
      pdfWindow.close()
      return { success: true, path: savePath.filePath }
    }

    pdfWindow.close()
    return { success: false, canceled: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Export to DOCX (using HTML as intermediate)
export const exportToDOCX = async (
  content: string,
  filePath: string,
  options: ExportOptions
) => {
  try {
    const title = path.basename(filePath, path.extname(filePath))
    
    // Add TOC if requested
    let finalContent = content
    if (options.tableOfContents) {
      finalContent = generateTOC(content) + content
    }

    // Convert markdown to HTML
    const htmlContent = marked(finalContent)
    
    // For DOCX, we'll create a simple HTML that Word can understand
    const docxHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `

    const savePath = await dialog.showSaveDialog({
      title: 'Export to Word',
      defaultPath: `${title}.docx`,
      filters: [
        { name: 'Word Documents', extensions: ['docx'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (!savePath.canceled && savePath.filePath) {
      // For now, we'll save as HTML with .docx extension
      // Word can open HTML files and save them as proper DOCX
      await fs.writeFile(savePath.filePath, docxHTML, 'utf-8')
      return { success: true, path: savePath.filePath }
    }
    
    return { success: false, canceled: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Batch export
export const batchExport = async (
  window: BrowserWindow,
  files: string[],
  format: 'pdf' | 'html',
  options: ExportOptions
) => {
  try {
    const folderPath = await dialog.showOpenDialog({
      title: 'Select Export Folder',
      properties: ['openDirectory', 'createDirectory']
    })

    if (folderPath.canceled || !folderPath.filePaths[0]) {
      return { success: false, canceled: true }
    }

    const exportFolder = folderPath.filePaths[0]
    const results = []

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const fileName = path.basename(filePath, path.extname(filePath))
        
        if (format === 'html') {
          const htmlContent = createHTMLTemplate(content, fileName, options)
          const outputPath = path.join(exportFolder, `${fileName}.html`)
          await fs.writeFile(outputPath, htmlContent, 'utf-8')
          results.push({ file: filePath, success: true, outputPath })
        } else if (format === 'pdf') {
          // Create a hidden window for PDF generation
          const pdfWindow = new BrowserWindow({
            show: false,
            width: 800,
            height: 600,
            webPreferences: {
              nodeIntegration: false,
              contextIsolation: true
            }
          })

          const htmlContent = createHTMLTemplate(content, fileName, options)
          await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

          const pdfData = await pdfWindow.webContents.printToPDF({
            pageSize: 'A4',
            printBackground: true,
            landscape: false,
            margins: {
              marginType: 'default'
            }
          })

          const outputPath = path.join(exportFolder, `${fileName}.pdf`)
          await fs.writeFile(outputPath, pdfData)
          pdfWindow.close()
          
          results.push({ file: filePath, success: true, outputPath })
        }
      } catch (error) {
        results.push({ file: filePath, success: false, error: error instanceof Error ? error.message : String(error) })
      }
    }

    return { success: true, results, exportFolder }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Print preview
export const showPrintPreview = async (
  window: BrowserWindow,
  content: string,
  filePath: string,
  options: ExportOptions
) => {
  try {
    const title = path.basename(filePath, path.extname(filePath))
    const htmlContent = createHTMLTemplate(content, title, {
      ...options,
      includeStyles: true // Always include styles for print
    })

    // Create a hidden window for print preview
    const printWindow = new BrowserWindow({
      show: true,
      width: 800,
      height: 600,
      title: `Print Preview - ${title}`,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)
    
    // Trigger print dialog
    printWindow.webContents.print({
      silent: false,
      printBackground: true,
      deviceName: ''
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}