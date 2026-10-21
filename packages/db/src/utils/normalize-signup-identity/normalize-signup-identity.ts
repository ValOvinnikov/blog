import type { TMaybeUndefined } from '@blog/config';
import { isValidDomain } from '@blog/db/utils/is-valid-domain/is-valid-domain';
import { normalizeEmailIdentity } from '@blog/utils/normalize-email-identity';

export type TSignupEmail = {
  address: string;
  domain: string;
};

// The one canonical form a blocklist entry is stored and checked in, so
// `Ada+promo@Example.com` and `ada@example.com` resolve to the same entry.
export function normalizeSignupEmail(
  email: string,
): TMaybeUndefined<TSignupEmail> {
  const address = normalizeEmailIdentity(email);
  const separator = address.lastIndexOf('@');
  const domain = address.slice(separator + 1);

  if (separator < 1 || !isValidDomain(domain)) return undefined;

  return { address, domain };
}

export function normalizeSignupDomain(domain: string): TMaybeUndefined<string> {
  const normalized = domain.trim().toLowerCase();

  return isValidDomain(normalized) ? normalized : undefined;
}
