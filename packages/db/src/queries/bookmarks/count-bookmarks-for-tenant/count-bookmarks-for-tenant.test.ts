import * as schema from '@blog/db/schema';
import {
  MOCK_OTHER_POST_ID,
  MOCK_POST_ID,
} from '@blog/db/testing/bookmarks/fixtures';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { addBookmark } from '../add-bookmark';

import { countBookmarksForTenant } from './count-bookmarks-for-tenant';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

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
    await addBookmark(tenantId, user1.id, MOCK_POST_ID);
    await addBookmark(tenantId, user2.id, MOCK_OTHER_POST_ID);

    await expect(countBookmarksForTenant(tenantId)).resolves.toBe(2);
  });

  it("does not count another tenant's bookmarks", async () => {
    const user = await insertTestUser(db());
    const { id: otherTenantId } = await insertTestTenant(db());
    await addBookmark(otherTenantId, user.id, MOCK_POST_ID);

    await expect(countBookmarksForTenant(tenantId)).resolves.toBe(0);
  });
});
