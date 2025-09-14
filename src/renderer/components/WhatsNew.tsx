import React from 'react'
import { X, Sparkles, FileText, Search, Download, Mic, List } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface WhatsNewProps {
  isOpen: boolean
  onClose: () => void
}

const WhatsNew: React.FC<WhatsNewProps> = ({ isOpen, onClose }) => {
  const features = [
    {
      icon: Search,
      title: 'Smart Document Search & Navigation',
      description: 'Global search across files, fuzzy file finder (Cmd+P), table of contents, breadcrumb navigation, and search & replace in edit mode.',
      new: true
    },
    {
      icon: Download,
      title: 'Enhanced Export Options',
      description: 'Export to PDF with custom styling, HTML with embedded styles, Word/DOCX format, batch export multiple files, and print preview.',
      new: true
    },
    {
      icon: Mic,
      title: 'Natural Text-to-Speech',
      description: 'KittenTTS integration with 8 natural voices, adjustable speed, pause/resume functionality, and keyboard shortcuts.',
      new: false
    },
    {
      icon: FileText,
      title: 'Advanced Markdown Support',
      description: 'Full GitHub Flavored Markdown, syntax highlighting, Mermaid diagrams, KaTeX math expressions, and tables.',
      new: false
    },
    {
      icon: List,
      title: 'Improved UI Organization',
      description: 'Cleaner toolbar layout, settings moved to sidebar, organized view controls, and better keyboard shortcuts.',
      new: true
    }
  ]

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
            className="whats-new-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="whats-new-header">
              <div className="whats-new-title">
                <Sparkles size={24} />
                <h2>What's New in Markview</h2>
              </div>
              <button className="close-button" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="whats-new-content">
              <p className="whats-new-subtitle">
                We've been working hard to make Markview even better. Check out the latest features and improvements!
              </p>

              <div className="features-list">
                {features.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div key={index} className="feature-item">
                      <div className="feature-icon">
                        <Icon size={20} />
                      </div>
                      <div className="feature-details">
                        <h3>
                          {feature.title}
                          {feature.new && <span className="new-badge">NEW</span>}
                        </h3>
                        <p>{feature.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="whats-new-footer">
                <p>
                  Press <kbd>⌘,</kbd> to open Settings or <kbd>⌘⇧E</kbd> to export documents.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default WhatsNew