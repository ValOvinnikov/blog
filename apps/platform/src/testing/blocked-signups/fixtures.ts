import type { TBlockedSignupEntry } from '@platform/server/signup-block/load-blocked-signup-entries';
import { MOCK_SUSPENSION_REFERENCE } from '@platform/testing/tenant-suspensions/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/tenant-identity';
import { BLOCKED_IDENTITY_KIND } from '@shinefold/db/constants';
import type {
  TBlockedIdentityListing,
  TBlockingSuspension,
} from '@shinefold/db/queries/blocked-signup-identities/list-blocked-identities';
import type { TBlockedSignupIdentity } from '@shinefold/db/schema/blocked-signup-identities';

export const MOCK_BLOCKED_DOMAIN = 'blocklist-spam.example';
export const MOCK_BLOCKED_ADDRESS_HASH = 'f00dface0123456789abcdef01234567';
export const MOCK_BLOCKED_ADDRESS_HASH_PREVIEW = `${MOCK_BLOCKED_ADDRESS_HASH.slice(0, 12)}…`;
const BLOCKED_DOMAIN_ENTRY_ID = 'blocked-domain-entry';
export const MOCK_BLOCKED_ADDRESS_ENTRY_ID = 'blocked-address-entry';
export const MOCK_BLOCK_REASON = 'Spam signups';
export const MOCK_BLOCK_AUTHOR_EMAIL = 'blocklist-ops@example.com';
export const MOCK_BLOCKED_OWNER_EMAIL = 'blocked-owner@example.com';

const BLOCKED_AT = new Date(Date.UTC(2026, 4, 6));

export const MOCK_BLOCKING_SUSPENSION = {
  reference: MOCK_SUSPENSION_REFERENCE,
  tenantId: MOCK_TENANT_ID,
  tenantName: MOCK_TENANT_NAME,
} as const satisfies TBlockingSuspension;

export const mockBlockedIdentity = (
  overrides: Partial<TBlockedSignupIdentity> = {},
): TBlockedSignupIdentity => ({
  id: BLOCKED_DOMAIN_ENTRY_ID,
  kind: BLOCKED_IDENTITY_KIND.DOMAIN,
  value: MOCK_BLOCKED_DOMAIN,
  reason: MOCK_BLOCK_REASON,
  createdByAdminId: null,
  createdAt: BLOCKED_AT,
  ...overrides,
});

export const mockBlockedIdentityListing = (
  overrides: Partial<TBlockedIdentityListing> = {},
): TBlockedIdentityListing => ({
  ...mockBlockedIdentity(),
  addedByEmail: MOCK_BLOCK_AUTHOR_EMAIL,
  suspension: null,
  ...overrides,
});

export const mockBlockedSignupEntry = (
  overrides: Partial<TBlockedSignupEntry> = {},
): TBlockedSignupEntry => ({
  id: BLOCKED_DOMAIN_ENTRY_ID,
  kind: BLOCKED_IDENTITY_KIND.DOMAIN,
  displayValue: MOCK_BLOCKED_DOMAIN,
  reason: MOCK_BLOCK_REASON,
  createdAt: BLOCKED_AT,
  addedBy: MOCK_BLOCK_AUTHOR_EMAIL,
  suspension: null,
  ...overrides,
});

export const mockBlockedAddressIdentity = (
  overrides: Partial<TBlockedSignupIdentity> = {},
): TBlockedSignupIdentity =>
  mockBlockedIdentity({
    id: MOCK_BLOCKED_ADDRESS_ENTRY_ID,
    kind: BLOCKED_IDENTITY_KIND.ADDRESS,
    value: MOCK_BLOCKED_ADDRESS_HASH,
    ...overrides,
  });
