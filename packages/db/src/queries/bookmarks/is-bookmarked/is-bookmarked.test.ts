import * as schema from '@blog/db/schema';
import { MOCK_POST_ID } from '@blog/db/testing/bookmarks/fixtures';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { addBookmark } from '../add-bookmark';

import { isBookmarked } from './is-bookmarked';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(isBookmarked, () => {
  let tenantId: string;
  let userId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestUser(db()));
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns true when the tuple exists', async () => {
    await addBookmark(tenantId, userId, MOCK_POST_ID);

    await expect(isBookmarked(tenantId, userId, MOCK_POST_ID)).resolves.toBe(
      true,
    );
  });

  it('returns false when the tuple does not exist', async () => {
    await expect(isBookmarked(tenantId, userId, MOCK_POST_ID)).resolves.toBe(
      false,
    );
  });

  it("returns false for another tenant's bookmark of the same post", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await addBookmark(otherTenantId, userId, MOCK_POST_ID);

    await expect(isBookmarked(tenantId, userId, MOCK_POST_ID)).resolves.toBe(
      false,
    );
  });
});
