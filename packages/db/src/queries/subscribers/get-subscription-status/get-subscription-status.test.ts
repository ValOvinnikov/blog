import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getSubscriptionStatus } from './get-subscription-status';

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

describe(getSubscriptionStatus, () => {
  it('returns active for a user whose account email has an active subscriber row', async () => {
    const user = await insertUser();
    const tenantId = await insertTenant('acme');
    await db
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com', status: 'active' });

    const result = await getSubscriptionStatus(tenantId, user.id);

    expect(result.outcome).toBe('active');
    if (result.outcome !== 'active') throw new Error('expected active');
    expect(result.subscriber.email).toBe('reader@example.com');
  });

  it('returns pending for a user whose account email has a pending subscriber row', async () => {
    const user = await insertUser();
    const tenantId = await insertTenant('acme');
    await db
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    const result = await getSubscriptionStatus(tenantId, user.id);

    expect(result.outcome).toBe('pending');
    if (result.outcome !== 'pending') throw new Error('expected pending');
    expect(result.subscriber.status).toBe('pending');
  });

  it('returns not-subscribed when no subscriber row matches the account email', async () => {
    const user = await insertUser();
    const tenantId = await insertTenant('acme');

    const result = await getSubscriptionStatus(tenantId, user.id);

    expect(result).toEqual({ outcome: 'not-subscribed' });
  });

  it('returns not-subscribed when the user has no email on file', async () => {
    const user = await insertUser({ email: null });
    const tenantId = await insertTenant('acme');

    const result = await getSubscriptionStatus(tenantId, user.id);

    expect(result).toEqual({ outcome: 'not-subscribed' });
  });

  it('returns not-subscribed for an unrecognized userId', async () => {
    const tenantId = await insertTenant('acme');

    const result = await getSubscriptionStatus(tenantId, 'does-not-exist');

    expect(result).toEqual({ outcome: 'not-subscribed' });
  });

  it('matches case-insensitively/trimmed against the stored subscriber email', async () => {
    const user = await insertUser({ email: '  Reader@Example.com  ' });
    const tenantId = await insertTenant('acme');
    await db
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    const result = await getSubscriptionStatus(tenantId, user.id);

    expect(result.outcome).toBe('pending');
  });

  it('returns not-subscribed when the subscriber row belongs to a different tenant', async () => {
    const user = await insertUser();
    const tenantOneId = await insertTenant('acme');
    const tenantTwoId = await insertTenant('other');
    await db
      .insert(schema.subscribers)
      .values({ tenantId: tenantOneId, email: 'reader@example.com' });

    const result = await getSubscriptionStatus(tenantTwoId, user.id);

    expect(result).toEqual({ outcome: 'not-subscribed' });
  });
});
