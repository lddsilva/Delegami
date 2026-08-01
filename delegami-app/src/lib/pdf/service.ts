/**
 * Abstract PDF Service
 *
 * Interface for PDF generation. Implementations can use:
 *  - Print-friendly HTML (current, no extra deps)
 *  - Puppeteer / Playwright (headless browser, Phase 4+ upgrade path)
 *  - @react-pdf/renderer (React-based, works serverless)
 *
 * Variant controls which fields are visible:
 *  - 'client'   → No internal costs, no margin. Professional layout.
 *  - 'internal' → Full data including costs, margins, internal notes.
 */

export type PdfVariant = 'client' | 'internal'

export interface PdfTemplate {
  name: string
  variant: PdfVariant
}

export interface PdfService {
  /**
   * Generate a PDF buffer for the given template and data.
   * Returns a Buffer (Node) or Uint8Array (edge) with the PDF bytes.
   */
  generate(template: PdfTemplate, data: unknown): Promise<Buffer | Uint8Array>
}

/**
 * Current implementation: redirect to print-friendly HTML page.
 * The user opens it and uses Ctrl+P → Save as PDF.
 *
 * Upgrade path: replace with PuppeteerPdfService that calls page.pdf()
 * without changing any caller code.
 */
export function getPrintUrl(
  type: 'quote' | 'invoice',
  id: string,
  variant: PdfVariant,
): string {
  return `/${type === 'quote' ? 'quotes' : 'invoices'}/${id}/preview?variant=${variant}`
}
