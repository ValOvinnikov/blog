import type { TMaybeUndefined } from '@blog/config/types';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { blockedSignupIdentities } from '@blog/db/schema/blocked-signup-identities';
import { normalizeSignupEmail } from '@blog/db/utils/normalize-signup-identity/normalize-signup-identity';
import { requireEmailIndex } from '@blog/db/utils/personal-data/personal-data';
import { personalDataIndex } from '@blog/utils/encryption';
import { and, eq, type SQL } from 'drizzle-orm';

export function toPersonalEmailIndex(email: string): TMaybeUndefined<string> {
  const normalized = normalizeSignupEmail(email);
  if (!normalized) return undefined;

  return requireEmailIndex(normalized.address, personalDataIndex);
}

export function isBlockedAddress(emailIndex: string): TMaybeUndefined<SQL> {
  return and(
    eq(blockedSignupIdentities.kind, BLOCKED_IDENTITY_KIND.ADDRESS),
    eq(blockedSignupIdentities.value, emailIndex),
  );
}
