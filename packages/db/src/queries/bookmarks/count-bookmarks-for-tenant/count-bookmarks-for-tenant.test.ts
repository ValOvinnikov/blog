import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { addBookmark } from '../add-bookmark';

import { countBookmarksForTenant } from './count-bookmarks-for-tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(countBookmarksForTenant, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('counts every bookmark row for the tenant, across users', async () => {
    const user1 = await insertTestUser(db());
    const user2 = await insertTestUser(db());
    await addBookmark(tenantId, user1.id, 'post-1');
    await addBookmark(tenantId, user2.id, 'post-2');

    await expect(countBookmarksForTenant(tenantId)).resolves.toBe(2);
  });

  it("does not count another tenant's bookmarks", async () => {
    const user = await insertTestUser(db());
    const { id: otherTenantId } = await insertTestTenant(db());
    await addBookmark(otherTenantId, user.id, 'post-1');

    await expect(countBookmarksForTenant(tenantId)).resolves.toBe(0);
  });
});
