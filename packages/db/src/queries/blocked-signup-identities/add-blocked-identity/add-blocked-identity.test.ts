import { ERROR_CODE } from '@blog/config/constants';
import {
  BLOCKED_IDENTITY_KIND,
  type TBlockedIdentityKind,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_BLOCK_REASON,
  MOCK_BLOCKED_ADDRESS,
  MOCK_BLOCKED_ADDRESS_DOMAIN,
  MOCK_BLOCKED_ADDRESS_INDEX,
  MOCK_BLOCKED_DOMAIN,
  MOCK_NOT_A_DOMAIN,
  MOCK_NOT_AN_ADDRESS,
} from '@blog/db/testing/blocked-signup-identities/fixtures';
import { insertTestAdmin } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';

import { addBlockedIdentity } from './add-blocked-identity';

vi.mock('@blog/db/client');

const OTHER_REASON = 'Another reason';

const db = useQueryTestDb();

beforeEach(() => {
  vi.stubEnv('PERSONAL_DATA_INDEX_KEY', MOCK_ENCRYPTION_KEY);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await db().delete(schema.blockedSignupIdentities);
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(addBlockedIdentity, () => {
  let createdByAdminId: string;

  beforeEach(async () => {
    ({ id: createdByAdminId } = await insertTestAdmin(db()));
  });

  function addEntry(kind: TBlockedIdentityKind, identity: string) {
    return addBlockedIdentity({
      kind,
      identity,
      reason: MOCK_BLOCK_REASON,
      createdByAdminId,
    });
  }

  it('stores an address entry with no readable address in any column', async () => {
    const result = await addEntry(
      BLOCKED_IDENTITY_KIND.ADDRESS,
      'Blocked+promo@Example.com',
    );

    expect(result.ok).toBe(true);
    const [row] = await db().select().from(schema.blockedSignupIdentities);
    expect(row).toMatchObject({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      value: MOCK_BLOCKED_ADDRESS_INDEX,
      reason: MOCK_BLOCK_REASON,
      createdByAdminId,
    });
    expect(JSON.stringify(row).toLowerCase()).not.toContain('blocked@');
  });

  it('throws when the index key is not configured', async () => {
    vi.stubEnv('PERSONAL_DATA_INDEX_KEY', undefined);

    await expect(
      addEntry(BLOCKED_IDENTITY_KIND.ADDRESS, MOCK_BLOCKED_ADDRESS),
    ).rejects.toThrow('PERSONAL_DATA_INDEX_KEY is not configured.');
  });

  it('stores a domain entry as the lower-cased domain', async () => {
    await addEntry(BLOCKED_IDENTITY_KIND.DOMAIN, ' Mailinator.COM ');

    const [row] = await db().select().from(schema.blockedSignupIdentities);
    expect(row?.value).toBe(MOCK_BLOCKED_DOMAIN);
  });

  it('returns the existing entry, not created, instead of adding a duplicate', async () => {
    const { id: otherAdminId } = await insertTestAdmin(db());
    const first = await addEntry(
      BLOCKED_IDENTITY_KIND.ADDRESS,
      MOCK_BLOCKED_ADDRESS,
    );
    const second = await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: 'BLOCKED+again@example.com',
      reason: OTHER_REASON,
      createdByAdminId: otherAdminId,
    });

    expect(first.ok && first.data.created).toBe(true);
    expect(second).toEqual({
      ok: true,
      data: { entry: first.ok && first.data.entry, created: false },
    });
    const rows = await db().select().from(schema.blockedSignupIdentities);
    expect(rows).toHaveLength(1);
  });

  it('keeps an address and a domain with the same text apart', async () => {
    await addEntry(BLOCKED_IDENTITY_KIND.DOMAIN, MOCK_BLOCKED_ADDRESS_DOMAIN);
    await addEntry(BLOCKED_IDENTITY_KIND.ADDRESS, MOCK_BLOCKED_ADDRESS);

    const rows = await db().select().from(schema.blockedSignupIdentities);
    expect(rows).toHaveLength(2);
  });

  it.each([
    {
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: MOCK_NOT_AN_ADDRESS,
      error: ERROR_CODE.DB_INVALID_EMAIL,
    },
    {
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: MOCK_NOT_A_DOMAIN,
      error: ERROR_CODE.DB_INVALID_DOMAIN,
    },
  ])('refuses a malformed $kind', async ({ kind, identity, error }) => {
    const result = await addEntry(kind, identity);

    expect(result).toEqual({ ok: false, error });
  });

  it('keeps the entry when the admin who added it is removed', async () => {
    await addEntry(BLOCKED_IDENTITY_KIND.ADDRESS, MOCK_BLOCKED_ADDRESS);

    await db().delete(schema.admins);

    const [row] = await db().select().from(schema.blockedSignupIdentities);
    expect(row?.createdByAdminId).toBeNull();
  });
});
