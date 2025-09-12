import {
  ElementTransformer,
  TextFormatTransformer,
  TextMatchTransformer,
  Transformer,
} from '@lexical/markdown'
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingTagType,
} from '@lexical/rich-text'
import {
  $createListNode,
  $createListItemNode,
  $isListNode,
  $isListItemNode,
} from '@lexical/list'
import {
  $createCodeNode,
  $isCodeNode,
} from '@lexical/code'
import {
  $createLinkNode,
  $isLinkNode,
} from '@lexical/link'
import { $createTextNode, $isParagraphNode } from 'lexical'

export const HEADING_TRANSFORMERS: Array<ElementTransformer> = [
  {
    dependencies: [],
    export: (node) => {
      if (!$isHeadingNode(node)) {
        return null
      }
      const tag = node.getTag()
      const tagNumber = tag[1]
      return '#'.repeat(Number(tagNumber)) + ' ' + node.getTextContent()
    },
    regExp: /^(#{1,6})\s/,
    replace: (parentNode, _1, match) => {
      const tag = ('h' + match[1].length) as HeadingTagType
      const node = $createHeadingNode(tag)
      return node
    },
    type: 'element',
  },
]

export const QUOTE_TRANSFORMER: ElementTransformer = {
  dependencies: [],
  export: (node) => {
    if (!$isQuoteNode(node)) {
      return null
    }
    return '> ' + node.getTextContent()
  },
  regExp: /^>\s/,
  replace: (parentNode, _1, match) => {
    return $createQuoteNode()
  },
  type: 'element',
}

export const LIST_TRANSFORMERS: Array<ElementTransformer> = [
  {
    dependencies: [],
    export: (node) => {
      if (!$isListItemNode(node)) {
        return null
      }
      const parent = node.getParent()
      if (!$isListNode(parent)) {
        return null
      }
      const listType = parent.getListType()
      return listType === 'bullet' ? '- ' : '1. '
    },
    regExp: /^(\*|-|\+|1\.)\s/,
    replace: (parentNode, _1, match) => {
      const listType = match[1] === '1.' ? 'number' : 'bullet'
      const listNode = $createListNode(listType)
      const listItemNode = $createListItemNode()
      listNode.append(listItemNode)
      return listNode
    },
    type: 'element',
  },
]

export const CODE_TRANSFORMER: ElementTransformer = {
  dependencies: [],
  export: (node) => {
    if (!$isCodeNode(node)) {
      return null
    }
    return '```\n' + node.getTextContent() + '\n```'
  },
  regExp: /^```$/,
  replace: () => {
    return $createCodeNode()
  },
  type: 'element',
}

export const ELEMENT_TRANSFORMERS: Array<ElementTransformer> = [
  QUOTE_TRANSFORMER,
  ...LIST_TRANSFORMERS,
  CODE_TRANSFORMER,
]

export const BOLD_TRANSFORMER: TextFormatTransformer = {
  format: 'bold',
  tag: '**',
  type: 'text-format',
}

export const ITALIC_TRANSFORMER: TextFormatTransformer = {
  format: 'italic',
  tag: '*',
  type: 'text-format',
}

export const STRIKETHROUGH_TRANSFORMER: TextFormatTransformer = {
  format: 'strikethrough',
  tag: '~~',
  type: 'text-format',
}

export const CODE_FORMAT_TRANSFORMER: TextFormatTransformer = {
  format: 'code',
  tag: '`',
  type: 'text-format',
}

export const TEXT_FORMAT_TRANSFORMERS: Array<TextFormatTransformer> = [
  BOLD_TRANSFORMER,
  ITALIC_TRANSFORMER,
  STRIKETHROUGH_TRANSFORMER,
  CODE_FORMAT_TRANSFORMER,
]

export const LINK_TRANSFORMER: TextMatchTransformer = {
  dependencies: [],
  export: (node) => {
    if (!$isLinkNode(node)) {
      return null
    }
    return `[${node.getTextContent()}](${node.getURL()})`
  },
  importRegExp: /\[(.+?)\]\((.+?)\)/,
  regExp: /\[(.+?)\]\((.+?)\)$/,
  replace: (textNode, match) => {
    const [, text, url] = match
    const linkNode = $createLinkNode(url)
    const textNodeForLink = $createTextNode(text)
    linkNode.append(textNodeForLink)
    textNode.replace(linkNode)
  },
  trigger: ')',
  type: 'text-match',
}

export const TEXT_MATCH_TRANSFORMERS: Array<TextMatchTransformer> = [
  LINK_TRANSFORMER,
]