import { normalizeEmail } from './normalize-email';

/** The one mailbox an address reaches, so `Foo+news@Example.com` and `foo@example.com` compare equal. */
export function normalizeEmailIdentity(email: string): string {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf('@');
  if (at === -1) return normalized;

  const [localPart = ''] = normalized.slice(0, at).split('+');
  return `${localPart}${normalized.slice(at)}`;
}
