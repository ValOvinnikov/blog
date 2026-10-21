import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { addBlockedIdentity } from '@blog/db/queries/blocked-signup-identities/add-blocked-identity';
import * as schema from '@blog/db/schema';
import { insertTestAdmin } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { isSignupBlocked } from './is-signup-blocked';

const BLOCKED_ADDRESS = 'ada@example.com';
const BLOCKED = { ok: true, data: true };
const NOT_BLOCKED = { ok: true, data: false };

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.blockedSignupIdentities);
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(isSignupBlocked, () => {
  beforeEach(async () => {
    const { id: createdByAdminId } = await insertTestAdmin(db());
    await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: BLOCKED_ADDRESS,
      reason: 'Spam tenant',
      createdByAdminId,
    });
    await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: 'mailinator.com',
      reason: 'Disposable',
      createdByAdminId,
    });
  });

  it.each([
    ['the blocked address', BLOCKED_ADDRESS],
    ['a +tag variant of it', 'ada+again@example.com'],
    ['a differently cased variant', ' ADA@Example.com'],
    ['an address on a blocked domain', 'anyone@mailinator.com'],
  ])('is true for %s', async (_, email) => {
    expect(await isSignupBlocked(email)).toEqual(BLOCKED);
  });

  it.each([
    ['another address on the same domain', 'grace@example.com'],
    ['a subdomain of a blocked domain', 'anyone@eu.mailinator.com'],
    ['an unrelated address', 'someone@other.example'],
  ])('is false for %s', async (_, email) => {
    expect(await isSignupBlocked(email)).toEqual(NOT_BLOCKED);
  });

  it('refuses a malformed address', async () => {
    expect(await isSignupBlocked('not-an-address')).toEqual({
      ok: false,
      error: ERROR_CODE.DB_INVALID_EMAIL,
    });
  });
});
