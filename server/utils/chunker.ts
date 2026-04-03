/**
 * Text chunking utilities for document ingestion.
 *
 * Splits raw text into overlapping word-based chunks suitable for embedding.
 * Paragraph boundaries are respected; long paragraphs are split at chunkSize words.
 */

export interface TextChunk {
  content: string
  tokenCount: number
}

/**
 * Split normalised text into overlapping chunks.
 *
 * @param text      Raw input text (any line-ending convention)
 * @param chunkSize Maximum number of words per chunk (default 400)
 * @param overlap   Number of trailing words to carry into the next chunk (default 40)
 * @returns Array of TextChunk objects, each with content and an estimated token count.
 *          Chunks shorter than 20 characters are filtered out.
 */
export function chunkText(
  text: string,
  chunkSize = 400,
  overlap = 40,
): TextChunk[] {
  const normalised = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  const paragraphs = normalised.split(/\n\n+/).filter(p => p.trim().length > 0)

  const chunks: TextChunk[] = []
  let currentWords: string[] = []

  for (const para of paragraphs) {
    const words = para.split(/\s+/)

    if (currentWords.length + words.length <= chunkSize) {
      // Paragraph fits alongside what we've already accumulated
      currentWords.push(...words)
    } else {
      // Flush the current accumulation before handling this paragraph
      if (currentWords.length > 0) {
        const content = currentWords.join(' ')
        chunks.push({ content, tokenCount: Math.ceil(currentWords.length * 1.3) })
        currentWords = currentWords.slice(-overlap)
      }

      if (words.length > chunkSize) {
        // Paragraph is itself longer than chunkSize — slice it directly
        let i = 0
        while (i < words.length) {
          const slice = words.slice(i, i + chunkSize)
          const content = slice.join(' ')
          chunks.push({ content, tokenCount: Math.ceil(slice.length * 1.3) })
          i += chunkSize - overlap
        }
        currentWords = []
      } else {
        currentWords = [...words]
      }
    }
  }

  // Flush any remaining words as the final chunk
  if (currentWords.length > 0) {
    const content = currentWords.join(' ')
    chunks.push({ content, tokenCount: Math.ceil(currentWords.length * 1.3) })
  }

  return chunks.filter(c => c.content.trim().length > 20)
}
