import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { addBookmark } from '../add-bookmark';

import { deleteBookmarksForTenant } from './delete-bookmarks-for-tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(deleteBookmarksForTenant, () => {
  it('deletes every bookmark row for the tenant, across users, and returns the count', async () => {
    const user1 = await insertTestUser(db());
    const user2 = await insertTestUser(db());
    const { id: tenantId } = await insertTestTenant(db());
    await addBookmark(tenantId, user1.id, 'post-1');
    await addBookmark(tenantId, user2.id, 'post-2');

    await expect(deleteBookmarksForTenant(tenantId)).resolves.toBe(2);

    const rows = await db()
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.tenantId, tenantId));
    expect(rows).toHaveLength(0);
  });

  it("leaves another tenant's bookmarks untouched", async () => {
    const user = await insertTestUser(db());
    const { id: tenantId } = await insertTestTenant(db());
    const { id: otherTenantId } = await insertTestTenant(db());
    await addBookmark(otherTenantId, user.id, 'post-1');

    await deleteBookmarksForTenant(tenantId);

    const rows = await db()
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.tenantId, otherTenantId));
    expect(rows).toHaveLength(1);
  });

  it('is idempotent — returns 0 when nothing matches', async () => {
    const { id: tenantId } = await insertTestTenant(db());

    await expect(deleteBookmarksForTenant(tenantId)).resolves.toBe(0);
  });
});
