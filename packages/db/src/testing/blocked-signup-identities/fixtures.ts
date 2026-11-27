import { BLOCKED_IDENTITY_KIND } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import type { TBlockedSignupIdentity } from '@shinefold/db/schema/blocked-signup-identities';
import { firstRowOrThrow } from '@shinefold/db/testing/first-row-or-throw';
import type { TTestDb } from '@shinefold/db/testing/fixtures';

export const MOCK_BLOCKED_ADDRESS = 'blocked@example.com';
export const MOCK_BLOCKED_ADDRESS_DOMAIN = 'example.com';
export const MOCK_BLOCKED_ADDRESS_INDEX =
  'tHLNf2J7Sg8FJOE9HsypH3RHE1QoltUb1Y0nedd0EKc';
export const MOCK_BLOCKED_DOMAIN = 'mailinator.com';
export const MOCK_BLOCK_REASON = 'Spam tenant';
export const MOCK_NOT_A_DOMAIN = 'https://example.com';
export const MOCK_NOT_AN_ADDRESS = 'not-an-address';
export const MOCK_BLOCKED_ADDRESS_TAGGED_VARIANT = MOCK_BLOCKED_ADDRESS.replace(
  '@',
  '+promo@',
);
export const MOCK_BLOCKED_ADDRESS_UPPERCASED_VARIANT = ` ${MOCK_BLOCKED_ADDRESS.toUpperCase()} `;
export const MOCK_BLOCKED_DOMAIN_UPPERCASED_VARIANT = ` ${MOCK_BLOCKED_DOMAIN.toUpperCase()} `;
export const MOCK_BLOCKED_DOMAIN_ADDRESS = `anyone@${MOCK_BLOCKED_DOMAIN}`;
export const MOCK_BLOCKED_DOMAIN_SUBDOMAIN_ADDRESS = `anyone@eu.${MOCK_BLOCKED_DOMAIN}`;
export const MOCK_SAME_DOMAIN_OTHER_ADDRESS = `grace@${MOCK_BLOCKED_ADDRESS_DOMAIN}`;

export async function insertTestBlockedIdentity(
  db: TTestDb,
  overrides: Partial<typeof schema.blockedSignupIdentities.$inferInsert> = {},
): Promise<TBlockedSignupIdentity> {
  return firstRowOrThrow(
    await db
      .insert(schema.blockedSignupIdentities)
      .values({
        kind: BLOCKED_IDENTITY_KIND.DOMAIN,
        value: MOCK_BLOCKED_DOMAIN,
        reason: MOCK_BLOCK_REASON,
        ...overrides,
      })
      .returning(),
    'insertTestBlockedIdentity',
  );
}
