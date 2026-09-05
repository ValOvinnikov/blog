const ALLOWED_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

/**
 * Validates a caller- or tenant-authored URL against an http/https/mailto
 * scheme allowlist before it is allowed near an `href` attribute. Returns
 * the normalised URL when it's safe, or `null` when it isn't — including
 * when the value cannot be parsed as an absolute URL, or carries http(s)
 * userinfo.
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

  if (url.protocol === 'mailto:') {
    url.search = '';
    return url.href;
  }

  if (url.username || url.password) {
    return null;
  }

  return url.href;
}
