import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import type { TBlockedIdentityListing } from '@blog/db/queries/blocked-signup-identities/list-blocked-identities';
import type { TBlockedSignupIdentity } from '@blog/db/schema/blocked-signup-identities';
import type { TBlockedSignupEntry } from '@platform/server/signup-block/load-blocked-signup-entries';

export const BLOCKED_DOMAIN = 'blocklist-spam.example';
export const BLOCKED_ADDRESS_HASH = 'f00dface0123456789abcdef01234567';
export const BLOCKED_ADDRESS_HASH_PREVIEW = `${BLOCKED_ADDRESS_HASH.slice(0, 12)}…`;
const BLOCKED_DOMAIN_ENTRY_ID = 'blocked-domain-entry';
export const BLOCKED_ADDRESS_ENTRY_ID = 'blocked-address-entry';
export const BLOCK_REASON = 'Spam signups';
export const BLOCK_AUTHOR_EMAIL = 'blocklist-ops@example.com';
export const BLOCKED_OWNER_EMAIL = 'blocked-owner@example.com';

const BLOCKED_AT = new Date(Date.UTC(2026, 4, 6));

export const makeBlockedIdentity = (
  overrides: Partial<TBlockedSignupIdentity> = {},
): TBlockedSignupIdentity => ({
  id: BLOCKED_DOMAIN_ENTRY_ID,
  kind: BLOCKED_IDENTITY_KIND.DOMAIN,
  value: BLOCKED_DOMAIN,
  reason: BLOCK_REASON,
  createdByAdminId: null,
  createdAt: BLOCKED_AT,
  ...overrides,
});

export const makeBlockedIdentityListing = (
  overrides: Partial<TBlockedIdentityListing> = {},
): TBlockedIdentityListing => ({
  ...makeBlockedIdentity(),
  addedByEmail: BLOCK_AUTHOR_EMAIL,
  ...overrides,
});

export const makeBlockedSignupEntry = (
  overrides: Partial<TBlockedSignupEntry> = {},
): TBlockedSignupEntry => ({
  id: BLOCKED_DOMAIN_ENTRY_ID,
  kind: BLOCKED_IDENTITY_KIND.DOMAIN,
  displayValue: BLOCKED_DOMAIN,
  reason: BLOCK_REASON,
  createdAt: BLOCKED_AT,
  addedBy: BLOCK_AUTHOR_EMAIL,
  ...overrides,
});
