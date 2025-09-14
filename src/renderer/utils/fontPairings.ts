export interface FontPairing {
  id: string
  name: string
  headingFont: string
  headingWeight: string
  bodyFont: string
  bodyWeight: string
  description: string
  googleFonts?: string[]
}

export const fontPairings: FontPairing[] = [
  {
    id: 'default',
    name: 'System Default',
    headingFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    headingWeight: '600',
    bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    bodyWeight: '400',
    description: 'Clean system fonts optimized for readability'
  },
  {
    id: 'playfair-source',
    name: 'Playfair Display + Source Sans Pro',
    headingFont: '"Playfair Display", serif',
    headingWeight: '700',
    bodyFont: '"Source Sans Pro", sans-serif',
    bodyWeight: '400',
    description: 'Elegant serif headings with clean sans-serif body',
    googleFonts: [
      'Playfair+Display:wght@700;900',
      'Source+Sans+Pro:wght@400;600'
    ]
  },
  {
    id: 'montserrat-lora',
    name: 'Montserrat + Lora',
    headingFont: '"Montserrat", sans-serif',
    headingWeight: '700',
    bodyFont: '"Lora", serif',
    bodyWeight: '400',
    description: 'Modern sans-serif headings with readable serif body',
    googleFonts: [
      'Montserrat:wght@400;700;900',
      'Lora:wght@400;700'
    ]
  },
  {
    id: 'raleway-merriweather',
    name: 'Raleway + Merriweather',
    headingFont: '"Raleway", sans-serif',
    headingWeight: '600',
    bodyFont: '"Merriweather", serif',
    bodyWeight: '300',
    description: 'Thin elegant headings with classic serif body',
    googleFonts: [
      'Raleway:wght@400;600;800',
      'Merriweather:wght@300;400;700'
    ]
  },
  {
    id: 'oswald-lato',
    name: 'Oswald + Lato',
    headingFont: '"Oswald", sans-serif',
    headingWeight: '500',
    bodyFont: '"Lato", sans-serif',
    bodyWeight: '400',
    description: 'Condensed impact headings with friendly body text',
    googleFonts: [
      'Oswald:wght@400;500;700',
      'Lato:wght@300;400;700'
    ]
  },
  {
    id: 'poppins-inter',
    name: 'Poppins + Inter',
    headingFont: '"Poppins", sans-serif',
    headingWeight: '600',
    bodyFont: '"Inter", sans-serif',
    bodyWeight: '400',
    description: 'Geometric headings with highly legible body text',
    googleFonts: [
      'Poppins:wght@400;600;700',
      'Inter:wght@400;500;600'
    ]
  },
  {
    id: 'bitter-raleway',
    name: 'Bitter + Raleway',
    headingFont: '"Bitter", serif',
    headingWeight: '700',
    bodyFont: '"Raleway", sans-serif',
    bodyWeight: '400',
    description: 'Bold slab serif headings with elegant sans-serif body',
    googleFonts: [
      'Bitter:wght@400;700;800',
      'Raleway:wght@400;500;600'
    ]
  },
  {
    id: 'space-mono-roboto',
    name: 'Space Mono + Roboto',
    headingFont: '"Space Mono", monospace',
    headingWeight: '700',
    bodyFont: '"Roboto", sans-serif',
    bodyWeight: '400',
    description: 'Technical monospace headings with clean body text',
    googleFonts: [
      'Space+Mono:wght@400;700',
      'Roboto:wght@300;400;500;700'
    ]
  },
  {
    id: 'abril-roboto',
    name: 'Abril Fatface + Roboto',
    headingFont: '"Abril Fatface", serif',
    headingWeight: '400',
    bodyFont: '"Roboto", sans-serif',
    bodyWeight: '300',
    description: 'Dramatic display headings with minimal body text',
    googleFonts: [
      'Abril+Fatface',
      'Roboto:wght@300;400;500'
    ]
  },
  {
    id: 'cormorant-fira',
    name: 'Cormorant Garamond + Fira Sans',
    headingFont: '"Cormorant Garamond", serif',
    headingWeight: '600',
    bodyFont: '"Fira Sans", sans-serif',
    bodyWeight: '400',
    description: 'Classic refined headings with modern body text',
    googleFonts: [
      'Cormorant+Garamond:wght@400;600;700',
      'Fira+Sans:wght@400;500;600'
    ]
  }
]

export function getFontPairingById(id: string): FontPairing | undefined {
  return fontPairings.find(pairing => pairing.id === id)
}

export function getGoogleFontsUrl(pairing: FontPairing): string | null {
  if (!pairing.googleFonts || pairing.googleFonts.length === 0) {
    return null
  }
  
  const baseUrl = 'https://fonts.googleapis.com/css2?family='
  const families = pairing.googleFonts.join('&family=')
  return `${baseUrl}${families}&display=swap`
}