import React, { useState } from 'react'
import { X, FileText, FileImage, FileSpreadsheet, Package, Printer, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  currentFileName: string
  content: string
  files?: Array<{ name: string; path: string }>
  onExport: (format: ExportFormat, options: ExportOptions) => void
}

export type ExportFormat = 'pdf' | 'html' | 'docx' | 'batch-pdf' | 'batch-html' | 'print'

export interface ExportOptions {
  includeStyles: boolean
  pageBreaks: boolean
  tableOfContents: boolean
  pageNumbers: boolean
  customCSS?: string
  selectedFiles?: string[]
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  currentFileName,
  content,
  files = [],
  onExport
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
  const [options, setOptions] = useState<ExportOptions>({
    includeStyles: true,
    pageBreaks: true,
    tableOfContents: false,
    pageNumbers: true
  })
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [showBatchOptions, setShowBatchOptions] = useState(false)

  const exportFormats = [
    {
      id: 'pdf' as const,
      name: 'PDF',
      description: 'Export to PDF with custom styling',
      icon: FileText,
      color: '#E74C3C'
    },
    {
      id: 'html' as const,
      name: 'HTML',
      description: 'Standalone HTML with embedded styles',
      icon: FileImage,
      color: '#3498DB'
    },
    {
      id: 'docx' as const,
      name: 'Word',
      description: 'Microsoft Word document',
      icon: FileSpreadsheet,
      color: '#2980B9'
    },
    {
      id: 'batch-pdf' as const,
      name: 'Batch PDF',
      description: 'Export multiple files to PDF',
      icon: Package,
      color: '#8E44AD'
    },
    {
      id: 'batch-html' as const,
      name: 'Batch HTML',
      description: 'Export multiple files to HTML',
      icon: Package,
      color: '#16A085'
    },
    {
      id: 'print' as const,
      name: 'Print',
      description: 'Print preview with custom styling',
      icon: Printer,
      color: '#34495E'
    }
  ]

  const handleExport = () => {
    const exportOptions = {
      ...options,
      selectedFiles: showBatchOptions ? selectedFiles : undefined
    }
    onExport(selectedFormat, exportOptions)
    onClose()
  }

  const handleFormatSelect = (format: ExportFormat) => {
    setSelectedFormat(format)
    setShowBatchOptions(format.startsWith('batch-'))
    if (!format.startsWith('batch-')) {
      setSelectedFiles([])
    }
  }

  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles(prev => 
      prev.includes(filePath)
        ? prev.filter(f => f !== filePath)
        : [...prev, filePath]
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="export-dialog"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="export-header">
              <h2>Export Document</h2>
              <button className="close-button" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="export-content">
              <div className="export-formats">
                <h3>Choose Format</h3>
                <div className="format-grid">
                  {exportFormats.map(format => {
                    const Icon = format.icon
                    return (
                      <button
                        key={format.id}
                        className={`format-option ${selectedFormat === format.id ? 'active' : ''}`}
                        onClick={() => handleFormatSelect(format.id)}
                        style={{
                          '--format-color': format.color
                        } as React.CSSProperties}
                      >
                        <Icon size={24} />
                        <span className="format-name">{format.name}</span>
                        <span className="format-description">{format.description}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="export-options">
                <h3>Export Options</h3>
                
                {!showBatchOptions && (
                  <div className="options-list">
                    <label className="option-item">
                      <input
                        type="checkbox"
                        checked={options.includeStyles}
                        onChange={(e) => setOptions(prev => ({
                          ...prev,
                          includeStyles: e.target.checked
                        }))}
                      />
                      <span>Include document styling</span>
                    </label>

                    {(selectedFormat === 'pdf' || selectedFormat === 'docx') && (
                      <>
                        <label className="option-item">
                          <input
                            type="checkbox"
                            checked={options.pageBreaks}
                            onChange={(e) => setOptions(prev => ({
                              ...prev,
                              pageBreaks: e.target.checked
                            }))}
                          />
                          <span>Add page breaks at headings</span>
                        </label>

                        <label className="option-item">
                          <input
                            type="checkbox"
                            checked={options.tableOfContents}
                            onChange={(e) => setOptions(prev => ({
                              ...prev,
                              tableOfContents: e.target.checked
                            }))}
                          />
                          <span>Generate table of contents</span>
                        </label>

                        <label className="option-item">
                          <input
                            type="checkbox"
                            checked={options.pageNumbers}
                            onChange={(e) => setOptions(prev => ({
                              ...prev,
                              pageNumbers: e.target.checked
                            }))}
                          />
                          <span>Add page numbers</span>
                        </label>
                      </>
                    )}
                  </div>
                )}

                {showBatchOptions && (
                  <div className="batch-options">
                    <p className="batch-info">
                      Select files to export ({selectedFiles.length} selected)
                    </p>
                    <div className="file-selection-list">
                      {files.map(file => (
                        <label key={file.path} className="file-selection-item">
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.path)}
                            onChange={() => toggleFileSelection(file.path)}
                          />
                          <FileText size={16} />
                          <span>{file.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedFormat === 'html' && (
                <div className="custom-css-section">
                  <h3>Custom CSS (Optional)</h3>
                  <textarea
                    className="custom-css-input"
                    placeholder="/* Add custom CSS here */"
                    value={options.customCSS || ''}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      customCSS: e.target.value
                    }))}
                  />
                </div>
              )}
            </div>

            <div className="export-footer">
              <button className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="export-button"
                onClick={handleExport}
                disabled={showBatchOptions && selectedFiles.length === 0}
              >
                <Download size={18} />
                Export
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ExportDialog