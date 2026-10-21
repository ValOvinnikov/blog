import type { TMaybeUndefined } from '@blog/config';
import { isValidDomain } from '@blog/db/utils/is-valid-domain/is-valid-domain';
import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';

export type TSignupEmail = {
  address: string;
  domain: string;
};

// The one canonical form a blocklist entry is stored and checked in, so
// `Ada+promo@Example.com` and `ada@example.com` resolve to the same entry.
export function normalizeSignupEmail(
  email: string,
): TMaybeUndefined<TSignupEmail> {
  const normalized = normalizeEmail(email);
  const separator = normalized.lastIndexOf('@');
  const [localPart] = normalized.slice(0, separator).split('+');
  const domain = normalized.slice(separator + 1);

  if (separator < 1 || !localPart || !isValidDomain(domain)) return undefined;

  return { address: `${localPart}@${domain}`, domain };
}

export function normalizeSignupDomain(domain: string): TMaybeUndefined<string> {
  const normalized = domain.trim().toLowerCase();

  return isValidDomain(normalized) ? normalized : undefined;
}

export async function hashSignupAddress(address: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(address),
  );

  return Buffer.from(digest).toString('hex');
}
