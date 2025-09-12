import React, { useEffect, useRef, useState, useCallback } from 'react'
import { $createParagraphNode, $getRoot, $insertNodes, EditorState } from 'lexical'
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
import { LinkNode } from '@lexical/link'
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table'
import { FileText } from 'lucide-react'
import { 
  HEADING_TRANSFORMERS,
  ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from './markdownTransformers'

interface MarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  isEditable: boolean
}

const theme = {
  paragraph: 'editor-paragraph',
  heading: {
    h1: 'editor-h1',
    h2: 'editor-h2',
    h3: 'editor-h3',
    h4: 'editor-h4',
    h5: 'editor-h5',
    h6: 'editor-h6',
  },
  list: {
    ul: 'editor-ul',
    ol: 'editor-ol',
    listitem: 'editor-listitem',
  },
  text: {
    bold: 'editor-bold',
    italic: 'editor-italic',
    code: 'editor-code',
    strikethrough: 'editor-strikethrough',
  },
  quote: 'editor-quote',
  code: 'editor-code-block',
  link: 'editor-link',
  table: 'editor-table',
  tableCell: 'editor-table-cell',
  tableRow: 'editor-table-row',
}

function EditorContent({ content }: { content: string }) {
  const [editor] = useLexicalComposerContext()
  
  useEffect(() => {
    editor.update(() => {
      const root = $getRoot()
      root.clear()
      
      if (content) {
        $convertFromMarkdownString(
          content,
          [...HEADING_TRANSFORMERS, ...ELEMENT_TRANSFORMERS, ...TEXT_FORMAT_TRANSFORMERS, ...TEXT_MATCH_TRANSFORMERS]
        )
      }
    })
  }, [content, editor])

  return null
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ content, onChange, isEditable }) => {
  const [isReady, setIsReady] = useState(false)

  const initialConfig = {
    namespace: 'MarkdownEditor',
    theme,
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      TableNode,
      TableCellNode,
      TableRowNode,
    ],
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    },
    editable: isEditable,
  }

  const handleChange = useCallback((editorState: EditorState) => {
    if (!isEditable) return
    
    editorState.read(() => {
      const markdown = $convertToMarkdownString(
        [...HEADING_TRANSFORMERS, ...ELEMENT_TRANSFORMERS, ...TEXT_FORMAT_TRANSFORMERS, ...TEXT_MATCH_TRANSFORMERS]
      )
      onChange(markdown)
    })
  }, [onChange, isEditable])

  useEffect(() => {
    // Small delay to ensure editor is ready
    setTimeout(() => setIsReady(true), 100)
  }, [])

  if (!content && !isEditable) {
    return (
      <div className="empty-state">
        <FileText size={64} strokeWidth={1} />
        <h2>No File Selected</h2>
        <p>Select a markdown file from the sidebar to preview</p>
      </div>
    )
  }

  return (
    <div className="markdown-container">
      <div className="markdown-container-inner">
        <LexicalComposer initialConfig={initialConfig}>
          <div className={`editor-wrapper ${isEditable ? 'editable' : 'readonly'}`}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="editor-content" />
              }
              placeholder={
                isEditable ? (
                  <div className="editor-placeholder">Start typing...</div>
                ) : null
              }
              ErrorBoundary={({ children, onError }) => (
                <div className="editor-error">
                  {children}
                </div>
              )}
            />
            {isReady && <EditorContent content={content} />}
            {isEditable && (
              <>
                <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
                <HistoryPlugin />
                <MarkdownShortcutPlugin transformers={[
                  ...HEADING_TRANSFORMERS,
                  ...ELEMENT_TRANSFORMERS,
                  ...TEXT_FORMAT_TRANSFORMERS,
                  ...TEXT_MATCH_TRANSFORMERS,
                ]} />
                <ListPlugin />
                <LinkPlugin />
                <TablePlugin />
              </>
            )}
          </div>
        </LexicalComposer>
      </div>
    </div>
  )
}

export default MarkdownEditor