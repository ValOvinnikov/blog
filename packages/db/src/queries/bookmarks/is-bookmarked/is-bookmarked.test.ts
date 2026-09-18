import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { addBookmark } from '../add-bookmark';

import { isBookmarked } from './is-bookmarked';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

// One in-memory Postgres instance for the whole file (spinning up pglite's
// WASM engine is the slow part — seconds, not milliseconds) — `afterEach`
// clears rows between tests instead of paying that cost per test.

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(isBookmarked, () => {
  it('returns true when the tuple exists', async () => {
    await insertTestUser(db(), { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db());
    await addBookmark(tenantId, 'user-1', 'post-1');

    expect(await isBookmarked(tenantId, 'user-1', 'post-1')).toBe(true);
  });

  it('returns false when the tuple does not exist', async () => {
    await insertTestUser(db(), { id: 'user-1' });
    const { id: tenantId } = await insertTestTenant(db());

    expect(await isBookmarked(tenantId, 'user-1', 'post-1')).toBe(false);
  });

  it("returns false for another tenant's bookmark on the same user and post", async () => {
    await insertTestUser(db(), { id: 'user-1' });
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    await addBookmark(tenantOneId, 'user-1', 'post-1');

    expect(await isBookmarked(tenantTwoId, 'user-1', 'post-1')).toBe(false);
  });
});
