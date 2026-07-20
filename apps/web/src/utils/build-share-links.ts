/**
 * Builds the outbound share URL for X (formerly Twitter)'s intent endpoint.
 * Platform-specific URL construction lives here (`apps/web`) rather than in
 * `@blog/ui` — the design system only renders whatever links it's given.
 *
 * @example
 * buildTwitterShareUrl('https://example.com/post', 'My post')
 * // 'https://twitter.com/intent/tweet?text=My+post&url=https%3A%2F%2Fexample.com%2Fpost'
 */
export function buildTwitterShareUrl(url: string, title: string): string {
  const params = new URLSearchParams({ text: title, url });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Builds the outbound share URL for LinkedIn's share-offsite endpoint.
 *
 * @example
 * buildLinkedInShareUrl('https://example.com/post')
 * // 'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fexample.com%2Fpost'
 */
export function buildLinkedInShareUrl(url: string): string {
  const params = new URLSearchParams({ url });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}
