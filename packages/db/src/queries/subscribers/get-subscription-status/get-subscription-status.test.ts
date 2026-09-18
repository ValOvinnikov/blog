import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getSubscriptionStatus } from './get-subscription-status';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

// One in-memory Postgres instance for the whole file (spinning up pglite's
// WASM engine is the slow part — seconds, not milliseconds) — `afterEach`
// clears rows between tests instead of paying that cost per test.

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

describe(getSubscriptionStatus, () => {
  it('returns active for a user whose account email has an active subscriber row', async () => {
    const user = await insertUser();
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com', status: 'active' });

    const result = await getSubscriptionStatus(tenantId, user.id);

    expect(result.outcome).toBe('active');
    if (result.outcome !== 'active') throw new Error('expected active');
    expect(result.subscriber.email).toBe('reader@example.com');
  });

  it('returns pending for a user whose account email has a pending subscriber row', async () => {
    const user = await insertUser();
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    const result = await getSubscriptionStatus(tenantId, user.id);

    expect(result.outcome).toBe('pending');
    if (result.outcome !== 'pending') throw new Error('expected pending');
    expect(result.subscriber.status).toBe('pending');
  });

  it('returns not-subscribed when no subscriber row matches the account email', async () => {
    const user = await insertUser();
    const { id: tenantId } = await insertTestTenant(db());

    const result = await getSubscriptionStatus(tenantId, user.id);

    expect(result).toEqual({ outcome: 'not-subscribed' });
  });

  it('returns not-subscribed when the user has no email on file', async () => {
    const user = await insertUser({ email: null });
    const { id: tenantId } = await insertTestTenant(db());

    const result = await getSubscriptionStatus(tenantId, user.id);

    expect(result).toEqual({ outcome: 'not-subscribed' });
  });

  it('returns not-subscribed for an unrecognized userId', async () => {
    const { id: tenantId } = await insertTestTenant(db());

    const result = await getSubscriptionStatus(tenantId, 'does-not-exist');

    expect(result).toEqual({ outcome: 'not-subscribed' });
  });

  it('matches case-insensitively/trimmed against the stored subscriber email', async () => {
    const user = await insertUser({ email: '  Reader@Example.com  ' });
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    const result = await getSubscriptionStatus(tenantId, user.id);

    expect(result.outcome).toBe('pending');
  });

  it('returns not-subscribed when the subscriber row belongs to a different tenant', async () => {
    const user = await insertUser();
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId: tenantOneId, email: 'reader@example.com' });

    const result = await getSubscriptionStatus(tenantTwoId, user.id);

    expect(result).toEqual({ outcome: 'not-subscribed' });
  });
});
