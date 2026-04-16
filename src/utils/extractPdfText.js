import * as pdfjsLib from 'pdfjs-dist'

// Point the worker at the bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    // Reconstruct lines using each item's y-position (transform[5]).
    // When the y-position changes, we start a new line.
    const items = content.items.filter(item => item.str.trim().length > 0)
    if (items.length === 0) continue

    // Sort top-to-bottom (highest y first), then left-to-right (lowest x first)
    items.sort((a, b) => {
      const dy = b.transform[5] - a.transform[5]     // descending y
      if (Math.abs(dy) > 2) return dy                 // different row (2px tolerance)
      return a.transform[4] - b.transform[4]          // same row → ascending x
    })

    let currentY = items[0].transform[5]
    let currentLine = ''

    for (const item of items) {
      const y = item.transform[5]
      // If the y-position shifted more than 2px, it's a new line
      if (Math.abs(y - currentY) > 2) {
        fullText += currentLine.trim() + '\n'
        currentLine = ''
        currentY = y
      }
      // Add a space between items on the same line
      currentLine += (currentLine ? ' ' : '') + item.str
    }
    // Flush the last line of the page
    if (currentLine.trim()) fullText += currentLine.trim() + '\n'
  }

  return fullText
}
