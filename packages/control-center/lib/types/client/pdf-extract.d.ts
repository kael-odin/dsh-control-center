/**
 * Client-side PDF text extraction — Cherry translate page PDF import parity.
 *
 * Runs pdfjs-dist in the browser (no host round-trip). The worker is not
 * wired (fake-worker fallback on the main thread): acceptable for occasional
 * text extraction, and avoids shipping a separate worker asset through the
 * single-file client bundle. DOMMatrix and friends are browser natives, so
 * unlike the Node host, no `canvas` dependency is needed.
 */
export interface PdfExtractionResult {
    text: string;
    pages: number;
}
/** Extract up to `limit` characters of plain text from a PDF `ArrayBuffer`. */
export declare function extractPdfText(data: ArrayBuffer, limit?: number): Promise<PdfExtractionResult>;
//# sourceMappingURL=pdf-extract.d.ts.map