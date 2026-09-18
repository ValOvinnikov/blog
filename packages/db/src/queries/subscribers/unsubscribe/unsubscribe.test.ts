import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { and, eq } from 'drizzle-orm';

import { unsubscribe } from './unsubscribe';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

async function insertUser(
  overrides: Partial<typeof schema.users.$inferInsert> = {},
): Promise<schema.TUser> {
  return insertTestUser(db(), { email: 'reader@example.com', ...overrides });
}

describe(unsubscribe, () => {
  it('deletes the subscriber row matching the account email', async () => {
    const user = await insertUser();
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    await unsubscribe(tenantId, user.id);

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(
        and(
          eq(schema.subscribers.tenantId, tenantId),
          eq(schema.subscribers.email, 'reader@example.com'),
        ),
      );
    expect(rows).toHaveLength(0);
  });

  it('is a no-op when no subscriber row matches the account email', async () => {
    const user = await insertUser();
    const { id: tenantId } = await insertTestTenant(db());

    await expect(unsubscribe(tenantId, user.id)).resolves.toBeUndefined();
  });

  it('is a no-op for an unrecognized userId', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    await unsubscribe(tenantId, 'does-not-exist');

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.email, 'reader@example.com'));
    expect(rows).toHaveLength(1);
  });

  it('is a no-op when the user has no email on file', async () => {
    const user = await insertUser({ email: null });
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    await unsubscribe(tenantId, user.id);

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.email, 'reader@example.com'));
    expect(rows).toHaveLength(1);
  });

  it("does not remove another user's subscriber row", async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const user = await insertUser({ email: 'reader@example.com' });
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: 'other@example.com' });

    await unsubscribe(tenantId, user.id);

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.email, 'other@example.com'));
    expect(rows).toHaveLength(1);
  });

  it("does not remove another tenant's subscriber row for the same email", async () => {
    const user = await insertUser();
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId: tenantOneId, email: 'reader@example.com' });
    await db()
      .insert(schema.subscribers)
      .values({ tenantId: tenantTwoId, email: 'reader@example.com' });

    await unsubscribe(tenantOneId, user.id);

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.tenantId, tenantTwoId));
    expect(rows).toHaveLength(1);
  });
});
