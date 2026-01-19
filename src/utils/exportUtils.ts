import { EXPORT_CONFIG } from '../constants'

/**
 * Download a text file
 * @param content - File content
 * @param filename - Name of the file
 * @param mimeType - MIME type of the file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  downloadBlob(blob, filename)
}

/**
 * Download a blob as a file
 * @param blob - The blob to download
 * @param filename - Name of the file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Convert SVG content to PNG blob
 * Uses a more robust encoding method that properly handles Unicode characters
 *
 * @param svgContent - SVG string content
 * @param scale - Scale factor for output resolution (default: 2 for retina)
 * @returns Promise resolving to PNG blob
 */
export async function svgToPng(
  svgContent: string,
  scale: number = EXPORT_CONFIG.PNG_SCALE
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    img.onload = () => {
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert to PNG'))
          }
        },
        EXPORT_CONFIG.MIME_TYPES.PNG
      )
    }

    img.onerror = () => reject(new Error('Failed to load SVG'))

    // Use TextEncoder for proper Unicode handling instead of deprecated unescape
    const svgBlob = new Blob([svgContent], { type: EXPORT_CONFIG.MIME_TYPES.SVG })
    img.src = URL.createObjectURL(svgBlob)
  })
}

/**
 * Format a BPMN element type for display
 * Converts "bpmn:StartEvent" to "Start Event"
 *
 * @param type - BPMN element type string
 * @returns Formatted type string
 */
export function formatElementType(type: string | undefined | null): string {
  if (!type) return ''
  return type
    .replace('bpmn:', '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
}

/**
 * Escape HTML entities in a string
 * Prevents XSS when displaying user-provided content
 *
 * @param str - String to escape
 * @returns Escaped string safe for HTML insertion
 */
export function escapeHtml(str: string | undefined | null): string {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/**
 * Generate a filename for export based on the current filename
 * @param currentFileName - Current file name (may be null)
 * @param extension - New file extension (without dot)
 * @returns Filename with the new extension
 */
export function generateExportFilename(
  currentFileName: string | null,
  extension: string
): string {
  const baseName = currentFileName?.replace(/\.[^.]+$/, '') || 'diagram'
  return `${baseName}.${extension}`
}
