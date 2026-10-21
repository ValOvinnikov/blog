import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestAdmin } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listBlockedIdentities } from './list-blocked-identities';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.blockedSignupIdentities);
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

const OLDER_REASON = 'Older';
const NEWER_REASON = 'Newer';

describe(listBlockedIdentities, () => {
  it('returns an empty list when nothing is blocked', async () => {
    expect(await listBlockedIdentities()).toEqual({ ok: true, data: [] });
  });

  it('lists entries newest first', async () => {
    const { id: createdByAdminId } = await insertTestAdmin(db());
    const now = Date.now();
    await db()
      .insert(schema.blockedSignupIdentities)
      .values([
        {
          kind: BLOCKED_IDENTITY_KIND.DOMAIN,
          value: 'older.example',
          reason: OLDER_REASON,
          createdByAdminId,
          createdAt: new Date(now - 1),
        },
        {
          kind: BLOCKED_IDENTITY_KIND.DOMAIN,
          value: 'newer.example',
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
});
