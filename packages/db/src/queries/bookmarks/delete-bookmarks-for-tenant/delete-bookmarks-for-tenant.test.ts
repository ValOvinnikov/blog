import * as schema from '@blog/db/schema';
import {
  MOCK_OTHER_POST_ID,
  MOCK_POST_ID,
} from '@blog/db/testing/bookmarks/fixtures';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { addBookmark } from '../add-bookmark';

import { deleteBookmarksForTenant } from './delete-bookmarks-for-tenant';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(deleteBookmarksForTenant, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('deletes every bookmark for the tenant, across users, and counts them', async () => {
    const user1 = await insertTestUser(db());
    const user2 = await insertTestUser(db());
    await addBookmark(tenantId, user1.id, MOCK_POST_ID);
    await addBookmark(tenantId, user2.id, MOCK_OTHER_POST_ID);

    const deleted = await deleteBookmarksForTenant(tenantId);

    const rows = await db()
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.tenantId, tenantId));
    expect(deleted).toBe(2);
    expect(rows).toHaveLength(0);
  });

  it("leaves another tenant's bookmarks untouched", async () => {
    const user = await insertTestUser(db());
    const { id: otherTenantId } = await insertTestTenant(db());
    await addBookmark(otherTenantId, user.id, MOCK_POST_ID);

    await deleteBookmarksForTenant(tenantId);

    const rows = await db()
      .select()
      .from(schema.bookmarks)
      .where(eq(schema.bookmarks.tenantId, otherTenantId));
    expect(rows).toHaveLength(1);
  });

  it('returns 0 when the tenant has no bookmarks', async () => {
    await expect(deleteBookmarksForTenant(tenantId)).resolves.toBe(0);
  });
});
