import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestAdmin } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { addBlockedIdentity } from './add-blocked-identity';

const ADDRESS = 'ada@example.com';
const REASON = 'Spam tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
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
      identity: 'Ada+promo@Example.com',
      reason: REASON,
      createdByAdminId,
    });

    expect(result.ok).toBe(true);
    const [row] = await db().select().from(schema.blockedSignupIdentities);
    expect(row).toMatchObject({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      value: 'b5fc85e55755f9e0d030a10ab4429b6b2944855f9a0d60077fe832becbc41d72',
      reason: REASON,
      createdByAdminId,
    });
    expect(JSON.stringify(row).toLowerCase()).not.toContain('ada');
  });

  it('stores a domain entry as the lower-cased domain', async () => {
    await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: ' Mailinator.COM ',
      reason: REASON,
      createdByAdminId,
    });

    const [row] = await db().select().from(schema.blockedSignupIdentities);
    expect(row?.value).toBe('mailinator.com');
  });

  it('returns the existing entry instead of adding a duplicate', async () => {
    const first = await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: ADDRESS,
      reason: REASON,
      createdByAdminId,
    });
    const second = await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: 'ADA+again@example.com',
      reason: 'Another reason',
      createdByAdminId,
    });

    expect(second).toEqual(first);
    const rows = await db().select().from(schema.blockedSignupIdentities);
    expect(rows).toHaveLength(1);
  });

  it('keeps an address and a domain with the same text apart', async () => {
    await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: 'example.com',
      reason: REASON,
      createdByAdminId,
    });
    await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: ADDRESS,
      reason: REASON,
      createdByAdminId,
    });

    const rows = await db().select().from(schema.blockedSignupIdentities);
    expect(rows).toHaveLength(2);
  });

  it('refuses a malformed address', async () => {
    const result = await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: 'not-an-address',
      reason: REASON,
      createdByAdminId,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_INVALID_EMAIL });
  });

  it('refuses a malformed domain', async () => {
    const result = await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: 'https://example.com',
      reason: REASON,
      createdByAdminId,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_INVALID_DOMAIN });
  });

  it('keeps the entry when the admin who added it is removed', async () => {
    await addBlockedIdentity({
      kind: BLOCKED_IDENTITY_KIND.ADDRESS,
      identity: ADDRESS,
      reason: REASON,
      createdByAdminId,
    });

    await db().delete(schema.admins);

    const [row] = await db().select().from(schema.blockedSignupIdentities);
    expect(row?.createdByAdminId).toBeNull();
  });
});
