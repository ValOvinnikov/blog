import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { createPendingSubscriber } from './create-pending-subscriber';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

// Only `getDb`'s return value is swapped for an in-memory Postgres — every
// query these functions build still runs as real SQL (see
// src/testing/create-test-db.ts), so the `(tenantId, email)` unique
// constraint under test is the real Postgres constraint, not a mocked
// stand-in.
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
});

describe(createPendingSubscriber, () => {
  it('inserts a new pending row for a fresh email', async () => {
    const tenantId = await insertTenant('acme');

    const result = await createPendingSubscriber(
      tenantId,
      'reader@example.com',
    );

    expect(result.outcome).toBe('created');
    expect(result.subscriber).toMatchObject({
      tenantId,
      email: 'reader@example.com',
      status: 'pending',
    });
    expect(result.subscriber.confirmationToken).toEqual(expect.any(String));
    expect(result.subscriber.confirmedAt).toBeNull();

    const rows = await db.select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('normalizes email casing/whitespace so it collides with an existing row', async () => {
    const tenantId = await insertTenant('acme');
    const first = await createPendingSubscriber(tenantId, 'Reader@Example.com');

    const second = await createPendingSubscriber(
      tenantId,
      '  reader@example.com  ',
    );

    expect(second.outcome).toBe('already-pending');
    expect(second.subscriber.id).toBe(first.subscriber.id);
    const rows = await db.select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('is idempotent-safe for a duplicate submission while still pending', async () => {
    const tenantId = await insertTenant('acme');
    const first = await createPendingSubscriber(tenantId, 'reader@example.com');

    const second = await createPendingSubscriber(
      tenantId,
      'reader@example.com',
    );

    expect(second).toEqual({
      outcome: 'already-pending',
      subscriber: first.subscriber,
    });
    // The token is not rotated — the already-sent confirmation email's link
    // must keep working.
    expect(second.subscriber.confirmationToken).toBe(
      first.subscriber.confirmationToken,
    );
    const rows = await db.select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('reports already-active for an email that already confirmed, without inserting or erroring', async () => {
    const tenantId = await insertTenant('acme');
    await db.insert(schema.subscribers).values({
      tenantId,
      email: 'reader@example.com',
      status: 'active',
      confirmedAt: new Date(),
    });

    const result = await createPendingSubscriber(
      tenantId,
      'reader@example.com',
    );

    expect(result.outcome).toBe('already-active');
    expect(result.subscriber.status).toBe('active');
    const rows = await db.select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('allows the same email to subscribe on two different tenants', async () => {
    const tenantOneId = await insertTenant('acme');
    const tenantTwoId = await insertTenant('other');

    const first = await createPendingSubscriber(
      tenantOneId,
      'reader@example.com',
    );
    const second = await createPendingSubscriber(
      tenantTwoId,
      'reader@example.com',
    );

    expect(first.outcome).toBe('created');
    expect(second.outcome).toBe('created');
    expect(first.subscriber.id).not.toBe(second.subscriber.id);
    const rows = await db.select().from(schema.subscribers);
    expect(rows).toHaveLength(2);
  });

  // pglite serves a single connection, so two calls kicked off together
  // still execute their statements one at a time under the hood — this
  // can't force the true interleaving (both INSERTs racing at the storage
  // layer) that a real concurrent hit against Neon could produce. What it
  // does verify is that calling concurrently for a brand-new email never
  // throws and always settles into a sane pair of outcomes with exactly
  // one row persisted. The actual race safety comes from
  // `.onConflictDoNothing()` making the `(tenantId, email)` uniqueness
  // check Postgres's job rather than a racy read-then-decide — see the
  // docstring on `createPendingSubscriber`.
  it('resolves two concurrent calls for the same brand-new email without an uncaught constraint error', async () => {
    const tenantId = await insertTenant('acme');

    const [first, second] = await Promise.all([
      createPendingSubscriber(tenantId, 'reader@example.com'),
      createPendingSubscriber(tenantId, 'reader@example.com'),
    ]);

    const outcomes = [first.outcome, second.outcome].sort();
    expect(outcomes).toEqual(['already-pending', 'created']);
    expect(first.subscriber.id).toBe(second.subscriber.id);
    const rows = await db.select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });
});
