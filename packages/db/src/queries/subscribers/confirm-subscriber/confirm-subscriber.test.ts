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
});

async function insertPendingSubscriber(
  overrides: Partial<typeof schema.subscribers.$inferInsert> = {},
): Promise<schema.TSubscriber> {
  const [inserted] = await db
    .insert(schema.subscribers)
    .values({ email: 'reader@example.com', ...overrides })
    .returning();

  if (!inserted) throw new Error('failed to seed a subscriber row');

  return inserted;
}

describe(confirmSubscriber, () => {
  it('flips a pending subscriber to active and stamps confirmedAt', async () => {
    const pending = await insertPendingSubscriber();

    const result = await confirmSubscriber(pending.confirmationToken);

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
    const pending = await insertPendingSubscriber();
    const first = await confirmSubscriber(pending.confirmationToken);
    if (first.outcome !== 'confirmed') throw new Error('expected confirmed');

    const second = await confirmSubscriber(pending.confirmationToken);

    expect(second).toEqual({
      outcome: 'already-confirmed',
      subscriber: first.subscriber,
    });
  });

  it('returns not-found for an unrecognized token', async () => {
    const result = await confirmSubscriber('does-not-exist');

    expect(result).toEqual({ outcome: 'not-found' });
  });
});
