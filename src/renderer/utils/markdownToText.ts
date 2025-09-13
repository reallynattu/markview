/**
 * Convert markdown to plain text for speech synthesis
 */
export function markdownToText(markdown: string): string {
  if (!markdown) return ''
  
  let text = markdown
  
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, 'code block')
  text = text.replace(/`[^`]+`/g, (match) => match.slice(1, -1))
  
  // Remove images
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  
  // Convert links to just the text
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  
  // Convert headers to text with pauses
  // Add double periods after headings for longer pauses
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1..\n\n')
  
  // Remove emphasis markers
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2')
  text = text.replace(/(\*|_)(.*?)\1/g, '$2')
  text = text.replace(/~~(.*?)~~/g, '$1')
  
  // Remove blockquote markers
  text = text.replace(/^>\s+/gm, '')
  
  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, '')
  
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '')
  
  // Convert list markers with pauses
  // Add a pause before list items
  text = text.replace(/^[\s]*[-*+]\s+(.+)$/gm, '. $1')
  text = text.replace(/^[\s]*\d+\.\s+(.+)$/gm, '. $1')
  
  // Remove task list markers
  text = text.replace(/^[\s]*- \[[x ]\]\s+/gmi, '')
  
  // Ensure lines without punctuation get periods
  // This helps with lines that look like list items but don't have markers
  text = text.replace(/^([A-Z][^\n.!?]+)$/gm, '$1.')
  
  // Remove extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.trim()
  
  return text
}