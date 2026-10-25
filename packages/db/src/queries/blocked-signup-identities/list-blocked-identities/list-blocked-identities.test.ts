import {
  ADMIN_ROLE,
  BLOCKED_IDENTITY_KIND,
  GRANTED_VIA,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_OPERATOR_EMAIL,
  insertTestAdmin,
  insertTestUser,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listBlockedIdentities } from './list-blocked-identities';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.blockedSignupIdentities);
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

const OLDER_REASON = 'Older';
const NEWER_REASON = 'Newer';
const ADMIN_NAME = 'Operator';
const OLDER_DOMAIN = 'older.example';
const NEWER_DOMAIN = 'newer.example';

describe(listBlockedIdentities, () => {
  it('returns an empty list when nothing is blocked', async () => {
    expect(await listBlockedIdentities()).toEqual({ ok: true, data: [] });
  });

  describe('with entries added by an admin', () => {
    let createdByAdminId: string;

    beforeEach(async () => {
      ({ id: createdByAdminId } = await insertTestAdmin(db()));
    });

    it('lists entries newest first', async () => {
      const now = Date.now();
      await db()
        .insert(schema.blockedSignupIdentities)
        .values([
          {
            kind: BLOCKED_IDENTITY_KIND.DOMAIN,
            value: OLDER_DOMAIN,
            reason: OLDER_REASON,
            createdByAdminId,
            createdAt: new Date(now - 1),
          },
          {
            kind: BLOCKED_IDENTITY_KIND.DOMAIN,
            value: NEWER_DOMAIN,
            reason: NEWER_REASON,
            createdByAdminId,
            createdAt: new Date(now),
          },
        ]);

      const result = await listBlockedIdentities();

      expect(result.ok && result.data.map(({ reason }) => reason)).toEqual([
        NEWER_REASON,
        OLDER_REASON,
      ]);
    });

    it('still lists an entry whose admin is gone, with no email', async () => {
      await db().insert(schema.blockedSignupIdentities).values({
        kind: BLOCKED_IDENTITY_KIND.DOMAIN,
        value: OLDER_DOMAIN,
        reason: OLDER_REASON,
        createdByAdminId,
      });
      await db().delete(schema.admins);

      const result = await listBlockedIdentities();

      expect(result.ok && result.data).toHaveLength(1);
      expect(result.ok && result.data[0]?.addedByEmail).toBeNull();
    });
  });

  it('lists the adding admin email and nothing else from the user', async () => {
    const { id: userId } = await insertTestUser(db(), {
      email: MOCK_OPERATOR_EMAIL,
      name: ADMIN_NAME,
    });
    const [admin] = await db()
      .insert(schema.admins)
      .values({
        userId,
        role: ADMIN_ROLE.ADMIN,
        grantedVia: GRANTED_VIA.PROMOTION,
      })
      .returning();
    await db().insert(schema.blockedSignupIdentities).values({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      value: OLDER_DOMAIN,
      reason: OLDER_REASON,
      createdByAdminId: admin?.id,
    });

    const result = await listBlockedIdentities();

    expect(result.ok && result.data[0]).toMatchObject({
      reason: OLDER_REASON,
      addedByEmail: MOCK_OPERATOR_EMAIL,
    });
    expect(JSON.stringify(result)).not.toContain(ADMIN_NAME);
  });
});
