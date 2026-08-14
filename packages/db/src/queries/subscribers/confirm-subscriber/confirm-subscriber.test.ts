import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { confirmSubscriber } from './confirm-subscriber';

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
});

async function insertPendingSubscriber(
  tenantId: string,
  overrides: Partial<typeof schema.subscribers.$inferInsert> = {},
): Promise<schema.TSubscriber> {
  const [inserted] = await db
    .insert(schema.subscribers)
    .values({ tenantId, email: 'reader@example.com', ...overrides })
    .returning();

  if (!inserted) throw new Error('failed to seed a subscriber row');

  return inserted;
}

describe(confirmSubscriber, () => {
  it('flips a pending subscriber to active and stamps confirmedAt', async () => {
    const tenantId = await insertTenant('acme');
    const pending = await insertPendingSubscriber(tenantId);

    const result = await confirmSubscriber(tenantId, pending.confirmationToken);

    expect(result.outcome).toBe('confirmed');
    if (result.outcome !== 'confirmed') throw new Error('expected confirmed');
    expect(result.subscriber.status).toBe('active');
    expect(result.subscriber.confirmedAt).not.toBeNull();

    const [row] = await db
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, pending.id));
    expect(row?.status).toBe('active');
  });

  it('is idempotent-safe: confirming an already-active row again does not error or restamp confirmedAt', async () => {
    const tenantId = await insertTenant('acme');
    const pending = await insertPendingSubscriber(tenantId);
    const first = await confirmSubscriber(tenantId, pending.confirmationToken);
    if (first.outcome !== 'confirmed') throw new Error('expected confirmed');

    const second = await confirmSubscriber(tenantId, pending.confirmationToken);

    expect(second).toEqual({
      outcome: 'already-confirmed',
      subscriber: first.subscriber,
    });
  });

  it('returns not-found for an unrecognized token', async () => {
    const tenantId = await insertTenant('acme');

    const result = await confirmSubscriber(tenantId, 'does-not-exist');

    expect(result).toEqual({ outcome: 'not-found' });
  });

  it("returns not-found for another tenant's token", async () => {
    const tenantOneId = await insertTenant('acme');
    const tenantTwoId = await insertTenant('other');
    const pending = await insertPendingSubscriber(tenantOneId);

    const result = await confirmSubscriber(
      tenantTwoId,
      pending.confirmationToken,
    );

    expect(result).toEqual({ outcome: 'not-found' });
  });

  // pglite serves a single connection, so two calls kicked off together
  // still execute their statements one at a time under the hood — this
  // can't force the true interleaving (both UPDATEs racing at the storage
  // layer) that a real concurrent hit against Neon could produce. What it
  // does verify is that calling concurrently on the same token never
  // double-transitions the row and always settles into exactly one
  // `confirmed` + one `already-confirmed`. The actual race safety comes
  // from gating the `UPDATE` itself on `status = 'pending'` so only one of
  // two racing calls can ever match that `WHERE`, not from this test — see
  // the docstring on `confirmSubscriber`.
  it('resolves two concurrent confirms of the same token into exactly one confirmed outcome', async () => {
    const tenantId = await insertTenant('acme');
    const pending = await insertPendingSubscriber(tenantId);

    const [first, second] = await Promise.all([
      confirmSubscriber(tenantId, pending.confirmationToken),
      confirmSubscriber(tenantId, pending.confirmationToken),
    ]);

    const outcomes = [first.outcome, second.outcome].sort();
    expect(outcomes).toEqual(['already-confirmed', 'confirmed']);

    const confirmed = first.outcome === 'confirmed' ? first : second;
    if (confirmed.outcome !== 'confirmed') {
      throw new Error('expected one confirmed outcome');
    }
    const [row] = await db
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, pending.id));
    expect(row?.confirmedAt).toEqual(confirmed.subscriber.confirmedAt);
  });
});
