/**
 * PDF text extraction utility.
 *
 * Wraps pdf-parse v2 (PDFParse class) to extract raw text from a PDF buffer.
 * Rejects image-only PDFs that yield no meaningful text.
 */

import { PDFParse } from 'pdf-parse'

/**
 * Extract plain text from a PDF file buffer.
 *
 * @param buffer Raw bytes of a PDF file
 * @returns Extracted text content
 * @throws Error if the PDF yields fewer than 50 characters (image-only or corrupt)
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer })
  const data = await parser.getText()
  if (data.text.trim().length < 50) {
    throw new Error('PDF appears to be image-only or contains no extractable text')
  }
  return data.text
}
