import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { and, eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { unsubscribe } from './unsubscribe';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

// Only `getDb`'s return value is swapped for an in-memory Postgres — every
// query these functions build still runs as real SQL (see
// src/testing/create-test-db.ts).
vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

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

// One in-memory Postgres instance for the whole file (spinning up pglite's
// WASM engine is the slow part — seconds, not milliseconds) — `afterEach`
// clears rows between tests instead of paying that cost per test.
beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.subscribers);
  await db.delete(schema.tenants);
  await db.delete(schema.users);
});

async function insertUser(
  overrides: Partial<typeof schema.users.$inferInsert> = {},
): Promise<schema.TUser> {
  const [inserted] = await db
    .insert(schema.users)
    .values({ email: 'reader@example.com', ...overrides })
    .returning();

  if (!inserted) throw new Error('failed to seed a user row');

  return inserted;
}

describe(unsubscribe, () => {
  it('deletes the subscriber row matching the account email', async () => {
    const user = await insertUser();
    const tenantId = await insertTenant('acme');
    await db
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    await unsubscribe(tenantId, user.id);

    const rows = await db
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
    const tenantId = await insertTenant('acme');

    await expect(unsubscribe(tenantId, user.id)).resolves.toBeUndefined();
  });

  it('is a no-op for an unrecognized userId', async () => {
    const tenantId = await insertTenant('acme');
    await db
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    await unsubscribe(tenantId, 'does-not-exist');

    const rows = await db
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.email, 'reader@example.com'));
    expect(rows).toHaveLength(1);
  });

  it('is a no-op when the user has no email on file', async () => {
    const user = await insertUser({ email: null });
    const tenantId = await insertTenant('acme');
    await db
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    await unsubscribe(tenantId, user.id);

    const rows = await db
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.email, 'reader@example.com'));
    expect(rows).toHaveLength(1);
  });

  it("does not remove another user's subscriber row", async () => {
    const tenantId = await insertTenant('acme');
    const user = await insertUser({ email: 'reader@example.com' });
    await db
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });
    await db
      .insert(schema.subscribers)
      .values({ tenantId, email: 'other@example.com' });

    await unsubscribe(tenantId, user.id);

    const rows = await db
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.email, 'other@example.com'));
    expect(rows).toHaveLength(1);
  });

  it("does not remove another tenant's subscriber row for the same email", async () => {
    const user = await insertUser();
    const tenantOneId = await insertTenant('acme');
    const tenantTwoId = await insertTenant('other');
    await db
      .insert(schema.subscribers)
      .values({ tenantId: tenantOneId, email: 'reader@example.com' });
    await db
      .insert(schema.subscribers)
      .values({ tenantId: tenantTwoId, email: 'reader@example.com' });

    await unsubscribe(tenantOneId, user.id);

    const rows = await db
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.tenantId, tenantTwoId));
    expect(rows).toHaveLength(1);
  });
});
