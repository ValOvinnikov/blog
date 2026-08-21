import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { addBookmark } from '../add-bookmark';
import { isBookmarked } from '../is-bookmarked';

import { removeBookmarksForPost } from './remove-bookmarks-for-post';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertUser(id: string): Promise<void> {
  await db.insert(schema.users).values({ id });
}

async function insertTenant(slug: string): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug,
      name: slug,
      primaryDomain: `${slug}.example.com`,
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();
  return tenant!.id;
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.bookmarks);
  await db.delete(schema.tenants);
  await db.delete(schema.users);
});

describe(removeBookmarksForPost, () => {
  it('deletes every user’s bookmark for the given tenant and post', async () => {
    await insertUser('user-1');
    await insertUser('user-2');
    const tenantId = await insertTenant('acme');
    await addBookmark(tenantId, 'user-1', 'post-1');
    await addBookmark(tenantId, 'user-2', 'post-1');

    const count = await removeBookmarksForPost(tenantId, 'post-1');

    expect(count).toBe(2);
    expect(await isBookmarked(tenantId, 'user-1', 'post-1')).toBe(false);
    expect(await isBookmarked(tenantId, 'user-2', 'post-1')).toBe(false);
  });

  it('leaves bookmarks for a different post untouched', async () => {
    await insertUser('user-1');
    const tenantId = await insertTenant('acme');
    await addBookmark(tenantId, 'user-1', 'post-1');
    await addBookmark(tenantId, 'user-1', 'post-2');

    await removeBookmarksForPost(tenantId, 'post-1');

    expect(await isBookmarked(tenantId, 'user-1', 'post-2')).toBe(true);
  });

  it("leaves a different tenant's bookmarks for the same postId untouched", async () => {
    await insertUser('user-1');
    const tenantOneId = await insertTenant('acme');
    const tenantTwoId = await insertTenant('other');
    await addBookmark(tenantOneId, 'user-1', 'post-1');
    await addBookmark(tenantTwoId, 'user-1', 'post-1');

    await removeBookmarksForPost(tenantOneId, 'post-1');

    expect(await isBookmarked(tenantTwoId, 'user-1', 'post-1')).toBe(true);
  });

  it('returns 0 when nothing matches', async () => {
    const tenantId = await insertTenant('acme');

    const count = await removeBookmarksForPost(tenantId, 'post-1');

    expect(count).toBe(0);
  });
});
