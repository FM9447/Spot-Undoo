/**
 * Lightweight Zero-Dependency XSS Sanitizer
 * Strips HTML tags and encodes dangerous characters to prevent script injection.
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') return input || '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // strip scripts
    .replace(/<[^>]+>/g, '') // strip all other HTML tags
    .replace(/[&<>"'/]/g, (match) => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
      };
      return entities[match];
    })
    .trim();
}

/**
 * Sanitizes URLs (only allows safe http, https, and internal assets)
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed;
  }
  return '';
}
