import { userPersonalColumns } from '@blog/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { exportAccountData } from './export-account-data';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const USER_ID = 'user-1';
const OLDER_POST_ID = 'post-older';
const NEWER_POST_ID = 'post-newer';
const AVATAR_URL = 'https://example.com/avatar.png';

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();
let tenantId: string;

beforeEach(async () => {
  const tenant = await insertTestTenant(db());
  tenantId = tenant.id;
});

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.users);
  await db().delete(schema.tenants);
});

describe(exportAccountData, () => {
  it('returns undefined for a userId with no matching users row', async () => {
    expect(await exportAccountData(tenantId, 'missing-user')).toBeUndefined();
  });

  it("aggregates the user's decrypted profile fields and bookmarks", async () => {
    const profile = { name: 'Jane Doe', email: 'jane@example.com' };
    await db()
      .insert(schema.users)
      .values({
        id: USER_ID,
        ...profile,
        ...userPersonalColumns(profile),
        image: AVATAR_URL,
      });
    await db()
      .insert(schema.bookmarks)
      .values([
        {
          tenantId,
          userId: USER_ID,
          postId: OLDER_POST_ID,
          createdAt: new Date(2026, 0, 1),
        },
        {
          tenantId,
          userId: USER_ID,
          postId: NEWER_POST_ID,
          createdAt: new Date(2026, 0, 2),
        },
      ]);

    const result = await exportAccountData(tenantId, USER_ID);

    expect(result).toEqual({
      profile: {
        id: USER_ID,
        ...profile,
        emailVerified: undefined,
        image: AVATAR_URL,
      },
      bookmarks: [
        { postId: NEWER_POST_ID, createdAt: new Date(2026, 0, 2) },
        { postId: OLDER_POST_ID, createdAt: new Date(2026, 0, 1) },
      ],
    });
  });

  it("does not include another user's bookmarks", async () => {
    await db()
      .insert(schema.users)
      .values([{ id: USER_ID }, { id: 'user-2' }]);
    await db()
      .insert(schema.bookmarks)
      .values([
        { tenantId, userId: USER_ID, postId: 'post-1' },
        { tenantId, userId: 'user-2', postId: 'post-2' },
      ]);

    const result = await exportAccountData(tenantId, USER_ID);

    expect(result?.bookmarks.map((bookmark) => bookmark.postId)).toEqual([
      'post-1',
    ]);
  });

  describe('with a user who has no other data', () => {
    beforeEach(async () => {
      await db().insert(schema.users).values({ id: USER_ID });
    });

    it('maps unset nullable profile fields to undefined, never null', async () => {
      const result = await exportAccountData(tenantId, USER_ID);

      expect(result?.profile).toEqual({
        id: USER_ID,
        name: undefined,
        email: undefined,
        emailVerified: undefined,
        image: undefined,
      });
    });

    it('returns an empty bookmarks array for a user with none', async () => {
      const result = await exportAccountData(tenantId, USER_ID);

      expect(result?.bookmarks).toEqual([]);
    });

    it("does not include the user's bookmarks from another tenant", async () => {
      const { id: otherTenantId } = await insertTestTenant(db());
      await db()
        .insert(schema.bookmarks)
        .values([
          { tenantId, userId: USER_ID, postId: 'post-1' },
          { tenantId: otherTenantId, userId: USER_ID, postId: 'post-2' },
        ]);

      const result = await exportAccountData(tenantId, USER_ID);

      expect(result?.bookmarks.map((bookmark) => bookmark.postId)).toEqual([
        'post-1',
      ]);
    });
  });
});
