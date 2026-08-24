/**
 * Client-side PDF text extraction — Cherry translate page PDF import parity.
 *
 * Runs pdfjs-dist in the browser (no host round-trip). The worker is not
 * wired (fake-worker fallback on the main thread): acceptable for occasional
 * text extraction, and avoids shipping a separate worker asset through the
 * single-file client bundle. DOMMatrix and friends are browser natives, so
 * unlike the Node host, no `canvas` dependency is needed.
 */

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

// The single-file client bundle cannot ship a separate worker asset, so the
// worker is loaded from the CDN matching the installed pdfjs-dist version and
// runs as the main-thread fake worker (pdfjs `import()`s the URL). Requires
// the surface to be online; without it, PDF import reports an honest error.
const PDFJS_VERSION = '6.2.108'
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`

export interface PdfExtractionResult {
  text: string
  pages: number
}

/** Extract up to `limit` characters of plain text from a PDF `ArrayBuffer`. */
export async function extractPdfText(data: ArrayBuffer, limit = 100_000): Promise<PdfExtractionResult> {
  const task = getDocument({ data })
  const doc = await task.promise
  try {
    const numPages = doc.numPages
    const chunks: string[] = []
    let total = 0
    for (let page = 1; page <= numPages; page++) {
      if (total >= limit) break
      const content = await doc.getPage(page)
      const textContent = await content.getTextContent()
      const pageText = textContent.items
        .map(item => ('str' in item ? item.str as string : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (pageText.length > 0) {
        chunks.push(pageText)
        total += pageText.length
      }
    }
    return { text: chunks.join('\n\n').slice(0, limit), pages: numPages }
  } finally {
    void task.destroy()
  }
}
