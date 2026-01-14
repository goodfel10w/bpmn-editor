export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  downloadBlob(blob, filename)
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function svgToPng(svgContent, scale = 2) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to convert to PNG'))
        }
      }, 'image/png')
    }

    img.onerror = () => reject(new Error('Failed to load SVG'))
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)))
  })
}

export function formatElementType(type) {
  if (!type) return ''
  return type
    .replace('bpmn:', '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
}

export function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
