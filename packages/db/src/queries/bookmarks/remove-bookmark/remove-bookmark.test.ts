import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { addBookmark } from '../add-bookmark';
import { isBookmarked } from '../is-bookmarked';

import { removeBookmark } from './remove-bookmark';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(removeBookmark, () => {
  it('deletes an existing bookmark', async () => {
    await insertTestUser(db(), { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db());
    await addBookmark(tenantId, 'user-1', 'post-1');

    await removeBookmark(tenantId, 'user-1', 'post-1');

    expect(await isBookmarked(tenantId, 'user-1', 'post-1')).toBe(false);
  });

  it('is a no-op when the bookmark does not exist', async () => {
    await insertTestUser(db(), { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db());

    await expect(
      removeBookmark(tenantId, 'user-1', 'post-1'),
    ).resolves.toBeUndefined();
  });

  it("does not remove another user's bookmark for the same post", async () => {
    await insertTestUser(db(), { id: 'user-1' });
    await insertTestUser(db(), { id: 'user-2' });
    const { id: tenantId } = await insertTestTenant(db());
    await addBookmark(tenantId, 'user-1', 'post-1');
    await addBookmark(tenantId, 'user-2', 'post-1');

    await removeBookmark(tenantId, 'user-1', 'post-1');

    expect(await isBookmarked(tenantId, 'user-2', 'post-1')).toBe(true);
  });

  it("does not remove another tenant's bookmark for the same user and post", async () => {
    await insertTestUser(db(), { id: 'user-1' });
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    await addBookmark(tenantOneId, 'user-1', 'post-1');
    await addBookmark(tenantTwoId, 'user-1', 'post-1');

    await removeBookmark(tenantOneId, 'user-1', 'post-1');

    expect(await isBookmarked(tenantTwoId, 'user-1', 'post-1')).toBe(true);
  });
});
