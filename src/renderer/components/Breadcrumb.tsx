import React, { useMemo } from 'react'
import { ChevronRight, FileText } from 'lucide-react'

interface BreadcrumbProps {
  content: string
  currentLine?: number
  fileName?: string
  onNavigate: (line: number) => void
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  content,
  currentLine,
  fileName,
  onNavigate
}) => {
  // Get heading hierarchy for current position
  const breadcrumbs = useMemo(() => {
    if (!currentLine) return []
    
    const lines = content.split('\n')
    const crumbs: Array<{ text: string; level: number; line: number }> = []
    
    // Find all headings before current line
    for (let i = 0; i < Math.min(currentLine, lines.length); i++) {
      const match = lines[i].match(/^(#{1,6})\s+(.+)$/)
      if (match) {
        const level = match[1].length
        const text = match[2].trim()
        
        // Remove deeper level headings when we find a higher level
        while (crumbs.length > 0 && crumbs[crumbs.length - 1].level >= level) {
          crumbs.pop()
        }
        
        crumbs.push({ text, level, line: i + 1 })
      }
    }
    
    return crumbs
  }, [content, currentLine])

  if (breadcrumbs.length === 0 && !fileName) {
    return null
  }

  return (
    <div className="breadcrumb-container">
      {fileName && (
        <>
          <div className="breadcrumb-item">
            <FileText size={14} />
            <span>{fileName}</span>
          </div>
          {breadcrumbs.length > 0 && <ChevronRight size={14} className="breadcrumb-separator" />}
        </>
      )}
      
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={`${crumb.line}-${index}`}>
          {index > 0 && <ChevronRight size={14} className="breadcrumb-separator" />}
          <div 
            className="breadcrumb-item clickable"
            onClick={() => onNavigate(crumb.line)}
          >
            <span>{crumb.text}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

export default Breadcrumb