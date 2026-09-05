const ALLOWED_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

/**
 * Validates a caller- or tenant-authored URL against an http/https/mailto
 * scheme allowlist before it is allowed near an `href` attribute. Returns
 * the normalised URL when the scheme is allowed, or `null` when it isn't —
 * including when the value can't be parsed as an absolute URL at all.
 */
export function sanitizeHref(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  if (!ALLOWED_URL_SCHEMES.has(url.protocol)) {
    return null;
  }

  return url.href;
}
