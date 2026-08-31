/**
 * Client-side PDF text extraction — Cherry translate page PDF import parity.
 *
 * Runs pdfjs-dist in the browser (no host round-trip). Uses the main-thread
 * fake worker (disableWorker) so no separate worker asset or CDN fetch is
 * required — works fully offline. DOMMatrix and friends are browser natives,
 * so unlike the Node host, no `canvas` dependency is needed.
 */

import { getDocument } from 'pdfjs-dist'

export interface PdfExtractionResult {
  text: string
  pages: number
}

/** Extract up to `limit` characters of plain text from a PDF `ArrayBuffer`. */
export async function extractPdfText(data: ArrayBuffer, limit = 100_000): Promise<PdfExtractionResult> {
  const task = getDocument({ data, disableWorker: true } as unknown as Parameters<typeof getDocument>[0])
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
