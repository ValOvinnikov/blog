import { ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { MOCK_POST_ID } from '@blog/db/testing/bookmarks/fixtures';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { addBookmark } from './add-bookmark';

vi.mock('@blog/db/client');

faker.seed(61011);

const MOCK_MISSING_USER_ID = faker.string.uuid();

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.bookmarks);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(addBookmark, () => {
  let tenantId: string;
  let userId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestUser(db()));
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('inserts a bookmark row for the given tenant, user and post', async () => {
    const result = await addBookmark(tenantId, userId, MOCK_POST_ID);

    const [stored] = await db().select().from(schema.bookmarks);
    expect(result).toEqual({ ok: true, data: stored });
    expect(stored).toMatchObject({
      tenantId,
      userId,
      postId: MOCK_POST_ID,
    });
  });

  it('is idempotent when the tuple is already bookmarked', async () => {
    const first = await addBookmark(tenantId, userId, MOCK_POST_ID);
    const second = await addBookmark(tenantId, userId, MOCK_POST_ID);

    const rows = await db().select().from(schema.bookmarks);
    expect(second).toEqual(first);
    expect(rows).toHaveLength(1);
  });

  it('lets one user bookmark the same post on different tenants', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());

    await addBookmark(tenantId, userId, MOCK_POST_ID);
    await addBookmark(otherTenantId, userId, MOCK_POST_ID);

    const rows = await db().select().from(schema.bookmarks);
    expect(rows).toHaveLength(2);
  });

  it('rejects a bookmark for a user that does not exist', async () => {
    await expect(
      addBookmark(tenantId, MOCK_MISSING_USER_ID, MOCK_POST_ID),
    ).rejects.toThrow();
  });

  it('rejects a bookmark for a tenant that does not exist', async () => {
    await expect(
      addBookmark(MOCK_MISSING_TENANT_ID, userId, MOCK_POST_ID),
    ).rejects.toThrow();
  });

  it('returns DB_NOT_FOUND when the conflicting row vanishes mid-call', async () => {
    await addBookmark(tenantId, userId, MOCK_POST_ID);
    const selectSpy = vi.spyOn(db(), 'select').mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([]) }),
    } as unknown as ReturnType<ReturnType<typeof db>['select']>);

    const result = await addBookmark(tenantId, userId, MOCK_POST_ID);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    selectSpy.mockRestore();
  });
});

describe('foreign-key cascade', () => {
  let tenantId: string;
  let userId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestUser(db()));
    ({ id: tenantId } = await insertTestTenant(db()));
    await addBookmark(tenantId, userId, MOCK_POST_ID);
  });

  it('removes a bookmark when its owning user is deleted', async () => {
    await db().delete(schema.users).where(eq(schema.users.id, userId));

    const rows = await db().select().from(schema.bookmarks);
    expect(rows).toHaveLength(0);
  });

  it('removes a bookmark when its owning tenant is deleted', async () => {
    await db().delete(schema.tenants).where(eq(schema.tenants.id, tenantId));

    const rows = await db().select().from(schema.bookmarks);
    expect(rows).toHaveLength(0);
  });
});
