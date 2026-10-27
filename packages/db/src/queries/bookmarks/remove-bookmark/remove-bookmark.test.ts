import * as schema from '@blog/db/schema';
import { MOCK_POST_ID } from '@blog/db/testing/bookmarks/fixtures';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { addBookmark } from '../add-bookmark';
import { isBookmarked } from '../is-bookmarked';

import { removeBookmark } from './remove-bookmark';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(removeBookmark, () => {
  let tenantId: string;
  let userId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestUser(db()));
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('deletes an existing bookmark', async () => {
    await addBookmark(tenantId, userId, MOCK_POST_ID);

    await removeBookmark(tenantId, userId, MOCK_POST_ID);

    await expect(isBookmarked(tenantId, userId, MOCK_POST_ID)).resolves.toBe(
      false,
    );
  });

  it('is a no-op when the bookmark does not exist', async () => {
    await expect(
      removeBookmark(tenantId, userId, MOCK_POST_ID),
    ).resolves.toBeUndefined();
  });

  it("leaves another user's bookmark for the same post", async () => {
    const { id: otherUserId } = await insertTestUser(db());
    await addBookmark(tenantId, userId, MOCK_POST_ID);
    await addBookmark(tenantId, otherUserId, MOCK_POST_ID);

    await removeBookmark(tenantId, userId, MOCK_POST_ID);

    await expect(
      isBookmarked(tenantId, otherUserId, MOCK_POST_ID),
    ).resolves.toBe(true);
  });

  it("leaves another tenant's bookmark for the same user and post", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await addBookmark(tenantId, userId, MOCK_POST_ID);
    await addBookmark(otherTenantId, userId, MOCK_POST_ID);

    await removeBookmark(tenantId, userId, MOCK_POST_ID);

    await expect(
      isBookmarked(otherTenantId, userId, MOCK_POST_ID),
    ).resolves.toBe(true);
  });
});
