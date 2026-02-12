/**
 * Strip HTML tags and control characters from user input.
 * Preserves Vietnamese characters and normal punctuation.
 */
export function sanitizeText(input: string): string {
  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Sanitize all string values in a FormData-like object.
 */
export function sanitizeFormData<T extends Record<string, string | undefined>>(
  data: T
): T {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (typeof val === 'string') {
      (result as Record<string, string | undefined>)[key] = sanitizeText(val);
    }
  }
  return result;
}
