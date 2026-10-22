import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  BLOCK_REASON,
  BLOCKED_ADDRESS,
  BLOCKED_ADDRESS_DOMAIN,
  BLOCKED_ADDRESS_INDEX,
  BLOCKED_DOMAIN,
  NOT_A_DOMAIN,
  NOT_AN_ADDRESS,
} from '@blog/db/testing/blocked-signup-identities/fixtures';
import { insertTestAdmin } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { TEST_ENCRYPTION_KEY } from '@blog/utils/encryption/encryption-fixtures';

import { addBlockedIdentity } from './add-blocked-identity';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const OTHER_REASON = 'Another reason';

const db = useQueryTestDb(getDbMock);

beforeEach(() => {
  vi.stubEnv('PERSONAL_DATA_INDEX_KEY', TEST_ENCRYPTION_KEY);
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

  it('stores an address entry with no readable address in any column', async () => {
    const result = await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: 'Blocked+promo@Example.com',
      reason: BLOCK_REASON,
      createdByAdminId,
    });

    expect(result.ok).toBe(true);
    const [row] = await db().select().from(schema.blockedSignupIdentities);
    expect(row).toMatchObject({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      value: BLOCKED_ADDRESS_INDEX,
      reason: BLOCK_REASON,
      createdByAdminId,
    });
    expect(JSON.stringify(row).toLowerCase()).not.toContain('blocked@');
  });

  it('throws when the index key is not configured', async () => {
    vi.stubEnv('PERSONAL_DATA_INDEX_KEY', undefined);

    await expect(
      addBlockedIdentity({
        kind: BLOCKED_IDENTITY_KIND.ADDRESS,
        identity: BLOCKED_ADDRESS,
        reason: BLOCK_REASON,
        createdByAdminId,
      }),
    ).rejects.toThrow('PERSONAL_DATA_INDEX_KEY is not configured.');
  });

  it('stores a domain entry as the lower-cased domain', async () => {
    await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: ' Mailinator.COM ',
      reason: BLOCK_REASON,
      createdByAdminId,
    });

    const [row] = await db().select().from(schema.blockedSignupIdentities);
    expect(row?.value).toBe(BLOCKED_DOMAIN);
  });

  it('returns the existing entry instead of adding a duplicate', async () => {
    const first = await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: BLOCKED_ADDRESS,
      reason: BLOCK_REASON,
      createdByAdminId,
    });
    const second = await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: 'BLOCKED+again@example.com',
      reason: OTHER_REASON,
      createdByAdminId,
    });

    expect(second).toEqual({
      ok: true,
      data: { entry: first.ok && first.data.entry, created: false },
    });
    const rows = await db().select().from(schema.blockedSignupIdentities);
    expect(rows).toHaveLength(1);
  });

  it('reports created on the first add and not on a repeat', async () => {
    const input = {
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: BLOCKED_ADDRESS,
      reason: BLOCK_REASON,
      createdByAdminId,
    };
    const { id: otherAdminId } = await insertTestAdmin(db());

    const first = await addBlockedIdentity(input);
    const repeat = await addBlockedIdentity({
      ...input,
      reason: OTHER_REASON,
      createdByAdminId: otherAdminId,
    });

    expect(first.ok && first.data.created).toBe(true);
    expect(repeat.ok && repeat.data.created).toBe(false);
    expect(repeat.ok && repeat.data.entry).toMatchObject({
      reason: BLOCK_REASON,
      createdByAdminId,
    });
  });

  it('keeps an address and a domain with the same text apart', async () => {
    await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: BLOCKED_ADDRESS_DOMAIN,
      reason: BLOCK_REASON,
      createdByAdminId,
    });
    await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: BLOCKED_ADDRESS,
      reason: BLOCK_REASON,
      createdByAdminId,
    });

    const rows = await db().select().from(schema.blockedSignupIdentities);
    expect(rows).toHaveLength(2);
  });

  it('refuses a malformed address', async () => {
    const result = await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: NOT_AN_ADDRESS,
      reason: BLOCK_REASON,
      createdByAdminId,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_INVALID_EMAIL });
  });

  it('refuses a malformed domain', async () => {
    const result = await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: NOT_A_DOMAIN,
      reason: BLOCK_REASON,
      createdByAdminId,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_INVALID_DOMAIN });
  });

  it('keeps the entry when the admin who added it is removed', async () => {
    await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: BLOCKED_ADDRESS,
      reason: BLOCK_REASON,
      createdByAdminId,
    });

    await db().delete(schema.admins);

    const [row] = await db().select().from(schema.blockedSignupIdentities);
    expect(row?.createdByAdminId).toBeNull();
  });
});
