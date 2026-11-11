import { sanitizeHref } from '@blog/utils';

export function sanitizeImageUrl(imageUrl: string): string | null {
  const sanitized = sanitizeHref(imageUrl);
  return sanitized && !sanitized.startsWith('mailto:') ? sanitized : null;
}
