/**
 * Text validation utilities for server-side input hardening.
 *
 * These helpers are for use in handlers that do NOT use Zod (e.g. multipart
 * form fields, raw query params). For JSON bodies validated with Zod, prefer
 * Zod's built-in .max() / .trim() instead.
 */

/**
 * Trims leading/trailing whitespace and enforces a max character length.
 * Returns the trimmed string if valid, or null if it exceeds maxLength.
 * Does NOT do HTML sanitisation — these endpoints don't render HTML.
 *
 * @param value     The raw string to validate.
 * @param maxLength Maximum number of characters allowed after trimming.
 * @returns         The trimmed string, or null if it exceeds maxLength.
 */
export function sanitizeText(value: string, maxLength: number): string | null {
  const trimmed = value.trim()
  if (trimmed.length > maxLength) return null
  return trimmed
}
