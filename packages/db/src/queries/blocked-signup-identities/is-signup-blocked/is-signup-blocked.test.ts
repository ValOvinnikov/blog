import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { addBlockedIdentity } from '@blog/db/queries/blocked-signup-identities/add-blocked-identity';
import * as schema from '@blog/db/schema';
import {
  MOCK_BLOCK_REASON,
  MOCK_BLOCKED_ADDRESS,
  MOCK_BLOCKED_ADDRESS_TAGGED_VARIANT,
  MOCK_BLOCKED_ADDRESS_UPPERCASED_VARIANT,
  MOCK_BLOCKED_DOMAIN_ADDRESS,
  MOCK_BLOCKED_DOMAIN_SUBDOMAIN_ADDRESS,
  MOCK_BLOCKED_DOMAIN,
  MOCK_NOT_AN_ADDRESS,
  MOCK_SAME_DOMAIN_OTHER_ADDRESS,
} from '@blog/db/testing/blocked-signup-identities/fixtures';
import { insertTestAdmin } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';
import { faker } from '@faker-js/faker';

import { isSignupBlocked } from './is-signup-blocked';

faker.seed(602106);

const MOCK_UNRELATED_ADDRESS = faker.internet.email({
  provider: 'other.example',
});
const BLOCKED = { ok: true, data: true };
const NOT_BLOCKED = { ok: true, data: false };

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  vi.unstubAllEnvs();
  await db().delete(schema.blockedSignupIdentities);
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(isSignupBlocked, () => {
  beforeEach(async () => {
    vi.stubEnv('PERSONAL_DATA_INDEX_KEY', MOCK_ENCRYPTION_KEY);
    const { id: createdByAdminId } = await insertTestAdmin(db());
    await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: MOCK_BLOCKED_ADDRESS,
      reason: MOCK_BLOCK_REASON,
      createdByAdminId,
    });
    await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: MOCK_BLOCKED_DOMAIN,
      reason: MOCK_BLOCK_REASON,
      createdByAdminId,
    });
  });

  it.each([
    ['the blocked address', MOCK_BLOCKED_ADDRESS],
    ['a +tag variant of it', MOCK_BLOCKED_ADDRESS_TAGGED_VARIANT],
    ['a differently cased variant', MOCK_BLOCKED_ADDRESS_UPPERCASED_VARIANT],
    ['an address on a blocked domain', MOCK_BLOCKED_DOMAIN_ADDRESS],
  ])('is true for %s', async (_, email) => {
    expect(await isSignupBlocked(email)).toEqual(BLOCKED);
  });

  it.each([
    ['another address on the same domain', MOCK_SAME_DOMAIN_OTHER_ADDRESS],
    ['a subdomain of a blocked domain', MOCK_BLOCKED_DOMAIN_SUBDOMAIN_ADDRESS],
    ['an unrelated address', MOCK_UNRELATED_ADDRESS],
  ])('is false for %s', async (_, email) => {
    expect(await isSignupBlocked(email)).toEqual(NOT_BLOCKED);
  });

  it('refuses a malformed address', async () => {
    expect(await isSignupBlocked(MOCK_NOT_AN_ADDRESS)).toEqual({
      ok: false,
      error: ERROR_CODE.DB_INVALID_EMAIL,
    });
  });
});
