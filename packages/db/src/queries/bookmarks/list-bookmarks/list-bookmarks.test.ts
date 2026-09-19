import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { addBookmark } from '../add-bookmark';

import { listBookmarks } from './list-bookmarks';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(listBookmarks, () => {
  it("returns only the given tenant and user's bookmarks", async () => {
    await insertTestUser(db(), { id: 'user-1' });
    await insertTestUser(db(), { id: 'user-2' });
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    await addBookmark(tenantOneId, 'user-1', 'post-1');
    await addBookmark(tenantOneId, 'user-1', 'post-2');
    await addBookmark(tenantOneId, 'user-2', 'post-3');
    await addBookmark(tenantTwoId, 'user-1', 'post-4');

    const result = await listBookmarks(tenantOneId, 'user-1');

    expect(result.map((bookmark) => bookmark.postId).sort()).toEqual([
      'post-1',
      'post-2',
    ]);
  });

  it('orders results by most recently bookmarked first', async () => {
    await insertTestUser(db(), { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.bookmarks)
      .values([
        {
          tenantId,
          userId: 'user-1',
          postId: 'post-older',
          createdAt: new Date(2026, 0, 1),
        },
        {
          tenantId,
          userId: 'user-1',
          postId: 'post-newer',
          createdAt: new Date(2026, 0, 2),
        },
      ]);

    const result = await listBookmarks(tenantId, 'user-1');

    expect(result.map((bookmark) => bookmark.postId)).toEqual([
      'post-newer',
      'post-older',
    ]);
  });

  it('returns an empty array when the user has no bookmarks', async () => {
    await insertTestUser(db(), { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db());

    expect(await listBookmarks(tenantId, 'user-1')).toEqual([]);
  });
});
