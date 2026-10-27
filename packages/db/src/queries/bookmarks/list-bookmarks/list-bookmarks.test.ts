import { addBookmark } from '@blog/db/queries/bookmarks/add-bookmark/add-bookmark';
import * as schema from '@blog/db/schema';
import {
  MOCK_OTHER_POST_ID,
  MOCK_POST_ID,
} from '@blog/db/testing/bookmarks/fixtures';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { listBookmarks } from './list-bookmarks';

vi.mock('@blog/db/client');

faker.seed(61012);

const MOCK_FOREIGN_USER_POST_ID = faker.string.uuid();
const MOCK_FOREIGN_TENANT_POST_ID = faker.string.uuid();
const MOCK_OLDER_CREATED_AT = faker.date.future({ refDate: new Date(0) });
const MOCK_NEWER_CREATED_AT = faker.date.soon({
  refDate: MOCK_OLDER_CREATED_AT,
});

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(listBookmarks, () => {
  let tenantId: string;
  let userId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestUser(db()));
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it("returns only the given tenant and user's bookmarks", async () => {
    const { id: otherUserId } = await insertTestUser(db());
    const { id: otherTenantId } = await insertTestTenant(db());
    await addBookmark(tenantId, userId, MOCK_POST_ID);
    await addBookmark(tenantId, userId, MOCK_OTHER_POST_ID);
    await addBookmark(tenantId, otherUserId, MOCK_FOREIGN_USER_POST_ID);
    await addBookmark(otherTenantId, userId, MOCK_FOREIGN_TENANT_POST_ID);

    const result = await listBookmarks(tenantId, userId);

    const postIds = result.map((bookmark) => bookmark.postId).sort();
    expect(postIds).toEqual([MOCK_POST_ID, MOCK_OTHER_POST_ID].sort());
  });

  it('orders results by most recently bookmarked first', async () => {
    await db()
      .insert(schema.bookmarks)
      .values([
        {
          tenantId,
          userId,
          postId: MOCK_POST_ID,
          createdAt: MOCK_OLDER_CREATED_AT,
        },
        {
          tenantId,
          userId,
          postId: MOCK_OTHER_POST_ID,
          createdAt: MOCK_NEWER_CREATED_AT,
        },
      ]);

    const result = await listBookmarks(tenantId, userId);

    const postIds = result.map((bookmark) => bookmark.postId);
    expect(postIds).toEqual([MOCK_OTHER_POST_ID, MOCK_POST_ID]);
  });

  it('returns an empty array when the user has no bookmarks', async () => {
    await expect(listBookmarks(tenantId, userId)).resolves.toEqual([]);
  });
});
