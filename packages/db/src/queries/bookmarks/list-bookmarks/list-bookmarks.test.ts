import { addBookmark } from '@blog/db/queries/bookmarks/add-bookmark/add-bookmark';
import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listBookmarks } from './list-bookmarks';

vi.mock('@blog/db/client');

const MOCK_OLDER_POST_ID = 'post-older';
const MOCK_NEWER_POST_ID = 'post-newer';

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(listBookmarks, () => {
  let tenantId: string;

  beforeEach(async () => {
    await insertTestUser(db(), { id: 'user-1' });
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it("returns only the given tenant and user's bookmarks", async () => {
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
    await db()
      .insert(schema.bookmarks)
      .values([
        {
          tenantId,
          userId: 'user-1',
          postId: MOCK_OLDER_POST_ID,
          createdAt: new Date(2026, 0, 1),
        },
        {
          tenantId,
          userId: 'user-1',
          postId: MOCK_NEWER_POST_ID,
          createdAt: new Date(2026, 0, 2),
        },
      ]);

    const result = await listBookmarks(tenantId, 'user-1');

    expect(result.map((bookmark) => bookmark.postId)).toEqual([
      MOCK_NEWER_POST_ID,
      MOCK_OLDER_POST_ID,
    ]);
  });

  it('returns an empty array when the user has no bookmarks', async () => {
    expect(await listBookmarks(tenantId, 'user-1')).toEqual([]);
  });
});
