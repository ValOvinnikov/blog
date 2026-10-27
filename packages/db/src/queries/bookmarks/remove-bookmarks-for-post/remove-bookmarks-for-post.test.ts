import * as schema from '@blog/db/schema';
import {
  MOCK_OTHER_POST_ID,
  MOCK_POST_ID,
} from '@blog/db/testing/bookmarks/fixtures';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { addBookmark } from '../add-bookmark';
import { isBookmarked } from '../is-bookmarked';

import { removeBookmarksForPost } from './remove-bookmarks-for-post';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(removeBookmarksForPost, () => {
  let tenantId: string;
  let userId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestUser(db()));
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it("deletes every user's bookmark for the tenant and post", async () => {
    const { id: otherUserId } = await insertTestUser(db());
    await addBookmark(tenantId, userId, MOCK_POST_ID);
    await addBookmark(tenantId, otherUserId, MOCK_POST_ID);

    const count = await removeBookmarksForPost(tenantId, MOCK_POST_ID);

    const rows = await db().select().from(schema.bookmarks);
    expect(count).toBe(2);
    expect(rows).toHaveLength(0);
  });

  it('leaves bookmarks for a different post untouched', async () => {
    await addBookmark(tenantId, userId, MOCK_POST_ID);
    await addBookmark(tenantId, userId, MOCK_OTHER_POST_ID);

    await removeBookmarksForPost(tenantId, MOCK_POST_ID);

    await expect(
      isBookmarked(tenantId, userId, MOCK_OTHER_POST_ID),
    ).resolves.toBe(true);
  });

  it("leaves another tenant's bookmarks for the same post untouched", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await addBookmark(tenantId, userId, MOCK_POST_ID);
    await addBookmark(otherTenantId, userId, MOCK_POST_ID);

    await removeBookmarksForPost(tenantId, MOCK_POST_ID);

    await expect(
      isBookmarked(otherTenantId, userId, MOCK_POST_ID),
    ).resolves.toBe(true);
  });

  it('returns 0 when nothing matches', async () => {
    await expect(removeBookmarksForPost(tenantId, MOCK_POST_ID)).resolves.toBe(
      0,
    );
  });
});
