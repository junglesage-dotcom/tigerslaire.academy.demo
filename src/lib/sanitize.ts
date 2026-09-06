// src/lib/sanitize.ts

/**
 * Basic sanitization to strip HTML tags and prevent XSS.
 * For a production LMS, consider a library like 'dompurify' if rich text is needed.
 * For now, this ensures only plain text is stored.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip javascript: protocols
    .replace(/on\w+=/gi, '') // Strip inline event handlers (onclick, onerror, etc.)
    .trim();
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    }
  }
  return sanitized;
}